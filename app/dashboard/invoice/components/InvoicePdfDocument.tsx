'use client'
import React from 'react'
import Image from 'next/image'
import { MapPin, Mail } from 'lucide-react'
import { useOrganization } from '@/app/context/OrganizationContext'
import { useOptionalWhiteLabel } from '@/app/context/Whitelabel'

interface InvoicePdfDocumentProps {
    invoice: any;
    roleSettings: any;
}

const InvoicePdfDocument = ({ invoice, roleSettings }: InvoicePdfDocumentProps) => {
    const { organization } = useOrganization()
    const currentOrg = organization as any;
    const whiteLabelContext = useOptionalWhiteLabel()
    const organizations = whiteLabelContext?.organizations || []

    if (!invoice) return null;
    const settings = roleSettings || { pageTabColor: '#000', pageBg: '#fff' };

    // Find the organization specifically associated with this invoice
    const invoiceOrg = organizations.find((org: any) => 
        org.id === invoice.organization_id || 
        org.uuid === invoice.organization_id || 
        org.uuid === invoice.organization_uuid
    ) as any;

    const invOrg = invoice.organization as any;

    const orgName = invoiceOrg?.name || invOrg?.name || currentOrg?.name || "BC Floor plans";
    const orgEmail = invoiceOrg?.contact_email || invoiceOrg?.from_email || invOrg?.contact_email || invOrg?.from_email || currentOrg?.contact_email || currentOrg?.from_email || "info@bcfloorplans.com";
    
    // Attempt to extract logo from all possible nested structures
    const orgWlsLogo = invoiceOrg?.white_label_styles?.admin?.logo || invoiceOrg?.white_label_styles?.vendor?.logo || invoiceOrg?.white_label_styles?.agent?.logo;
    const invoiceOrgWlsLogo = invOrg?.white_label_styles?.admin?.logo || invOrg?.white_label_styles?.vendor?.logo || invOrg?.white_label_styles?.agent?.logo;
    const companyLogoUrl = invoiceOrg?.company_logos_urls?.find((l: any) => l.type === 'primary_logo')?.url || invoiceOrg?.company_logos_urls?.[0]?.url || invOrg?.company_logos_urls?.find((l: any) => l.type === 'primary_logo')?.url || invOrg?.company_logos_urls?.[0]?.url;

    let logoUrl = companyLogoUrl || invoiceOrg?.logo_url || invoiceOrg?.logo || invoiceOrg?.branding?.logo || orgWlsLogo || 
                  invOrg?.logo_url || invOrg?.logo || invOrg?.branding?.logo || invoiceOrgWlsLogo || 
                  settings?.logo || currentOrg?.branding?.logo;

    // Only fallback to BCF logo if no organization logo is found and the organization is BC Floor plans, 
    // or if the logo explicitly falls back
    const isBcf = orgName.toLowerCase().includes("bcf") || orgName.toLowerCase().includes("bc floor plans");
    if (!logoUrl && isBcf) {
        logoUrl = "/bcfloor.png";
    }

    return (
        <div id="invoice-pdf-content" className="bg-white p-12 mx-auto font-alexandria text-gray-900 flex flex-col" style={{ width: '800px', minHeight: '1123px' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 h-[60px]">
                        {logoUrl && (
                            <Image 
                                src={logoUrl} 
                                alt="Logo" 
                                width={60} 
                                height={60} 
                                className="object-contain" 
                                crossOrigin="anonymous" 
                                unoptimized
                            />
                        )}
                        <span className="text-2xl font-bold tracking-tight leading-none pt-1">{orgName}</span>
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
                        <p className="font-bold text-gray-900 pb-1">{invoice.org_details?.name || invoice.org_name || orgName}</p>
                        <div className="flex items-start gap-2">
                            <Mail size={14} className="shrink-0 mt-0.5" style={{ color: settings.pageTabColor }} />
                            <span className="leading-snug">{invoice.org_details?.email || invoice.org_email || orgEmail}</span>
                        </div>
                        {invoice.org_details?.phone && <p className="text-xs">{invoice.org_details.phone}</p>}
                        {invoice.org_details?.address && <p className="text-xs text-gray-500">{invoice.org_details.address}</p>}
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: settings.pageTabColor }}>
                        Bill To:
                    </h3>
                    <div className="space-y-3 text-sm text-gray-600">
                        {(invoice.vendor || invoice.vendor_details) ? (
                            <>
                                <div>
                                    <p className="font-bold text-gray-900 mb-0.5">
                                        {invoice.vendor_details?.name || (invoice.vendor_details?.first_name ? `${invoice.vendor_details.first_name} ${invoice.vendor_details.last_name || ''}` : '') || (invoice.vendor ? `${invoice.vendor.first_name} ${invoice.vendor.last_name}` : '')}
                                    </p>
                                    {(invoice.vendor_details?.company_name || invoice.vendor?.company?.name || invoice.vendor?.company_name) && (
                                        <p className="mb-1">{invoice.vendor_details?.company_name || invoice.vendor?.company?.name || invoice.vendor?.company_name}</p>
                                    )}
                                </div>
                                {(invoice.vendor_details?.email || invoice.vendor?.email) && (
                                    <div className="flex items-start gap-2">
                                        <Mail size={14} className="shrink-0 mt-0.5" style={{ color: settings.pageTabColor }} />
                                        <span className="leading-snug">{invoice.vendor_details?.email || invoice.vendor?.email}</span>
                                    </div>
                                )}
                                {invoice.vendor_details?.address && <p className="text-xs text-gray-500">{invoice.vendor_details.address}</p>}
                                {(invoice.tax_number || invoice.vendor_details?.tax_number || invoice.vendor?.tax_number || invoice.vendor?.settings?.tax_number) && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: settings.pageTabColor }}>Tax ID:</span>
                                        <span className="text-[10px] leading-snug">{invoice.tax_number || invoice.vendor_details?.tax_number || invoice.vendor?.tax_number || invoice.vendor?.settings?.tax_number}</span>
                                        {(invoice.tax_type || invoice.vendor_details?.tax_type) && <span className="text-[10px] text-gray-500">({invoice.tax_type || invoice.vendor_details?.tax_type})</span>}
                                    </div>
                                )}
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
                            <th className="py-4 px-4 text-left font-bold w-[70%]">Item</th>
                            <th className="py-4 px-4 text-center font-bold w-[12%]">Quantity</th>
                            <th className="py-4 px-4 text-right font-bold w-[18%]">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(invoice.items || invoice.lines || []).map((item: any, idx: number) => {
                            const desc = item.description || item.title;
                            const qty = item.quantity || 1;
                            const amt = item.amount || (parseFloat(item.unit_price) * qty);
                            const serviceOption = item.order_service?.option?.title || item.orderService?.option?.title;
                            const gstEnabled = item.gst_enabled !== undefined ? Boolean(item.gst_enabled) : true;
                            const pstEnabled = item.pst_enabled !== undefined ? Boolean(item.pst_enabled) : false;

                            return (
                                <tr key={idx}>
                                    <td className="py-4 px-4">
                                        <div className="font-medium text-gray-900 block whitespace-pre-line leading-relaxed">{desc}</div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            {serviceOption && (
                                                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-opacity-20 leading-none"
                                                      style={{ color: settings.pageTabColor, backgroundColor: `${settings.pageTabColor}10`, borderColor: settings.pageTabColor }}>
                                                    {serviceOption}
                                                </span>
                                            )}
                                            {(item.item_status === "paid" || item.is_paid) && (
                                                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 leading-none">
                                                    Paid
                                                </span>
                                            )}
                                            {item.item_status === "refunded" && (
                                                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-300 leading-none">
                                                    Refunded
                                                </span>
                                            )}
                                            {(gstEnabled || pstEnabled) && (
                                                <span className="text-[9px] text-gray-400 font-medium">
                                                    {[gstEnabled && 'GST', pstEnabled && 'PST'].filter(Boolean).join(' + ')}
                                                </span>
                                            )}
                                        </div>
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

                    {/* Tax Breakdown */}
                    {(() => {
                        const taxDetails = invoice.tax_details || {};
                        if (taxDetails && Object.keys(taxDetails).length > 0) {
                            return Object.entries(taxDetails).map(([key, val]: [string, any]) => (
                                <div key={key} className="flex justify-between text-sm px-4">
                                    <span className="text-gray-500 font-medium uppercase text-xs">
                                        {key} ({val?.rate || 0}%):
                                    </span>
                                    <span className="font-bold text-gray-900">${parseFloat(val?.amount || 0).toFixed(2)}</span>
                                </div>
                            ));
                        }

                        return (
                            <div className="flex justify-between text-sm px-4">
                                <span className="text-gray-500 font-medium uppercase text-xs">
                                    {invoice.tax_type || "Tax"} ({invoice.tax_rate || 0}%):
                                </span>
                                <span className="font-bold text-gray-900">${parseFloat(invoice.tax_amount || '0').toFixed(2)}</span>
                            </div>
                        );
                    })()}

                    <div className="flex justify-between items-center p-4 text-white rounded mt-4" style={{ backgroundColor: settings.pageTabColor }}>
                        <span className="font-bold uppercase tracking-widest">Total ({invoice.currency || 'CAD'})</span>
                        <span className="text-xl font-bold">${parseFloat(invoice.total || invoice.total_amount || '0').toFixed(2)} {invoice.currency || 'CAD'}</span>
                    </div>

                    {/* Partial payments */}
                    {parseFloat(invoice.paid_amount || '0') > 0 && (
                        <div className="pt-2 px-4 space-y-1 text-xs">
                            <div className="flex justify-between text-gray-600">
                                <span>Paid:</span>
                                <span className="font-semibold text-green-600">-${parseFloat(invoice.paid_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900">
                                <span>Balance Due:</span>
                                <span className="text-red-600">
                                    ${Math.max(0, parseFloat(invoice.total || '0') - parseFloat(invoice.paid_amount || '0')).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default InvoicePdfDocument;
