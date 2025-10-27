import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  availableAdmins: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  isWidgetOpen: false,
  isAdminListOpen: false,
  isChatPanelOpen: false,
  unreadCount: 0,
  hasNewMessage: false,
  isChatTerminated: false,
  chatTerminationReason: null,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  
  toggleWidget: async () => {
    const isOpen = !get().isWidgetOpen;
    const { authUser, onlineUsers } = useAuthStore.getState();
    const isAdmin = authUser?.isAdmin || false;
    
    set({ isWidgetOpen: isOpen });
    if (isOpen) {
      // Admins see the list, regular users get auto-connected to an admin
      if (isAdmin) {
        set({ isAdminListOpen: true, isChatPanelOpen: false });
        get().getAllUsers();
      } else {
        // Regular user - check for last admin first
        set({ isUsersLoading: true });
        try {
          const res = await axiosInstance.get("/messages/avail-admin");
          set({ availableAdmins: res.data });
          
          // Get last admin ID from localStorage
          const lastAdminId = localStorage.getItem("lastAdminId");
          let selectedAdmin = null;
          
          // Priority 1: Try to reconnect with last admin if they exist and are valid
          if (lastAdminId) {
            const lastAdmin = res.data.find(admin => admin._id === lastAdminId);
            if (lastAdmin) {
              // Last admin still exists - use them regardless of online status
              selectedAdmin = lastAdmin;
            }
          }
          
          // Priority 2: If no last admin or they're no longer available, find first online admin
          if (!selectedAdmin) {
            selectedAdmin = res.data.find(admin => onlineUsers.includes(admin._id));
          }
          
          if (selectedAdmin) {
            // Connect to the selected admin
            set({ 
              selectedUser: selectedAdmin,
              isAdminListOpen: false,
              isChatPanelOpen: true,
              isUsersLoading: false
            });
            get().getMessagesByUserId(selectedAdmin._id);
            // Save this admin as the last contacted
            localStorage.setItem("lastAdminId", selectedAdmin._id);
          } else {
            // No admins available at all - show waiting list message
            set({ 
              isAdminListOpen: false,
              isChatPanelOpen: true,
              selectedUser: null, // null indicates "no admin available" state
              isUsersLoading: false
            });
          }
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to connect to support");
          set({ isUsersLoading: false, isWidgetOpen: false });
        }
      }
    } else {
      set({ isAdminListOpen: false, isChatPanelOpen: false, selectedUser: null });
    }
  },

  openChatPanel: (admin) => {
    const { authUser } = useAuthStore.getState();
    const isAdmin = authUser?.isAdmin || false;
    
    set({ 
      selectedUser: admin, 
      isAdminListOpen: false, 
      isChatPanelOpen: true,
      unreadCount: 0,
      hasNewMessage: false
    });
    get().getMessagesByUserId(admin._id);
    
    // Save admin ID for non-admin users to remember last conversation
    if (!isAdmin) {
      localStorage.setItem("lastAdminId", admin._id);
    }
  },

  closeChatPanel: () => {
    set({ 
      isChatPanelOpen: false, 
      isAdminListOpen: true, 
      selectedUser: null,
      isChatTerminated: false,
      chatTerminationReason: null
    });
  },

  closeWidget: () => {
    set({ 
      isWidgetOpen: false, 
      isAdminListOpen: false, 
      isChatPanelOpen: false, 
      selectedUser: null,
      isChatTerminated: false,
      chatTerminationReason: null
    });
  },

  clearNotifications: () => {
    set({ unreadCount: 0, hasNewMessage: false });
  },

  showAdminList: () => {
    set({ 
      isAdminListOpen: true, 
      isChatPanelOpen: false, 
      selectedUser: null 
    });
  },

  terminateChat: (reason, adminName) => {
    const { authUser } = useAuthStore.getState();
    const isAdmin = authUser?.isAdmin || false;
    
    // Only terminate for regular users (not admins)
    if (!isAdmin) {
      set({ 
        isChatTerminated: true,
        chatTerminationReason: {
          reason,
          adminName,
          timestamp: new Date().toISOString()
        }
      });
      
      // Play notification sound if enabled
      if (get().isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
      
      toast.error(`${adminName} has left the chat`);
    }
  },

  permanentlyDeleteChat: (reason, adminName, deletedCount) => {
    const { authUser } = useAuthStore.getState();
    const isAdmin = authUser?.isAdmin || false;
    
    // Only for regular users (not admins)
    if (!isAdmin) {
      // Clear ALL chat data from local state
      set({ 
        isChatTerminated: true,
        chatTerminationReason: {
          reason,
          adminName,
          timestamp: new Date().toISOString(),
          deletedCount
        },
        messages: [],  // Clear all messages
        selectedUser: null,  // Clear selected user
      });
      
      // Play notification sound if enabled
      if (get().isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
      
      // Show permanent deletion notice
      toast.error(`This chat has been permanently deleted because ${adminName} is no longer online`, {
        duration: 6000,
        icon: '🔥'
      });
    }
  },

  resetChatTermination: () => {
    set({ 
      isChatTerminated: false,
      chatTerminationReason: null,
      selectedUser: null,
      messages: []
    });
  },

  notifyAdminLeaving: (userId) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("adminLeavingChat", { userId });
    }
  },

  autoOpenChatOnNewMessage: (senderId) => {
    const { isWidgetOpen, isChatPanelOpen, selectedUser } = get();
    const { authUser } = useAuthStore.getState();
    const isAdmin = authUser?.isAdmin || false;
    
    // Don't auto-open if it's my own message
    if (senderId === authUser._id) return;
    
    // If chat is already open to this user, just clear notifications
    if (isChatPanelOpen && selectedUser?._id === senderId) {
      set({ unreadCount: 0, hasNewMessage: false });
      return;
    }
    
    // If widget is closed, auto-open it with the chat panel
    if (!isWidgetOpen) {
      // First, fetch the sender's data
      const fetchSenderAndOpen = async () => {
        try {
          // Fetch admins or users based on role
          if (isAdmin) {
            await get().getAllUsers();
          } else {
            await get().getAvailAdmin();
          }
          
          // Find the sender in the contacts
          const contacts = isAdmin ? get().allContacts : get().availableAdmins;
          const sender = contacts.find(c => c._id === senderId);
          
          if (sender) {
            set({ 
              isWidgetOpen: true,
              isAdminListOpen: false,
              isChatPanelOpen: true,
              selectedUser: sender,
              unreadCount: 0,
              hasNewMessage: false
            });
            get().getMessagesByUserId(senderId);
            
            // Save admin ID for non-admin users to remember last conversation
            if (!isAdmin) {
              localStorage.setItem("lastAdminId", senderId);
            }
          }
        } catch (error) {
          console.error("Error auto-opening chat:", error);
          // Show notification badge if auto-open fails
          set({ 
            hasNewMessage: true,
            unreadCount: get().unreadCount + 1
          });
        }
      };
      
      fetchSenderAndOpen();
    } else if (isWidgetOpen && !isChatPanelOpen) {
      // Widget is open but chat panel is closed - auto-open the chat panel
      const fetchSenderAndOpen = async () => {
        try {
          const contacts = isAdmin ? get().allContacts : get().availableAdmins;
          const sender = contacts.find(c => c._id === senderId);
          
          if (sender) {
            set({ 
              isAdminListOpen: false,
              isChatPanelOpen: true,
              selectedUser: sender,
              unreadCount: 0,
              hasNewMessage: false
            });
            get().getMessagesByUserId(senderId);
            
            // Save admin ID for non-admin users
            if (!isAdmin) {
              localStorage.setItem("lastAdminId", senderId);
            }
          } else {
            // Sender not in current list, fetch fresh data
            if (isAdmin) {
              await get().getAllUsers();
            } else {
              await get().getAvailAdmin();
            }
            const updatedContacts = isAdmin ? get().allContacts : get().availableAdmins;
            const updatedSender = updatedContacts.find(c => c._id === senderId);
            
            if (updatedSender) {
              set({ 
                isAdminListOpen: false,
                isChatPanelOpen: true,
                selectedUser: updatedSender,
                unreadCount: 0,
                hasNewMessage: false
              });
              get().getMessagesByUserId(senderId);
              
              if (!isAdmin) {
                localStorage.setItem("lastAdminId", senderId);
              }
            }
          }
        } catch (error) {
          console.error("Error opening chat panel:", error);
          // Show notification badge if auto-open fails
          set({ 
            hasNewMessage: true,
            unreadCount: get().unreadCount + 1
          });
        }
      };
      
      fetchSenderAndOpen();
    } else if (isChatPanelOpen && selectedUser?._id !== senderId) {
      // Chat panel is open but with different user - show notification badge
      set({ 
        hasNewMessage: true,
        unreadCount: get().unreadCount + 1
      });
    }
  },

  getAllUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getAvailAdmin: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/avail-admin");
      set({ availableAdmins: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    const isAdmin = authUser?.isAdmin || false;

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    
    // Immediately update the UI by adding the optimistic message
    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      
      // Remove optimistic message and add the real one
      const updatedMessages = messages.filter(msg => msg._id !== tempId);
      set({ messages: [...updatedMessages, res.data] });
      
      // Save admin ID for non-admin users to remember last conversation
      if (!isAdmin) {
        localStorage.setItem("lastAdminId", selectedUser._id);
      }
    } catch (error) {
      // Remove optimistic message on failure
      set({ messages: messages.filter(msg => msg._id !== tempId) });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const { authUser } = useAuthStore.getState();
    const isAdmin = authUser?.isAdmin || false;

    // Remove any existing listeners to prevent duplicates
    socket.off("newMessage");
    socket.off("adminLeftChat");
    socket.off("adminWentOffline");
    socket.off("chatPermanentlyDeleted");

    // Global newMessage listener
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, isSoundEnabled, messages } = get();
      const isMyMessage = newMessage.senderId === authUser._id;
      
      // Update messages if this message belongs to the currently selected chat
      if (selectedUser) {
        const isRelevantToCurrentChat = 
          (newMessage.senderId === selectedUser._id) || 
          (newMessage.receiverId === selectedUser._id && isMyMessage);
        
        if (isRelevantToCurrentChat) {
          // Remove any optimistic message with same text/image if it's our message
          let updatedMessages = messages;
          if (isMyMessage) {
            updatedMessages = messages.filter(msg => {
              if (msg.isOptimistic && msg.text === newMessage.text && msg.image === newMessage.image) {
                return false;
              }
              return true;
            });
          }
          set({ messages: [...updatedMessages, newMessage] });
        }
      }

      // Auto-open chat if message is from someone else
      if (!isMyMessage) {
        get().autoOpenChatOnNewMessage(newMessage.senderId);
        
        // Clear notifications if chat panel is open to this user
        if (get().isChatPanelOpen && selectedUser?._id === newMessage.senderId) {
          set({ unreadCount: 0, hasNewMessage: false });
        }
      }

      // Play sound for incoming messages
      if (isSoundEnabled && !isMyMessage) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });

    // Listen for admin leaving chat (intentional)
    if (!isAdmin) {
      socket.on("adminLeftChat", (data) => {
        const { selectedUser } = get();
        if (selectedUser && data.adminId === selectedUser._id) {
          get().terminateChat("admin_left", data.adminName);
        }
      });

      // Listen for admin going offline (disconnect)
      socket.on("adminWentOffline", (data) => {
        const { selectedUser } = get();
        if (selectedUser && data.adminId === selectedUser._id) {
          get().terminateChat("admin_offline", data.adminName);
        }
      });

      // Listen for permanent chat deletion
      socket.on("chatPermanentlyDeleted", (data) => {
        const { selectedUser } = get();
        if (selectedUser && data.adminId === selectedUser._id) {
          get().permanentlyDeleteChat(data.reason, data.adminName, data.deletedCount);
        }
      });
    }
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    socket.off("newMessage");
    socket.off("adminLeftChat");
    socket.off("adminWentOffline");
    socket.off("chatPermanentlyDeleted");
  },
}));
