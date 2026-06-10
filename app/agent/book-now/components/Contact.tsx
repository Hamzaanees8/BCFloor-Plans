'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Eye, Plus, EyeOff, X, Trash, Edit2Icon } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AgentNote, useBookNowContext } from '../context/BookNowContext';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RealtorSignInModal } from './RealtorLogin';

const BookNowContact = () => {
    const {
        agentNotes,
        setAgentNotes,
        coAgents,
        setCoAgents,
        isSplitInvoice,
        setIsSplitInvoice,
        internal,
        setInternal,
    } = useBookNowContext();

    const [percentage, setPercentage] = useState<number | ''>('');
    const [activeTab, setActiveTab] = useState("appointment");
    const [userName, setUserName] = useState<string>("");
    const [coAgentName, setCoAgentName] = useState("");
    const [coAgentEmail, setCoAgentEmail] = useState("");
    const [editingCoAgentIndex, setEditingCoAgentIndex] = useState<number | null>(null);
    const [tempNotes, setTempNotes] = useState('');
    const [openAddCoAgentDialog, setOpenAddCoAgentDialog] = useState(false);
    const [openAddNotesDialog, setOpenAddNotesDialog] = useState(false);
    const [editingNote, setEditingNote] = useState<AgentNote | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
    const isEditing = Boolean(editingNote);
    const [hasAgentToken, setHasAgentToken] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleSaveCoAgent = () => {
        const email = coAgentEmail.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            toast.error("Please enter a valid email.");
            return;
        }

        if (!coAgentName.trim()) {
            toast.error("Please enter a name.");
            return;
        }

        // Percentage validation
        if (percentage !== '' && (isNaN(Number(percentage)) || Number(percentage) < 0 || Number(percentage) > 100)) {
            toast.error("Please enter a valid percentage between 0 and 100.");
            return;
        }

        if (isSplitInvoice && (percentage === '' || Number(percentage) <= 0)) {
            toast.error("Please enter a valid percentage.");
            return;
        }

        const newAgent = {
            email,
            name: coAgentName,
            percentage: Number(percentage) || 0,
        };

        if (editingCoAgentIndex !== null) {
            setCoAgents(prev => {
                const updated = [...prev];
                updated[editingCoAgentIndex] = newAgent;
                return updated;
            });
            toast.success("Co-Agent updated.");
        } else {
            setCoAgents(prev => [...prev, newAgent]);
            toast.success("Co-Agent added.");
        }

        // Auto-enable split invoice if percentage is set
        if (Number(percentage) > 0 && !isSplitInvoice) {
            setIsSplitInvoice(true);
        }

        closeCoAgentDialog();
    };

    const closeCoAgentDialog = () => {
        setOpenAddCoAgentDialog(false);
        setCoAgentEmail("");
        setCoAgentName("");
        setPercentage("");
        setEditingCoAgentIndex(null);
    }

    const handleEditCoAgent = (index: number) => {
        const agent = coAgents[index];
        setCoAgentName(agent.name);
        setCoAgentEmail(agent.email);
        setPercentage(agent.percentage || '');
        setEditingCoAgentIndex(index);
        setOpenAddCoAgentDialog(true);
    };

    const handleRemoveCoAgent = (index: number) => {
        const updated = [...coAgents];
        updated.splice(index, 1);
        setCoAgents(updated);
    };

    const handleOpenAddCoAgentDialog = () => {
        setCoAgentName('');
        setCoAgentEmail('');
        setPercentage('');
        setEditingCoAgentIndex(null);
        setOpenAddCoAgentDialog(true);
    };

    useEffect(() => {
        setUserName("Agent");
        const checkAuth = () => {
            const token = localStorage.getItem('agentToken');
            setHasAgentToken(!!token);
        };
        checkAuth();

        window.addEventListener('storage', checkAuth);
        window.addEventListener('agentLogin', checkAuth);
        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('agentLogin', checkAuth);
        }
    }, []);

    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
            el.style.overflowY = "hidden";
        }
    }, [agentNotes]);

    const filteredNotes = useMemo(() => {
        const filtered = agentNotes.filter(note => {
            if (activeTab === "appointment") {
                return note.internal === "false";
            } else {
                return note.internal === "true";
            }
        });
        return filtered;
    }, [agentNotes, activeTab]);

    const handleDeleteNote = (targetNote: AgentNote) => {
        setAgentNotes(prev => {
            const indexToDelete = prev.findIndex(
                n =>
                    n.note === targetNote.note &&
                    n.internal === targetNote.internal &&
                    n.date === targetNote.date
            );

            if (indexToDelete !== -1) {
                const updated = [...prev];
                updated.splice(indexToDelete, 1);
                return updated;
            }
            return prev;
        });
    };

    const handleEditNote = (note: AgentNote, index: number) => {
        setEditingNote(note);
        setTempNotes(note.note);
        setEditingNoteIndex(index);
    };

    const handleSaveInlineNote = () => {
        if (editingNote && tempNotes.trim()) {
            setAgentNotes(prev =>
                prev.map(note =>
                    note.note === editingNote.note &&
                        note.internal === editingNote.internal &&
                        note.date === editingNote.date
                        ? { ...note, note: tempNotes.trim() }
                        : note
                )
            );
        }
        setEditingNote(null);
        setEditingNoteIndex(null);
        setTempNotes('');
    };

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempNotes.trim()) {
            if (editingNote) {
                setAgentNotes(prev =>
                    prev.map(note =>
                        note.note === editingNote.note &&
                            note.internal === editingNote.internal &&
                            note.date === editingNote.date
                            ? { ...note, note: tempNotes.trim() }
                            : note
                    )
                );
                toast.success("Note updated.");
            } else {
                setAgentNotes(prev => [
                    ...prev,
                    {
                        note: tempNotes.trim(),
                        name: userName,
                        date: new Date(),
                        internal: internal ? "true" : "false"
                    }
                ]);
            }
            setTempNotes('');
            setEditingNote(null);
            setOpenAddNotesDialog(false);
        }
    };

    const handleCloseNotesDialog = () => {
        setOpenAddNotesDialog(false);
        setEditingNote(null);
        setTempNotes('');
    };

    return (
        <div className="w-full space-y-4">
            <div className="grid gap-4">
                <div className='w-full flex flex-col items-center'>
                    <div className='w-full md:w-[410px] pt-[32px] pb-[100px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                        {!hasAgentToken && (
                            <div className='flex flex-col gap-4 items-center py-8 border-b pb-8'>
                                <p className='text-[16px] font-[600] text-[#666666]'>Please login or sign up to continue</p>
                                <div className='flex gap-4 w-full'>
                                    <Button
                                        onClick={() => setShowAuthModal(true)}
                                        className='flex-1 bg-[#4290E9] text-white hover:opacity-90 h-[44px] font-[600]'
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        onClick={() => setShowAuthModal(true)}
                                        variant="outline"
                                        className='flex-1 border-[#4290E9] text-[#4290E9] hover:bg-[#4290E9] hover:text-white h-[44px] font-[600]'
                                    >
                                        Sign up
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className='grid grid-cols-2 gap-[32px]'>
                            {/* Split Invoice Section */}
                            {coAgents.length > 0 && (
                                <div className='col-span-2 flex items-center justify-between'>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="inline-block">
                                                    <label className={`flex items-center gap-x-[10px] ${(!isSplitInvoice && coAgents.length === 0) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSplitInvoice}
                                                            disabled={!isSplitInvoice && coAgents.length === 0}
                                                            onChange={(e) => {
                                                                setIsSplitInvoice(e.target.checked);
                                                            }}
                                                            className={`w-[18px] h-[18px] accent-[#4290E9] rounded-sm border border-[#CCCCCC] ${(!isSplitInvoice && coAgents.length === 0) ? 'cursor-not-allowed' : ''}`}
                                                        />
                                                        <span className='text-base font-semibold font-raleway text-[#666666]'>
                                                            Split Invoice
                                                        </span>
                                                    </label>
                                                </div>
                                            </TooltipTrigger>
                                            {(!isSplitInvoice && coAgents.length === 0) && (
                                                <TooltipContent>
                                                    <p>To enable split invoice, add a co-agent first</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}

                            {/* Co Agents Section */}
                            <div className="col-span-2">
                                <div className='flex items-center justify-between'>
                                    <p >Co Agents</p>
                                    <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={handleOpenAddCoAgentDialog}>
                                        <p className={`text-base font-semibold font-raleway text-[#4290E9]`}>Add</p>
                                        <Plus className={`w-[18px] h-[18px] bg-[#4290E9] text-white rounded-sm `} />
                                    </div>
                                    <Dialog open={openAddCoAgentDialog} onOpenChange={setOpenAddCoAgentDialog}>
                                        <DialogContent className="w-[320px] md:w-[470px] h-[350px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto [&>button]:hidden">
                                            <DialogHeader>
                                                <DialogTitle className={`flex items-center uppercase justify-between text-[#4290E9] text-[18px] font-[600]`}>
                                                    {editingCoAgentIndex !== null ? 'Edit Co-Agent' : 'Add Co-Agent'}
                                                    <button
                                                        type="button"
                                                        onClick={closeCoAgentDialog}
                                                        className="border-none !shadow-none bg-transparent"
                                                    >
                                                        <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                                                    </button>
                                                </DialogTitle>
                                                <hr className="w-full h-[1px] text-[#BBBBBB]" />
                                            </DialogHeader>

                                            <div className="w-full space-y-4">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-normal text-[#666666]">Name <span className="text-red-500">*</span></label>
                                                    <Input
                                                        value={coAgentName}
                                                        onChange={(e) => setCoAgentName(e.target.value)}
                                                        className="h-[42px] bg-[#EEEEEE]"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-sm font-normal text-[#666666]">Email <span className="text-red-500">*</span></label>
                                                    <Input
                                                        type="email"
                                                        value={coAgentEmail}
                                                        onChange={(e) => setCoAgentEmail(e.target.value)}
                                                        className="h-[42px] bg-[#EEEEEE]"
                                                    />
                                                </div>

                                                <div className="mt-4">
                                                    <label className="text-sm font-normal text-[#666666] block mb-2">Percentage <span className="text-red-500">*</span></label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={percentage === '' ? '' : percentage}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '') setPercentage('');
                                                                else setPercentage(Number(val));
                                                            }}
                                                            className="h-[42px] bg-[#EEEEEE] appearance-none"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <DialogFooter className="mt-6 flex gap-2">
                                                <Button variant="outline" onClick={closeCoAgentDialog} className="w-full">Cancel</Button>
                                                <Button onClick={handleSaveCoAgent} className={`w-full bg-[#4290E9] text-white hover:opacity-90`}>
                                                    {editingCoAgentIndex !== null ? 'Update' : 'Add'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                {coAgents.length > 0 && (
                                    <div className="mt-[12px] border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-[#E4E4E4]">
                                                <TableRow>
                                                    <TableHead className="font-bold text-[#666666]">Name</TableHead>
                                                    <TableHead className="font-bold text-[#666666]">Email</TableHead>
                                                    {isSplitInvoice && <TableHead className="font-bold text-[#666666]">Split (%)</TableHead>}
                                                    <TableHead className="text-right font-bold text-[#666666]">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {coAgents.map((agent, index) => (
                                                    <TableRow key={index} className="bg-white">
                                                        <TableCell>{agent.name}</TableCell>
                                                        <TableCell>{agent.email}</TableCell>
                                                        {isSplitInvoice && <TableCell>{agent.percentage}%</TableCell>}
                                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                                            <button onClick={() => handleEditCoAgent(index)} className="p-1 hover:bg-gray-100 rounded">
                                                                <Edit2Icon className="w-4 h-4 text-blue-500" />
                                                            </button>
                                                            <button onClick={() => handleRemoveCoAgent(index)} className="p-1 hover:bg-gray-100 rounded">
                                                                <Trash className="w-4 h-4 text-red-500" />
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>

                            {/* Additional Notes Section */}
                            <div className="col-span-2">
                                <div className='flex items-center justify-between'>
                                    <label htmlFor="">
                                        Additional Notes
                                    </label>
                                    <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={() => setOpenAddNotesDialog(true)}>
                                        <p className={`text-base font-semibold font-raleway text-[#4290E9]`}>Add</p>
                                        <Plus className={`w-[18px] h-[18px] bg-[#4290E9] text-white rounded-sm `} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-y-3 mt-3">
                                    <div className="flex items-center justify-center gap-x-2.5">
                                        <button
                                            onClick={() => {
                                                setActiveTab("appointment");
                                                setInternal(false);
                                            }}
                                            className={`px-5 py-1 text-[13px] rounded-[6px] font-bold rounded-l-md transition-colors duration-200 h-[30px]
                                            ${activeTab === "appointment" ? `bg-[#4290E9] text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                                        >

                                            Appointment Notes
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveTab("agent");
                                                setInternal(true);
                                            }}
                                            className={`px-5 py-1 text-[13px] rounded-[6px] font-bold rounded-l-md transition-colors duration-200 h-[30px]
                                            ${activeTab === "agent" ? `bg-[#4290E9] text-white` : "bg-[#E4E4E4] text-[#666666]"}`}
                                        >

                                            Notes on Agent
                                        </button>
                                    </div>
                                    {activeTab === "appointment" ? (
                                        <p className="text-[#E06D5E] text-[13px]">
                                            These notes will be viewable by AGENT.
                                        </p>
                                    ) : (
                                        <p className="text-[#7D7D7D] text-[13px]">
                                            This note is for Internal Use only. Agent will not be able to see or access Note.
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-4 mt-[12px]">
                                    {filteredNotes.length === 0 ? (
                                        <textarea
                                            className="w-full min-h-[150px] p-3 rounded-[6px] bg-[#E4E4E4] border-[1px] sidebar-scroll border-[#BBBBBB] resize-none overflow-y-auto"
                                            disabled
                                            placeholder="No notes yet..."
                                            value=""
                                        />
                                    ) : (
                                        filteredNotes.map((note, index) => (
                                            <div
                                                key={index}
                                                className="w-full p-3 rounded-[6px] bg-[#E4E4E4] border border-[#BBBBBB] relative whitespace-pre-wrap break-words"
                                            >
                                                {editingNoteIndex === index ? (
                                                    <textarea
                                                        autoFocus
                                                        className="w-full bg-transparent border-none outline-none resize-none text-sm text-[#333] min-h-[60px]"
                                                        value={tempNotes}
                                                        onChange={(e) => setTempNotes(e.target.value)}
                                                        onBlur={handleSaveInlineNote}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <p className="text-sm text-[#333]">{note.note}</p>
                                                )}

                                                <div className="mt-2 text-right text-[#8E8E8E] text-[13px] font-[400] leading-tight">
                                                    <p>
                                                        {new Date(note.date).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                    <p>{note.name}</p>
                                                    <div className='flex items-center justify-end gap-x-2'>
                                                        {note.internal === "true" ? (
                                                            <EyeOff className='w-4 h-4 text-[#7D7D7D]' />
                                                        ) : (
                                                            <Eye className='w-4 h-4 text-[#7D7D7D]' />
                                                        )}
                                                        <Edit2Icon className='w-4 h-4 text-[#7D7D7D] cursor-pointer' onClick={() => handleEditNote(note, index)} />
                                                        <Trash onClick={() => handleDeleteNote(note)} className="w-4 h-4 text-[#7D7D7D] cursor-pointer" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <Dialog open={openAddNotesDialog} onOpenChange={setOpenAddNotesDialog}>
                                <DialogContent className="w-[320px] md:w-[450px] max-h-[550px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto [&>button]:hidden">
                                    <DialogHeader>
                                        <DialogTitle className={`flex items-center uppercase justify-between text-[#4290E9] text-[18px] font-[600]`}>
                                            {isEditing ? "EDIT NOTE" : "ADD NEW NOTES"}
                                            <button
                                                type="button"
                                                onClick={handleCloseNotesDialog}
                                                className="border-none !shadow-none bg-transparent"
                                                aria-label="Close"
                                            >
                                                <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                                            </button>
                                        </DialogTitle>
                                        <hr className="w-full h-[1px] text-[#BBBBBB]" />
                                    </DialogHeader>

                                    <div className="flex flex-col">
                                        <div className="flex flex-col gap-4">
                                            <form onSubmit={handleAddNote}>
                                                <div className="flex flex-col gap-4">
                                                    {activeTab === "appointment" ? (
                                                        <p className="text-[#E06D5E] text-[16px]">
                                                            These notes will be viewable by AGENT.
                                                        </p>
                                                    ) : (
                                                        <p className="text-[#7D7D7D] text-[16px]">
                                                            This note is for Internal Use only. Agent will not be able to see or access Note.
                                                        </p>
                                                    )}
                                                    <textarea
                                                        className="h-[180px] w-full p-3 rounded-[6px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] text-[#666666]"
                                                        value={tempNotes}
                                                        onChange={(e) => setTempNotes(e.target.value)}
                                                        placeholder='Write Notes Here...'
                                                    />
                                                </div>
                                                <hr className="w-full h-[1px] text-[#BBBBBB] my-[16px]" />
                                                <DialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px] mt-2 font-alexandria">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={handleCloseNotesDialog}
                                                        className={`bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border-[#4290E9] text-[#4290E9]`}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        className={`bg-[#4290E9] text-white hover:opacity-90 w-full md:w-[176px] h-[44px] font-[400] text-[20px]`}
                                                    >
                                                        {isEditing ? "Update" : "Add"}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </div>
            <RealtorSignInModal
                open={showAuthModal}
                setOpen={setShowAuthModal}
            />
        </div>
    );
};
export default BookNowContact;