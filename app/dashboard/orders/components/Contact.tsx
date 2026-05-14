


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
import { RealtorSignInModal } from '@/app/agent/book-now/components/RealtorLogin';
import { SearchableSelect } from './SearchableSelect';
import { useOrderContext } from '../context/OrderContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
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
        agentsData
    } = useOrderContext();
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string)?.toLowerCase() || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const selectedAgent = useMemo(() => {
        return agentsData.find((agent) => agent.uuid === selectedAgentId) || null;
    }, [agentsData, selectedAgentId]);
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
    const [showSignIn, setShowSignIn] = useState(false);

    // New States for Notes Redesign
    const [appointmentText, setAppointmentText] = useState('');
    const [internalText, setInternalText] = useState('');
    const [isEditingAppointment, setIsEditingAppointment] = useState(false);
    const [isEditingInternal, setIsEditingInternal] = useState(false);

    // Helper to format date + name signature
    const getSignature = () => {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        // E.g., "(Admin Todd): "
        const userPrefix = userType === 'admin' ? 'Admin' : 'Agent';
        return `\n${formattedDate} (${userPrefix} ${userName}): `;
    };


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
        const agent = selectedAgent?.co_agents?.find((a: { name: string; email: string }) => a.email === agentId || a.name === agentId);

        if (agent) {
            setCoAgentName(agent.name);
            setCoAgentEmail(agent.email);
            // setPercentage(agent.split...?) // If split is in there? Assuming no specific existing split logic for now unless mapped.
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



    useEffect(() => {
        if (selectedAgent) {
            setCoAgents(selectedAgent.co_agents || []);

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
        } else {
            setCoAgents([]);
            // Optional: Clear notes when agent is deselected?
            // setAgentNotes([]); 
        }
    }, [selectedAgent, setAgentNotes, setCoAgents]);

    useEffect(() => {
        // Initialize text areas from context ONCE on load
        if (agentNotes.length > 0) {
            const apptNotes = agentNotes
                .filter(n => n.internal === "false")
                .map(n => n.note) // The note often has the date/name already attached, or we simply join them
                .join("\n");
            const intNotes = agentNotes
                .filter(n => n.internal === "true")
                .map(n => n.note)
                .join("\n");

            if (apptNotes) setAppointmentText(apptNotes);
            if (intNotes) setInternalText(intNotes);
        }
    }, [agentNotes]);
    const handleEditClick = (type: 'appointment' | 'internal') => {
        if (type === 'appointment') {
            setAppointmentText(prev => prev ? prev + getSignature() : getSignature().trimStart());
        } else {
            setInternalText(prev => prev ? prev + getSignature() : getSignature().trimStart());
        }
    }

    const handleSaveNotes = (type: 'appointment' | 'internal') => {
        if (type === 'appointment') {
            setIsEditingAppointment(false);
            // Overwrite existing appointment notes logic. Wait backend payload just uses agentNotes
            setAgentNotes(prev => [
                ...prev.filter(n => n.internal === "true"), // keep other type
                {
                    note: appointmentText.trim(),
                    name: userName,
                    date: new Date(),
                    internal: "false"
                }
            ]);
        } else {
            setIsEditingInternal(false);
            setAgentNotes(prev => [
                ...prev.filter(n => n.internal === "false"), // keep other type
                {
                    note: internalText.trim(),
                    name: userName,
                    date: new Date(),
                    internal: "true"
                }
            ]);
        }
    };
    return (
        <>
            <div className="w-full space-y-4">
                <div className="grid gap-4">
                    <div className='w-full flex flex-col items-center'>
                        <div className='w-full md:w-[410px] pt-[32px] pb-[100px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
                            <div>
                                {!token &&
                                    <Button
                                        onClick={() => setShowSignIn(true)}
                                        className='bg-[#4290E9] w-[180px] h-[35px] rounded-[6px] hover:bg-[#509ffa]'>
                                        Login
                                    </Button>
                                }
                            </div>
                            <div className='grid grid-cols-2 gap-[32px]'>
                                {openDropdown && (
                                    <div className='col-span-2'>
                                        <Select
                                            value={selectedAgentId ?? ""}
                                            onValueChange={(value) => {
                                                setSelectedAgentId(value);
                                            }}
                                        >
                                            <SelectTrigger className="w-[432px] h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
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
                                                                    options={selectedAgent?.co_agents?.map((a: { name: string; email: string }) => ({
                                                                        label: `${a.name} (${a.email})`,
                                                                        value: a.email
                                                                    })) || []}
                                                                    value={coAgentEmail}
                                                                    onChange={handleSelectExisting}
                                                                    placeholder="Search co-agents..."
                                                                    className="w-full"
                                                                />
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
                                            <p className="text-[#E06D5E] text-[12px] mb-2">
                                                These notes will be viewable by AGENT.
                                            </p>
                                            <div className="relative">
                                                <textarea
                                                    className={`w-full min-h-[150px] p-3 rounded-[6px] border border-[#BBBBBB] resize-none overflow-y-auto ${isEditingAppointment ? "bg-white" : "bg-[#E4E4E4]"}`}
                                                    placeholder={isEditingAppointment ? "Type appointment note here..." : ""}
                                                    value={appointmentText}
                                                    onChange={(e) => setAppointmentText(e.target.value)}
                                                    readOnly={!isEditingAppointment}
                                                />
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    className="font-bold text-[12px] uppercase"
                                                    style={{ color: roleSettings.pageTabColor }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (isEditingAppointment) {
                                                            handleSaveNotes('appointment');
                                                        } else {
                                                            setIsEditingAppointment(true);
                                                            handleEditClick('appointment');
                                                        }
                                                    }}
                                                >
                                                    {isEditingAppointment ? 'SAVE' : 'EDIT'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Internal Notes Section */}
                                        {userType === 'admin' && (
                                            <div className="flex flex-col relative group">
                                                <div className="flex justify-between items-center text-white rounded-[6px] px-4 py-1.5 w-max mb-2" style={{ backgroundColor: roleSettings.pageTabColor }}>
                                                    <span className="font-bold text-[13px]">Internal AGENT Notes</span>
                                                </div>
                                                <p className="text-[#E06D5E] text-[12px] mb-2 font-bold">
                                                    These notes will NOT be viewable to AGENT
                                                </p>
                                                <div className="relative">
                                                    <textarea
                                                        className={`w-full min-h-[150px] p-3 rounded-[6px] border border-[#BBBBBB] resize-none overflow-y-auto ${isEditingInternal ? "bg-white" : "bg-[#E4E4E4]"}`}
                                                        placeholder={isEditingInternal ? "Type internal note here..." : ""}
                                                        value={internalText}
                                                        onChange={(e) => setInternalText(e.target.value)}
                                                        readOnly={!isEditingInternal}
                                                    />
                                                </div>
                                                <div className="flex justify-end mt-2">
                                                    <button
                                                        className="font-bold text-[12px] uppercase"
                                                        style={{ color: roleSettings.pageTabColor }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (isEditingInternal) {
                                                                handleSaveNotes('internal');
                                                            } else {
                                                                setIsEditingInternal(true);
                                                                handleEditClick('internal');
                                                            }
                                                        }}
                                                    >
                                                        {isEditingInternal ? 'SAVE' : 'EDIT'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <RealtorSignInModal open={showSignIn} setOpen={setShowSignIn} />
        </>
    );
};
export default Contact;