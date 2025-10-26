import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";
import ChatWidgetButton from "../components/ChatWidgetButton";
import AdminListPanel from "../components/AdminListPanel";
import ChatWidgetPanel from "../components/ChatWidgetPanel";
import Header from "../components/Header";
import { getChatLabels } from "../lib/chatLabels";

function ChatPage() {
  const { isWidgetOpen, isAdminListOpen, isChatPanelOpen, toggleWidget, autoOpenChatOnNewMessage } = useChatStore();
  const { authUser, socket } = useAuthStore();
  
  const isAdmin = authUser?.isAdmin || false;
  const labels = getChatLabels(isAdmin);

  // Global message listener for auto-opening chat
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // Only auto-open if message is not from current user
      if (newMessage.senderId !== authUser._id) {
        autoOpenChatOnNewMessage(newMessage.senderId);
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, authUser, autoOpenChatOnNewMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header with Logout and Profile */}
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            {labels.pageTitle}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {labels.pageSubtitle}
          </p>
        </div>
      </div>

      {/* Floating Chat Widget Button */}
      <ChatWidgetButton isOpen={isWidgetOpen} onClick={toggleWidget} />

      {/* Admin List Panel */}
      <AdminListPanel isOpen={isAdminListOpen} />

      {/* Chat Widget Panel */}
      <ChatWidgetPanel isOpen={isChatPanelOpen} />
    </div>
  );
}
export default ChatPage;
