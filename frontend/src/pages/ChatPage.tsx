import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Layout from "../components/Layout";
import { getChatMessages } from "../lib/api";

type ChatMessage = {
  id: number;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = localStorage.getItem("participant_id") || "";

  const groupedMessages = useMemo(() => messages, [messages]);

  async function loadHistory() {
    const res = await getChatMessages();
    setMessages(res?.messages || []);
  }

  function connectSocket() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("http://localhost:3000", {
      transports: ["websocket"],
      auth: { token }
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("chat:new", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current = socket;
  }

  function onSend(e: FormEvent) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || !socketRef.current) return;
    setSending(true);
    socketRef.current.emit("chat:send", { message: clean });
    setText("");
    setSending(false);
  }

  useEffect(() => {
    loadHistory();
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Community Chat</h1>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              connected ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {connected ? "Live" : "Offline"}
          </span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm h-[70vh] flex flex-col">
          <div className="p-4 border-b border-gray-100 text-sm text-gray-600">
            Send supportive messages, tips, and progress wins with participants.
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/60">
            {groupedMessages.length === 0 && (
              <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
            )}

            {groupedMessages.map((m) => {
              const mine = String(m.sender_id) === String(currentUserId);
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      mine ? "bg-[#064e3b] text-white" : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    <p className={`text-xs mb-1 ${mine ? "text-emerald-100" : "text-gray-500"}`}>
                      {m.sender_name} • {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-sm break-words whitespace-pre-wrap">{m.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <form onSubmit={onSend} className="p-3 border-t border-gray-100 flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200"
              rows={2}
              maxLength={400}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="bg-[#064e3b] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#053d2f] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
