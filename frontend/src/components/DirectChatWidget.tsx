import { primeChatIncomingAudio } from "../lib/chatIncomingPing";

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function directChatUrl(): string {
  const base = import.meta.env.BASE_URL || "/";
  return new URL("direct-chat", `${window.location.origin}${base}`).href;
}

export default function DirectChatWidget() {
  function openChatWindow() {
    primeChatIncomingAudio();
    const href = directChatUrl();
    window.open(
      href,
      "dd-direct-chat",
      "width=460,height=740,left=96,top=48,resizable=yes,scrollbars=yes,noopener,noreferrer"
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        type="button"
        onClick={openChatWindow}
        className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#064e3b] px-4 py-2 text-white shadow-xl hover:bg-[#053d2f]"
        title="Opens chat in a new window. You will hear a ping for new messages."
      >
        <ChatIcon />
        <span className="text-sm font-semibold">Chat</span>
      </button>
    </div>
  );
}
