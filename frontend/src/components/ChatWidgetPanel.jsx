import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, ArrowLeft, Circle } from "lucide-react";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { useEffect, useRef } from "react";
import { formatMessageTime } from "../lib/utils";

function ChatWidgetPanel({ isOpen }) {
  const { selectedUser, messages, isMessagesLoading, closeChatPanel, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!isOpen || !selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
        onClick={closeChatPanel}
      ></div>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-0 right-0 w-full md:w-[450px] h-[600px] md:bottom-6 md:right-6 md:h-[700px] md:rounded-2xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden transition-all duration-300 transform z-50 flex flex-col ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-4 flex items-center gap-3 shadow-lg">
          {/* Back button */}
          <button
            onClick={closeChatPanel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Back to admin list"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

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

          {/* Close button */}
          <button
            onClick={closeChatPanel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 space-y-4">
          {isMessagesLoading ? (
            <MessagesLoadingSkeleton />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Start a conversation
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Send a message to {selectedUser.fullName} to get started!
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

        {/* Message Input */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <MessageInput />
        </div>
      </div>
    </>
  );
}

export default ChatWidgetPanel;
