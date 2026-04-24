import { Outlet } from "react-router-dom";
import { Sidebar } from "@/features/shared/Sidebar";
import { Header } from "@/features/shared/Header";
import { SidebarProvider } from "@/contexts/SidebarContext";

export const ERPLayout = () => {
    return (
        <SidebarProvider>
            <div className="h-screen flex bg-gray-100 overflow-hidden">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top Header */}
                    <Header />

                    {/* Page Content */}
                    <main className="flex-1 p-8 overflow-auto">
                        <Outlet />
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};

