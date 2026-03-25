import { useNavigate } from "react-router-dom";

export default function AppLayout({children}:any){

const navigate = useNavigate();

function logout(){

localStorage.removeItem("token");
localStorage.removeItem("participant_id");

navigate("/");

}

return(

<div className="min-h-screen flex bg-gray-100">

{/* Sidebar */}

<div className="w-64 bg-white shadow-lg p-6 flex flex-col">

<h2 className="text-xl font-semibold text-primary mb-10">
Digital Detox
</h2>

<nav className="space-y-4 flex-1">

<button
onClick={()=>navigate("/dashboard")}
className="block w-full text-left text-gray-700 hover:text-green-600"
>
Dashboard
</button>

<button
onClick={()=>navigate("/baseline")}
className="block w-full text-left text-gray-700 hover:text-green-600"
>
Baseline
</button>

<button
onClick={()=>navigate("/weekly")}
className="block w-full text-left text-gray-700 hover:text-green-600"
>
Weekly Tracker
</button>

<button
onClick={()=>navigate("/leaderboard")}
className="block w-full text-left text-gray-700 hover:text-green-600"
>
Leaderboard
</button>

<button
onClick={()=>navigate("/profile")}
className="block w-full text-left text-gray-700 hover:text-green-600"
>
Profile
</button>

<button
onClick={()=>navigate("/admin")}
className="block w-full text-left text-gray-700 hover:text-green-600"
>
Admin
</button>

</nav>

<button
onClick={logout}
className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
>
Logout
</button>

</div>


{/* Main Content */}

<div className="flex-1 p-10">

{children}

</div>

</div>

)

}