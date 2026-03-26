'use client'
import React from 'react'
import { MapPin, Mail } from 'lucide-react'

interface InvoicePdfDocumentProps {
    invoice: any;
    roleSettings: any;
}

const InvoicePdfDocument = ({ invoice, roleSettings }: InvoicePdfDocumentProps) => {
    if (!invoice) return null;
    const settings = roleSettings || { pageTabColor: '#000', pageBg: '#fff' };

    return (
        <div id="invoice-pdf-content" className="bg-white p-12 mx-auto font-alexandria text-gray-900 flex flex-col" style={{ width: '800px', minHeight: '1123px' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 h-[60px]">
                        <img src="/bcfloor.png" alt="Logo" className="w-[60px] h-[60px] object-contain" crossOrigin="anonymous" />
                        <span className="text-2xl font-bold tracking-tight leading-none pt-1">BC Floor plans</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600">Invoice Number: <span className="text-gray-900">{invoice.invoice_number}</span></p>
                        <p className="text-sm font-medium text-gray-600">Date: <span className="text-gray-900">{new Date(invoice.issued_at || invoice.created_at).toLocaleDateString()}</span></p>
                        
                        <div className="mt-3">
                            <span 
                                className="inline-block px-4 pt-[6px] pb-[3px] text-[10px] font-bold uppercase rounded-full leading-none tracking-wider"
                                style={{
                                    backgroundColor: (invoice.status?.toLowerCase() === 'paid') ? '#6BAE411A' : (invoice.status?.toLowerCase() === 'draft') ? '#FFEDD5' : '#DBEAFE',
                                    color: (invoice.status?.toLowerCase() === 'paid') ? '#6BAE41' : (invoice.status?.toLowerCase() === 'draft') ? '#EA580C' : '#2563EB',
                                }}
                            >
                                {invoice.status || 'UNPAID'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-stretch gap-1.5 -mr-12 h-[80px]">
                    <div className="w-1" style={{ backgroundColor: settings.pageTabColor }}></div>
                    <div className="w-3" style={{ backgroundColor: settings.pageTabColor }}></div>
                    <div className="px-10 flex items-center justify-center min-w-[300px]" style={{ backgroundColor: settings.pageTabColor }}>
                        <span className="text-4xl font-bold uppercase tracking-[0.2em] text-white leading-none">
                            Invoice
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-0.5 w-full mb-10 opacity-30 shrink-0" style={{ backgroundColor: settings.pageTabColor }}></div>

            {/* Bill Info */}
            <div className="grid grid-cols-2 gap-10 mb-16 px-4">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: settings.pageTabColor }}>
                        Bill From:
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                        <p className="font-bold text-gray-900 pb-1">BC Floor plans</p>
                        <div className="flex items-start gap-2">
                            <Mail size={14} className="shrink-0 mt-0.5" style={{ color: settings.pageTabColor }} />
                            <span className="leading-snug">info@bcfloorplans.com</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: settings.pageTabColor }}>
                        Bill To:
                    </h3>
                    <div className="space-y-3 text-sm text-gray-600">
                        {invoice.vendor ? (
                            <>
                                <div>
                                    <p className="font-bold text-gray-900 mb-0.5">{invoice.vendor.first_name} {invoice.vendor.last_name}</p>
                                    {(invoice.vendor.company?.name || invoice.vendor.company_name) && <p className="mb-1">{invoice.vendor.company?.name || invoice.vendor.company_name}</p>}
                                </div>
                                <div className="flex items-start gap-2">
                                    <Mail size={14} className="shrink-0 mt-0.5" style={{ color: settings.pageTabColor }} />
                                    <span className="leading-snug">{invoice.vendor.email}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="font-bold text-gray-900 mb-1">{invoice.agent?.first_name} {invoice.agent?.last_name}</p>
                                <div className="flex items-start gap-2">
                                    <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: settings.pageTabColor }} />
                                    <span className="leading-snug">{invoice.order?.property?.address}, {invoice.order?.property?.city}, {invoice.order?.property?.province}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Mail size={14} className="shrink-0 mt-0.5" style={{ color: settings.pageTabColor }} />
                                    <span className="leading-snug">{invoice.agent?.email}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="mb-12 flex-grow">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-t-2 border-b border-opacity-30 border-gray-200 text-xs text-gray-500 uppercase tracking-wider" style={{ borderTopColor: settings.pageTabColor }}>
                            <th className="py-4 px-4 text-left font-bold w-1/2">Item</th>
                            <th className="py-4 px-4 text-center font-bold">Quantity</th>
                            <th className="py-4 px-4 text-right font-bold w-1/4">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(invoice.items || invoice.lines || []).map((item: any, idx: number) => {
                            const desc = item.description || item.title;
                            const qty = item.quantity || 1;
                            const amt = item.amount || (parseFloat(item.unit_price) * qty);
                            const serviceOption = item.order_service?.option?.title || item.orderService?.option?.title;

                            return (
                                <tr key={idx}>
                                    <td className="py-4 px-4">
                                        <div className="font-medium text-gray-900 block">{desc}</div>
                                        {serviceOption && (
                                            <div className="mt-2 block">
                                                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-opacity-20 leading-none"
                                                      style={{ color: settings.pageTabColor, backgroundColor: `${settings.pageTabColor}10`, borderColor: settings.pageTabColor }}>
                                                    {serviceOption}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-center text-gray-700">{qty}</td>
                                    <td className="py-4 px-4 text-right font-medium text-gray-900">
                                        ${parseFloat(amt || '0').toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Notes & Totals */}
            <div className="flex justify-between items-end shrink-0 pt-8 border-t border-gray-100">
                <div className="w-1/2 pr-8">
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: settings.pageTabColor }}>Notes:</h4>
                    <p className="text-[10px] text-gray-400 italic leading-relaxed">
                        {invoice.notes || 'Payment is due within 30 days of issuance. Please include the invoice number with your payment. Thank you for your business!'}
                    </p>
                </div>
                <div className="w-[300px] space-y-3">
                    <div className="flex justify-between text-sm px-4">
                        <span className="text-gray-500 font-medium uppercase text-xs">Subtotal:</span>
                        <span className="font-bold text-gray-900">${parseFloat(invoice.subtotal || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm px-4">
                        <span className="text-gray-500 font-medium uppercase text-xs">
                            Tax ({invoice.tax_rate || 0}%):
                        </span>
                        <span className="font-bold text-gray-900">${parseFloat(invoice.tax_amount || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 text-white rounded mt-4" style={{ backgroundColor: settings.pageTabColor }}>
                        <span className="font-bold uppercase tracking-widest">Total</span>
                        <span className="text-xl font-bold">${parseFloat(invoice.total || invoice.total_amount || '0').toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default InvoicePdfDocument;
