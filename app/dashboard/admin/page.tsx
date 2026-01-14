"use client";
import AdminTable, { Admin } from '@/components/AdminTable';
import QuickViewCard, { AdminData } from '@/components/QuickViewCard';
import React, { useEffect, useState } from 'react'
import { Delete, Get } from './admin';
import Link from 'next/link';
import { toast } from 'sonner';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';

const Page = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [showCard, setShowCard] = React.useState(false);
    const [showHeader, setShowHeader] = useState(true)
    const [adminData, setAdminData] = useState<Admin[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const [selectedData, setSelectedData] = useState<AdminData | null>(null);

    useEffect(() => {

        Get()
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
            await Delete(userId);
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
    const { hasPermission } = usePermissions();

    // Check if user can create admins
    const canCreateAdmin = hasPermission(PERMISSIONS.CREATE_ADMIN);

    return (
        <ProtectedAdminRoute>
            <div>

                <div className='w-full h-[80px] font-alexandria z-10 relative flex justify-between px-[20px] items-center' style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }} >
                    <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>Administrators ({adminLength})</p>
                    {canCreateAdmin && (
                        <Link
                            href={'/dashboard/admin/create'}
                            onClick={() => {
                                console.log('Button Clicked');
                                setShowHeader(false)
                            }}
                            className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] justify-center rounded-[6px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110'
                            style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                        >
                            + Admin
                        </Link>
                    )}
                </div>

                <div className="w-full">
                    <AdminTable
                        adminData={adminData}
                        showHeader={showHeader}
                        setAdminData={setAdminData}
                        setShowHeader={setShowHeader}
                        onQuickView={(selectedType, data) => {
                            setShowCard(true);
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