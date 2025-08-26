"use client";
import QuickViewCard, { AgentData, SubAccountData } from '@/components/QuickViewCard';
import React, { useEffect, useState } from 'react'
import Link from 'next/link';
import { toast } from 'sonner';
import SubAccountTable, { SubAccount } from '@/components/SubAccountTable';
import { Delete, Get } from './subaccounts';

const Page = () => {
    const [showForm, setShowForm] = useState(false)
    const [showCard, setShowCard] = React.useState(false);
    const [type, setType] = React.useState('');
    const [showHeader, setShowHeader] = useState(true)
    const [subAccountData, setSubAccountData] = useState<SubAccount[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const [selectedData, setSelectedData] = useState<SubAccountData | null>(null);
    const [selectedData1, setSelectedData1] = useState<AgentData>();

    console.log('type', type)
    console.log(showForm);

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
                if (data.data.length == 0) {
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
    const length = subAccountData.length;
    console.log("subaccount data", subAccountData)
    return (
        <div>

            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center' style={{ boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]  text-[#4290E9]'>Sub Accounts ({length})</p>
                <Link href={'/dashboard/sub-accounts/create'} onClick={() => {
                    setShowHeader(false)
                    setShowForm(true)
                }} className='w-[110px] md:w-[143px] h-[35px] md:h-[44px]  justify-center rounded-[6px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]'>+ Sub Accounts</Link>
            </div>

            <div className="w-full">
                <SubAccountTable
                    subAccountData={subAccountData}
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