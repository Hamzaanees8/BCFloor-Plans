import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreatePermission, UpdatePermission, Permission } from "@/app/dashboard/global-settings/permissions";

interface AddPermissionDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: Permission | null;
}

const AddPermissionDialog = ({ open, setOpen, onSuccess, initialData }: AddPermissionDialogProps) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData && open) {
            setName(initialData.name || "");
        } else if (open) {
            setName("");
        }
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error("Permission name is required");
            return;
        }

        setLoading(true);
        try {
            if (initialData && initialData.id) {
                const res = await UpdatePermission({ name }, initialData.id);
                if (res.status !== false) {
                    toast.success("Permission updated successfully");
                    onSuccess();
                    setOpen(false);
                } else {
                    toast.error(res.message || "Failed to update permission");
                }
            } else {
                const res = await CreatePermission({ name });
                if (res.status !== false) {
                    toast.success("Permission created successfully");
                    onSuccess();
                    setOpen(false);
                } else {
                    toast.error(res.message || "Failed to create permission");
                }
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Permission' : 'Add New Permission'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Permission Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. view-orders"
                            className="col-span-3"
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="mr-2 px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 transition-all font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-[#4290E9] text-white rounded hover:bg-blue-600 transition-all font-semibold"
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddPermissionDialog;
