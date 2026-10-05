


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
import { GetCoAgents } from '@/app/dashboard/sub-accounts/subaccounts';
import AddCoAgentModal from '@/components/AddCoAgentModal';
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
    const { userType } = useAppContext();
    const userInfoRaw = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null;
    const userInfo = useMemo(() => {
        try {
            return userInfoRaw ? JSON.parse(userInfoRaw) : null;
        } catch {
            return null;
        }
    }, [userInfoRaw]);
    const isAgentUser = userType === "agent";

    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string)?.toLowerCase() || (isBookNowMode ? 'agent' : 'admin');
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [showSignIn, setShowSignIn] = useState(false);
    const [hasToken, setHasToken] = useState(true);
    const [allLinkedCoAgents, setAllLinkedCoAgents] = useState<any[]>([]);
    const [selectedExistingCoAgent, setSelectedExistingCoAgent] = useState<any | null>(null);
    const [isCreateCoAgentModalOpen, setIsCreateCoAgentModalOpen] = useState(false);

    // Reset co-agents when primary agent changes
    const prevSelectedAgentIdRef = useRef(selectedAgentId);
    useEffect(() => {
        if (prevSelectedAgentIdRef.current !== undefined && prevSelectedAgentIdRef.current !== selectedAgentId) {
            setCoAgents([]);
            setIsSplitInvoice(false);
        }
        prevSelectedAgentIdRef.current = selectedAgentId;
    }, [selectedAgentId, setCoAgents, setIsSplitInvoice]);

    const fetchLinkedCoAgents = React.useCallback(async (targetAgentUuid?: string) => {
        const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
        if (!token) return [];
        const uuid = targetAgentUuid || selectedAgentId || (isAgentUser && userInfo ? userInfo.uuid : undefined);
        try {
            const res: any = await GetCoAgents(token, uuid);
            let list: any[] = [];
            if (Array.isArray(res?.data)) {
                list = res.data;
            } else if (Array.isArray(res)) {
                list = res;
            }
            setAllLinkedCoAgents(list);
            return list;
        } catch (err: any) {
            console.error("Failed to fetch linked co-agents for order contact:", err);
            setAllLinkedCoAgents([]);
            return [];
        }
    }, [selectedAgentId, isAgentUser, userInfo]);

    useEffect(() => {
        const checkToken = () => {
            const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
            setHasToken(!!token);
            if (token) {
                fetchLinkedCoAgents();
            }
        };
        
        checkToken();
        
        window.addEventListener('storage', checkToken);
        window.addEventListener('agentLogin', checkToken);
        
        return () => {
            window.removeEventListener('storage', checkToken);
            window.removeEventListener('agentLogin', checkToken);
        };
    }, [fetchLinkedCoAgents]);

    const selectedAgent = useMemo(() => {
        const found = agentsData.find((agent) => agent.uuid === selectedAgentId);
        if (found) return found;
        if (isAgentUser && userInfo && (!selectedAgentId || selectedAgentId === userInfo.uuid)) {
            return userInfo;
        }
        return null;
    }, [agentsData, selectedAgentId, isAgentUser, userInfo]);

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

    const effectiveAgent = useMemo(() => {
        if (detailedAgent && (!selectedAgentId || detailedAgent.uuid === selectedAgentId)) {
            return detailedAgent;
        }
        if (selectedAgent) {
            return selectedAgent;
        }
        if (isAgentUser && userInfo) {
            return userInfo;
        }
        return null;
    }, [detailedAgent, selectedAgentId, selectedAgent, isAgentUser, userInfo]);

    const availableCoAgents = useMemo(() => {
        const result: any[] = [];
        const seenKeys = new Set<string>();

        if (Array.isArray(allLinkedCoAgents) && allLinkedCoAgents.length > 0) {
            for (const co of allLinkedCoAgents) {
                const fullName = `${co.first_name || ""} ${co.last_name || ""}`.trim() || co.name || (co.email ? co.email.split("@")[0] : "Co-Agent");
                const email = (co.email || "").toLowerCase().trim();
                const key = String(co.uuid || co.id || email);
                if (key && !seenKeys.has(key)) {
                    seenKeys.add(key);
                    result.push({
                        id: co.id,
                        uuid: co.uuid,
                        agent_id: co.id,
                        agent_uuid: co.uuid,
                        name: fullName,
                        email: co.email || "",
                        primary_phone: co.primary_phone || co.number || "",
                        role: "Co-Agent / Partner",
                        percentage: Number(co.split || co.percentage || 0),
                        split: co.split ?? co.percentage,
                    });
                }
            }
        }

        return result;
    }, [allLinkedCoAgents]);

    const [percentage, setPercentage] = useState<number | ''>('');
    const [userName, setUserName] = useState<string>("");

    // Co-Agent Selection / Edit States
    const [coAgentName, setCoAgentName] = useState("");
    const [coAgentEmail, setCoAgentEmail] = useState("");
    const [editingCoAgentIndex, setEditingCoAgentIndex] = useState<number | null>(null);
    const [openAddCoAgentDialog, setOpenAddCoAgentDialog] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // New States for Notes Redesign
    const [editingNote, setEditingNote] = useState<any | null>(null);
    const [editNoteText, setEditNoteText] = useState('');

    const token = localStorage.getItem('token') || localStorage.getItem('agentToken');

    const coAgentOptions = useMemo(() => {
        return availableCoAgents.map((a) => {
            const isAlreadyAdded = coAgents.some((c, idx) => {
                if (editingCoAgentIndex !== null && idx === editingCoAgentIndex) return false;
                const matchUuid = a.uuid && c.agent_uuid && a.uuid === c.agent_uuid;
                const matchId = a.id && c.agent_id && String(a.id) === String(c.agent_id);
                const matchEmail = a.email && c.email && a.email.trim().toLowerCase() === c.email.trim().toLowerCase();
                const matchName = a.name && c.name && a.name.trim().toLowerCase() === c.name.trim().toLowerCase();
                return matchUuid || matchId || matchEmail || matchName;
            });

            return {
                label: a.email ? `${a.name} (${a.email})` : a.name,
                value: a.uuid || a.email || a.name,
                disabled: isAlreadyAdded,
                badge: isAlreadyAdded ? "Selected" : undefined,
            };
        });
    }, [availableCoAgents, coAgents, editingCoAgentIndex]);

    const handleCoAgentCreated = async (createdData?: any) => {
        const targetAgentUuid = selectedAgentId || (isAgentUser && userInfo ? userInfo.uuid : undefined);
        const updatedList = await fetchLinkedCoAgents(targetAgentUuid);

        const createdUuid = createdData?.uuid || createdData?.agent_uuid || createdData?.id;
        const createdEmail = (createdData?.email || "").toLowerCase().trim();

        const found = updatedList.find((co: any) => 
            (createdUuid && (co.uuid === createdUuid || String(co.id) === String(createdUuid))) ||
            (createdEmail && co.email && co.email.toLowerCase().trim() === createdEmail)
        );

        if (found) {
            const fullName = `${found.first_name || ""} ${found.last_name || ""}`.trim() || found.name || (found.email ? found.email.split("@")[0] : "Co-Agent");
            setSelectedExistingCoAgent({
                id: found.id,
                uuid: found.uuid,
                agent_id: found.id,
                agent_uuid: found.uuid,
                name: fullName,
                email: found.email || "",
                primary_phone: found.primary_phone || found.number || "",
                role: "Co-Agent / Partner",
                percentage: Number(found.split || found.percentage || 0),
                split: found.split ?? found.percentage,
            });
            setCoAgentName(fullName);
            setCoAgentEmail(found.email || "");
            if (found.split || found.percentage) {
                setPercentage(Number(found.split || found.percentage));
            }
        } else if (createdData) {
            const fullName = `${createdData.first_name || ""} ${createdData.last_name || ""}`.trim() || createdData.name || (createdData.email ? createdData.email.split("@")[0] : "Co-Agent");
            setSelectedExistingCoAgent({
                id: createdData.id,
                uuid: createdData.uuid,
                agent_id: createdData.id || createdData.agent_id,
                agent_uuid: createdData.uuid || createdData.agent_uuid,
                name: fullName,
                email: createdData.email || "",
                primary_phone: createdData.primary_phone || createdData.number || "",
                role: "Co-Agent / Partner",
                percentage: Number(createdData.split || createdData.percentage || 0),
                split: createdData.split ?? createdData.percentage,
            });
            setCoAgentName(fullName);
            setCoAgentEmail(createdData.email || "");
        }

        setOpenAddCoAgentDialog(true);
    };

    // Updated Handle Add/Update
    const handleSaveCoAgent = () => {
        if (!selectedExistingCoAgent && editingCoAgentIndex === null) {
            toast.error("Please select a co-agent.");
            return;
        }

        const rawEmail = (selectedExistingCoAgent?.email || coAgentEmail || "").trim();
        const email = rawEmail.toLowerCase();
        const name = (selectedExistingCoAgent?.name || coAgentName || "").trim();

        if (!rawEmail) {
            toast.error("Please select a valid co-agent.");
            return;
        }

        // Duplicate check
        const isDuplicate = coAgents.some((agent, idx) => {
            if (editingCoAgentIndex !== null && idx === editingCoAgentIndex) return false;
            const matchUuid = selectedExistingCoAgent?.uuid && agent.agent_uuid && selectedExistingCoAgent.uuid === agent.agent_uuid;
            const matchId = selectedExistingCoAgent?.id && agent.agent_id && String(selectedExistingCoAgent.id) === String(agent.agent_id);
            const matchEmail = email && agent.email && agent.email.trim().toLowerCase() === email;
            const matchName = name && agent.name && agent.name.trim().toLowerCase() === name.toLowerCase();
            return matchUuid || matchId || matchEmail || matchName;
        });

        if (isDuplicate) {
            toast.error("This co-agent is already added.");
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
            email: rawEmail,
            name: name || rawEmail.split('@')[0],
            percentage: Number(percentage) || 0,
            split: Number(percentage) || 0,
            agent_id: selectedExistingCoAgent?.agent_id || selectedExistingCoAgent?.id || (editingCoAgentIndex !== null ? coAgents[editingCoAgentIndex]?.agent_id : undefined),
            agent_uuid: selectedExistingCoAgent?.agent_uuid || selectedExistingCoAgent?.uuid || (editingCoAgentIndex !== null ? coAgents[editingCoAgentIndex]?.agent_uuid : undefined),
            primary_phone: selectedExistingCoAgent?.primary_phone || (editingCoAgentIndex !== null ? coAgents[editingCoAgentIndex]?.primary_phone : undefined),
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
        setSelectedExistingCoAgent(null);
    };

    const handleEditCoAgent = (index: number) => {
        const agent = coAgents[index];
        setCoAgentName(agent.name);
        setCoAgentEmail(agent.email);
        setPercentage(agent.percentage || '');
        setEditingCoAgentIndex(index);
        const existingMatch = availableCoAgents.find(a => 
            (agent.agent_uuid && a.uuid === agent.agent_uuid) ||
            (agent.agent_id && String(a.id) === String(agent.agent_id)) ||
            (agent.email && a.email && agent.email.toLowerCase() === a.email.toLowerCase())
        );
        setSelectedExistingCoAgent(existingMatch || {
            agent_id: agent.agent_id,
            agent_uuid: agent.agent_uuid,
            name: agent.name,
            email: agent.email,
            primary_phone: agent.primary_phone,
            percentage: agent.percentage,
        });
        setOpenAddCoAgentDialog(true);
    };

    const handleRemoveCoAgent = (index: number) => {
        const updated = [...coAgents];
        updated.splice(index, 1);
        setCoAgents(updated);
    };

    const handleSelectExisting = (agentValue: string) => {
        const agent = availableCoAgents.find((a) => 
            (a.uuid && a.uuid === agentValue) || 
            (a.id && String(a.id) === agentValue) || 
            (a.email && a.email === agentValue) || 
            a.name === agentValue
        );

        if (agent) {
            const isAlreadyAdded = coAgents.some((c, idx) => {
                if (editingCoAgentIndex !== null && idx === editingCoAgentIndex) return false;
                const matchUuid = agent.uuid && c.agent_uuid && agent.uuid === c.agent_uuid;
                const matchId = agent.id && c.agent_id && String(agent.id) === String(c.agent_id);
                const matchEmail = agent.email && c.email && agent.email.trim().toLowerCase() === c.email.trim().toLowerCase();
                const matchName = agent.name && c.name && agent.name.trim().toLowerCase() === c.name.trim().toLowerCase();
                return matchUuid || matchId || matchEmail || matchName;
            });

            if (isAlreadyAdded) {
                toast.error("This co-agent is already added.");
                return;
            }

            setSelectedExistingCoAgent(agent);
            setCoAgentName(agent.name);
            setCoAgentEmail(agent.email);
            if (agent.percentage && agent.percentage > 0) {
                setPercentage(agent.percentage);
            }
        }
    };

    const handleOpenAddCoAgentDialog = () => {
        setCoAgentName('');
        setCoAgentEmail('');
        setPercentage('');
        setEditingCoAgentIndex(null);
        setSelectedExistingCoAgent(null);
        setOpenAddCoAgentDialog(true);
    };

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
                        <div className='w-full md:w-[490px] max-w-[520px] pt-[32px] pb-[100px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
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
                                                if (value !== selectedAgentId) {
                                                    setSelectedAgentId(value);
                                                    setCoAgents([]);
                                                    setIsSplitInvoice(false);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
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
                                {effectiveAgent && (
                                    <div className='col-span-2 flex flex-col'>
                                        <p className='text-[#666666] font-[400] text-[20px]'>
                                            {effectiveAgent.first_name} {effectiveAgent.last_name}
                                        </p>
                                        {effectiveAgent.company_name && (
                                            <p className='text-[#666666] font-[400] text-[16px]'>
                                                {effectiveAgent.company_name}
                                            </p>
                                        )}
                                        <p className='text-[#666666] font-[400] text-[16px]'>
                                            {effectiveAgent.email || effectiveAgent.primary_email}
                                        </p>
                                        <p className='text-[#666666] font-[400] text-[16px]'>
                                            {effectiveAgent.primary_phone || effectiveAgent.phone || effectiveAgent.secondary_phone}
                                        </p>
                                    </div>
                                )}
                                {effectiveAgent && userType === 'admin' && (
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
                                            <DialogContent className="w-[90vw] max-w-[480px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto [&>button]:hidden">
                                                <DialogHeader>
                                                    <DialogTitle className={`flex items-center uppercase justify-between ${userType}-text text-[18px] font-[600]`}>
                                                        {editingCoAgentIndex !== null ? 'Edit Co-Agent Split' : 'Add Co-Agent / Partner'}
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
                                                    {editingCoAgentIndex !== null ? (
                                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase">Co-Agent Details</p>
                                                            <p className="text-sm font-semibold text-gray-800 mt-1">{coAgentName || selectedExistingCoAgent?.name || "Co-Agent"}</p>
                                                            <p className="text-xs text-gray-600">{coAgentEmail || selectedExistingCoAgent?.email}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-sm font-normal text-[#666666]">Select Co-Agent <span className="text-red-500">*</span></label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenAddCoAgentDialog(false);
                                                                        setIsCreateCoAgentModalOpen(true);
                                                                    }}
                                                                    className={`text-xs font-semibold ${userType}-text hover:underline flex items-center gap-1 cursor-pointer`}
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    <span>Create New Co-Agent</span>
                                                                </button>
                                                            </div>
                                                            <SearchableSelect
                                                                options={coAgentOptions}
                                                                value={selectedExistingCoAgent?.uuid || selectedExistingCoAgent?.email || coAgentEmail}
                                                                onChange={handleSelectExisting}
                                                                placeholder="Search co-agents..."
                                                                className="w-full"
                                                            />
                                                            {availableCoAgents.length === 0 ? (
                                                                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex flex-col gap-1.5 mt-1">
                                                                    <span>No co-agents found linked with this agent.</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setOpenAddCoAgentDialog(false);
                                                                            setIsCreateCoAgentModalOpen(true);
                                                                        }}
                                                                        className={`text-xs font-semibold ${userType}-text hover:underline text-left cursor-pointer`}
                                                                    >
                                                                        + Click here to create &amp; link a new Co-Agent
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[11px] text-gray-500">
                                                                    Select a linked co-agent or click &ldquo;Create New Co-Agent&rdquo; to add a new partner.
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Percentage Field */}
                                                    <div>
                                                        <label className="text-sm font-normal text-[#666666] block mb-2">Split Percentage (%)</label>
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
                                                                placeholder="e.g. 50"
                                                                className="h-[42px] bg-[#EEEEEE] appearance-none pr-8"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 mt-1">
                                                            Enter the percentage of invoice costs allocated to this co-agent.
                                                        </p>
                                                    </div>
                                                </div>

                                                <DialogFooter className="mt-6 flex gap-2">
                                                    <Button variant="outline" onClick={closeCoAgentDialog} className="w-full">Cancel</Button>
                                                    <Button onClick={handleSaveCoAgent} className={`w-full ${userType}-bg text-white hover:opacity-90`}>
                                                        {editingCoAgentIndex !== null ? 'Update' : 'Add to Order'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <AddCoAgentModal
                                            open={isCreateCoAgentModalOpen}
                                            setOpen={setIsCreateCoAgentModalOpen}
                                            onSuccess={handleCoAgentCreated}
                                            agentUuid={effectiveAgent?.uuid || selectedAgentId || (isAgentUser && userInfo ? userInfo.uuid : undefined)}
                                        />
                                    </div>
                                    {coAgents.length > 0 && (
                                        <div className="mt-[12px] border rounded-md overflow-hidden bg-white shadow-sm">
                                            <Table className="w-full text-left table-auto">
                                                <TableHeader className="bg-[#E4E4E4]">
                                                    <TableRow>
                                                        <TableHead className="py-2.5 px-3 font-bold text-[#666666] text-xs">Name</TableHead>
                                                        <TableHead className="py-2.5 px-3 font-bold text-[#666666] text-xs">Email</TableHead>
                                                        {isSplitInvoice && <TableHead className="py-2.5 px-3 font-bold text-[#666666] text-xs text-center">Split (%)</TableHead>}
                                                        <TableHead className="py-2.5 px-3 text-right font-bold text-[#666666] text-xs">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {coAgents.map((agent, index) => (
                                                        <TableRow key={index} className="bg-white hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                                                            <TableCell className="py-2.5 px-3 text-xs font-medium text-gray-800 break-words">{agent.name}</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-xs text-gray-600 break-all">{agent.email}</TableCell>
                                                            {isSplitInvoice && <TableCell className="py-2.5 px-3 text-xs text-center font-medium text-gray-700">{agent.percentage}%</TableCell>}
                                                            <TableCell className="py-2.5 px-3 text-right">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button type="button" onClick={() => handleEditCoAgent(index)} className="p-1 hover:bg-gray-100 rounded text-blue-500" title="Edit">
                                                                        <Edit2Icon className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button type="button" onClick={() => handleRemoveCoAgent(index)} className="p-1 hover:bg-gray-100 rounded text-red-500" title="Delete">
                                                                        <Trash className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>

                                            {isSplitInvoice && (
                                                <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-700 flex flex-col gap-1.5 font-alexandria">
                                                    {(() => {
                                                        const totalCo = coAgents.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0);
                                                        const primaryShare = Math.max(0, 100 - totalCo);
                                                        const primaryName = `${effectiveAgent?.first_name || ""} ${effectiveAgent?.last_name || ""}`.trim() || "Primary Agent";
                                                        const isExceeded = totalCo > 100;
                                                        return (
                                                            <>
                                                                <div className="flex items-center justify-between font-medium">
                                                                    <span>Primary Agent Share ({primaryName}):</span>
                                                                    <span className={isExceeded ? "text-red-600 font-bold" : "text-emerald-700 font-bold"}>
                                                                        {primaryShare}%
                                                                    </span>
                                                                </div>
                                                                {isExceeded ? (
                                                                    <p className="text-red-500 font-medium">
                                                                        Warning: Total co-agent percentages exceed 100%. Please adjust splits.
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[#666666]">
                                                                        Each agent will be billed separately for their designated percentage via an individual invoice.
                                                                    </p>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}
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