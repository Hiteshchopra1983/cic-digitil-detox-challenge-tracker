import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import DirectChatWidget from "./DirectChatWidget";

export default function Layout({
  children,
  dense = false,
  pinFooterToMain = false
}: {
  children: ReactNode;
  /** Tighter scroll-area padding (e.g. compact welcome / info pages) */
  dense?: boolean;
  /**
   * Main column uses full height; children should wrap scrollable content + a fixed footer
   * so the footer sits at the bottom of the viewport (above the chat widget).
   */
  pinFooterToMain?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-emerald-50/40 text-slate-900">
      <div className="sm:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#064e3b] text-white shadow-md">
        <div className="font-semibold tracking-tight">Digital Detox</div>
        <button
          type="button"
          className="rounded-lg border border-white/25 px-3 py-1.5 text-sm font-medium"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      <div className="flex h-[calc(100vh-56px)] sm:h-screen min-h-0">
        <aside className="hidden sm:flex w-64 shrink-0 flex-col border-r border-emerald-950/15 shadow-xl">
          <Sidebar />
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-40 sm:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 shadow-2xl">
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-end gap-2 border-b border-slate-200/90 bg-white/80 px-4 py-2.5 backdrop-blur-md sm:px-6">
            <NotificationBell />
          </div>
          {pinFooterToMain ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                className={
                  dense
                    ? "mx-auto flex min-h-0 min-w-0 flex-1 flex-col px-2.5 py-2 sm:px-4 sm:py-3"
                    : "mx-auto flex min-h-0 min-w-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5"
                }
              >
                {children}
              </div>
            </div>
          ) : (
            <div className="app-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div
                className={
                  dense
                    ? "mx-auto flex min-h-full w-full max-w-6xl flex-col px-2.5 py-2 sm:px-4 sm:py-3 pb-16 sm:pb-20"
                    : "mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-5 pb-24 sm:pb-28"
                }
              >
                {children}
              </div>
            </div>
          )}
        </main>

        <DirectChatWidget />
      </div>
    </div>
  );
}
