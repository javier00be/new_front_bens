import { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/api";

interface AuthUser {
    id: number;
    correo: string;
    rol: "ADMINISTRADOR" | "VENDEDOR" | "CLIENTE";
}

interface RegisterDto {
    correo: string;
    password: string;
    nombre: string;
    apellido: string;
    telefono?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (correo: string, password: string) => Promise<void>;
    register: (dto: RegisterDto) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeToken(token: string): AuthUser | null {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        return { id: decoded.sub, correo: decoded.correo, rol: decoded.rol };
    } catch {
        return null;
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("erp_token");
        if (token) {
            const decoded = decodeToken(token);
            setUser(decoded);
        }
        setIsLoading(false);
    }, []);

    const login = async (correo: string, password: string) => {
        const response = await api.post("/auth/login", { correo, password });
        const { access_token, user: userData } = response.data;
        localStorage.setItem("erp_token", access_token);
        setUser({ id: userData.id, correo: userData.correo, rol: userData.rol });
    };

    const register = async (dto: RegisterDto) => {
        const response = await api.post("/auth/register", dto);
        const { access_token, user: userData } = response.data;
        localStorage.setItem("erp_token", access_token);
        setUser({ id: userData.id, correo: userData.correo, rol: userData.rol });
    };

    const logout = () => {
        localStorage.removeItem("erp_token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
};
