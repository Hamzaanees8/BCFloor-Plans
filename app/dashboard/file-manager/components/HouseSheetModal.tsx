import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { Order } from '../../orders/page';
import { toast } from 'sonner';
import { EditOrder } from '../file-manager';
import { GetOneOrder } from '../../orders/orders';
import { useAppContext } from '@/app/context/AppContext';
import EditSquareFootage from '../../calendar/components/EditSquareFootage';
import { Area } from '../../calendar/components/OrderDetailView';

type Props = {
    open: boolean
    setOpen: (value: boolean) => void
    uuid?: string;
    setArea: (value: Area[]) => void
}

const HouseSheetModal: React.FC<Props> = ({
    open,
    setOpen,
    uuid,
    setArea
}) => {
    const [orderData, setOrderData] = React.useState<Order | null>(null);
    const [tempArea, setTempArea] = useState<Area[]>([]);
    const { userType } = useAppContext();

    useEffect(() => {
        if (!open || !uuid) return;

        const token = localStorage.getItem("token");
        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetOneOrder(token, uuid)
            .then((data) => {
                setOrderData(data.data);
                // Map the API area to the component's expected Area type if needed
                // Assuming data.data.area matches or is compatible
                setTempArea(data.data.area || []);
            })
            .catch((err) => console.log(err.message));
    }, [open, uuid]);

    const handleSubmitOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token') || '';
            console.log("areato send", tempArea)
            const payload = { areas: tempArea };
            console.log("payload", payload)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updatedPayload = { ...payload, _method: 'PUT' } as any;
            const response = await EditOrder(orderData?.uuid ?? "", updatedPayload, token);


            if (response?.success) {
                toast.success('Order updated successfully');
                setArea(response.data.areas ?? []);
                setOpen(false)
            } else {
                toast.error("Something went wrong");
            }
        } catch (error) {
            const apiError = error as { message?: string; errors?: Record<string, string[]> };

            if (apiError.errors && typeof apiError.errors === 'object') {
                const normalizedErrors: Record<string, string[]> = {};

                Object.entries(apiError.errors).forEach(([key, messages]) => {
                    const normalizedKey = key.split('.')[0];
                    if (!normalizedErrors[normalizedKey]) {
                        normalizedErrors[normalizedKey] = [];
                    }
                    normalizedErrors[normalizedKey].push(...messages);
                });

                // setFieldErrors(normalizedErrors);

                // const firstError = Object.values(normalizedErrors).flat()[0];
                // toast.error(firstError || 'Validation error');
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to submit');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[730px] max-w-[730px] md:w-[730px] h-[600px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className={`flex items-center uppercase justify-between ${userType}-text text-[24px] font-[400]`}>
                        {orderData?.property_address}, {orderData?.property_location} › Order #{orderData?.id || ""}
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setOpen(false)
                            }}
                            className="border-none !shadow-none p-0 h-auto hover:bg-transparent"
                        >
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </Button>
                    </DialogTitle>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                </DialogHeader>

                {/* Reusing EditSquareFootage component */}
                <div className="overflow-y-auto pr-2">
                    <EditSquareFootage
                        currentOrder={orderData || undefined}
                        area={tempArea}
                        setArea={setTempArea}
                    />
                </div>

                <div className="flex flex-col " >
                    <div className="flex flex-col gap-4">
                        <hr className="w-full h-[1px] text-[#BBBBBB] my-[16px]" />
                        <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px]  mt-2 font-raleway">
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className={`bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400]  ${userType}-border ${userType}-text hover:bg-[#f1f8ff]`}
                            >
                                Close
                            </Button>
                            <Button
                                onClick={(e) => {
                                    handleSubmitOrder(e)
                                    setOpen(false)
                                }}
                                className={`${userType}-bg w-full md:w-[170px] h-[44px] text-[20px] font-[600] text-white hover-${userType}-bg`}
                            >
                                Save And Exit
                            </Button>
                        </DialogFooter>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    )
}

export default HouseSheetModal