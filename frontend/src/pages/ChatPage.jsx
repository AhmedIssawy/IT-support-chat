import { useChatStore } from "../store/useChatStore";
import ChatWidgetButton from "../components/ChatWidgetButton";
import AdminListPanel from "../components/AdminListPanel";
import ChatWidgetPanel from "../components/ChatWidgetPanel";

function ChatPage() {
  const { isWidgetOpen, isAdminListOpen, isChatPanelOpen, toggleWidget } = useChatStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Main content area - your existing app content goes here */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Welcome to Support Chat
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Need help? Click the chat button to connect with our support team
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
