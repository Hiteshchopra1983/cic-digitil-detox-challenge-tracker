import { FormEvent, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getDirectMessages, searchChatUsers } from "../lib/api";

type ChatUser = {
  id: string;
  name: string;
  email: string;
};

type DirectMessage = {
  id: number;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  message: string;
  created_at: string;
};

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export default function DirectChatWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = String(localStorage.getItem("participant_id") || "");

  async function loadUsers(search: string) {
    const res = await searchChatUsers(search);
    setUsers(res?.users || []);
  }

  async function loadMessages(otherId: string) {
    const res = await getDirectMessages(otherId);
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
    socket.on("chat:new", (msg: DirectMessage) => {
      if (!selectedUser) return;
      const otherId = selectedUser.id;
      const isForCurrentThread =
        (String(msg.sender_id) === currentUserId && String(msg.receiver_id) === otherId) ||
        (String(msg.sender_id) === otherId && String(msg.receiver_id) === currentUserId);
      if (isForCurrentThread) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socketRef.current = socket;
  }

  function onSend(e: FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    const clean = text.trim();
    if (!clean || !socketRef.current) return;
    socketRef.current.emit("chat:send", {
      receiver_id: selectedUser.id,
      message: clean
    });
    setText("");
  }

  useEffect(() => {
    connectSocket();
    loadUsers("");
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    } else {
      setMessages([]);
    }
  }, [selectedUser]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="w-[360px] max-w-[92vw] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden mb-2">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <p className="font-semibold text-gray-800">Direct Chat</p>
            <span className={`text-[11px] ${connected ? "text-emerald-600" : "text-rose-600"}`}>
              {connected ? "Live" : "Offline"}
            </span>
          </div>

          <div className="p-2 border-b border-gray-100">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email"
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <div className="max-h-24 overflow-y-auto mt-2 space-y-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-sm ${
                    selectedUser?.id === u.id ? "bg-emerald-100 text-emerald-800" : "hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="h-[260px] bg-gray-50/70 p-2 overflow-y-auto">
            {!selectedUser && <p className="text-sm text-gray-500 p-2">Select a user to start chat.</p>}
            {selectedUser && messages.length === 0 && (
              <p className="text-sm text-gray-500 p-2">No messages yet. Say hello.</p>
            )}
            {messages.map((m) => {
              const mine = String(m.sender_id) === currentUserId;
              return (
                <div key={m.id} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 ${mine ? "bg-[#064e3b] text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
                    <p className={`text-[11px] ${mine ? "text-emerald-100" : "text-gray-500"}`}>
                      {m.sender_name} • {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <form onSubmit={onSend} className="p-2 border-t border-gray-100 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={selectedUser ? "Type a message..." : "Select user first"}
              disabled={!selectedUser}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-gray-100"
              maxLength={400}
            />
            <button
              type="submit"
              disabled={!selectedUser || !text.trim()}
              className="bg-[#064e3b] text-white rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-[#053d2f] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-auto inline-flex items-center gap-2 bg-[#064e3b] hover:bg-[#053d2f] text-white px-4 py-2 rounded-full shadow-xl"
      >
        <ChatIcon />
        <span className="text-sm font-semibold">{open ? "Close Chat" : "Chat"}</span>
      </button>
    </div>
  );
}
