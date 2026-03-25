import { createContext, useContext, useState, useEffect } from "react";

type User = {
  email: string;
  role: "user" | "admin";
};

type AuthContextType = {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("detox-user");

    if (stored) {
      setUser(JSON.parse(stored));
    }

    setLoading(false);
  }, []);

  const login = (email: string) => {
    const role = email === "admin@cic.com" ? "admin" : "user";

    const newUser = { email, role };

    localStorage.setItem("detox-user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("detox-user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};