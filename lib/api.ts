// lib/api.ts
import axios from "axios";
import { toast } from "sonner";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            // Do not force logout or redirect if user is viewing public tour routes
            const pathname = typeof window !== "undefined" ? window.location.pathname : "";
            const isPublicTourRoute = pathname.startsWith("/tour");
            if (!isPublicTourRoute) {
                toast.error("Session expired — you’ve been logged out");
                localStorage.removeItem("token");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);
