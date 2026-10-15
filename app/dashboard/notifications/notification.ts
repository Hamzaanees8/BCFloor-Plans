import { api } from "@/lib/api";

export interface NotificationFilterOptions {
  months?: number;
  all?: boolean;
  start_date?: string;
  end_date?: string;
}

export async function GetNotifications(
  token: string,
  filter?: number | NotificationFilterOptions
) {
  try {
    let params: Record<string, any> = {};
    if (typeof filter === "number") {
      params = { months: filter };
    } else if (filter) {
      if (filter.all) {
        params.all = true;
      } else if (filter.start_date || filter.end_date) {
        if (filter.start_date) params.start_date = filter.start_date;
        if (filter.end_date) params.end_date = filter.end_date;
      } else if (filter.months) {
        params.months = filter.months;
      }
    }
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

export async function MarkAllNotificationsAsRead(token: string) {
  try {
    const response = await api.put(
      `/notifications/mark-all-read`,
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
    console.error("Failed to mark all notifications as read:", error);
    throw error;
  }
}
