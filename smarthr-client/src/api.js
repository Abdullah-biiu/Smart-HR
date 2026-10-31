import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7104/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token to every API request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;