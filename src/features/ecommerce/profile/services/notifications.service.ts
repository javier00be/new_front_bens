import { api } from "@/api";

export interface NotificationItem {
    id: number;
    titulo: string;
    mensaje: string;
    tipo: "INFO" | "PEDIDO" | "PROMO" | "SISTEMA" | string;
    leida: boolean;
    enlace?: string | null;
    createdAt: string;
}

export const getNotifications = async (): Promise<NotificationItem[]> => {
    const { data } = await api.get("/notifications");
    return data;
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
    await api.patch("/notifications/read-all");
};
