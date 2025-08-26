import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import AddLevelDialog from '../../calendar/components/AddLevelDialog';
import AddExtraDialog from '../../calendar/components/AddExtraDialog';
import { Order } from '../../orders/page';
import { toast } from 'sonner';
import { EditOrder } from '../file-manager';
import { GetOneOrder } from '../../orders/orders';
type Props = {
    open: boolean
    setOpen: (value: boolean) => void
    uuid?: string;
    setArea: (value: Area[]) => void
}
interface Field {
    id: number;
    label: string;
    value: number;
    custom_title?: string;
    showSecondInput?: boolean;
    secondValue?: number;
}
export interface Area {
    type: string;
    footage: number;
    custom_title?: string;
    uuid?: string;
}
let uniqueId = 0;
const HouseSheetModal: React.FC<Props> = ({
    open,
    setOpen,
    uuid,
    // area,
    setArea
}) => {
    const [levels, setLevels] = useState<Field[]>([
        { id: uniqueId++, label: '1st Level', value: 0 },
        { id: uniqueId++, label: '2nd Level', value: 0 },
        { id: uniqueId++, label: '3rd Level', value: 0 },
    ]);

    const [extras, setExtras] = useState<Field[]>([
        { id: uniqueId++, label: 'Garage', value: 0 },
        { id: uniqueId++, label: 'Mechanical', value: 0 },
        { id: uniqueId++, label: 'Storage', value: 0 },
    ]);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openAddExtraDialog, setOpenAddExtraDialog] = useState(false);
    const [orderData, setOrderData] = React.useState<Order | null>(null);
    const [tempArea, setTempArea] = useState<Area[]>([]);
    const handleChange = (id: number, list: Field[], setList: React.Dispatch<React.SetStateAction<Field[]>>, field: Partial<Field>) => {
        setList(list.map(item => item.id === id ? { ...item, ...field } : item));
    };

    const handleRemove = (id: number, list: Field[], setList: React.Dispatch<React.SetStateAction<Field[]>>) => {
        setList(list.filter(item => item.id !== id));
    };
    const total = (list: Field[]) =>
        list.reduce((sum, item) => sum + (item.value > 0 ? item.value : 0), 0);
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
                setTempArea(data.data.area);
            })
            .catch((err) => console.log(err.message));
    }, [open, uuid]);

    useEffect(() => {
        if (!orderData) return;

        const areaMap = new Map(orderData.areas?.map(a => [a.type, a]));

        setLevels(prevLevels =>
            prevLevels.map(level => {
                const area = areaMap.get(level.label);
                return area
                    ? { ...level, value: area.footage, checked: true }
                    : level;
            })
        );

        setExtras(prevExtras =>
            prevExtras.map(extra => {
                const area = areaMap.get(extra.label);
                return area
                    ? { ...extra, value: area.footage, checked: true }
                    : extra;
            })
        );
    }, [orderData]);
    useEffect(() => {
        if (!orderData) return;

        const isLevel = (label: string) => /\d+(st|nd|rd|th) Level/.test(label);
        const levelsFromAPI: Field[] = [];
        const extrasFromAPI: Field[] = [];

        orderData.areas?.forEach((area: Area) => {
            const field: Field = {
                id: uniqueId++,
                label: area.type,
                value: area.footage,
                ...(area.custom_title ? { custom_title: area.custom_title } : {})
            };

            if (isLevel(area.type)) {
                levelsFromAPI.push(field);
            } else {
                extrasFromAPI.push(field);
            }
        });

        const defaultLevelLabels = ['1st Level', '2nd Level', '3rd Level'];
        const allLevels = [...defaultLevelLabels, ...levelsFromAPI.map(l => l.label)]
            .filter((label, i, arr) => arr.indexOf(label) === i)
            .map(label => {
                const existing = levelsFromAPI.find(l => l.label === label);
                return existing || { id: uniqueId++, label, value: 0 };
            });

        setLevels(allLevels);
        setExtras(extrasFromAPI);
    }, [orderData]);
    useEffect(() => {
        const levelAreas: Area[] = levels
            .filter(item => item.value > 0)
            .map(item => ({
                type: item.label,
                footage: item.value,
            }));

        const extraAreas: Area[] = extras
            .filter(item => item.value > 0)
            .map(item => ({
                type: item.label,
                footage: item.value,
                ...(item.custom_title ? { custom_title: item.custom_title } : {})
            }));

        setTempArea([...levelAreas, ...extraAreas]);
    }, [levels, extras]);
    const handleSubmitOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token') || '';
            console.log("areato send", tempArea)
            const payload = { areas: tempArea };
            console.log("payload", payload)
            const updatedPayload = { ...payload, _method: 'PUT' };
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
    useEffect(() => {
        if (!open) {
            setTempArea([]);
            if (orderData) {
                const isLevel = (label: string) => /\d+(st|nd|rd|th) Level/.test(label);
                const levelsFromAPI: Field[] = [];
                const extrasFromAPI: Field[] = [];

                orderData.areas?.forEach((area: Area) => {
                    const field: Field = {
                        id: uniqueId++,
                        label: area.type,
                        value: area.footage,
                        ...(area.custom_title ? { custom_title: area.custom_title } : {})
                    };

                    if (isLevel(area.type)) {
                        levelsFromAPI.push(field);
                    } else {
                        extrasFromAPI.push(field);
                    }
                });

                const defaultLevelLabels = ['1st Level', '2nd Level', '3rd Level'];
                const allLevels = [...defaultLevelLabels, ...levelsFromAPI.map(l => l.label)]
                    .filter((label, i, arr) => arr.indexOf(label) === i)
                    .map(label => {
                        const existing = levelsFromAPI.find(l => l.label === label);
                        return existing || { id: uniqueId++, label, value: 0 };
                    });

                setLevels(allLevels);
                setExtras(extrasFromAPI);
            }
        }
    }, [open, orderData]);


    // console.log("area", area)
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[730px] max-w-[730px] md:w-[730px] h-[600px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center uppercase justify-between text-[#4290E9] text-[24px] font-[400]">
                        {orderData?.property_address}, {orderData?.property_location} › Order #{orderData?.id || ""}
                        <AlertDialogCancel onClick={() => {
                            setOpen(false)
                        }} className="border-none !shadow-none">
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </AlertDialogCancel>
                    </AlertDialogTitle>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                </AlertDialogHeader>
                <div className="bg-[#F5F5F5] p-4 rounded border border-gray-300 text-[16px] font-normal text-[#666666] font-alexandria space-y-6">
                    <div className="text-[24px] font-[400]">{orderData?.property_address}, {orderData?.property_location}</div>
                    <div className="space-y-3">
                        <div className="text-[16px] font-normal">Chargeable</div>
                        {levels.map(field => (
                            <div key={field.id} className="flex items-center gap-2">
                                <Checkbox
                                    checked={field.showSecondInput}
                                    onCheckedChange={(val) => handleChange(field.id, levels, setLevels, { showSecondInput: !!val })}
                                    className="w-[18px] h-[18px] border border-gray-400 rounded-[3px] relative
                                  appearance-none
                                  after:hidden
                                  data-[state=checked]:bg-transparent
                                  data-[state=checked]:before:content-['']
                                  data-[state=checked]:before:absolute
                                  data-[state=checked]:before:inset-0
                                  data-[state=checked]:before:m-auto
                                  data-[state=checked]:before:w-[14px]
                                  data-[state=checked]:before:h-[14px]
                                  data-[state=checked]:before:bg-[#4290E9]
                                  data-[state=checked]:before:rounded-[2px]"
                                />
                                <span className="w-[120px]">{field.label}</span>
                                <Input
                                    type="number"
                                    min={1}
                                    step="1"
                                    inputMode="decimal"
                                    value={field.value === 0 ? '' : field.value}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '') {
                                            handleChange(field.id, levels, setLevels, { value: 0 });
                                            return;
                                        }
                                        const numeric = Number(value);
                                        if (!isNaN(numeric) && numeric > 0) {
                                            handleChange(field.id, levels, setLevels, { value: numeric });
                                        }
                                    }}
                                    className="w-[130px] h-[42px] border-[#7D7D7D] bg-[#EEEEEE] text-[16px] border appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />

                                <span>FT²</span>
                                {field.showSecondInput && (
                                    <Input
                                        type="number"
                                        min={1}
                                        step="1"
                                        inputMode="decimal"
                                        placeholder='Cost'
                                        value={field.secondValue ?? ''}
                                        onChange={(e) => {
                                            const secondValue = Number(e.target.value);
                                            handleChange(field.id, levels, setLevels, { secondValue: isNaN(secondValue) ? 0 : secondValue });
                                        }}
                                        className="w-[130px] h-[42px] border-[#7D7D7D] bg-[#EEEEEE] text-[16px] border appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-[#666666] hover:text-red-500 "
                                    onClick={() => handleRemove(field.id, levels, setLevels)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        <div className="border-t border-dashed border-gray-400 my-2 w-1/2"></div>
                        <div className="flex justify-between items-center pr-[50px] w-1/2">
                            <span className='w-1/2 flex justify-start'>Total:</span>
                            <span className='w-1/2 flex justify-center'>{total(levels)} FT²</span>
                        </div>

                        <Button className='bg-[#4290E9] font-raleway text-sm font-semibold hover:bg-[#4999f4]' variant="default" onClick={() => setOpenAddDialog(true)}>
                            Add a Level
                        </Button>
                        <AddLevelDialog
                            open={openAddDialog}
                            onOpenChange={setOpenAddDialog}
                            onAddLevel={(label, sqft) => {
                                setLevels(prev => [
                                    ...prev,
                                    { id: uniqueId++, label, value: sqft, checked: true },
                                ]);
                            }}
                        />

                    </div>

                    {/* Extra Fields */}
                    <div className="space-y-3">
                        {extras.map(field => (
                            <div key={field.id} className="flex items-center gap-2">
                                <Checkbox
                                    checked={field.showSecondInput}
                                    onCheckedChange={(val) =>
                                        handleChange(field.id, extras, setExtras, { showSecondInput: !!val })
                                    }
                                    className="w-[18px] h-[18px] border border-gray-400 rounded-[3px] relative
                                  appearance-none
                                  after:hidden
                                  data-[state=checked]:bg-transparent
                                  data-[state=checked]:before:content-['']
                                  data-[state=checked]:before:absolute
                                  data-[state=checked]:before:inset-0
                                  data-[state=checked]:before:m-auto
                                  data-[state=checked]:before:w-[14px]
                                  data-[state=checked]:before:h-[14px]
                                  data-[state=checked]:before:bg-[#4290E9]
                                  data-[state=checked]:before:rounded-[2px]"
                                />
                                <span className="w-[120px]">{field.label}</span>
                                <Input
                                    type="number"
                                    min={1}
                                    step="1"
                                    inputMode="decimal"
                                    value={field.value === 0 ? '' : field.value}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '') {
                                            handleChange(field.id, extras, setExtras, { value: 0 });
                                            return;
                                        }
                                        const numeric = Number(value);
                                        if (!isNaN(numeric) && numeric > 0) {
                                            handleChange(field.id, extras, setExtras, { value: numeric });
                                        }
                                    }}
                                    className="w-[130px] h-[42px] bg-[#EEEEEE] font-normal text-[16px] border border-[#7D7D7D] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />

                                <span>FT²</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-[#666666] hover:text-red-500"
                                    onClick={() => handleRemove(field.id, extras, setExtras)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        <div className="border-t border-dashed border-gray-400 my-2 w-1/2"></div>
                        <div className="flex justify-between items-center pr-[50px] w-1/2">
                            <span className='w-1/2 flex justify-start'>Total:</span>
                            <span className='w-1/2 flex justify-center'>{total(extras)} FT²</span>
                        </div>

                        <Button className='bg-[#4290E9] font-raleway text-sm font-semibold hover:bg-[#4999f4]' variant="default" onClick={() => setOpenAddExtraDialog(true)}>
                            Add a Custom Field
                        </Button>
                        <AddExtraDialog
                            open={openAddExtraDialog}
                            onOpenChange={setOpenAddExtraDialog}
                            onAddExtra={(label: string, sqft: number, customLabel?: string) => {
                                setExtras(prev => [
                                    ...prev,
                                    { id: uniqueId++, label, value: sqft, checked: true, ...(customLabel && { custom_title: customLabel }) },
                                ]);
                            }}
                        />

                    </div>
                </div>
                <div className="flex flex-col " >
                    <div className="flex flex-col gap-4">
                        <hr className="w-full h-[1px] text-[#BBBBBB] my-[16px]" />
                        <AlertDialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px]  mt-2 font-raleway">
                            <AlertDialogCancel className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
                                Close
                            </AlertDialogCancel>
                            <Button
                                onClick={(e) => {
                                    handleSubmitOrder(e)
                                    setOpen(false)
                                }}
                                className="bg-[#4290E9] w-full md:w-[170px] h-[44px] text-[20px] font-[600] text-white hover:bg-[#005fb8]"
                            >
                                Save And Exit
                            </Button>
                        </AlertDialogFooter>
                    </div>

                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default HouseSheetModal