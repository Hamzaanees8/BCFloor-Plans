import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GetUser } from '../../orders/orders';

interface Note {
    note: string;
    name: string;
    date: string;
}

interface AddNotesDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    notes: Note[];
    setNotes: (notes: Note[]) => void;
    isInternal: boolean
}



const AddNotesDialog = ({ open, setOpen, notes, setNotes, isInternal }: AddNotesDialogProps) => {
    const [tempNotes, setTempNotes] = useState('');
    const [userName, setUserName] = useState('');
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetUser(token)
            .then((res) => {
                const firstName = res?.data?.first_name || "";
                const lastName = res?.data?.last_name || "";
                setUserName(`${firstName} ${lastName}`.trim());
            })
            .catch((err) => console.log("Error fetching data:", err.message));
    }, []);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempNotes.trim()) {
            setNotes([
                ...notes,
                {
                    note: tempNotes.trim(),
                    name: userName,
                    date: new Date().toISOString().replace('T', ' ').split('.')[0]
                }
            ]);
            setTempNotes('');
            setOpen(false);
        }
    };


    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[320px] md:w-[450px] max-h-[550px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center uppercase justify-between text-[#4290E9] text-[18px] font-[600]">
                        ADD NEW NOTES
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                            }}
                            className="border-none !shadow-none bg-transparent"
                            aria-label="Close"
                        >
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </button>
                    </AlertDialogTitle>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                </AlertDialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        disabled
                        className="w-[370px] h-[42px] p-3 rounded-[6px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] text-[#666666] font-medium"
                        value={userName}
                    />
                    {isInternal &&
                        <p className='text-[#E06D5E] '>This note is for Internal Use only. Vendor will not be able to see or access Note.</p>
                    }
                    <textarea
                        className="h-[180px] w-[370px] p-3 rounded-[6px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] text-[#666666]"
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder='Write Notes Here...'
                    />
                    <hr className="w-full h-[1px] text-[#BBBBBB] my-[16px]" />
                    <AlertDialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px] mt-2 font-alexandria">
                        <AlertDialogCancel
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                            }}
                            className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            type="submit"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full md:w-[176px] h-[44px] font-[400] text-[20px]"
                        >
                            Add
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default AddNotesDialog;
