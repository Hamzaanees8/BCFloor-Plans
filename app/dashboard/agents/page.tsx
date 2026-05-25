"use client";
import QuickViewCard from '@/components/QuickViewCard';
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Delete, Get } from './agents';
import Link from 'next/link';
import { toast } from 'sonner';
import { Agent } from '@/lib/types';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';
import { DataTable } from '@/components/DataTable';
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import DropdownActions from "@/components/DropdownActions";
import { useRouter } from "next/navigation";

import { UploadRightIcon } from "@/components/Icons";
import { UpdateAgentStatus } from './agents';
import { ColumnDef } from "@tanstack/react-table";
import { useUser } from "@/context/UserContext";
import { GetOrganizations } from "@/app/dashboard/global-settings/global-settings";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
export interface AgentData {
    uuid?: string;
    first_name: string;
    last_name: string;
    notes: string;
    payment_status: string;
    email: string;
    created_at: string;
    status?: boolean;
    permissions?: { id: number, name: string }[]
    roles?: { id: number, name: string }[],
    headquarter_address?: string
    primary_phone?: string;
    secondary_phone?: string;
    avatar_url?: string;
    company_name: string;
    activity?: string;
}
const Page = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const header = headerRef.current;
        if (!header) return;

        let ancestor = header.parentElement;
        while (ancestor) {
            const style = window.getComputedStyle(ancestor);
            if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
                ancestor.style.setProperty('overflow-x', 'visible', 'important');
                ancestor.style.setProperty('overflow-y', 'visible', 'important');

                const target = ancestor;
                return () => {
                    target.style.removeProperty('overflow-x');
                    target.style.removeProperty('overflow-y');
                };
            }
            ancestor = ancestor.parentElement;
        }
    }, []);

    const [showCard, setShowCard] = React.useState(false);
    const [agentData, setAgentData] = useState<Agent[]>([]);
    const { isSuperAdmin } = useUser();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [orgFilter, setOrgFilter] = useState<string>("all");

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const [selectedData, setSelectedData] = useState<AgentData | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (isSuperAdmin) {
            GetOrganizations()
                .then(res => {
                    if (res.status && Array.isArray(res.data)) {
                        setOrganizations(res.data);
                    }
                })
                .catch(err => console.error("Failed to fetch organizations:", err));
        }
    }, [isSuperAdmin]);

    const filteredAgents = useMemo(() => {
        return agentData.filter(agent => {
            if (orgFilter !== "all" && String(agent.organization_id) !== orgFilter) {
                return false;
            }
            return true;
        });
    }, [agentData, orgFilter]);

    const handleUpdateStatus = async (uuid: string, status: boolean) => {
        try {
            const payload = {
                status: status,
                _method: 'PUT'
            };
            const result = await UpdateAgentStatus(uuid, payload);
            toast.success('Agent Status updated successfully');
            return result
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(error.message);
                toast.error(error.message || 'Failed to submit agent data');
            }
        }
    };

    const handleDelete = async (uuid: string) => {
        try {
            await Delete(uuid);
            toast.success('Agent deleted successfully');
            setAgentData(prev => prev.filter(agent => agent.uuid !== uuid));
        } catch (error) {
            if (error instanceof Error) {
                console.error('Delete failed:', error.message);
                toast.error(error.message || 'Failed to delete Agent');
            } else {
                console.error('Delete failed:', error);
                toast.error('Failed to delete Agent');
            }
        }
    };

    const columns = useMemo<ColumnDef<Agent>[]>(() => {
        const cols: ColumnDef<Agent>[] = [
        {
            id: "select",
            header: () => <div></div>,
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: "AGENTS",
            cell: ({ row }) => {
                const { first_name, last_name, roles, ...rest } = row.original;

                const handleClick = () => {
                    const mappedRoles =
                        roles && roles.length > 0
                            ? [{ id: roles[0].id, name: roles[0].name }] as { id: number; name: string }[]
                            : undefined;

                    setShowCard(true);
                    setSelectedData({
                        ...rest,
                        first_name,
                        last_name,
                        roles: mappedRoles,
                    });
                };

                return (
                    <div
                        className={`text-[#4290E9] cursor-pointer ${userType}-text`}
                        onClick={handleClick}
                    >
                        {first_name} {last_name}
                    </div>
                );
            },
        }

        ,
        {
            accessorKey: "headquarter_address",
            header: "ADDRESS",
            cell: ({ row }) => {
                const address = row.original.headquarter_address;
                return (
                    <div className="text-[#666666]">
                        {address || "N/A"}
                    </div>
                );
            },
        },
        {
            header: "PAYMENT STATUS",
            cell: ({ row }) => {
                const status = row.original.payment_status;
                const bgColor = status === "GOOD" ? "#6BAE41" : "#E06D5E";

                return (
                    <div
                        className="text-white px-3 py-1 rounded-full text-[10px] font-medium w-fit"
                        style={{ backgroundColor: bgColor }}
                    >
                        {status}
                    </div>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: "ADDED",
            cell: ({ row }) => {
                const date = new Date(row.getValue("created_at")).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                });
                return <div className="text-[#666666]">{date}</div>;
            },
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => {
                const status = row.getValue("status");
                const uuid = row.original.uuid;

                return (
                    userType !== "vendor" && (
                        <Switch
                            checked={!!status}
                            onCheckedChange={async (checked) => {
                                const data = await handleUpdateStatus(uuid || "", checked);
                                if (setAgentData && data?.data?.uuid) {
                                    setAgentData((prev) =>
                                        prev.map((agent) =>
                                            agent.uuid === data.data.uuid
                                                ? { ...agent, status: checked }
                                                : agent
                                        )
                                    );
                                }
                            }}
                            className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                        />
                    )
                );

            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row, table }) => {
                const selectedRowIds = Object.keys(table.getState().rowSelection);
                const selectedRowCount = selectedRowIds.length;
                const selectedAgents = table.getRowModel().rows
                    .filter(r => selectedRowIds.includes(r.id))
                    .map(r => ({
                        ...r.original,
                        full_name: `${r.original.first_name} ${r.original.last_name}`
                    }));

                return (
                    userType !== "vendor" &&
                    <div className="flex gap-2 justify-center items-center">
                        <Link
                            className={`w-[90px]  h-[30px]   justify-center rounded-[6px] border-[1px] ${userType}-border ${userType}-bg text-[12px]  font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg hover:opacity-95`}
                            href={`/dashboard/listings${row.original.uuid ? `?agent=${row.original.uuid}` : ''}`}
                        >
                            <span>Tour</span>
                            <UploadRightIcon size={14} color="#fff" />
                        </Link>

                        <DropdownActions
                            options={[
                                {
                                    label: "Edit",
                                    onClick: () => {
                                        const uuid = row.original.uuid;
                                        if (uuid) {
                                            router.push(`/dashboard/agents/create/${uuid}`);
                                        }
                                    },
                                },
                                {
                                    label: "Quick View",
                                    onClick: () => {
                                        const { roles, ...rest } = row.original;
                                        const mappedRoles =
                                            roles && roles.length > 0
                                                ? [{ id: roles[0].id, name: roles[0].name }] as { id: number; name: string; }[]
                                                : undefined;
                                        setShowCard(true);
                                        setSelectedData({ ...rest, roles: mappedRoles });
                                    },
                                },
                                ...(selectedRowCount === 2
                                    ? [{
                                        label: "Merge",
                                        onClick: () => {
                                            toast.success('Agents merged ')
                                        },
                                        confirm2: true,
                                    }]
                                    : []),
                                {
                                    label: "Delete",
                                    onClick: () => handleDelete(row.original.uuid ?? ""),
                                    confirm1: true,
                                }
                            ]}
                            data={selectedAgents}
                        />

                    </div>
                );
            },
        }
    ];

        if (isSuperAdmin) {
            cols.splice(2, 0, {
                accessorKey: "organization",
                header: "ORGANIZATION",
                cell: ({ row }) => {
                    const org = row.original.organization;
                    return <div className="text-[#666666]">{org?.name || "Global / None"}</div>;
                }
            });
        }

        return cols;
    }, [isSuperAdmin, organizations, userType, router, handleUpdateStatus, handleDelete]);


    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            setLoading(false);
            setError(true);
            return;
        }

        setLoading(true);
        setError(false);

        Get()
            .then(data => setAgentData(Array.isArray(data.data) ? data.data : []))
            .catch(err => {
                console.log(err.message);
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const agentlength = filteredAgents.length;
    const { hasPermission } = usePermissions();

    // Check if user can create agents
    const canCreateAgent = userType !== 'admin' || hasPermission(PERMISSIONS.CREATE_AGENT);

    return (
        <div>
            <div ref={headerRef} className='w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center' style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>Agents ({agentlength})</p>
                <div className="flex items-center gap-3">
                    {isSuperAdmin && (
                        <Select value={orgFilter} onValueChange={setOrgFilter}>
                            <SelectTrigger className="w-[180px] h-[35px] md:h-[42px] text-[#666666] border border-[#BBBBBB] rounded-[6px]" style={{ backgroundColor: roleSettings.pageBg }}>
                                <SelectValue placeholder="All Organizations" />
                            </SelectTrigger>
                            <SelectContent className="border border-[#BBBBBB]" style={{ backgroundColor: roleSettings.pageBg }}>
                                <SelectItem value="all">All Organizations</SelectItem>
                                {organizations.map((org) => (
                                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {(userType !== 'vendor' && canCreateAgent) && (
                        <Link
                            href={'/dashboard/agents/create'}

                            className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] justify-center rounded-[6px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110'
                            style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                        >
                            + New Agent
                        </Link>
                    )}
                </div>
            </div>

            <div className="w-full">
                <DataTable
                    columns={columns}
                    data={filteredAgents}
                    loading={loading}
                    error={error}
                    dataName="Agents"
                    userType={userType}
                />
                {showCard && selectedData && (
                    <QuickViewCard
                        type="agent"
                        data={selectedData}
                        onClose={() => setShowCard(false)}
                    />
                )}

            </div>
        </div >
    )
}

export default Page