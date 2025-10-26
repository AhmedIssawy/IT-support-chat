import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import { permanentlyDeleteChat } from "../controllers/message.controller.js";
import Message from "../models/Message.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {}; // {userId:socketId}
const adminDisconnectTimers = {}; // {adminId: timeoutId} - Track disconnect timers

async function deleteAllAdminChats(adminId, adminName) {
  try {
    // find all messages involving this admin (use .lean() for performance)
    const msgs = await Message.find({
      $or: [{ senderId: adminId }, { receiverId: adminId }]
    }).lean();

    // collect unique other-party user IDs (exclude the admin itself)
    const userIdSet = new Set();
    for (const m of msgs) {
      const sid = m.senderId?.toString();
      const rid = m.receiverId?.toString();
      if (sid && sid !== adminId.toString()) userIdSet.add(sid);
      if (rid && rid !== adminId.toString()) userIdSet.add(rid);
    }
    const uniqueUserIds = [...userIdSet];

    console.log(`Deleting chats for admin ${adminId} with ${uniqueUserIds.length} users`);

    for (const targetUserId of uniqueUserIds) {
      try {
        const deleteResult = await permanentlyDeleteChat(adminId, targetUserId);
        // support different return shapes from permanentlyDeleteChat
        const deletedCount = deleteResult.deletedCount ?? deleteResult.deletedMessages ?? 0;

        console.log(`Chat permanently deleted: Admin ${adminId} - User ${targetUserId}, ${deletedCount} messages deleted`);

        const receiverSocketId = getReceiverSocketId(targetUserId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("chatPermanentlyDeleted", {
            adminId: adminId,
            adminName: adminName,
            reason: "admin_offline",
            timestamp: new Date().toISOString(),
            deletedCount
          });
        }
      } catch (deleteError) {
        console.error(`Error deleting chat with user ${targetUserId}:`, deleteError);
      }
    }

    return uniqueUserIds.length;
  } catch (error) {
    console.error("Error in deleteAllAdminChats:", error);
    throw error;
  }
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  const isAdmin = socket.user.isAdmin;
  userSocketMap[userId] = socket.id;

  if (isAdmin && adminDisconnectTimers[userId]) {
    console.log(`Admin ${userId} reconnected. Canceling deletion timer.`);
    clearTimeout(adminDisconnectTimers[userId]);
    delete adminDisconnectTimers[userId];
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Listen for terminateChat event (admin closing/reloading page)
  socket.on("terminateChat", async (data) => {
    const { adminId } = data;
    
    console.log(`terminateChat event received from admin ${adminId}`);
    
    // Clear any existing disconnect timer for this admin
    if (adminDisconnectTimers[adminId]) {
      clearTimeout(adminDisconnectTimers[adminId]);
      delete adminDisconnectTimers[adminId];
    }
    
    try {
      // Immediately delete all chats for this admin
      const deletedChatsCount = await deleteAllAdminChats(adminId, socket.user.fullName);
      console.log(`Terminated and deleted ${deletedChatsCount} chats for admin ${adminId}`);
    } catch (error) {
      console.error("Error in terminateChat:", error);
    }
  });

  // Listen for admin leaving chat intentionally
  socket.on("adminLeavingChat", async (data) => {
    const { userId: targetUserId } = data;
    const receiverSocketId = getReceiverSocketId(targetUserId);
    
    try {
      // PERMANENTLY DELETE all chat data between admin and user
      const deleteResult = await permanentlyDeleteChat(userId, targetUserId);
      
      console.log(`Chat permanently deleted: Admin ${userId} left chat with user ${targetUserId}`);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("chatPermanentlyDeleted", {
          adminId: userId,
          adminName: socket.user.fullName,
          reason: "admin_left",
          timestamp: new Date().toISOString(),
          deletedCount: deleteResult.deletedCount
        });
      }
    } catch (error) {
      console.error("Error during chat deletion:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log("A user disconnected", socket.user.fullName);
    
    // If an admin disconnects, set a 5-second timer before deleting chats
    if (isAdmin) {
      console.log(`Admin ${userId} disconnected. Starting 5-second timer...`);
      
      // Clear any existing timer
      if (adminDisconnectTimers[userId]) {
        clearTimeout(adminDisconnectTimers[userId]);
      }
      
      // Set 5-second timer - if admin doesn't reconnect, delete all chats
      adminDisconnectTimers[userId] = setTimeout(async () => {
        console.log(`5-second timer expired for admin ${userId}. Checking if still offline...`);
        
        // Check if admin reconnected (is back in userSocketMap)
        if (!userSocketMap[userId]) {
          console.log(`Admin ${userId} did not reconnect. Deleting all chats...`);
          
          try {
            const deletedChatsCount = await deleteAllAdminChats(userId, socket.user.fullName);
            console.log(`Deleted ${deletedChatsCount} chats for offline admin ${userId}`);
          } catch (error) {
            console.error(`Error deleting chats for admin ${userId}:`, error);
          }
        } else {
          console.log(`Admin ${userId} reconnected. Canceling deletion.`);
        }
        
        // Clean up the timer reference
        delete adminDisconnectTimers[userId];
      }, 5000); // 5 seconds
    }
    
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
