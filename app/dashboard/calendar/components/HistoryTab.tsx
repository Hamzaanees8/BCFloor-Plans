import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import React from 'react'
import { Order, OrderService } from '../../orders/page'
import { Services } from '../../services/page';
import { useAppContext } from '@/app/context/AppContext';
interface HistoryProps {
    currentOrder: Order | undefined
    servicesData: Services[]
}
function HistoryTab({ currentOrder, servicesData }: HistoryProps) {
    const { userType } = useAppContext();

    if (!currentOrder?.logs || currentOrder.logs.length === 0) {
        return <div className="p-4 text-center text-gray-500">No history available</div>
    }

    // Sort logs by date descending (newest first), ensuring consistent comparison
    const sortedLogs = [...currentOrder.logs].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }

    const getServiceName = (serviceId: number) => {
        const service = servicesData.find(s => s.id === serviceId);
        return service ? service.name : `Service #${serviceId}`;
    }

    const formatKey = (key: string) => {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    const formatValue = (key: string, value: unknown): string => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (key === 'amount' || key.includes('price') || key.includes('cost')) {
            return `$${Number(value).toFixed(2)}`;
        }

        let processedValue = value;
        // Try parsing stringified JSON
        if (typeof value === 'string' && (value.trim().startsWith('[') || value.trim().startsWith('{'))) {
            try {
                processedValue = JSON.parse(value);
            } catch {
                // Ignore parse error, treat as string
            }
        }

        // Special handling for areas and slots
        if (key === 'areas' || key === 'slots') {
            let list: Record<string, unknown>[] = [];
            if (Array.isArray(processedValue)) {
                list = processedValue as Record<string, unknown>[];
            } else if (typeof processedValue === 'object' && processedValue !== null) {
                // Handle case where array is returned as an object with numeric keys
                list = Object.values(processedValue as Record<string, unknown>) as Record<string, unknown>[];
            }

            if (list.length > 0) {
                if (key === 'areas') {
                    return list.map((v) => {
                        const parts = [];
                        if (v.type) parts.push(v.type);
                        if (v.footage) parts.push(`${v.footage} sq ft`);
                        if (v.custom_title) parts.push(`(${v.custom_title})`);
                        return parts.join(' ');
                    }).join(', ');
                }
                if (key === 'slots') {
                    return list.map((v) => {
                        const date = v.date || '';
                        const time = (typeof v.start_time === 'string' && typeof v.end_time === 'string')
                            ? `${v.start_time.slice(0, 5)}-${v.end_time.slice(0, 5)}`
                            : '';
                        const loc = [v.address, v.location].filter(Boolean).join(', ');
                        return [date, time, loc].filter(Boolean).join(' ');
                    }).join(' | ');
                }
            } else if (Array.isArray(processedValue) || (typeof processedValue === 'object' && processedValue !== null)) {
                return 'Empty';
            }
        }

        if (Array.isArray(processedValue)) {
            return `${processedValue.length} items`;
        }

        if (typeof processedValue === 'object') {
            try {
                if (Object.prototype.toString.call(processedValue) === '[object Date]') {
                    return (processedValue as Date).toLocaleDateString();
                }
                return JSON.stringify(processedValue);
            } catch {
                return '[Complex Object]';
            }
        }

        return String(processedValue);
    }

    return (
        <div>
            <h1 className='mb-[10px]'>History</h1>
            <div className='h-[42px] w-full grid grid-cols-4 text-[14px] text-[#424242] border border-[#BBBBBB] rounded-[6px] items-center px-[10px]'>
                <p>Subject</p>
                <p>Created By</p>
                <p>Time</p>
                <p>Date</p>
            </div>

            {sortedLogs.map((log) => {
                const isCreated = log.action === 'created';
                const userName = '-';

                // --- Service Changes Logic ---
                let beforeServices: OrderService[] = [];
                let afterServices: OrderService[] = [];
                let hasServiceChanges = false;

                if (!isCreated && log.data?.before?.services && log.data?.after?.services) {
                    const beforeMap = log.data.before.services as unknown as Record<string, OrderService>;
                    const afterMap = log.data.after.services as unknown as Record<string, OrderService>;

                    beforeServices = Object.values(beforeMap);
                    afterServices = Object.values(afterMap);

                    if (JSON.stringify(beforeServices) !== JSON.stringify(afterServices)) {
                        hasServiceChanges = true;
                    }
                }

                // --- General Changes Logic (excluding services and timestamps) ---
                const generalDiffs: Array<{ key: string, before: unknown, after: unknown }> = [];
                if (!isCreated && log.data?.before && log.data?.after) {
                    const allKeys = new Set([...Object.keys(log.data.before), ...Object.keys(log.data.after)]);
                    const ignoredKeys = ['services', 'updated_at', 'created_at', 'id', 'uuid', 'agent', 'vendor', 'property'];

                    allKeys.forEach(key => {
                        if (ignoredKeys.includes(key)) return;

                        const beforeVal = (log.data.before as Record<string, unknown>)[key];
                        const afterVal = (log.data.after as Record<string, unknown>)[key];

                        if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
                            generalDiffs.push({ key, before: beforeVal, after: afterVal });
                        }
                    });
                }

                return (
                    <Accordion key={log.id} type="single" collapsible className="w-full border border-[#BBBBBB] rounded-[6px] my-[20px]">
                        <AccordionItem value={`item-${log.id}`}>
                            <AccordionTrigger className="p-0 px-[10px] hover:no-underline">
                                <div className="h-[42px] w-full grid grid-cols-4 text-[14px] text-[#424242] text-left items-center">
                                    <p>{isCreated ? 'Order Created' : 'Order Updated'}</p>
                                    <p className='pl-[5px]'>{userName}</p>
                                    <p className='pl-[5px]'>{formatTime(log.created_at)}</p>
                                    <p className='pl-[10px]'>{formatDate(log.created_at)}</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                {isCreated ? (
                                    <div className="px-4 bg-gray-50 text-sm text-gray-700 py-4">
                                        <p>Order created.</p>
                                    </div>
                                ) : (
                                    <div className="px-4 bg-gray-50 text-sm text-gray-700 pb-4">
                                        {/* General Changes Section */}
                                        {generalDiffs.length > 0 && (
                                            <div className="mb-4 pt-4">
                                                <h1 className="font-semibold mb-2">General Changes</h1>
                                                <div className="grid grid-cols-3 gap-y-2 border-t border-gray-200 pt-2">
                                                    {generalDiffs.map((diff, idx) => (
                                                        <React.Fragment key={idx}>
                                                            <div className="font-medium text-gray-600 col-span-1 flex items-center">{formatKey(diff.key)}</div>
                                                            <div className="text-gray-800 col-span-2 flex items-center gap-2">
                                                                <span className="line-through text-gray-400 text-xs">{formatValue(diff.key, diff.before)}</span>
                                                                <span>→</span>
                                                                <span className="font-medium">{formatValue(diff.key, diff.after)}</span>
                                                            </div>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Service Changes Section */}
                                        {hasServiceChanges ? (
                                            <>
                                                <h1 className='pt-4 font-semibold'>Updated Services</h1>
                                                <div className='grid grid-cols-6 my-4 px-4'>
                                                    <h1 className='col-span-4'>Service</h1>
                                                    <h1 className='col-span-2'>Option</h1>
                                                </div>
                                                {afterServices.map((s: OrderService, i) => (
                                                    <div key={`after-${i}`} className="mb-3 grid grid-cols-6 gap-x-3 px-4">
                                                        <p className='border border-[#BBBBBB] rounded-[6px] col-span-4 h-[42px] px-[10px] flex items-center' style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
                                                            {getServiceName(s.service_id)}
                                                        </p>
                                                        <p className='border border-[#BBBBBB] rounded-[6px] col-span-2 h-[42px] px-[10px] flex items-center' style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
                                                            {s.option?.title || 'Default'}
                                                        </p>
                                                    </div>
                                                ))}

                                                <h1 className='mt-4 font-semibold'>Old Version</h1>
                                                <div className='grid grid-cols-6 my-4 px-4'>
                                                    <h1 className='col-span-4'>Service</h1>
                                                    <h1 className='col-span-2'>Option</h1>
                                                </div>
                                                {beforeServices.map((s: OrderService, i) => (
                                                    <div key={`before-${i}`} className="mb-3 grid grid-cols-6 gap-x-3 px-4">
                                                        <p className='border border-[#BBBBBB] rounded-[6px] col-span-4 h-[42px] px-[10px] flex items-center' style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
                                                            {getServiceName(s.service_id)}
                                                        </p>
                                                        <p className='border border-[#BBBBBB] rounded-[6px] col-span-2 h-[42px] px-[10px] flex items-center' style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
                                                            {s.option?.title || 'Default'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </>
                                        ) : null}

                                        {/* Fallback if no changes detected */}
                                        {generalDiffs.length === 0 && !hasServiceChanges && (
                                            <div className="py-4 text-center text-gray-500">
                                                <p>Other details updated (check diff for specifics if needed).</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )
            })}
        </div>
    )
}

export default HistoryTab
