import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";

export default function LoginPage() {

  const navigate = useNavigate();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleLogin = async (e:any)=>{

    e.preventDefault();

    try{

      const res = await apiRequest("/api/login","POST",{
        email: email.trim(),
        password
      });

      if (!res || (res as { error?: string }).error) {
        alert((res as { error?: string })?.error || "Login failed");
        return;
      }

      if (!(res as { token?: string }).token) {
        alert("Login failed — invalid response from server");
        return;
      }

      localStorage.setItem("token", (res as { token: string }).token);
      localStorage.setItem("participant_id", (res as { participant_id: string }).participant_id);
      localStorage.setItem("role", (res as { role: string }).role);

      if ((res as { role: string }).role === "admin") {
        navigate("/admin");
        return;
      }

      const pid = (res as { participant_id: string }).participant_id;
      const [base, prog] = await Promise.all([
        apiRequest(`/api/baseline/${pid}`, "GET"),
        apiRequest(`/api/progress/${pid}`, "GET")
      ]);

      if (!base?.baseline_completed) {
        navigate("/baseline");
      } else if (!prog || Number(prog.submitted ?? 0) < 1) {
        navigate("/weekly");
      } else {
        navigate("/dashboard");
      }

    }catch(err){

      console.error(err);
      alert("Login failed");

    }

  };

  return(

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-700 p-4">

      <div className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-8 md:p-10 w-full max-w-md border border-white/70">

        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-emerald-900">
          Digital Detox
        </h1>

        <p className="text-gray-600 text-center mb-6">
          CIC Challenge Tracker
        </p>

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >

          <input
            type="email"
            placeholder="you@insead.edu"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <button
            type="submit"
            className="w-full bg-emerald-800 text-white py-2.5 rounded-lg hover:bg-emerald-900 transition"
          >
            Sign In
          </button>

        </form>

        <p className="text-center mt-3">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-sm text-emerald-800 font-medium hover:underline"
          >
            Forgot password?
          </button>
        </p>

        <p className="text-center mt-4">

          Don't have an account?

          <button
            onClick={()=>navigate("/signup")}
            className="text-emerald-700 ml-1 font-medium"
          >

            Create one

          </button>

        </p>

      </div>

    </div>

  );

}