import { createContext, useContext, useState, useEffect } from "react";

interface User {
  email: string;
  role: "user" | "admin";
}

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: any) {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("detox-user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  function login(email: string) {

    const role = email === "admin@cic.com" ? "admin" : "user";

    const newUser = { email, role };

    localStorage.setItem("detox-user", JSON.stringify(newUser));

    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("detox-user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}