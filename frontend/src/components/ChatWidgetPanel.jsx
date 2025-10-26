import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, ArrowLeft, Circle, Clock, Mail, AlertCircle, RefreshCw, LogOut } from "lucide-react";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { useEffect, useRef } from "react";
import { formatMessageTime } from "../lib/utils";
import { getChatLabels } from "../lib/chatLabels";

function ChatWidgetPanel({ isOpen }) {
  const { 
    selectedUser, 
    messages, 
    isMessagesLoading, 
    closeChatPanel, 
    subscribeToMessages, 
    unsubscribeFromMessages, 
    clearNotifications, 
    availableAdmins, 
    showAdminList,
    isChatTerminated,
    chatTerminationReason,
    resetChatTermination,
    toggleWidget
  } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  const messagesEndRef = useRef(null);
  
  const isAdmin = authUser?.isAdmin || false;
  const labels = getChatLabels(isAdmin);

  useEffect(() => {
    if (selectedUser) {
      subscribeToMessages();
      // Clear notifications when chat panel opens
      clearNotifications();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser, subscribeToMessages, unsubscribeFromMessages, clearNotifications]);

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Don't render if not open
  if (!isOpen) return null;

  // Check if this is a "no admin available" state (panel open but no selected user for regular users)
  const isWaitingList = !selectedUser && !isAdmin && isOpen;
  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;

  const handleRestartChat = () => {
    resetChatTermination();
    closeChatPanel();
    // Reopen widget to find new admin
    setTimeout(() => {
      toggleWidget();
    }, 300);
  };

  const handleAdminLeaveChat = () => {
    if (!selectedUser || !isAdmin) return;
    
    const confirmed = window.confirm("Are you sure you want to leave this chat? The user will be notified.");
    if (confirmed) {
      // Notify the user
      const { notifyAdminLeaving } = useChatStore.getState();
      notifyAdminLeaving(selectedUser._id);
      
      // Close the chat panel
      closeChatPanel();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeChatPanel}
      ></div>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-0 right-0 w-full md:w-[450px] h-[600px] md:bottom-6 md:right-6 md:h-[700px] md:rounded-2xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden transition-all duration-500 ease-out transform z-50 flex flex-col ${
          isOpen 
            ? "translate-x-0 translate-y-0 opacity-100 scale-100" 
            : "translate-x-full md:translate-x-0 translate-y-full md:translate-y-4 opacity-0 scale-95"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-4 flex items-center gap-3 shadow-lg">
          {/* Back/Close button */}
          <button
            onClick={closeChatPanel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={isWaitingList ? "Close" : labels.backButtonLabel}
          >
            {isWaitingList ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <ArrowLeft className="w-5 h-5 text-white" />
            )}
          </button>

          {isWaitingList ? (
            // Waiting list header
            <div className="flex-1">
              <h3 className="font-semibold text-white">Support Queue</h3>
              <p className="text-xs text-cyan-100">We'll connect you shortly</p>
            </div>
          ) : selectedUser ? (
            // Normal chat header
            <>
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/30">
                  <img
                    src={selectedUser.profilePic || "/avatar.png"}
                    alt={selectedUser.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Online indicator */}
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-cyan-500 ${
                    isOnline ? "bg-green-400" : "bg-slate-400"
                  }`}
                ></div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{selectedUser.fullName}</h3>
                <p className="text-xs text-cyan-100 flex items-center gap-1">
                  <Circle className={`w-2 h-2 ${isOnline ? "fill-green-400 text-green-400" : "fill-slate-400 text-slate-400"}`} />
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>

              {/* Admin Leave Chat Button */}
              {isAdmin && (
                <button
                  onClick={handleAdminLeaveChat}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Leave chat"
                  title="Leave this chat"
                >
                  <LogOut className="w-5 h-5 text-white" />
                </button>
              )}
            </>
          ) : null}

          {/* Close button (mobile only for normal chat) */}
          {!isWaitingList && (
            <button
              onClick={closeChatPanel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Messages / Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 space-y-4">
          {/* Chat Terminated Banner */}
          {isChatTerminated && !isAdmin && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1 flex items-center gap-2">
                    🔥 Chat Permanently Deleted
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    This chat has been permanently deleted because {chatTerminationReason?.adminName || "the admin"} is no longer online. 
                    All messages and attachments have been removed with no trace remaining.
                    {chatTerminationReason?.deletedCount > 0 && (
                      <span className="block mt-2 font-medium">
                        {chatTerminationReason.deletedCount} message{chatTerminationReason.deletedCount !== 1 ? 's' : ''} permanently deleted.
                      </span>
                    )}
                  </p>
                  <button
                    onClick={handleRestartChat}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Start New Chat
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {isWaitingList ? (
            // Waiting list message - No admins available
            <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Clock className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
              <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                No Active Admins Right Now
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed max-w-sm">
                There are no active admins right now. You've been added to our waiting list. Once an admin becomes available, we'll send you an email at{" "}
                <span className="font-semibold text-cyan-600 dark:text-cyan-400 inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 inline" />
                  {authUser.email}
                </span>
                .
              </p>
              
              {/* Available admins list (offline) */}
              {availableAdmins.length > 0 && (
                <div className="w-full max-w-sm mt-4">
                  <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
                      Support Team (Currently Offline)
                    </p>
                    <div className="space-y-2">
                      {availableAdmins.slice(0, 3).map((admin) => (
                        <div key={admin._id} className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={admin.profilePic || "/avatar.png"}
                              alt={admin.fullName}
                              className="w-8 h-8 rounded-full ring-2 ring-slate-200 dark:ring-slate-600"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-400 rounded-full border-2 border-white dark:border-slate-800"></div>
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{admin.fullName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={closeChatPanel}
                className="mt-8 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Got it, thanks!
              </button>
              
              {/* View all admins option */}
              {availableAdmins.length > 0 && (
                <button
                  onClick={showAdminList}
                  className="mt-3 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium underline underline-offset-2 transition-colors"
                >
                  View all support team members
                </button>
              )}
            </div>
          ) : isMessagesLoading ? (
            <MessagesLoadingSkeleton />
          ) : !selectedUser ? null : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">{labels.chatWelcomeEmoji}</span>
              </div>
              <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {labels.chatWelcomeTitle}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {labels.chatWelcomeText} {selectedUser.fullName} to get started!
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isMyMessage = message.senderId === authUser._id;
                return (
                  <div
                    key={message._id}
                    className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] ${isMyMessage ? "order-2" : "order-1"}`}>
                      {/* Message bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2 shadow-sm ${
                          isMyMessage
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-sm"
                            : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                        }`}
                      >
                        {message.image && (
                          <img
                            src={message.image}
                            alt="attachment"
                            className="rounded-lg mb-2 max-w-full"
                          />
                        )}
                        {message.text && (
                          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                        )}
                      </div>
                      {/* Timestamp */}
                      <p
                        className={`text-xs text-slate-400 mt-1 px-1 ${
                          isMyMessage ? "text-right" : "text-left"
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input - only show if we have a selected user and chat is not terminated */}
        {selectedUser && !isWaitingList && !isChatTerminated && (
          <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <MessageInput />
          </div>
        )}

        {/* Disabled Message Input - show when chat is terminated */}
        {selectedUser && isChatTerminated && !isAdmin && (
          <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-4">
            <div className="bg-slate-200 dark:bg-slate-800 rounded-lg px-4 py-3 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Chat ended. Input disabled.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ChatWidgetPanel;
