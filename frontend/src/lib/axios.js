import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? (import.meta.env.VITE_CLIENT_URL || "http://localhost:5000/api")
    : "/api",
  withCredentials: true,
});
