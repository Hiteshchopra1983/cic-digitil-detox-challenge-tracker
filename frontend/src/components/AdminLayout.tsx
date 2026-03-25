import { useState } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({children}:any){
  const [menuOpen,setMenuOpen] = useState(false);

  return(
    <div className="h-screen overflow-hidden bg-[#f3f4f6] text-gray-900">
      <div className="sm:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#064e3b] text-white shadow">
        <div className="font-semibold">Digital Detox Admin</div>
        <button
          className="rounded-md border border-white/30 px-3 py-1 text-sm"
          onClick={()=>setMenuOpen((v)=>!v)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      <div className="flex h-[calc(100vh-56px)] sm:h-screen">
        <aside className="hidden sm:block w-80 shadow-xl">
          <AdminSidebar />
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-40 sm:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setMenuOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-80 shadow-2xl">
              <AdminSidebar onNavigate={()=>setMenuOpen(false)} />
            </div>
          </div>
        )}

        <div className="app-scroll flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
