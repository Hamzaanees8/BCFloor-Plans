"use client";
import AdminTable, { Admin } from '@/components/AdminTable';
import QuickViewCard, { AdminData } from '@/components/QuickViewCard';
import React, { useEffect, useState } from 'react'
import { Delete, Get } from './admin';
import Link from 'next/link';
import { toast } from 'sonner';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';

const Page = () => {
    const [showForm, setShowForm] = useState(false)
    const [showCard, setShowCard] = React.useState(false);
    const [type, setType] = React.useState('');
    const [showHeader, setShowHeader] = useState(true)
    const [adminData, setAdminData] = useState<Admin[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const [selectedData, setSelectedData] = useState<AdminData | null>(null);

    console.log('type', type)
    console.log(showForm);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            return;
        }

        Get(token)
            .then(data => setAdminData(Array.isArray(data.data) ? data.data : []))
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
            toast.success('User deleted successfully');
            setAdminData(prev => prev.filter(admin => admin.uuid !== userId));
        } catch (error) {
            if (error instanceof Error) {
                console.error('Delete failed:', error.message);
                toast.error(error.message || 'Failed to delete user');
            } else {
                console.error('Delete failed:', error);
                toast.error('Failed to delete user');
            }
        }
    };

    const adminLength = adminData.length;
    return (
        <ProtectedAdminRoute>
        <div>

            <div className='w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center' style={{ boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]  text-[#4290E9]'>Administrators ({adminLength})</p>
                <Link href={'/dashboard/admin/create'} onClick={() => {
                    console.log('Button Clicked');
                    setShowHeader(false)
                    setShowForm(true)
                }} className='w-[110px] md:w-[143px] h-[35px] md:h-[44px]  justify-center rounded-[6px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]'>+ Admin</Link>
            </div>

            <div className="w-full">
                <AdminTable
                    adminData={adminData}
                    showHeader={showHeader}
                    setAdminData={setAdminData}
                    setShowHeader={setShowHeader}
                    onQuickView={(selectedType, data) => {
                        setShowCard(true);
                        setType(selectedType);
                        setSelectedData(data);
                    }}
                    onDelete={handleDelete}
                    loading={loading}
                    error={error}
                />
                {showCard && selectedData && (
                    <QuickViewCard
                        type="admin"
                        data={selectedData}
                        onClose={() => setShowCard(false)}
                    />
                )}

            </div>
        </div >
        </ProtectedAdminRoute>
    )
}

export default Page