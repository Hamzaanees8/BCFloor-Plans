


import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, X, Trash, Edit2Icon } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropDownArrow } from '@/components/Icons';
import { GetUser } from '../orders';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAppContext } from '@/app/context/AppContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { SearchableSelect } from './SearchableSelect';
import { useOrderContext } from '../context/OrderContext';
import { RealtorSignInModal } from '@/app/agent/book-now/components/RealtorLogin';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { GetOne as GetOneAgent } from '@/app/dashboard/agents/agents';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const Contact = () => {
    const {
        selectedAgentId,
        setSelectedAgentId,
        agentNotes,
        setAgentNotes,
        coAgents,
        setCoAgents,
        isSplitInvoice,
        setIsSplitInvoice,
        agentsData,
        lastPopulatedAgentId,
        setLastPopulatedAgentId,
        isBookNowMode
    } = useOrderContext();
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string)?.toLowerCase() || (isBookNowMode ? 'agent' : 'admin');
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [showSignIn, setShowSignIn] = useState(false);
    const [hasToken, setHasToken] = useState(true);
    useEffect(() => {
        const checkToken = () => {
            const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
            setHasToken(!!token);
        };
        
        checkToken();
        
        window.addEventListener('storage', checkToken);
        window.addEventListener('agentLogin', checkToken);
        
        return () => {
            window.removeEventListener('storage', checkToken);
            window.removeEventListener('agentLogin', checkToken);
        };
    }, []);

    const selectedAgent = useMemo(() => {
        return agentsData.find((agent) => agent.uuid === selectedAgentId) || null;
    }, [agentsData, selectedAgentId]);

    const [detailedAgent, setDetailedAgent] = useState<any | null>(null);

    useEffect(() => {
        if (selectedAgentId) {
            GetOneAgent(selectedAgentId)
                .then((res: any) => {
                    if (res?.data) {
                        setDetailedAgent(res.data);
                    }
                })
                .catch((err: any) => {
                    console.error("Failed to fetch detailed agent:", err);
                });
        } else {
            setDetailedAgent(null);
        }
    }, [selectedAgentId]);

    const availableCoAgents = useMemo(() => {
        const target = (detailedAgent && detailedAgent.uuid === selectedAgentId) ? detailedAgent : selectedAgent;
        if (!target) return [];

        let raw = target.co_agents || target.coagents || target.coagent;
        
        if (!raw) return [];

        if (typeof raw === 'object' && !Array.isArray(raw)) {
            raw = [raw];
        }

        if (typeof raw === 'string') {
            try {
                raw = JSON.parse(raw);
            } catch (e) {
                console.error("Failed to parse co_agents JSON:", e);
                return [];
            }
        }

        if (!Array.isArray(raw)) return [];

        return raw.map((item: any) => {
            if (typeof item === 'string') {
                const isEmail = item.includes('@');
                return {
                    name: isEmail ? item.split('@')[0] : item,
                    email: isEmail ? item : '',
                    percentage: 0
                };
            }
            return {
                name: item.name || item.first_name || (item.email ? item.email.split('@')[0] : 'Co-Agent'),
                email: item.email || item.primary_email || '',
                percentage: Number(item.split) || Number(item.percentage) || 0
            };
        }).filter((item: any) => item.email || item.name);
    }, [selectedAgent, detailedAgent, selectedAgentId]);
    //     const [draftCoAgents, setDraftCoAgents] = useState<typeof coAgents>([]); // Keeping for backward compatibility if needed, but primary flow will direct update coAgents
    const [percentage, setPercentage] = useState<number | ''>('');
    const [userName, setUserName] = useState<string>("");

    // New Co-Agent States
    const [coAgentName, setCoAgentName] = useState("");
    const [coAgentEmail, setCoAgentEmail] = useState("");
    const [coAgentMode, setCoAgentMode] = useState<'existing' | 'new'>('existing');
    const [editingCoAgentIndex, setEditingCoAgentIndex] = useState<number | null>(null);
    //     const [adminEmail, setAdminEmail] = useState("");
    //     const removeAdmin = () => setAdminEmail("");
    const [openAddCoAgentDialog, setOpenAddCoAgentDialog] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);


    // New States for Notes Redesign
    const [editingNote, setEditingNote] = useState<any | null>(null);
    const [editNoteText, setEditNoteText] = useState('');


    const token = localStorage.getItem('token')



    // Updated Handle Add/Update
    const handleSaveCoAgent = () => {
        const email = coAgentEmail.trim();

        // Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            if (coAgentMode === 'new' || editingCoAgentIndex !== null) { // Only validate strict email for new/edit manual
                toast.error("Please enter a valid email.");
                return;
            }
        }

        if (coAgentMode === 'new' && !coAgentName.trim()) {
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

        const name = coAgentName;
        // If existing mode, get name from email/selected agent logic if needed, but usually we set name when selecting from dropdown

        const newAgent = {
            email,
            name: name || email.split('@')[0],
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

        // Reset
        closeCoAgentDialog();
    };

    const closeCoAgentDialog = () => {
        setOpenAddCoAgentDialog(false);
        setCoAgentEmail("");
        setCoAgentName("");
        setPercentage("");
        setEditingCoAgentIndex(null);
        setCoAgentMode('existing');
    }

    const handleEditCoAgent = (index: number) => {
        const agent = coAgents[index];
        setCoAgentName(agent.name);
        setCoAgentEmail(agent.email);
        setPercentage(agent.percentage || '');
        setEditingCoAgentIndex(index);
        setCoAgentMode('new'); // Edit mode is effectively "new" (manual) mode but pre-filled
        setOpenAddCoAgentDialog(true);
    };

    const handleRemoveCoAgent = (index: number) => {
        const updated = [...coAgents];
        updated.splice(index, 1);
        setCoAgents(updated);
    };

    const handleSelectExisting = (agentId: string) => {
        const agent = availableCoAgents.find((a) => a.email === agentId || a.name === agentId);

        if (agent) {
            setCoAgentName(agent.name);
            setCoAgentEmail(agent.email);
            if (agent.percentage && agent.percentage > 0) {
                setPercentage(agent.percentage);
            }
        }
    };

    const handleOpenAddCoAgentDialog = () => {
        setCoAgentMode('existing');
        setCoAgentName('');
        setCoAgentEmail('');
        setPercentage('');
        setEditingCoAgentIndex(null);
        setOpenAddCoAgentDialog(true);
    };
    // useEffect(() => {
    //     if (openAddNotesDialog) {
    //         setTempNotes(agentNotes);
    //     }
    // }, [agentNotes, openAddNotesDialog]);
    // useEffect(() => {
    //     const el = textareaRef.current;
    //     if (el) {
    //         el.style.height = "auto";
    //         const height = el.scrollHeight;
    //         el.style.height = `${Math.min(height, 150)}px`;

    //         // ✅ Only show scrollbar if content exceeds 150px
    //         el.style.overflowY = height > 150 ? "auto" : "hidden";
    //     }
    // }, [note]);

    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto"; // Reset
            el.style.height = el.scrollHeight + "px"; // Fit exact content
            el.style.overflowY = "hidden"; // Prevent scroll
        }
    }, [agentNotes]);
    useEffect(() => {
        const token = localStorage.getItem("token") || localStorage.getItem("agentToken");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        const userInfoStr = localStorage.getItem("userInfo");
        if (userInfoStr) {
            try {
                const userObj = JSON.parse(userInfoStr);
                const firstName = userObj.first_name || userObj.name || "";
                const lastName = userObj.last_name || "";
                setUserName(`${firstName} ${lastName}`.trim() || "Agent");
            } catch (e) {
                console.error("Error parsing userInfo", e);
            }
        }

        if (localStorage.getItem("token")) {
            GetUser(localStorage.getItem("token")!)
                .then((res) => {
                    const firstName = res?.data?.first_name || "";
                    const lastName = res?.data?.last_name || "";
                    if (firstName || lastName) {
                        setUserName(`${firstName} ${lastName}`.trim());
                    }
                })
                .catch((err) => console.log("Error fetching data:", err.message));
        }
    }, []);



    useEffect(() => {
        if (selectedAgent && selectedAgent.uuid !== lastPopulatedAgentId) {
            setCoAgents(prev => {
                if (prev.length > 0) return prev;
                return availableCoAgents;
            });

            // Check if agent has notes and if they haven't been added yet (simple duplicate check)
            if (selectedAgent.notes) {
                setAgentNotes(prev => {
                    const noteExists = prev.some(n => n.note === selectedAgent.notes);
                    if (!noteExists) {
                        return [
                            ...prev,
                            {
                                note: selectedAgent.notes,
                                name: `${selectedAgent.first_name} ${selectedAgent.last_name}`,
                                date: new Date(),
                                internal: "false" // Or based on requirements
                            }
                        ];
                    }
                    return prev;
                });
            }
            setLastPopulatedAgentId(selectedAgent.uuid || null);
        }
    }, [selectedAgent, availableCoAgents, setAgentNotes, setCoAgents, lastPopulatedAgentId, setLastPopulatedAgentId]);

    const [tempAppointmentNote, setTempAppointmentNote] = useState('');
    const [tempInternalNote, setTempInternalNote] = useState('');

    const appointmentNoteRef = useRef(tempAppointmentNote);
    const internalNoteRef = useRef(tempInternalNote);
    const userNameRef = useRef(userName);

    useEffect(() => {
        appointmentNoteRef.current = tempAppointmentNote;
    }, [tempAppointmentNote]);

    useEffect(() => {
        internalNoteRef.current = tempInternalNote;
    }, [tempInternalNote]);

    useEffect(() => {
        userNameRef.current = userName;
    }, [userName]);

    useEffect(() => {
        return () => {
            const apptVal = appointmentNoteRef.current.trim();
            const intVal = internalNoteRef.current.trim();

            if (apptVal || intVal) {
                setAgentNotes(prev => {
                    const updated = [...prev];
                    if (apptVal) {
                        const noteExists = prev.some(n => n.note === apptVal && n.internal === "false");
                        if (!noteExists) {
                            updated.push({
                                note: apptVal,
                                name: userNameRef.current,
                                date: new Date(),
                                internal: "false"
                            });
                        }
                    }
                    if (intVal) {
                        const noteExists = prev.some(n => n.note === intVal && n.internal === "true");
                        if (!noteExists) {
                            updated.push({
                                note: intVal,
                                name: userNameRef.current,
                                date: new Date(),
                                internal: "true"
                            });
                        }
                    }
                    return updated;
                });
            }
        };
    }, [setAgentNotes]);

    const formatTimestamp = (dateVal: any) => {
        if (!dateVal) return "";
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return String(dateVal);
            return d.toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return String(dateVal);
        }
    };


    const handleSaveNotes = (type: 'appointment' | 'internal') => {
        if (type === 'appointment') {
            if (tempAppointmentNote.trim()) {
                setAgentNotes(prev => [
                    ...prev,
                    {
                        note: tempAppointmentNote.trim(),
                        name: userName,
                        date: new Date(),
                        internal: "false"
                    }
                ]);
                setTempAppointmentNote('');
            }
        } else {
            if (tempInternalNote.trim()) {
                setAgentNotes(prev => [
                    ...prev,
                    {
                        note: tempInternalNote.trim(),
                        name: userName,
                        date: new Date(),
                        internal: "true"
                    }
                ]);
                setTempInternalNote('');
            }
        }
    };

    const handleEditNote = (n: any) => {
        setEditingNote(n);
        setEditNoteText(n.note);
    };

    const handleCancelEdit = () => {
        setEditingNote(null);
        setEditNoteText('');
    };

    const handleUpdateNote = (targetNote: any) => {
        if (!editNoteText.trim()) {
            toast.error("Note content cannot be empty.");
            return;
        }
        setAgentNotes(prev =>
            prev.map(note =>
                note === targetNote
                    ? { ...note, note: editNoteText.trim() }
                    : note
            )
        );
        setEditingNote(null);
        setEditNoteText('');
        toast.success("Note updated.");
    };
    return (
        <>
            <div className="w-full space-y-4">
                <div className="grid gap-4">
                    <div className='w-full flex flex-col items-center'>
                        <div className='w-full md:w-[410px] pt-[32px] pb-[100px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                            <div>
                                {(!hasToken && !isBookNowMode) &&
                                    <Button
                                        onClick={() => setShowSignIn(true)}
                                        className='bg-[#4290E9] w-[180px] h-[35px] rounded-[6px] hover:bg-[#509ffa]'>
                                        Login
                                    </Button>
                                }
                            </div>
                            <RealtorSignInModal open={showSignIn} setOpen={setShowSignIn} accentColor={roleSettings.pageTabColor} />
                            

                            {!(isBookNowMode && !hasToken) && (
                                <div className='grid grid-cols-2 gap-[32px]'>
                                {openDropdown && (
                                    <div className='col-span-2'>
                                        <Select
                                            value={selectedAgentId ?? ""}
                                            onValueChange={(value) => {
                                                setSelectedAgentId(value);
                                            }}
                                        >
                                            <SelectTrigger className="w-full md:w-[432px] h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
                                                <SelectValue placeholder="Select Agent" />
                                                <span className="custom-arrow">
                                                    <DropDownArrow />
                                                </span>
                                            </SelectTrigger>

                                            <SelectContent>
                                                {agentsData.map((agent) => (
                                                    <SelectItem key={agent.uuid ?? ''} value={agent.uuid ?? ''}>
                                                        {agent.first_name} {agent.last_name} – {agent.company_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {selectedAgent && (
                                    <div className='col-span-2 flex flex-col'>
                                        <p className='text-[#666666] font-[400] text-[20px]'>
                                            {selectedAgent.first_name} {selectedAgent.last_name}
                                        </p>
                                        <p className='text-[#666666] font-[400] text-[16px]'>
                                            {selectedAgent.company_name}
                                        </p>
                                        <p className='text-[#666666] font-[400] text-[16px]'>
                                            {selectedAgent.email}
                                        </p>
                                        <p className='text-[#666666] font-[400] text-[16px]'>
                                            {selectedAgent.primary_phone}
                                        </p>
                                    </div>
                                )}
                                {selectedAgent && userType === 'admin' && (
                                    <button
                                        type="button"
                                        className="bg-[#4290E9] font-raleway hidden text-white rounded-[3px] hover:bg-[#005fb8] w-full md:w-[130px] h-[30px] font-[600] text-[14px]"
                                        onClick={() => setOpenDropdown(true)}
                                    >
                                        Change
                                    </button>
                                )}
                                {token != null &&
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
                                                                className={`w-[18px] h-[18px] ${userType === 'admin' ? 'accent-[#4290E9]' : 'accent-[#6BAE41]'}  rounded-sm border border-[#CCCCCC] ${(!isSplitInvoice && coAgents.length === 0) ? 'cursor-not-allowed' : ''}`}
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
                                }
                                <div className="col-span-2">
                                    <div className='flex items-center justify-between'>
                                        <p >Co Agents</p>
                                        <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={handleOpenAddCoAgentDialog}>
                                            <p className={`text-base font-semibold font-raleway ${userType}-text`}>Add</p>
                                            <Plus className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm `} />
                                        </div>
                                        <Dialog open={openAddCoAgentDialog} onOpenChange={setOpenAddCoAgentDialog}>
                                            <DialogContent className="w-[320px] md:w-[470px] h-[450px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto [&>button]:hidden">
                                                <DialogHeader>
                                                    <DialogTitle className={`flex items-center uppercase justify-between ${userType}-text text-[18px] font-[600]`}>
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

                                                <div className="w-full">
                                                    <div className="grid w-full grid-cols-2 mb-4 bg-[#E4E4E4] p-1 rounded-md">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCoAgentMode('existing')}
                                                            className={`py-1.5 text-sm font-medium rounded-sm transition-all ${coAgentMode === 'existing' ? `${userType}-bg shadow-sm text-white` : 'text-[#666666]'}`}
                                                        >
                                                            Select Existing
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCoAgentMode('new')}
                                                            className={`py-1.5 text-sm font-medium rounded-sm transition-all ${coAgentMode === 'new' ? `${userType}-bg shadow-sm text-white` : 'text-[#666666]'}`}
                                                        >
                                                            Add New
                                                        </button>
                                                    </div>

                                                    {coAgentMode === 'existing' ? (
                                                        <div className="space-y-4">
                                                            <div className="flex flex-col gap-2">
                                                                <label className="text-sm font-normal text-[#666666]">Select Co-Agent</label>
                                                                <SearchableSelect
                                                                    options={availableCoAgents.map((a) => ({
                                                                        label: a.email ? `${a.name} (${a.email})` : a.name,
                                                                        value: a.email || a.name
                                                                    }))}
                                                                    value={coAgentEmail}
                                                                    onChange={handleSelectExisting}
                                                                    placeholder="Search co-agents..."
                                                                    className="w-full"
                                                                />
                                                                {availableCoAgents.length === 0 && (
                                                                    <p className="text-xs text-amber-600 mt-1">No existing co-agents found for this agent. Switch to &quot;Add New&quot; tab above to enter details.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
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
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Common Fields */}
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

                                                <DialogFooter className="mt-6 flex gap-2">
                                                    <Button variant="outline" onClick={closeCoAgentDialog} className="w-full">Cancel</Button>
                                                    <Button onClick={handleSaveCoAgent} className={`w-full ${userType}-bg text-white hover:opacity-90`}>
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
                                <div className="col-span-2">
                                    <div className='flex items-center justify-between'>
                                        <label htmlFor="">
                                            Additional Notes
                                        </label>
                                    </div>
                                    <div className="flex flex-col gap-6 mt-[12px]">
                                        {/* Appointment Notes Section */}
                                        <div className="flex flex-col relative group">
                                            <div className="flex justify-between items-center text-white rounded-[6px] px-4 py-1.5 w-max mb-2" style={{ backgroundColor: roleSettings.pageTabColor }}>
                                                <span className="font-bold text-[13px]">Appointment Notes</span>
                                            </div>
                                            {(userType === 'vendor' || userType === 'admin') && (
                                                <p className="text-[#E06D5E] text-[12px] mb-2">
                                                    These notes will be viewable by AGENT.
                                                </p>
                                            )}
                                            <div className="relative">
                                                <div className="w-full min-h-[150px] max-h-[300px] p-3 rounded-[6px] border border-[#BBBBBB] overflow-y-auto bg-[#E4E4E4]">
                                                    {agentNotes.filter(n => n.internal === "false" || !n.internal).length === 0 ? (
                                                        <p className="text-sm text-gray-500 italic mb-2">No appointment notes yet.</p>
                                                    ) : (
                                                        agentNotes.filter(n => n.internal === "false" || !n.internal).map((n, i) => (
                                                            <div key={i} className="mb-3 pb-2 border-b border-[#BBBBBB] last:border-b-0 last:pb-0">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <div className="font-bold text-xs text-gray-500 select-none">
                                                                        {n.name} ({formatTimestamp(n.date)}):
                                                                    </div>
                                                                    {editingNote !== n && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleEditNote(n)}
                                                                            className="p-1 hover:bg-gray-200 rounded"
                                                                            title="Edit Note"
                                                                        >
                                                                            <Edit2Icon className="w-3.5 h-3.5 text-blue-500" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {editingNote === n ? (
                                                                    <div className="flex flex-col gap-2 mt-1">
                                                                        <textarea
                                                                            className="w-full p-2 border border-[#BBBBBB] rounded bg-white text-sm focus:outline-none"
                                                                            value={editNoteText}
                                                                            onChange={(e) => setEditNoteText(e.target.value)}
                                                                            rows={2}
                                                                        />
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                className="text-xs font-bold text-gray-500 hover:text-gray-700 uppercase"
                                                                                onClick={handleCancelEdit}
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="text-xs font-bold uppercase"
                                                                                style={{ color: roleSettings.pageTabColor }}
                                                                                onClick={() => handleUpdateNote(n)}
                                                                            >
                                                                                Save
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{n.note}</div>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                    <div className="mt-2 pt-2 border-t border-dashed border-[#BBBBBB]">
                                                        <div className="font-bold text-xs text-gray-400 mb-1 select-none">
                                                            New Note:
                                                        </div>
                                                        <textarea
                                                            className="w-full mt-1 p-2 border border-[#BBBBBB] rounded bg-white text-sm focus:outline-none"
                                                            placeholder="Type appointment note here..."
                                                            value={tempAppointmentNote}
                                                            onChange={(e) => setTempAppointmentNote(e.target.value)}
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    className="font-bold text-[12px] uppercase"
                                                    style={{ color: roleSettings.pageTabColor }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleSaveNotes('appointment');
                                                    }}
                                                >
                                                    SAVE
                                                </button>
                                            </div>
                                        </div>

                                        {/* Internal Notes Section */}
                                        {userType === 'admin' && (
                                            <div className="flex flex-col relative group">
                                                <div className="flex justify-between items-center text-white rounded-[6px] px-4 py-1.5 w-max mb-2" style={{ backgroundColor: roleSettings.pageTabColor }}>
                                                    <span className="font-bold text-[13px]">Internal AGENT Notes</span>
                                                </div>
                                                <p className="text-[#357ad1] text-[12px] mb-2 font-bold">
                                                    These notes will NOT be viewable to AGENT
                                                </p>
                                                <div className="relative">
                                                    <div className="w-full min-h-[150px] max-h-[300px] p-3 rounded-[6px] border border-[#BBBBBB] overflow-y-auto bg-[#E4E4E4]">
                                                        {agentNotes.filter(n => n.internal === "true").length === 0 ? (
                                                            <p className="text-sm text-gray-500 italic mb-2">No internal notes yet.</p>
                                                        ) : (
                                                            agentNotes.filter(n => n.internal === "true").map((n, i) => (
                                                                <div key={i} className="mb-3 pb-2 border-b border-[#BBBBBB] last:border-b-0 last:pb-0">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <div className="font-bold text-xs text-gray-500 select-none">
                                                                            {n.name} ({formatTimestamp(n.date)}):
                                                                        </div>
                                                                        {editingNote !== n && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleEditNote(n)}
                                                                                className="p-1 hover:bg-gray-200 rounded"
                                                                                title="Edit Note"
                                                                            >
                                                                                <Edit2Icon className="w-3.5 h-3.5 text-blue-500" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {editingNote === n ? (
                                                                        <div className="flex flex-col gap-2 mt-1">
                                                                            <textarea
                                                                                className="w-full p-2 border border-[#BBBBBB] rounded bg-white text-sm focus:outline-none"
                                                                                value={editNoteText}
                                                                                onChange={(e) => setEditNoteText(e.target.value)}
                                                                                rows={2}
                                                                            />
                                                                            <div className="flex justify-end gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    className="text-xs font-bold text-gray-500 hover:text-gray-700 uppercase"
                                                                                    onClick={handleCancelEdit}
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className="text-xs font-bold uppercase"
                                                                                    style={{ color: roleSettings.pageTabColor }}
                                                                                    onClick={() => handleUpdateNote(n)}
                                                                                >
                                                                                    Save
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-sm text-gray-800 whitespace-pre-wrap">{n.note}</div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                        <div className="mt-2 pt-2 border-t border-dashed border-[#BBBBBB]">
                                                            <div className="font-bold text-xs text-gray-400 mb-1 select-none">
                                                                New Note:
                                                            </div>
                                                            <textarea
                                                                className="w-full mt-1 p-2 border border-[#BBBBBB] rounded bg-white text-sm focus:outline-none"
                                                                placeholder="Type internal note here..."
                                                                value={tempInternalNote}
                                                                onChange={(e) => setTempInternalNote(e.target.value)}
                                                                rows={3}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end mt-2">
                                                    <button
                                                        className="font-bold text-[12px] uppercase"
                                                        style={{ color: roleSettings.pageTabColor }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleSaveNotes('internal');
                                                        }}
                                                    >
                                                        SAVE
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};
export default Contact;