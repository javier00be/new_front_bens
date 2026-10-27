import axios from "axios";

// Aquí configuraremos la URL base de tu backend cuando esté listo
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("erp_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de respuesta para manejar 401 Unauthorized (token expirado o inválido)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("erp_token");
            window.dispatchEvent(new CustomEvent("auth:unauthorized"));

            if (window.location.pathname.startsWith("/admin")) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);
