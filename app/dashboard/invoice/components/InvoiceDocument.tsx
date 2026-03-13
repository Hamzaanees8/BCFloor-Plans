'use client'
import React from 'react'
import Image from 'next/image'
import { MapPin, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface InvoiceDocumentProps {
    invoice: any;
    editData: any;
    isEditing: boolean;
    updateItem: (index: number, field: string, value: any) => void;
    updateTaxRate: (val: string) => void;
    setEditData: (data: any) => void;
}

const InvoiceDocument = ({
    invoice,
    editData,
    isEditing,
    updateItem,
    updateTaxRate,
    setEditData
}: InvoiceDocumentProps) => {
    if (!invoice) return null;

    return (
        <div id="invoice-download-content" className="relative bg-white p-12 rounded-lg border-2 border-gray-100 shadow-2xl mx-auto w-full max-w-[800px]  flex flex-col">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <Image src="/bcfloor.png" alt="BCFloor Logo" width={60} height={60} className="object-contain" />
                        <span className="text-2xl font-bold tracking-tight text-gray-900 leading-none">BC Floor plans</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">Invoice Number: <span className="text-gray-900">{invoice.invoice_number}</span></p>
                        <p className="text-sm font-medium text-gray-600">Date: <span className="text-gray-900">{new Date(invoice.issued_at || invoice.created_at).toLocaleDateString()}</span></p>
                        <div className="mt-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${invoice.status === 'paid' ? 'bg-[#6BAE41]/10 text-[#6BAE41]' :
                                invoice.status === 'void' ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-orange-600'
                                }`}>
                                {invoice.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-12 right-0 flex items-stretch gap-1.5">
                    <div className="admin-bg w-1"></div>
                    <div className="admin-bg w-3"></div>
                    <div className="admin-bg text-white px-4 py-1 flex items-center justify-center min-w-[300px] md:min-w-[300px]">
                        <h1 className="text-4xl font-bold uppercase tracking-[0.2em] leading-none">Invoice</h1>
                    </div>
                </div>
            </div>

            <div className="h-px bg-[#4290E9] w-full mb-10 opacity-30"></div>

            {/* Bill From/To Section */}
            <div className="grid grid-cols-1 gap-20 mb-16 px-4">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#4290E9] mb-4">Bill To:</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p className="font-bold text-gray-900">{invoice.agent?.first_name} {invoice.agent?.last_name}</p>
                        <p className="flex items-center gap-2 px-1"><MapPin size={14} className="text-[#4290E9]" /> {invoice.order?.property?.address}, {invoice.order?.property?.city}, {invoice.order?.property?.province}</p>
                        <p className="flex items-center gap-2 px-1"><Mail size={14} className="text-[#4290E9]" /> {invoice.agent?.email}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="flex-grow">
                <table className="w-full">
                    <thead>
                        <tr className="border-t-2 border-[#4290E9] border-opacity-30 text-[10px] font-bold uppercase text-gray-500">
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
                                                    <span className="text-[10px] text-[#4290E9] font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 min-w-fit">
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
            </div>

            {/* Footer Totals */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-end">
                <div className="max-w-xs flex-grow mr-10">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#4290E9] mb-4">Notes:</h4>
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
                        <span className="font-bold text-gray-900">${parseFloat(isEditing ? editData.subtotal : invoice.subtotal).toFixed(2)}</span>
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
                            ) : `(${invoice.tax_rate}%)`}:
                        </span>
                        <span className="font-bold text-gray-900">${parseFloat(isEditing ? editData.tax_amount : invoice.tax_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center admin-bg p-4 text-white rounded-sm mt-6">
                        <span className=" font-bold uppercase tracking-[0.1em]">Total</span>
                        <span className="text-xl font-bold">$ {parseFloat(isEditing ? editData.total : invoice.total).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDocument;
