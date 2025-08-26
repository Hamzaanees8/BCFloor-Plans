import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { CoAgent } from "./EditAppointmentTab";

type AddCoAgentDialogProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    setCoAgents: React.Dispatch<React.SetStateAction<CoAgent[]>>;
};

export const AddCoAgentDialog = ({ open, setOpen, setCoAgents }: AddCoAgentDialogProps) => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");

    const handleAdd = () => {
        const trimmedEmail = email.trim();
        const trimmedName = name.trim();
        const trimmedContact = contact.trim();

        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

        if (!isValidEmail) {
            toast.error("Please enter a valid email.");
            return;
        }

        if (!trimmedName) {
            toast.error("Name is required.");
            return;
        }

        if (!trimmedContact) {
            toast.error("Contact is required.");
            return;
        }

        const newCoAgent = {
            email: trimmedEmail,
            name: trimmedName,
            contact: trimmedContact,
        };

        setCoAgents((prev) => [...prev, newCoAgent]);

        setEmail("");
        setName("");
        setContact("");
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-full max-w-md p-6 rounded-lg font-alexandria">
                <DialogHeader>
                    <DialogTitle className="text-[#4290E9] text-lg font-semibold  flex justify-between items-center">
                        Add Co-Agent
                       
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <div>
                        <label htmlFor="email" className="text-sm ">
                            Email
                        </label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 h-[42px]"
                        />
                    </div>

                    <div>
                        <label htmlFor="name" className="text-sm ">
                            Name
                        </label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 h-[42px]"
                        />
                    </div>

                    <div>
                        <label htmlFor="contact" className="text-sm ">
                            Contact
                        </label>
                        <Input
                            id="contact"
                            type="text"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            className="mt-1 h-[42px]"
                        />
                    </div>
                </div>

                <DialogFooter className="mt-6 flex flex-col md:flex-row gap-2">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            className="w-full md:w-[140px] border-[#0078D4] text-[#0078D4] hover:bg-[#0078D4] hover:text-white"
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full md:w-[140px]"
                        onClick={handleAdd}
                    >
                        Add
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
