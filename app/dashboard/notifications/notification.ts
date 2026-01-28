import { api } from "@/lib/api";

export async function GetNotifications(token: string, months?: number) {
  try {
    const params = months ? { months } : {};
    const response = await api.get(`/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params,
    });

    const notificationData = await response.data;

    if (response.status !== 200) {
      throw new Error(
        notificationData.message ||
          `Request failed with status ${response.status}`,
      );
    }

    return notificationData;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    throw error;
  }
}

export async function MarkNotificationAsRead(token: string, uuid: string) {
  try {
    const response = await api.put(
      `/notifications/read/${uuid}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status !== 200) {
      throw new Error(
        response.data?.message ||
          `Request failed with status ${response.status}`,
      );
    }

    return response.data;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }
}
