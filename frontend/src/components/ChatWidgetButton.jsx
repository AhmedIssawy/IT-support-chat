import { MessageCircle, X } from "lucide-react";

function ChatWidgetButton({ isOpen, onClick }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Prompt bubble */}
      {!isOpen && (
        <div className="animate-bounce">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-3 rounded-2xl shadow-xl relative max-w-xs">
            <p className="text-sm font-medium">
              Do you want to ask any questions?
            </p>
            {/* Arrow pointing to button */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-blue-500 rotate-45"></div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={onClick}
        className={`group relative w-16 h-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-300 ${
          isOpen
            ? "bg-red-500 hover:bg-red-600"
            : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-cyan-500/50"
        }`}
        aria-label={isOpen ? "Close chat" : "Open chat support"}
      >
        {/* Ping animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-20"></span>
        )}
        
        <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
          {isOpen ? (
            <X className="w-7 h-7 text-white" strokeWidth={2.5} />
          ) : (
            <MessageCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
          )}
        </div>
      </button>
    </div>
  );
}

export default ChatWidgetButton;
