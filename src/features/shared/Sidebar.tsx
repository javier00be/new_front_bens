import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    PackageSearch,
    Settings,
    Package,
    ShoppingBag,
    ClipboardList,
    Truck,
    UserCircle,
    PackagePlus,
    Factory,
    BookOpen,
    TrendingUp,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

export const menuItems = [
    { path: "/admin",            icon: LayoutDashboard, label: "Dashboard",   group: null       },
    // Catálogo
    { path: "/admin/products",   icon: Package,         label: "Productos",   group: "Catálogo" },
    { path: "/admin/inventory",  icon: PackageSearch,   label: "Inventario",  group: "Catálogo" },
    // Ventas
    { path: "/admin/orders",     icon: ClipboardList,   label: "Pedidos",     group: "Ventas"   },
    { path: "/admin/sales",      icon: TrendingUp,      label: "Ventas",      group: "Ventas"   },
    { path: "/admin/logistics",  icon: Truck,           label: "Logística",   group: "Ventas"   },
    // Compras
    { path: "/admin/purchases",  icon: ShoppingBag,     label: "Compras",     group: "Compras"  },
    { path: "/admin/suppliers",  icon: UserCircle,      label: "Proveedores", group: "Compras"  },
    { path: "/admin/items",      icon: PackagePlus,     label: "Insumos",     group: "Compras"  },
    // Producción
    { path: "/admin/production", icon: Factory,         label: "Producción",  group: "Fabrica." },
    { path: "/admin/recipes",    icon: BookOpen,        label: "Recetas",     group: "Fabrica." },
    // Personas
    { path: "/admin/customers",  icon: ShoppingCart,    label: "Clientes",    group: "Personas" },
    { path: "/admin/users",      icon: Users,           label: "Usuarios",    group: "Personas" },
    // Config
    { path: "/admin/settings",   icon: Settings,        label: "Config.",     group: "Sistema"  },
];

export const Sidebar = () => {
    const location = useLocation();
    const { isCollapsed } = useSidebar();

    const groups = menuItems.reduce<Record<string, typeof menuItems>>((acc, item) => {
        const g = item.group ?? "__top__";
        if (!acc[g]) acc[g] = [];
        acc[g].push(item);
        return acc;
    }, {});

    const renderItem = (item: typeof menuItems[0]) => {
        const Icon = item.icon;
        const isActive =
            location.pathname === item.path ||
            (location.pathname.startsWith(item.path) && item.path !== "/admin");

        return (
            <li key={item.path}>
                <Link
                    to={item.path}
                    title={isCollapsed ? item.label : ""}
                    className={`flex rounded-xl items-center transition-all duration-200 ${
                        isCollapsed ? "justify-center px-0 py-3" : "px-4 py-2.5"
                    } ${
                        isActive
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                            : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                    }`}
                >
                    <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? "" : "mr-3"}`} />
                    <span
                        className={`transition-all duration-300 origin-left text-sm ${
                            isCollapsed ? "w-0 scale-0 opacity-0" : "w-auto scale-100 opacity-100"
                        }`}
                    >
                        {item.label}
                    </span>
                </Link>
            </li>
        );
    };

    return (
        <aside
            className={`${
                isCollapsed ? "w-20" : "w-64"
            } bg-white text-black flex flex-col transition-all duration-300 ease-in-out border-r border-slate-200 shrink-0`}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-center overflow-hidden whitespace-nowrap px-4 border-b border-slate-100">
                {isCollapsed ? (
                    <span className="font-bold text-indigo-600 text-lg">ERP</span>
                ) : (
                    <span className="text-xl font-bold tracking-wider text-slate-800">Bens ERP</span>
                )}
            </div>

            <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
                {/* Dashboard (top, no group) */}
                {groups["__top__"] && (
                    <ul className={`${isCollapsed ? "px-2" : "px-4"} mb-2`}>
                        {groups["__top__"].map(renderItem)}
                    </ul>
                )}

                {/* Grupos con separador */}
                {Object.entries(groups)
                    .filter(([key]) => key !== "__top__")
                    .map(([group, items]) => (
                        <div key={group} className="mt-1">
                            {!isCollapsed && (
                                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                    {group}
                                </p>
                            )}
                            {isCollapsed && <div className="mx-3 border-t border-slate-100 my-2" />}
                            <ul className={`${isCollapsed ? "px-2" : "px-4"} space-y-0.5`}>
                                {items.map(renderItem)}
                            </ul>
                        </div>
                    ))}
            </nav>
        </aside>
    );
};
