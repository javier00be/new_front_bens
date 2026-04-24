import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell, LogOut } from "lucide-react";
import { menuItems } from "./Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const ROL_LABEL: Record<string, string> = {
    ADMINISTRADOR: "Administrador",
    VENDEDOR: "Vendedor",
    CLIENTE: "Cliente",
};

export const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toggleSidebar } = useSidebar();
    const { user, logout } = useAuth();

    const currentRoute = menuItems.find(
        (item) =>
            location.pathname === item.path ||
            (location.pathname.startsWith(item.path) && item.path !== "/admin")
    );

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const initials = user?.correo?.charAt(0).toUpperCase() ?? "U";

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </Button>
                <h2 className="text-lg font-bold text-slate-800">
                    {currentRoute?.label || "Panel de Control"}
                </h2>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                    <Bell className="w-5 h-5" />
                </Button>
                <div className="h-8 w-px bg-slate-200 mx-2" />
                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-800 leading-none">{user?.correo ?? "—"}</p>
                        <p className="text-xs text-slate-500 mt-1">{ROL_LABEL[user?.rol ?? ""] ?? "—"}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold border-2 border-indigo-100 shadow-sm text-sm select-none">
                        {initials}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                    title="Cerrar sesión"
                >
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>
        </header>
    );
};
