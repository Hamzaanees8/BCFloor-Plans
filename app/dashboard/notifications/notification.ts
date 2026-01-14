import { api } from "@/lib/api";

export async function GetNotifications(token: string) {
    try {
        const response = await api.get(`/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const notificationData = await response.data;

        if (response.status !== 200) {
            throw new Error(notificationData.message || `Request failed with status ${response.status}`);
        }

        return notificationData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}