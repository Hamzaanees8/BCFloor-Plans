"use client";
import QuickViewCard from '@/components/QuickViewCard';
import React, { useEffect, useState } from 'react'
import { Delete, Get } from './agents';
import Link from 'next/link';
import { toast } from 'sonner';
import AgentTable, { Agent } from '@/components/AgentTable';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';
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

    const [showCard, setShowCard] = React.useState(false);
    const [showHeader, setShowHeader] = useState(true)
    const [agentData, setAgentData] = useState<Agent[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const [selectedData, setSelectedData] = useState<AgentData | null>(null);


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
    const agentlength = agentData.length;
    const { hasPermission } = usePermissions();

    // Check if user can create agents
    const canCreateAgent = userType !== 'admin' || hasPermission(PERMISSIONS.CREATE_AGENT);

    return (
        <div>
            <div className='w-full h-[80px] font-alexandria z-10 relative flex justify-between px-[20px] items-center' style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>Agents ({agentlength})</p>
                {(userType !== 'vendor' && canCreateAgent) && (
                    <Link
                        href={'/dashboard/agents/create'}
                        onClick={() => {
                            setShowHeader(false)
                        }}
                        className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] justify-center rounded-[6px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110'
                        style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                    >
                        + New Agent
                    </Link>
                )}
            </div>

            <div className="w-full">
                <AgentTable
                    agentData={agentData}
                    showHeader={showHeader}
                    setAgentData={setAgentData}
                    setShowHeader={setShowHeader}
                    onQuickView={(data) => {
                        setShowCard(true);
                        setSelectedData(data);
                    }}
                    onDelete={handleDelete}
                    loading={loading}
                    error={error}
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