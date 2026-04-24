import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { StoreLayout } from "../layouts/StoreLayout";
import { ERPLayout } from "../layouts/ERPLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { InventoryDashboard } from "@/features/erp/inventory/components/InventoryDashboard";
import { SalesDashboard } from "@/features/erp/sales/components/SalesDashboard";
import { UsersDashboard } from "@/features/erp/users/components/UsersDashboard";
import { ProductsDashboard } from "@/features/erp/products/components/ProductsDashboard";
import { OrdersDashboard } from "@/features/erp/orders/components/OrdersDashboard";
import { CustomersDashboard } from "@/features/erp/customers/components/CustomersDashboard";
import { SuppliersDashboard } from "@/features/erp/suppliers/components/SuppliersDashboard";
import { ItemsDashboard } from "@/features/erp/items/components/ItemsDashboard";
import { PurchasesDashboard } from "@/features/erp/purchases/components/PurchasesDashboard";
import { ProductionDashboard } from "@/features/erp/production/components/ProductionDashboard";
import { RecipesDashboard } from "@/features/erp/recipes/components/RecipesDashboard";
import { LogisticsDashboard } from "@/features/erp/logistics/components/LogisticsDashboard";
import { ERPDashboard } from "@/features/erp/dashboard/components/ERPDashboard";
import { SettingsDashboard } from "@/features/erp/settings/components/SettingsDashboard";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { HomePage } from "@/pages/ecommerce/HomePage";

const router = createBrowserRouter([
    // ─── Rutas Públicas — Ecommerce ───────────────────────────────────────────
    {
        path: "/",
        element: <StoreLayout />,
        children: [
            { index: true, element: <HomePage /> },
        ],
    },

    // ─── Rutas Privadas — ERP ─────────────────────────────────────────────────
    {
        path: "/admin",
        element: <ProtectedRoute />,
        children: [
            {
                element: <ERPLayout />,
                children: [
                    { index: true, element: <ERPDashboard /> },

                    // Usuarios
                    { path: "users", element: <UsersDashboard /> },

                    // Catálogo
                    { path: "products",  element: <ProductsDashboard /> },
                    { path: "inventory", element: <InventoryDashboard /> },

                    // Clientes y Proveedores
                    { path: "customers", element: <CustomersDashboard /> },
                    { path: "suppliers", element: <SuppliersDashboard /> },

                    // Ventas
                    { path: "orders",  element: <OrdersDashboard /> },
                    { path: "sales",   element: <SalesDashboard /> },
                    { path: "logistics", element: <LogisticsDashboard /> },

                    // Compras y Materias Primas
                    { path: "purchases", element: <PurchasesDashboard /> },
                    { path: "items",     element: <ItemsDashboard /> },

                    // Fabricación
                    { path: "production", element: <ProductionDashboard /> },
                    { path: "recipes",    element: <RecipesDashboard /> },

                    // Config
                    { path: "settings", element: <SettingsDashboard /> },
                ],
            },
        ],
    },

    // ─── Auth ─────────────────────────────────────────────────────────────────
    { path: "/login",    element: <LoginForm /> },
    { path: "/register", element: <RegisterForm /> },
    { path: "*", element: <Navigate to="/" replace /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
