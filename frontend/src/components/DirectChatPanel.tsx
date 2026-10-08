import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getApiOrigin, getDirectMessages, searchChatUsers } from "../lib/api";
import { playChatIncomingPing, primeChatIncomingAudio } from "../lib/chatIncomingPing";

type ChatUser = {
  id: string;
  name: string;
  email: string;
};

type DirectMessage = {
  id: number | string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  message: string;
  created_at: string;
  clientStatus?: "sending" | "failed";
};

type ChatSendAck =
  | { ok: true; message: DirectMessage }
  | { ok: false; error: string };

export default function DirectChatPanel() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const selectedUserRef = useRef<ChatUser | null>(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  function mergeIncomingMessage(prev: DirectMessage[], msg: DirectMessage): DirectMessage[] {
    const me = String(localStorage.getItem("participant_id") || "");
    const other = selectedUserRef.current;
    if (!other) return prev;
    const otherId = other.id;

    if (prev.some((m) => typeof m.id === "number" && Number(m.id) === Number(msg.id))) {
      return prev;
    }

    const inThread =
      (String(msg.sender_id) === me && String(msg.receiver_id) === otherId) ||
      (String(msg.sender_id) === otherId && String(msg.receiver_id) === me);
    if (!inThread) return prev;

    if (String(msg.sender_id) === me && String(msg.receiver_id) === otherId) {
      const pendingIdx = prev.findIndex(
        (m) =>
          m.clientStatus === "sending" &&
          String(m.sender_id) === me &&
          String(m.receiver_id) === otherId &&
          m.message === msg.message
      );
      if (pendingIdx !== -1) {
        const next = [...prev];
        next[pendingIdx] = { ...msg };
        return next;
      }
    }

    return [...prev, msg];
  }

  useEffect(() => {
    const unlock = () => {
      primeChatIncomingAudio();
    };
    document.addEventListener("pointerdown", unlock, { once: true, capture: true });
    return () => document.removeEventListener("pointerdown", unlock, true);
  }, []);

  const loadUsers = useCallback(async (search: string) => {
    const res = await searchChatUsers(search);
    setUsers(res?.users || []);
  }, []);

  const loadMessages = useCallback(async (otherId: string) => {
    const res = await getDirectMessages(otherId);
    setMessages((res?.messages as DirectMessage[]) || []);
  }, []);

  const connectSocket = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const origin = getApiOrigin();
    const socket = io(origin, {
      transports: ["websocket", "polling"],
      auth: { token },
      reconnectionAttempts: 8,
      reconnectionDelay: 800,
      timeout: 20000
    });

    socket.on("connect", () => {
      setConnected(true);
      setConnectError(null);
      const sel = selectedUserRef.current;
      if (sel?.id) {
        void loadMessages(sel.id);
      }
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      if (reason === "io server disconnect") {
        setConnectError("Server closed the connection. Refresh if this persists.");
      }
    });

    socket.on("connect_error", (err: Error) => {
      setConnected(false);
      setConnectError(
        err?.message?.includes("Unauthorized")
          ? "Chat could not authorize you. Try logging in again."
          : `Cannot reach chat server (${origin}). Check VPN/network or API URL.`
      );
    });

    socket.on("chat:new", (msg: DirectMessage) => {
      const me = String(localStorage.getItem("participant_id") || "");
      const isIncomingForMe =
        String(msg.receiver_id) === me && String(msg.sender_id) !== me;
      if (isIncomingForMe) {
        playChatIncomingPing();
      }
      setMessages((prev) => mergeIncomingMessage(prev, msg));
    });

    socketRef.current = socket;
  }, [loadMessages]);

  useEffect(() => {
    connectSocket();
    void loadUsers("");
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connectSocket, loadUsers]);

  useEffect(() => {
    const t = setTimeout(() => void loadUsers(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query, loadUsers]);

  useEffect(() => {
    if (selectedUser) {
      void loadMessages(selectedUser.id);
    } else {
      setMessages([]);
    }
  }, [selectedUser, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), banner.type === "ok" ? 4000 : 8000);
    return () => clearTimeout(t);
  }, [banner]);

  function onSend(e: FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    const sock = socketRef.current;
    const clean = text.trim();
    if (!clean || !sock) return;

    primeChatIncomingAudio();

    if (!sock.connected) {
      setBanner({
        type: "err",
        text: "Not connected yet. Wait for “Live” above or refresh the page."
      });
      return;
    }

    const me = String(localStorage.getItem("participant_id") || "");
    const otherId = selectedUser.id;
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pending: DirectMessage = {
      id: tempId,
      sender_id: me,
      receiver_id: otherId,
      sender_name: "You",
      message: clean,
      created_at: new Date().toISOString(),
      clientStatus: "sending"
    };

    setMessages((prev) => [...prev, pending]);
    setText("");
    setBanner(null);

    sock.emit(
      "chat:send",
      { receiver_id: otherId, message: clean },
      (res: ChatSendAck | undefined) => {
        if (res && res.ok === true && res.message) {
          const saved = res.message;
          setMessages((prev) => {
            const withoutTemp = prev.filter((m) => m.id !== tempId);
            if (withoutTemp.some((m) => typeof m.id === "number" && Number(m.id) === Number(saved.id))) {
              return withoutTemp;
            }
            return [...withoutTemp, { ...saved }];
          });
          setBanner({
            type: "ok",
            text: "Message saved and delivered to this thread."
          });
          return;
        }

        const err = res && "error" in res ? String(res.error) : "Message could not be sent.";
        setBanner({ type: "err", text: err });
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, clientStatus: "failed" as const } : m))
        );
      }
    );
  }

  function retryFailed(tempRow: DirectMessage) {
    if (tempRow.clientStatus !== "failed" || typeof tempRow.id !== "string") return;
    const sock = socketRef.current;
    if (!sock?.connected) {
      setBanner({ type: "err", text: "Reconnect before retrying." });
      return;
    }
    const me = String(localStorage.getItem("participant_id") || "");
    const otherId = String(tempRow.receiver_id || "");
    const body = String(tempRow.message || "").trim();
    if (!body || !otherId) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === tempRow.id ? { ...m, clientStatus: "sending" as const } : m))
    );
    setBanner(null);

    sock.emit(
      "chat:send",
      { receiver_id: otherId, message: body },
      (res: ChatSendAck | undefined) => {
        if (res && res.ok === true && res.message) {
          const saved = res.message;
          setMessages((prev) => {
            const withoutTemp = prev.filter((m) => m.id !== tempRow.id);
            if (withoutTemp.some((m) => typeof m.id === "number" && Number(m.id) === Number(saved.id))) {
              return withoutTemp;
            }
            return [...withoutTemp, { ...saved }];
          });
          setBanner({ type: "ok", text: "Message sent." });
          return;
        }
        const err = res && "error" in res ? String(res.error) : "Retry failed.";
        setBanner({ type: "err", text: err });
        setMessages((prev) =>
          prev.map((m) => (m.id === tempRow.id ? { ...m, clientStatus: "failed" as const } : m))
        );
      }
    );
  }

  const statusLabel = connected ? "Live — messages send instantly" : "Offline — chat paused";
  const statusClass = connected ? "text-emerald-700" : "text-rose-700";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 py-2">
        <div>
          <p className="font-semibold text-gray-800">Direct messages</p>
          <p className={`text-[11px] font-medium ${statusClass}`}>{statusLabel}</p>
          {connectError && (
            <p className="mt-0.5 text-[11px] text-rose-600" role="alert">
              {connectError}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 border-b border-gray-100 bg-slate-50/90 px-3 py-2 text-[11px] leading-snug text-slate-600">
        <span className="font-semibold text-slate-800">How it works:</span>{" "}
        <span className="text-slate-600">1) Search and pick someone</span>
        {" · "}
        <span>2) Type your note</span>
        {" · "}
        <span>3) Send — your bubble shows </span>
        <span className="font-medium text-emerald-800">Sending…</span>
        <span> then </span>
        <span className="font-medium text-emerald-800">Saved</span>
        <span> when the server stores it.</span>
        {" · "}
        <span className="font-medium text-slate-700">New messages play a short ping.</span>
      </div>

      {banner && (
        <div
          className={`shrink-0 border-b px-3 py-2 text-xs ${
            banner.type === "ok"
              ? "border-emerald-100 bg-emerald-50 text-emerald-900"
              : "border-rose-100 bg-rose-50 text-rose-900"
          }`}
          aria-live="polite"
        >
          {banner.text}
        </div>
      )}

      <div className="shrink-0 border-b border-gray-100 p-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <div className="mt-2 max-h-24 space-y-1 overflow-y-auto">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                setSelectedUser(u);
                setBanner(null);
              }}
              className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${
                selectedUser?.id === u.id ? "bg-emerald-100 text-emerald-800" : "hover:bg-gray-50"
              }`}
            >
              <p className="truncate font-medium">{u.name}</p>
              <p className="truncate text-xs text-gray-500">{u.email}</p>
            </button>
          ))}
        </div>
        {selectedUser && (
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
            <p className="min-w-0 truncate text-[11px] text-gray-600">
              Thread with <span className="font-semibold text-gray-800">{selectedUser.name}</span>
            </p>
            <button
              type="button"
              className="shrink-0 text-[11px] font-medium text-emerald-800 hover:underline"
              onClick={() => {
                setSelectedUser(null);
                setMessages([]);
                setBanner(null);
              }}
            >
              Change person
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/70 p-2">
        {!selectedUser && (
          <p className="p-2 text-sm text-gray-500">Select a participant above to open a thread.</p>
        )}
        {selectedUser && messages.length === 0 && (
          <p className="p-2 text-sm text-gray-500">No messages yet. Say hello — you will see Sending… then Saved.</p>
        )}
        {messages.map((m) => {
          const me = String(localStorage.getItem("participant_id") || "");
          const mine = String(m.sender_id) === me;
          const isPending = mine && m.clientStatus === "sending";
          const isFailed = mine && m.clientStatus === "failed";
          const isSaved = mine && !m.clientStatus && typeof m.id === "number";

          return (
            <div key={String(m.id)} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] rounded-xl px-2.5 py-1.5 ${
                  mine
                    ? isFailed
                      ? "border border-rose-200 bg-rose-950/90 text-white"
                      : isPending
                        ? "border border-amber-200/80 bg-[#064e3b]/85 text-white"
                        : "bg-[#064e3b] text-white"
                    : "border border-gray-200 bg-white text-gray-800"
                }`}
              >
                <p className={`text-[11px] ${mine ? "text-emerald-100" : "text-gray-500"}`}>
                  {m.sender_name} ·{" "}
                  {(() => {
                    try {
                      return new Date(m.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                    } catch {
                      return "";
                    }
                  })()}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm">{m.message}</p>
                {mine && (
                  <div className="mt-1 border-t border-white/10 pt-1 text-[10px] font-medium">
                    {isPending && (
                      <span className="text-amber-100" aria-live="polite">
                        Sending… (waiting for server)
                      </span>
                    )}
                    {isSaved && <span className="text-emerald-100/90">Saved — visible in this thread</span>}
                    {isFailed && (
                      <div className="flex flex-wrap items-center gap-2 text-rose-100">
                        <span>Not delivered.</span>
                        <button
                          type="button"
                          className="rounded bg-white/15 px-2 py-0.5 font-semibold hover:bg-white/25"
                          onClick={() => retryFailed(m)}
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSend} className="flex shrink-0 gap-2 border-t border-gray-100 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={selectedUser ? "Type a message..." : "Select someone first"}
          disabled={!selectedUser}
          className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-gray-100"
          maxLength={400}
        />
        <button
          type="submit"
          disabled={!selectedUser || !text.trim() || !connected}
          title={!connected ? "Wait until status shows Live" : undefined}
          className="rounded-lg bg-[#064e3b] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#053d2f] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}
