import { api } from "@/lib/api";
import { toast } from "sonner";

export interface SquareFootageTitles {
    finished: string;
    subtotal: string;
    other: string;
}

export const defaultTitles: SquareFootageTitles = {
    finished: "Finished Areas",
    subtotal: "Sub total",
    other: "Other Areas"
};

export async function GetSquareFootageTitles(): Promise<SquareFootageTitles> {
    try {

        return defaultTitles;
    } catch (error) {
        console.error("Failed to fetch square footage titles:", error);
        return defaultTitles;
    }
}

export async function SaveSquareFootageTitles(titles: SquareFootageTitles): Promise<boolean> {
    try {
        await api.post('/settings/square_footage_titles', { value: titles });
        toast.success("Section titles saved successfully");
        return true;
    } catch (error) {
        console.error("Failed to save square footage titles:", error);
        toast.error("Failed to save section titles");
        return false;
    }
}
