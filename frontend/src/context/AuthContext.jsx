
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore login session after page refresh
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("securelens_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getMe(token);

        if (!currentUser) {
          throw new Error("Unable to restore session");
        }

        setUser(currentUser);
      } catch (error) {
        console.error("Session restoration failed:", error);

        localStorage.removeItem("securelens_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(email, password) {
    const result = await authService.login(email, password);

    localStorage.setItem("securelens_token", result.token);
    setUser(result.user);

    return result.user;
  }

  async function register(name, email, password) {
    const result = await authService.register(name, email, password);

    localStorage.setItem("securelens_token", result.token);
    setUser(result.user);

    return result.user;
  }

  async function loginWithGoogle(credential) {
    const result = await authService.googleLogin(credential);

    localStorage.setItem("securelens_token", result.token);
    setUser(result.user);

    return result.user;
  }

  function logout() {
    localStorage.removeItem("securelens_token");
    setUser(null);
  }
  function updateUser(updatedUser) {
  setUser(updatedUser);
}

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
