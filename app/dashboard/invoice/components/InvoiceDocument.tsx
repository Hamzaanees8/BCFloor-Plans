'use client'
import React from 'react'
import Image from 'next/image'
import { MapPin, Mail, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface InvoiceDocumentProps {
    invoice: any;
    editData: any;
    isEditing: boolean;
    updateItem: (index: number, field: string, value: any) => void;
    addItem: () => void;
    removeItem: (index: number) => void;
    updateTaxRate: (val: string) => void;
    setEditData: (data: any) => void;
    roleSettings: any;
}

const InvoiceDocument = ({
    invoice,
    editData,
    isEditing,
    updateItem,
    addItem,
    removeItem,
    updateTaxRate,
    setEditData,
    roleSettings
}: InvoiceDocumentProps) => {
    if (!invoice) return null;

    // Default settings if roleSettings is not provided (defensive)
    const settings = roleSettings || { pageTabColor: '#000', pageBg: '#fff' };

    return (
        <div id="invoice-download-content" className="relative bg-white p-12 rounded-lg border-2 border-gray-100 shadow-2xl mx-auto w-full max-w-[950px]  flex flex-col">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <div className="flex border-box items-center gap-3 mb-6">
                        <Image src="/bcfloor.png" alt="BCFloor Logo" width={60} height={60} className="object-contain" />
                        <span className="text-2xl font-bold tracking-tight text-gray-900 leading-normal mb-0 pb-0">BC Floor plans</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">Invoice Number: <span className="text-gray-900">{invoice.invoice_number}</span></p>
                        <p className="text-sm font-medium text-gray-600">Date: <span className="text-gray-900">{new Date(invoice.issued_at || invoice.created_at).toLocaleDateString()}</span></p>
                        <div className="mt-2">
                            {(() => {
                                const status = (invoice.status || 'unpaid').toLowerCase();
                                const statusStyles: Record<string, string> = {
                                    paid: 'bg-[#6BAE41]/10 text-[#6BAE41]',
                                    issued: 'bg-blue-100 text-blue-600',
                                    unpaid: 'bg-orange-100 text-orange-600',
                                    void: 'bg-gray-100 text-gray-400',
                                    partial: 'bg-yellow-100 text-yellow-600',
                                    refunded: 'bg-red-100 text-red-600'
                                };
                                return (
                                    <span className={`inline-block rounded-full px-3 py-1 text-[11px] leading-normal font-bold uppercase ${statusStyles[status] || statusStyles.unpaid}`}>
                                        {status}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                </div>
                <div className="absolute top-12 right-0 flex items-stretch gap-1.5">
                    <div style={{ backgroundColor: settings.pageTabColor }} className="w-1"></div>
                    <div style={{ backgroundColor: settings.pageTabColor }} className="w-3"></div>
                    <div style={{ backgroundColor: settings.pageTabColor }} className="text-white px-6 py-3 flex items-center justify-center min-w-[300px] md:min-w-[300px]">
                        <h1 className="text-[32px] font-bold uppercase tracking-wider" style={{ lineHeight: '1.2' }}>Invoice</h1>
                    </div>
                </div>
            </div>

            <div className="h-px w-full mb-10 opacity-30" style={{ backgroundColor: settings.pageTabColor }}></div>

            {/* Bill From/To Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16 px-4">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: settings.pageTabColor }}>
                        Bill From:
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p className="font-bold text-gray-900">BC Floor plans</p>
                        <p>info@bcfloorplans.com</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: settings.pageTabColor }}>
                        Bill To:
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        {invoice.vendor ? (
                            <>
                                <p className="font-bold text-gray-900">{invoice.vendor.first_name} {invoice.vendor.last_name}</p>
                                {(invoice.vendor.company?.name || invoice.vendor.company_name) && <p>{invoice.vendor.company?.name || invoice.vendor.company_name}</p>}
                                <p className="flex items-center gap-2 px-1"><Mail size={14} className="shrink-0" style={{ color: settings.pageTabColor }} /> <span>{invoice.vendor.email}</span></p>
                            </>
                        ) : (
                            <>
                                <p className="font-bold text-gray-900">{invoice.agent?.first_name} {invoice.agent?.last_name}</p>
                                <p className="flex items-start gap-2 px-1"><MapPin size={14} className="shrink-0 mt-0.5" style={{ color: settings.pageTabColor }} /> <span>{invoice.order?.property?.address}, {invoice.order?.property?.city}, {invoice.order?.property?.province}</span></p>
                                <p className="flex items-center gap-2 px-1"><Mail size={14} className="shrink-0" style={{ color: settings.pageTabColor }} /> <span>{invoice.agent?.email}</span></p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="flex-grow">
                <table className="w-full">
                    <thead>
                        <tr className="border-t-2 border-opacity-30 text-[10px] font-bold uppercase text-gray-500" style={{ borderColor: settings.pageTabColor }}>
                            <th className="py-4 text-left px-4">Item</th>
                            <th className="py-4 text-center">Quantity</th>
                            <th className="py-4 text-right px-4">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 italic-text-container">
                        {(isEditing ? editData.items : invoice.items || []).map((item: any, idx: number) => {
                            const serviceOption = item.order_service?.option?.title || item.orderService?.option?.title;
                            return (
                                <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                {isEditing ? (
                                                    <Input
                                                        value={item.description}
                                                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                        className="font-medium text-gray-900 h-8 flex-grow"
                                                    />
                                                ) : (
                                                    <span className="font-medium text-gray-900">{item.description}</span>
                                                )}
                                                {serviceOption && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border min-w-fit"
                                                          style={{ 
                                                              color: settings.pageTabColor, 
                                                              backgroundColor: `${settings.pageTabColor}1A`, 
                                                              borderColor: `${settings.pageTabColor}33` 
                                                          }}>
                                                        {serviceOption}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center text-gray-700 font-medium">
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                className="w-20 mx-auto text-center h-8"
                                            />
                                        ) : (
                                            item.quantity
                                        )}
                                    </td>
                                    <td className="py-4 text-right font-medium text-gray-900 px-4">
                                        {isEditing ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs text-gray-400">Rate:</span>
                                                <Input
                                                    type="number"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                                    className="w-24 text-right h-8 font-black"
                                                />
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => removeItem(idx)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            `$${parseFloat(item.amount || '0').toFixed(2)}`
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                
                {isEditing && (
                    <div className="mt-4 flex justify-start">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={addItem}
                            className="bg-white hover:brightness-95 flex items-center gap-2 border-[1px]"
                            style={{ color: settings.pageTabColor, borderColor: settings.pageTabColor }}
                        >
                            <Plus className="h-4 w-4" /> Add Item
                        </Button>
                    </div>
                )}
            </div>

            {/* Footer Totals */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-end">
                <div className="max-w-xs flex-grow mr-10">
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: settings.pageTabColor }}>Notes:</h4>
                    {isEditing ? (
                        <Textarea
                            value={editData.notes || ''}
                            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                            className="text-[10px] text-gray-600 h-20"
                            placeholder="Add notes..."
                        />
                    ) : (
                        <p className="text-[10px] text-gray-400 leading-relaxed italic">
                            {invoice.notes || 'Payment is due within 30 days of issuance. Please include the invoice number with your payment. Thank you for your business!'}
                        </p>
                    )}
                </div>
                <div className="w-80 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium uppercase tracking-wider text-xs">Subtotal:</span>
                        <span className="font-bold text-gray-900">${parseFloat(isEditing ? editData.subtotal : (invoice.subtotal || '0')).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-500 font-medium uppercase tracking-wider text-xs">
                            Tax {isEditing ? (
                                <Input
                                    type="number"
                                    value={editData.tax_rate}
                                    onChange={(e) => updateTaxRate(e.target.value)}
                                    className="w-16 h-6 inline-block ml-1 py-0 px-1 text-right"
                                />
                            ) : `(${invoice.tax_rate || 0}%)`}:
                        </span>
                        <span className="font-bold text-gray-900">${parseFloat(isEditing ? editData.tax_amount : (invoice.tax_amount || '0')).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center px-5 py-4 text-white rounded-sm mt-6" style={{ backgroundColor: settings.pageTabColor }}>
                        <span className="font-bold uppercase tracking-wider text-sm leading-normal">Total</span>
                        <span className="text-xl font-bold leading-normal">$ {parseFloat(isEditing ? editData.total : (invoice.total || invoice.total_amount || '0')).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDocument;
