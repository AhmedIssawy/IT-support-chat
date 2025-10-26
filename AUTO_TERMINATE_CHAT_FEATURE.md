# Auto-Terminate Chat on Admin Offline Feature

## Overview
This feature automatically terminates user chat sessions when the admin they're chatting with goes offline or intentionally leaves the chat.

---

## 🎯 Features Implemented

### 1. **Admin Disconnect Detection**

**Backend (Socket.IO Events)**:
- `adminWentOffline` - Emitted when admin disconnects (network issue, browser closed, etc.)
- `adminLeavingChat` - Emitted when admin intentionally leaves a specific chat
- `adminLeftChat` - Received by user when admin leaves their chat

**Frontend (Socket Listeners)**:
- Listens for both events in `subscribeToMessages()`
- Only regular users (non-admins) listen to these events
- Triggers automatic chat termination

---

### 2. **Automatic Termination Behavior**

When admin goes offline or leaves:
1. ✅ Chat is marked as terminated (`isChatTerminated: true`)
2. ✅ Termination reason is stored (`admin_offline` or `admin_left`)
3. ✅ Error toast notification appears
4. ✅ Notification sound plays (if enabled)
5. ✅ Red banner displays at top of chat
6. ✅ Message input is disabled
7. ✅ "Start New Chat" button appears

**Termination Message**:
> "The admin has left the chat or gone offline. Your session has been ended. You can start a new chat when an admin becomes available."

---

### 3. **Admin Side Controls**

**Leave Chat Button**:
- Located in chat header (LogOut icon)
- Only visible to admins
- Shows confirmation dialog
- Emits `adminLeavingChat` event to notify user
- Closes admin's chat panel

**Automatic Offline Detection**:
- When admin disconnects (closes browser, network issues)
- Socket.IO automatically detects disconnect
- Broadcasts `adminWentOffline` to all clients
- Users chatting with that admin get notified

---

### 4. **State Management**

**New Store States**:
```javascript
{
  isChatTerminated: false,        // Chat termination flag
  chatTerminationReason: null     // { reason, adminName, timestamp }
}
```

**New Store Methods**:
- `terminateChat(reason, adminName)` - Marks chat as terminated
- `resetChatTermination()` - Clears termination state
- `notifyAdminLeaving(userId)` - Emits admin leaving event

**State Cleanup**:
- Termination state cleared when closing chat panel
- Termination state cleared when closing widget
- Socket listeners properly cleaned up

---

## 🎨 UI/UX Behavior

### **Chat Terminated Banner**
```
┌─────────────────────────────────────────┐
│ ⚠️ Chat Session Ended                   │
│                                         │
│ [Admin Name] has left the chat.        │
│ Your session has been ended. You can   │
│ start a new chat when an admin becomes │
│ available.                              │
│                                         │
│ [🔄 Start New Chat]                    │
└─────────────────────────────────────────┘
```

**Banner Features**:
- Red background with alert icon
- Clear termination message
- Admin name mentioned
- Fade-in animation
- "Start New Chat" button

### **Disabled Input State**
```
┌─────────────────────────────────────────┐
│  Chat ended. Input disabled.            │
└─────────────────────────────────────────┘
```

### **Admin Leave Button**
- Appears in chat header (top-right)
- LogOut icon
- Hover effect: semi-transparent white background
- Confirmation dialog before leaving

---

## 🔌 Socket Events Flow

### **Admin Disconnects (Unintentional)**
```
1. Admin's browser closes/network fails
   ↓
2. Socket.IO detects disconnect
   ↓
3. Backend emits "adminWentOffline" globally
   {
     adminId: "abc123",
     adminName: "John Doe",
     reason: "admin_offline",
     timestamp: "2025-10-26T..."
   }
   ↓
4. Users listening check if it's their admin
   ↓
5. If match: terminateChat("admin_offline", "John Doe")
   ↓
6. Banner shows, input disables, notification appears
```

### **Admin Leaves Intentionally**
```
1. Admin clicks "Leave Chat" button
   ↓
2. Confirmation dialog: "Are you sure?"
   ↓
3. If confirmed: emit "adminLeavingChat"
   {
     userId: "xyz789"  // User they're chatting with
   }
   ↓
4. Backend forwards to specific user as "adminLeftChat"
   {
     adminId: "abc123",
     adminName: "John Doe",
     reason: "admin_left",
     timestamp: "2025-10-26T..."
   }
   ↓
5. User receives event
   ↓
6. terminateChat("admin_left", "John Doe")
   ↓
7. Banner shows, input disables, notification appears
```

---

## 📂 File Structure

### **Backend**
```
backend/src/lib/
└── socket.js  ← MODIFIED
    - Added isAdmin check
    - Added "adminLeavingChat" listener
    - Added "adminWentOffline" broadcast on disconnect
```

### **Frontend**
```
frontend/src/
├── store/
│   └── useChatStore.js  ← MODIFIED
│       - Added isChatTerminated state
│       - Added chatTerminationReason state
│       - Added terminateChat() method
│       - Added resetChatTermination() method
│       - Added notifyAdminLeaving() method
│       - Updated subscribeToMessages() with event listeners
│       - Updated unsubscribeFromMessages() to clean up events
│       - Updated closeChatPanel() to reset termination
│       - Updated closeWidget() to reset termination
│
└── components/
    └── ChatWidgetPanel.jsx  ← MODIFIED
        - Added termination banner UI
        - Added disabled input state
        - Added "Start New Chat" button
        - Added "Leave Chat" button for admins
        - Added handleRestartChat() function
        - Added handleAdminLeaveChat() function
```

---

## 🔧 Implementation Details

### **Backend Socket Enhancement**
```javascript
io.on("connection", (socket) => {
  const userId = socket.userId;
  const isAdmin = socket.user.isAdmin;
  
  // Admin intentionally leaves chat
  socket.on("adminLeavingChat", (data) => {
    const receiverSocketId = getReceiverSocketId(data.userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("adminLeftChat", {
        adminId: userId,
        adminName: socket.user.fullName,
        reason: "admin_left",
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Admin disconnects (offline)
  socket.on("disconnect", () => {
    if (isAdmin) {
      io.emit("adminWentOffline", {
        adminId: userId,
        adminName: socket.user.fullName,
        reason: "admin_offline",
        timestamp: new Date().toISOString()
      });
    }
  });
});
```

### **Frontend Chat Store**
```javascript
terminateChat: (reason, adminName) => {
  const { authUser } = useAuthStore.getState();
  const isAdmin = authUser?.isAdmin || false;
  
  if (!isAdmin) {  // Only terminate for regular users
    set({ 
      isChatTerminated: true,
      chatTerminationReason: {
        reason,
        adminName,
        timestamp: new Date().toISOString()
      }
    });
    
    // Play sound and show toast
    if (get().isSoundEnabled) {
      const sound = new Audio("/sounds/notification.mp3");
      sound.play().catch(e => console.log("Audio failed:", e));
    }
    
    toast.error(`${adminName} has left the chat`);
  }
}
```

### **Socket Event Subscription**
```javascript
subscribeToMessages: () => {
  const socket = useAuthStore.getState().socket;
  const { authUser } = useAuthStore.getState();
  const isAdmin = authUser?.isAdmin || false;
  
  // Regular message listener
  socket.on("newMessage", (newMessage) => {
    // ... existing code
  });
  
  // Admin disconnect listeners (non-admins only)
  if (!isAdmin) {
    socket.on("adminLeftChat", (data) => {
      if (data.adminId === selectedUser._id) {
        get().terminateChat("admin_left", data.adminName);
      }
    });
    
    socket.on("adminWentOffline", (data) => {
      if (data.adminId === selectedUser._id) {
        get().terminateChat("admin_offline", data.adminName);
      }
    });
  }
}
```

---

## 🎭 User Experience Flow

### **Scenario 1: Admin Closes Browser**
```
User: Typing message...
  ↓
Admin: Closes browser
  ↓
Socket: Detects disconnect → emits "adminWentOffline"
  ↓
User's UI: Banner appears with fade-in
  ↓
Input: Disabled with gray background
  ↓
Toast: "John Doe has left the chat" (error style)
  ↓
Sound: Notification plays (if enabled)
  ↓
User: Sees "Start New Chat" button
  ↓
User: Clicks button → finds new admin or waiting list
```

### **Scenario 2: Admin Intentionally Leaves**
```
Admin: In active chat with user
  ↓
Admin: Clicks "Leave Chat" (LogOut icon)
  ↓
Dialog: "Are you sure you want to leave?"
  ↓
Admin: Confirms
  ↓
Socket: Emits "adminLeavingChat" → user notified
  ↓
Admin's UI: Returns to user list
  ↓
User's UI: Same as Scenario 1 (banner, disabled input, etc.)
```

---

## 💡 Bonus Features Implemented

### ✅ **Termination Reason Storage**
- Stores `reason` field: `"admin_offline"` or `"admin_left"`
- Stores `adminName` for display in banner
- Stores `timestamp` for analytics/logging

### ✅ **Smooth Animations**
- Banner fades in with `animate-fade-in`
- Chat panel slides with transform transitions
- Button hover effects

### ✅ **Admin Goodbye Option**
- Admin can see "Leave Chat" button
- Confirmation prevents accidental leaves
- User immediately notified

### ✅ **Restart Chat Functionality**
- "Start New Chat" button
- Clears termination state
- Closes panel and reopens widget
- Finds new available admin or shows waiting list

---

## 🧪 Testing Scenarios

### **Test 1: Admin Goes Offline**
- [x] Admin closes browser
- [x] User sees termination banner
- [x] Input is disabled
- [x] Toast notification appears
- [x] Sound plays (if enabled)

### **Test 2: Admin Leaves Chat**
- [x] Admin clicks "Leave Chat" button
- [x] Confirmation dialog shows
- [x] User receives notification
- [x] Banner displays correct message
- [x] Admin returns to user list

### **Test 3: User Restarts Chat**
- [x] Click "Start New Chat" button
- [x] Termination state clears
- [x] Widget reopens
- [x] New admin connection or waiting list

### **Test 4: Admin Not Affected**
- [x] Admins don't see termination when users disconnect
- [x] Admins can still use chat normally
- [x] Leave button only visible to admins

### **Test 5: Multiple Users**
- [x] Admin disconnects
- [x] Only users chatting with that admin get notified
- [x] Other chats unaffected

---

## 🐛 Troubleshooting

### Issue: Termination banner doesn't show
**Solution**: Check if `isChatTerminated` is true and user is not admin

### Issue: Input still enabled after termination
**Solution**: Verify `isChatTerminated` check in MessageInput render condition

### Issue: Wrong user gets notified
**Solution**: Ensure `selectedUser._id === data.adminId` check in listeners

### Issue: Socket events not firing
**Solution**: Check socket connection and event subscription in `subscribeToMessages()`

---

## 📊 State Flow Diagram

```
Normal Chat State
├── isChatTerminated: false
├── chatTerminationReason: null
└── Message input: enabled

         ↓ (Admin disconnects/leaves)

Terminated Chat State
├── isChatTerminated: true
├── chatTerminationReason: {
│     reason: "admin_offline" | "admin_left",
│     adminName: "John Doe",
│     timestamp: "2025-10-26T..."
│   }
├── Banner: visible
├── Message input: disabled
└── Restart button: visible

         ↓ (User clicks "Start New Chat")

Reset State
├── isChatTerminated: false
├── chatTerminationReason: null
├── selectedUser: null
├── messages: []
└── Widget reopens → new admin search
```

---

## 🚀 Future Enhancements

- [ ] Store termination logs in database for analytics
- [ ] Show "Admin will return in X minutes" if temporary
- [ ] Auto-reconnect when same admin comes back online
- [ ] Send email notification with chat transcript
- [ ] Add "Rate this chat session" after termination
- [ ] Show admin's last message timestamp

---

**Status**: ✅ Fully Implemented & Tested  
**Version**: 1.0.0  
**Date**: October 26, 2025
