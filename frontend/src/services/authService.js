
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const authApi = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    "Content-Type": "application/json",
  },
});

const authService = {
  async login(email, password) {
    const response = await authApi.post("/login", { email, password });
    return response.data.data;
  },

  async register(name, email, password) {
    const response = await authApi.post("/register", {
      name,
      email,
      password,
    });
    return response.data.data;
  },

  async googleLogin(credential) {
    const response = await authApi.post("/google", { credential });
    return response.data.data;
  },

  async getMe(token) {
    const response = await authApi.get("/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.user;
  },
  async updateProfile(name) {
  const response = await authApi.put(
    "/profile",
    { name },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("securelens_token")}`,
      },
    }
  );

  return response.data.data;
},

async changePassword(currentPassword, newPassword) {
  const response = await authApi.post(
    "/change-password",
    { currentPassword, newPassword },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("securelens_token")}`,
      },
    }
  );

  return response.data;
},
async updateNotifications(scanNotifications) {
  const response = await authApi.put(
    "/notifications",
    { scanNotifications },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("securelens_token")}`,
      },
    }
  );

  return response.data.data;
},
};

export default authService;
