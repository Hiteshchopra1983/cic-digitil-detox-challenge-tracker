import { useLocation, useNavigate } from "react-router-dom";

type AdminSidebarProps = {
  onNavigate?: () => void;
};

export default function AdminSidebar({ onNavigate }: AdminSidebarProps){
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { label: "Admin Dashboard", path: "/admin" },
    { label: "Program Configuration", path: "/admin/config" },
    { label: "CO2 Configuration", path: "/admin/factors" },
    { label: "Audit Logs", path: "/admin/audit" },
    { label: "Participant Administration", path: "/admin/participants" },
    { label: "Impact Analytics", path: "/admin/impact" }
  ];

  function go(path: string){
    navigate(path);
    onNavigate?.();
  }

  function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("participant_id");
    localStorage.removeItem("role");
    navigate("/");
    onNavigate?.();
  }

  return(
    <div className="h-full bg-[#064e3b] text-white p-4 md:p-6 flex flex-col">
      <h2 className="text-lg md:text-xl font-bold mb-6 tracking-wide">Digital Detox Admin</h2>

      <div className="space-y-2 flex-1">
        {items.map((item)=>(
          <button
            key={item.path}
            onClick={()=>go(item.path)}
            className={`block w-full text-left rounded-xl px-3 py-2.5 transition ${
              location.pathname === item.path ? "bg-white/20 font-semibold" : "hover:bg-white/10"
            }`}
          >
            {item.label}
          </button>
        ))}

        <button
          onClick={logout}
          className="block w-full text-left rounded-xl px-3 py-2.5 mt-6 text-red-100 hover:bg-red-950/40 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
