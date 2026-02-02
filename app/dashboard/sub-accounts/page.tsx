"use client";
import QuickViewCard, { AgentData, SubAccountData } from '@/components/QuickViewCard';
import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link';
import { toast } from 'sonner';
import SubAccountTable, { SubAccount } from '@/components/SubAccountTable';
import { Delete, Get } from './subaccounts';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { useSearchParams } from 'next/navigation';

const Page = () => {
    const searchParams = useSearchParams();
    const agentId = searchParams.get('agentId') || '';
    const [showCard, setShowCard] = React.useState(false);
    const [type, setType] = React.useState('');
    const [showHeader, setShowHeader] = useState(true)
    const [subAccountData, setSubAccountData] = useState<SubAccount[]>([]);
    const { userType } = useAppContext()
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const [selectedData, setSelectedData] = useState<SubAccountData | null>(null);
    const [selectedData1, setSelectedData1] = useState<AgentData>();
    const headerRef = useRef<HTMLDivElement>(null);

    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];


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

        Get(token)
            .then(data => {
                setSubAccountData(Array.isArray(data.data) ? data.data : [])
                if (data.success === false) {
                    setError(true)
                }
            })
            .catch(err => {
                console.log(err.message);
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

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
    }, [headerRef]);

    const handleDelete = async (userId: string) => {
        try {
            const token = localStorage.getItem('token') || '';
            await Delete(userId, token);
            toast.success('Sub-Account deleted successfully');
            setSubAccountData(prev => prev.filter(subaccount => subaccount.uuid !== userId));
        } catch (error) {
            if (error instanceof Error) {
                console.error('Delete failed:', error.message);
                toast.error(error.message || 'Failed to delete Sub-Account');
            } else {
                console.error('Delete failed:', error);
                toast.error('Failed to delete Sub-Account');
            }
        }
    };

    const filteredSubAccounts = subAccountData.filter(subAccount => {
        if (agentId) {
            return subAccount.agent.uuid === agentId

        }
        return true;
    })
    const lengthFiltered = filteredSubAccounts.length;
    return (
        <div>
            <div ref={headerRef} className='w-full h-[80px] font-alexandria z-50 sticky top-0 flex justify-between px-[20px] items-center' style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>Sub Accounts ({lengthFiltered})</p>
                <Link
                    href={`/dashboard/sub-accounts/create?agentId=${agentId}`}
                    onClick={() => {
                        setShowHeader(false)
                    }}
                    className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] justify-center rounded-[6px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110'
                    style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                >
                    + Sub Accounts
                </Link>
            </div>

            <div className="w-full">
                <SubAccountTable
                    subAccountData={filteredSubAccounts}
                    showHeader={showHeader}
                    setSubAccountData={setSubAccountData}
                    setShowHeader={setShowHeader}
                    onQuickView={(selectedType, data) => {
                        setShowCard(true);
                        setType(selectedType);
                        setSelectedData(data);
                    }}
                    onQuickView1={(selectedType, data) => {
                        setShowCard(true);
                        setType(selectedType);
                        setSelectedData1(data);
                    }}
                    onDelete={handleDelete}
                    loading={loading}
                    error={error}
                />
                {(type === "agent") && showCard && selectedData1 && (
                    <QuickViewCard
                        type="agent"
                        data={selectedData1}
                        onClose={() => setShowCard(false)}
                    />
                )}
                {(type === "subaccount") && showCard && selectedData && (
                    <QuickViewCard
                        type="subaccount"
                        data={selectedData}
                        onClose={() => setShowCard(false)}
                    />
                )}

            </div>
        </div >
    )
}

export default Page