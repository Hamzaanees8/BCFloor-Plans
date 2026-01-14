"use client";
import QuickViewCard, { VendorData } from '@/components/QuickViewCard';
import React, { useEffect, useState } from 'react'
import Link from 'next/link';
import { toast } from 'sonner';
import { Delete, Get } from './vendors';
import VendorTable, { Vendor } from '@/components/VendorTable';
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
    const [vendorData, setVendorData] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const [selectedData, setSelectedData] = useState<VendorData | null>(null);


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
            .then(res => {
                if (Array.isArray(res.data)) {
                    setVendorData(res.data);
                } else {
                    setVendorData([]);
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
            await Delete(userId);
            toast.success('vendor deleted successfully');
            setVendorData(prev => prev.filter(vendor => vendor.uuid !== userId));
        } catch (error) {
            if (error instanceof Error) {
                console.error('Delete failed:', error.message);
                toast.error(error.message || 'Failed to delete vendor');
            } else {
                console.error('Delete failed:', error);
                toast.error('Failed to delete vendor');
            }
        }
    };
    const length = vendorData.length;
    const { hasPermission } = usePermissions();

    // Check if user can create vendors
    const canCreateVendor = userType !== 'admin' || hasPermission(PERMISSIONS.CREATE_VENDOR);

    return (
        <div>
            <div className='w-full h-[80px] font-alexandria z-10 relative flex justify-between px-[20px] items-center' style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>Vendors ({length})</p>
                {canCreateVendor && (
                    <Link
                        href={'/dashboard/vendors/create'}
                        onClick={() => {
                            setShowHeader(false)
                        }}
                        className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] justify-center rounded-[6px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110'
                        style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                    >
                        + New Vendor
                    </Link>
                )}
            </div>

            <div className="w-full">
                <VendorTable
                    vendorData={vendorData}
                    showHeader={showHeader}
                    setVendorData={setVendorData}
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
                        type="vendors"
                        data={selectedData}
                        onClose={() => setShowCard(false)}
                    />
                )}

            </div>
        </div >
    )
}

export default Page