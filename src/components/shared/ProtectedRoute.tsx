import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    // Clientes no tienen acceso al panel ERP
    if (user.rol === "CLIENTE") return <Navigate to="/" replace />;

    return <Outlet />;
};
