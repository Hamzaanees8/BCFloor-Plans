
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertDialog } from '@radix-ui/react-alert-dialog';
import { Minus, Plus, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOrderContext } from '../context/OrderContext';
import { Get } from '../../agents/agents';
import { Agent } from '@/components/AgentTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, DropDownArrow } from '@/components/Icons';
import { GetUser } from '../orders';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAppContext } from '@/app/context/AppContext';

const Contact = () => {
    const {
        selectedAgentId,
        setSelectedAgentId,
        agentNotes,
        setAgentNotes,
        coAgents,
        setCoAgents,
        isSplitInvoice,
        setIsSplitInvoice
    } = useOrderContext();
    const { userType } = useAppContext()
    const [agentData, setAgentData] = useState<Agent[]>([]);
    const selectedAgent = useMemo(() => {
        return agentData.find((agent) => agent.uuid === selectedAgentId) || null;
    }, [agentData, selectedAgentId]);
    const [draftCoAgents, setDraftCoAgents] = useState<typeof coAgents>([]);
    const [percentage, setPercentage] = useState<number | ''>('');

    const [userName, setUserName] = useState<string>("");
    const [coAgentEmail, setCoAgentEmail] = useState("");
    const [tempNotes, setTempNotes] = useState('');
    const [adminEmail, setAdminEmail] = useState("");
    const [openAddCoAgentDialog, setOpenAddCoAgentDialog] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [openAddNotesDialog, setOpenAddNotesDialog] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const removeAdmin = () => setAdminEmail("");
    const handleAdd = () => {
        const email = coAgentEmail.trim();

        // ✅ Don't proceed if email is empty or invalid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            toast.error("Please enter a valid email.");
            return;
        }

        // ✅ If split is enabled, percentage must be a number > 0
        if (isSplitInvoice && (percentage === '' || isNaN(Number(percentage)) || Number(percentage) <= 0)) {
            toast.error("Please enter a valid percentage.");
            return;
        }

        const extractedName = email.split('@')[0];

        const newAgent = {
            email,
            name: extractedName,
            ...(isSplitInvoice && { percentage: Number(percentage) }),
        };

        setDraftCoAgents(prev => [...prev, newAgent]);
        setCoAgentEmail('');
        setPercentage('');
    };



    const handleRemove = (index: number) => {
        setDraftCoAgents((prev) => prev.filter((_, i) => i !== index));
    };
    console.log(openAddNotesDialog)
    // const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    //     if (e.key === "Enter") {
    //         e.preventDefault();
    //         handleAdd();
    //     }
    // };
    // const handleRemove = (index: number) => {
    //     const updated = [...draftCoAgents];
    //     updated.splice(index, 1);
    //     setDraftCoAgents(updated);
    // };
    const handleOpenAddCoAgentDialog = () => {
        setDraftCoAgents(coAgents);         // clear input
        setOpenAddCoAgentDialog(true);
    };
    const handleRemoveCoAgent = (index: number) => {
        const updated = [...coAgents];
        updated.splice(index, 1);
        setCoAgents(updated);
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


    const fetchAgents = useCallback(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        Get(token)
            .then((data) => setAgentData(Array.isArray(data.data) ? data.data : []))
            .catch((err) => console.log("Error fetching data:", err.message));
    }, []);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);
    // useEffect(() => {
    //     if (selectedAgent) {
    //         if (Array.isArray(selectedAgent.co_agents)) {
    //             setCoAgents(selectedAgent.co_agents);
    //         } else {
    //             setCoAgents([]);
    //         }
    //         setAgentNotes(selectedAgent.notes ?? "");
    //     } else {
    //         setCoAgents([]);
    //         setAgentNotes("");
    //     }
    // }, [selectedAgent, setAgentNotes, setCoAgents]);
    console.log("agent", selectedAgent)
    return (
        <div className="w-full space-y-4">
            <div className="grid gap-4">
                <div className='w-full flex flex-col items-center'>
                    <div className='w-full md:w-[410px] pt-[32px] pb-[100px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]'>
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
                                            {agentData.map((agent) => (
                                                <SelectItem key={agent.uuid ?? ''} value={agent.uuid ?? ''}>
                                                    {agent.first_name} {agent.last_name} – {agent.company_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )

                            }
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
                            )
                            }
                            {selectedAgent && userType === 'admin' && (
                                <button
                                    type="button"
                                    className="bg-[#4290E9] font-raleway text-white rounded-[3px] hover:bg-[#005fb8] w-full md:w-[130px] h-[30px] font-[600] text-[14px]"
                                    onClick={() => setOpenDropdown(true)}
                                >
                                    Change
                                </button>
                            )

                            }
                            <div className='col-span-2 flex items-center justify-between'>
                                <label className='flex items-center gap-x-[10px] cursor-pointer'>
                                    <input
                                        type="checkbox"
                                        checked={isSplitInvoice}
                                        onChange={(e) => {
                                            setIsSplitInvoice(e.target.checked);
                                            setDraftCoAgents([]);
                                            setCoAgents([]);
                                        }}

                                        className={`w-[18px] h-[18px] ${userType === 'admin' ? 'accent-[#4290E9]' : 'accent-[#6BAE41]'}  rounded-sm border border-[#CCCCCC]`}
                                    />
                                    <span className='text-base font-semibold font-raleway text-[#666666]'>
                                        Split Invoice
                                    </span>
                                </label>
                            </div>
                            <div className="col-span-2">
                                <div className='flex items-center justify-between'>
                                    <p >Co Agents</p>
                                    <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={handleOpenAddCoAgentDialog}>
                                        <p className={`text-base font-semibold font-raleway ${userType}-text`}>Add</p>
                                        <Plus className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm `} />
                                    </div>
                                    <AlertDialog open={openAddCoAgentDialog} onOpenChange={setOpenAddCoAgentDialog}>
                                        <AlertDialogContent className="w-[320px] md:w-[470px] h-[360px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className={`flex items-center uppercase justify-between ${userType}-text text-[18px] font-[600]`}>
                                                    CC
                                                    <AlertDialogCancel onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenAddCoAgentDialog(false);
                                                        setCoAgentEmail("");
                                                        setPercentage("");
                                                        setDraftCoAgents([]);
                                                    }} className="border-none !shadow-none">
                                                        <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                                                    </AlertDialogCancel>
                                                </AlertDialogTitle>
                                                <hr className="w-full h-[1px] text-[#BBBBBB]" />
                                            </AlertDialogHeader>

                                            <div className="flex flex-col " >
                                                <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-4">
                                                    <form >
                                                        <div className="flex flex-col gap-4">
                                                            {/* Admin Section */}
                                                            <div>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-base font-normal text-[#666666]">Admin</span>
                                                                    <button
                                                                        type='button'
                                                                        className="flex items-center text-[#E06D5E] text-base font-semibold font-raleway"
                                                                        onClick={removeAdmin}
                                                                    >
                                                                        Remove <Minus className='w-[18px] h-[18px] bg-[#E06D5E] text-white rounded-sm ml-[10px]' />
                                                                    </button>
                                                                </div>
                                                                {adminEmail && (
                                                                    <div
                                                                        className="bg-[#E4E4E4] text-[#424242] flex items-center px-3 py-1 rounded-full text-sm"
                                                                    >
                                                                        {adminEmail}
                                                                        <button
                                                                            type="button"
                                                                            className="ml-2 text-red-500"
                                                                            onClick={() => removeAdmin()}
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Co Agents Section */}
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex justify-between items-center">
                                                                    <label className="text-base font-normal text-[#666666]">Co Agents</label>
                                                                    <button
                                                                        type="button"
                                                                        className="flex items-center text-[#6BAE41] text-base font-semibold mt-1 font-raleway"
                                                                        onClick={handleAdd}
                                                                    >
                                                                        Add
                                                                        <Plus className="w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm ml-[10px]" />
                                                                    </button>
                                                                </div>

                                                                {/* 👇 Render added co-agents above the form fields */}
                                                                {draftCoAgents.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2 py-3">
                                                                        {draftCoAgents.map((agent, index) => (
                                                                            <div
                                                                                key={index}
                                                                                className="bg-[#E4E4E4] text-[#424242] flex items-center px-3 py-1 rounded-full text-sm"
                                                                            >
                                                                                {agent.email} {agent.percentage !== undefined && `(${agent.percentage}%)`}
                                                                                <button
                                                                                    type="button"
                                                                                    className="ml-2 text-red-500"
                                                                                    onClick={() => handleRemove(index)}
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-2 w-full gap-x-2.5 text-[#666666]">
                                                                    <div className={`relative w-full ${isSplitInvoice ? 'col-span-1' : 'col-span-2'}`}>
                                                                        <label htmlFor="email" className="block text-sm font-normal">
                                                                            Email <span className="text-red-500">*</span>
                                                                        </label>
                                                                        <Input
                                                                            id="email"
                                                                            type="email"
                                                                            value={coAgentEmail}
                                                                            onChange={(e) => {
                                                                                setCoAgentEmail(e.target.value);
                                                                            }}
                                                                            className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px]"
                                                                        />
                                                                    </div>

                                                                    {isSplitInvoice && (
                                                                        <div className="relative w-full">
                                                                            <label htmlFor="percentage" className="block text-sm font-normal">
                                                                                Percentage <span className="text-red-500">*</span>
                                                                            </label>
                                                                            <Input
                                                                                id="percentage"
                                                                                type="number"
                                                                                min={0}
                                                                                step="0.01"
                                                                                inputMode="decimal"
                                                                                value={percentage === '' ? '' : percentage}
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value;
                                                                                    if (value === '') {
                                                                                        setPercentage('');
                                                                                        return;
                                                                                    }
                                                                                    const numeric = Number(value);
                                                                                    if (!isNaN(numeric) && numeric >= 0) {
                                                                                        setPercentage(numeric);
                                                                                    }
                                                                                }}
                                                                                className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                            />
                                                                            <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setPercentage((prev) => Math.max(0, parseFloat((prev || 0).toString()) + 1))}
                                                                                >
                                                                                    <ArrowUp />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setPercentage((prev) => Math.max(0, parseFloat((prev || 0).toString()) - 1))}
                                                                                >
                                                                                    <ArrowDown />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                        </div>
                                                        <hr className="w-full h-[1px] text-[#BBBBBB] my-[16px]" />
                                                        <AlertDialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                                                            <AlertDialogCancel onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenAddCoAgentDialog(false);
                                                                setCoAgentEmail("");
                                                                setPercentage("");
                                                                setDraftCoAgents([]);
                                                            }} className={`bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400]  ${userType}-border ${userType}-text ${userType}-button hovert-${userType}-text hover-${userType}-bg`}>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const email = coAgentEmail.trim();
                                                                    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                                                                    const needsToAdd = email !== '' || (isSplitInvoice && percentage !== '');

                                                                    if (needsToAdd) {
                                                                        if (!isValidEmail) {
                                                                            toast.error('Please enter a valid email.');
                                                                            return;
                                                                        }

                                                                        if (isSplitInvoice && (percentage === '' || isNaN(Number(percentage)) || Number(percentage) <= 0)) {
                                                                            toast.error('Please enter a valid percentage.');
                                                                            return;
                                                                        }

                                                                        const extractedName = email.split('@')[0];
                                                                        const newAgent = {
                                                                            email,
                                                                            name: extractedName,
                                                                            ...(isSplitInvoice && { percentage: Number(percentage) }),
                                                                        };

                                                                        draftCoAgents.push(newAgent);
                                                                    }

                                                                    // Only proceed after validation
                                                                    setCoAgents(draftCoAgents);
                                                                    setCoAgentEmail('');
                                                                    setPercentage('');
                                                                    setDraftCoAgents([]);
                                                                    setOpenAddCoAgentDialog(false);
                                                                }}
                                                                className={`${userType}-bg text-white hover-${userType}-bg w-full md:w-[176px] h-[44px] font-[400] text-[20px] rounded-md hover-${userType}-bg`}
                                                            >
                                                                Add
                                                            </button>



                                                        </AlertDialogFooter>
                                                    </form>
                                                </div>

                                            </div>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <div className="border border-[#BBBBBB] mt-[12px] px-[6px] py-[8px] rounded-[6px] bg-[#EEEEEE] flex flex-wrap gap-[6px] min-h-[67px]">
                                    {coAgents.map((coagent, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center bg-[#E4E4E4] px-[6px] h-[24px] py-1.5 rounded-[10px] shadow-sm max-w-full break-words cursor-pointer overflow-hidden"
                                            style={{ maxWidth: '100%' }}
                                        >
                                            <span className="text-sm font-normal text-[#7D7D7D] break-words whitespace-pre-wrap overflow-hidden text-ellipsis" onClick={() => setOpenAddCoAgentDialog(true)}>
                                                {coagent.email || 'No Email Provided'} {coagent.percentage !== undefined && `(${coagent.percentage}%)`}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveCoAgent(index)}
                                                className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className='flex items-center justify-between'>
                                    <label htmlFor="">
                                        Agent Notes (Not visible to Agent)
                                    </label>
                                    <div className='flex items-center gap-x-[10px] cursor-pointer' onClick={() => setOpenAddNotesDialog(true)}>
                                        <p className={`text-base font-semibold font-raleway ${userType}-text`}>Add</p>
                                        <Plus className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm `} />
                                        <AlertDialog open={openAddNotesDialog} onOpenChange={setOpenAddNotesDialog}>
                                            <AlertDialogContent className="w-[320px] md:w-[450px] max-h-[550px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className={`flex items-center uppercase justify-between ${userType}-text text-[18px] font-[600]`}>
                                                        ADD NEW NOTES
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenAddNotesDialog(false);
                                                            }}
                                                            className="border-none !shadow-none bg-transparent"
                                                            aria-label="Close"
                                                        >
                                                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                                                        </button>
                                                    </AlertDialogTitle>
                                                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                                                </AlertDialogHeader>

                                                <div className="flex flex-col " >
                                                    <div className="flex flex-col gap-4">
                                                        <form onSubmit={(e) => {
                                                            e.preventDefault();
                                                            if (tempNotes.trim()) {
                                                                setAgentNotes(prev => [
                                                                    ...prev,
                                                                    {
                                                                        note: tempNotes.trim(),
                                                                        name: userName,
                                                                        date: new Date()
                                                                    }
                                                                ]);
                                                                setTempNotes('');
                                                                setOpenAddNotesDialog(false);
                                                            }
                                                        }}>
                                                            <div className="flex flex-col gap-4">
                                                                <input
                                                                    type="text"
                                                                    disabled
                                                                    className="w-[370px] h-[42px] p-3 rounded-[6px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] text-[#666666] font-medium"
                                                                    value={userName}
                                                                />
                                                                <div className='col-span-2 flex items-center justify-between'>
                                                                    <label className='flex items-center gap-x-[10px] cursor-pointer'>
                                                                        <input
                                                                            type="checkbox"
                                                                            // checked={isSplitInvoice}
                                                                            // onChange={(e) => {
                                                                            //     setIsSplitInvoice(e.target.checked);
                                                                            //     setDraftCoAgents([]);
                                                                            //     setCoAgents([]);
                                                                            // }}

                                                                            className={`w-[18px] h-[18px] ${userType === 'admin' ? 'accent-[#4290E9]' : 'accent-[#6BAE41]'}  rounded-sm border border-[#CCCCCC]`}
                                                                        />
                                                                        <span className='text-base font-semibold font-raleway text-[#666666]'>
                                                                            Allow Agent to View
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                                <textarea
                                                                    className="h-[180px] w-[370px] p-3 rounded-[6px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] text-[#666666]"
                                                                    value={tempNotes}
                                                                    onChange={(e) => setTempNotes(e.target.value)}
                                                                    placeholder='Write Notes Here...'
                                                                />
                                                            </div>
                                                            <hr className="w-full h-[1px] text-[#BBBBBB] my-[16px]" />
                                                            <AlertDialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                                                                <AlertDialogCancel onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenAddNotesDialog(false);
                                                                }} className={`bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] ${userType}-border ${userType}-text ${userType}-button hover-${userType}-bg`}>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    type="submit"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setOpenAddNotesDialog(false);
                                                                    }}
                                                                    className={`${userType}-bg text-white hover-${userType}-bg w-full md:w-[176px] h-[44px] font-[400] text-[20px]`}
                                                                >
                                                                    Add
                                                                </AlertDialogAction>

                                                            </AlertDialogFooter>
                                                        </form>
                                                    </div>

                                                </div>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 mt-[12px]">
                                    {agentNotes.length === 0 ? (
                                        <textarea
                                            className="w-full min-h-[150px] p-3 rounded-[6px] bg-[#E4E4E4] border-[1px] sidebar-scroll border-[#BBBBBB] resize-none overflow-y-auto"
                                            disabled
                                            placeholder="No notes yet..."
                                            value=""
                                        />
                                    ) : (
                                        agentNotes.map((note, index) => (
                                            <div
                                                key={index}
                                                className="w-full p-3 rounded-[6px] bg-[#E4E4E4] border border-[#BBBBBB] relative whitespace-pre-wrap break-words"
                                            >
                                                {/* Note content */}
                                                <p className="text-sm text-[#333]">{note.note}</p>

                                                {/* Username and Date aligned to bottom right */}
                                                <div className="mt-2 text-right text-[#8E8E8E] text-[13px] font-[400] leading-tight">
                                                    <p>{new Date(note.date).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}</p>
                                                    <p>{note.name}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </div >
        </div >
    )
}

export default Contact