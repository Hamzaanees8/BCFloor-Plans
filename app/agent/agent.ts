import { api } from "@/lib/api";


export async function GetPublicTours(slug?: string) {
    try {
        const url = slug ? `/public/tour/${slug}` : `/public/tour`;
        const response = await api.get(url);
        const data = await response.data;
        if (data.success !== true) {
            throw new Error(data.message || `Request failed with status ${data.success}`);
        }
        return data;
    } catch (error) {
        console.error("Failed to fetch public tours:", error);
        throw error;
    }
}
