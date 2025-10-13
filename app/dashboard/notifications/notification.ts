export async function GetNotifications(token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
        const response = await fetch(`${API_URL}/notifications`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const notificationData = await response.json();

        if (!response.ok) {
            throw new Error(notificationData.message || `Request failed with status ${response.status}`);
        }

        return notificationData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}