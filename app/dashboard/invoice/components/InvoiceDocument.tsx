"use client";
import React from "react";
import Image from "next/image";
import { MapPin, Mail, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/app/context/OrganizationContext";
import { useOptionalWhiteLabel } from "@/app/context/Whitelabel";

interface InvoiceDocumentProps {
  invoice: any;
  editData: any;
  isEditing: boolean;
  updateItem: (index: number, field: string, value: any) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  updateTaxRate: (val: string) => void;
  updateTaxType?: (val: string) => void;
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
  updateTaxType,
  setEditData,
  roleSettings,
}: InvoiceDocumentProps) => {
  const { organization } = useOrganization();
  const currentOrg = organization as any;
  const whiteLabelContext = useOptionalWhiteLabel();
  const organizations = whiteLabelContext?.organizations || [];

  if (!invoice) return null;

  // Default settings if roleSettings is not provided (defensive)
  const settings = roleSettings || { pageTabColor: "#000", pageBg: "#fff" };

  // Find the organization specifically associated with this invoice
  const invoiceOrg = organizations.find(
    (org: any) =>
      org.id === invoice.organization_id ||
      org.uuid === invoice.organization_id ||
      org.uuid === invoice.organization_uuid,
  ) as any;
  console.log("invoiceOrg", invoiceOrg);

  const invOrg = invoice.organization as any;

  const orgName =
    invoiceOrg?.name || invOrg?.name || currentOrg?.name || "BC Floor plans";
  const orgEmail =
    invoiceOrg?.contact_email ||
    invoiceOrg?.from_email ||
    invOrg?.contact_email ||
    invOrg?.from_email ||
    currentOrg?.contact_email ||
    currentOrg?.from_email ||
    "info@bcfloorplans.com";

  // Attempt to extract logo from all possible nested structures
  const orgWlsLogo =
    invoiceOrg?.white_label_styles?.admin?.logo ||
    invoiceOrg?.white_label_styles?.vendor?.logo ||
    invoiceOrg?.white_label_styles?.agent?.logo;
  const invoiceOrgWlsLogo =
    invOrg?.white_label_styles?.admin?.logo ||
    invOrg?.white_label_styles?.vendor?.logo ||
    invOrg?.white_label_styles?.agent?.logo;
  const companyLogoUrl =
    invoiceOrg?.company_logos_urls?.find((l: any) => l.type === "primary_logo")
      ?.url ||
    invoiceOrg?.company_logos_urls?.[0]?.url ||
    invOrg?.company_logos_urls?.find((l: any) => l.type === "primary_logo")
      ?.url ||
    invOrg?.company_logos_urls?.[0]?.url;

  let logoUrl =
    companyLogoUrl ||
    invoiceOrg?.logo_url ||
    invoiceOrg?.logo ||
    invoiceOrg?.branding?.logo ||
    orgWlsLogo ||
    invOrg?.logo_url ||
    invOrg?.logo ||
    invOrg?.branding?.logo ||
    invoiceOrgWlsLogo ||
    settings?.logo ||
    currentOrg?.branding?.logo;
  console.log("logoUrl", logoUrl);

  // Only fallback to BCF logo if no organization logo is found and the organization is BC Floor plans,
  // or if the logo explicitly falls back
  const isBcf =
    orgName.toLowerCase().includes("bcf") ||
    orgName.toLowerCase().includes("bc floor plans");
  if (!logoUrl && isBcf) {
    logoUrl = "/bcfloor.png";
  }

  return (
    <div
      id="invoice-download-content"
      className="relative bg-white p-4 md:p-12 rounded-lg border-2 border-gray-100 shadow-2xl mx-auto w-full max-w-[950px] flex flex-col overflow-x-hidden"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-12 gap-6 md:gap-0">
        <div>
          <div className="flex border-box items-center gap-3 mb-4 md:mb-6">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt="Organization Logo"
                width={60}
                height={60}
                className="object-contain"
              />
            )}
            <span className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-normal mb-0 pb-0">
              {orgName}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs md:text-sm font-medium text-gray-600">
              Invoice Number:{" "}
              <span className="text-gray-900">#{invoice.invoice_number}</span>
            </p>
            <p className="text-xs md:text-sm font-medium text-gray-600">
              Date:{" "}
              <span className="text-gray-900">
                {new Date(
                  invoice.issued_at || invoice.created_at,
                ).toLocaleDateString()}
              </span>
            </p>
            <div className="mt-2">
              {(() => {
                const status = (invoice.status || "unpaid").toLowerCase();
                const statusStyles: Record<string, string> = {
                  paid: "bg-[#6BAE41]/10 text-[#6BAE41]",
                  issued: "bg-blue-100 text-blue-600",
                  unpaid: "bg-orange-100 text-orange-600",
                  void: "bg-gray-100 text-gray-400",
                  partial: "bg-yellow-100 text-yellow-600",
                  refunded: "bg-red-100 text-red-600",
                };
                return (
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] leading-normal font-bold uppercase ${statusStyles[status] || statusStyles.unpaid}`}
                  >
                    {status}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
        <div className="relative md:absolute md:top-12 right-0 flex items-stretch gap-1 md:gap-1.5 self-stretch md:self-auto">
          <div
            style={{ backgroundColor: settings.pageTabColor }}
            className="w-1"
          ></div>
          <div
            style={{ backgroundColor: settings.pageTabColor }}
            className="w-2 md:w-3"
          ></div>
          <div
            style={{ backgroundColor: settings.pageTabColor }}
            className="text-white px-4 md:px-6 py-2 md:py-3 flex items-center justify-center min-w-[150px] md:min-w-[300px] flex-grow md:flex-grow-0"
          >
            <h1
              className="text-xl md:text-[32px] font-bold uppercase tracking-wider"
              style={{ lineHeight: "1.2" }}
            >
              Invoice
            </h1>
          </div>
        </div>
      </div>

      <div
        className="h-px w-full mb-6 md:mb-10 opacity-30"
        style={{ backgroundColor: settings.pageTabColor }}
      ></div>

      {/* Bill From/To Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-8 md:mb-16 px-2 md:px-4">
        <div>
          <h3
            className="text-xs font-bold uppercase tracking-widest mb-2 md:mb-4"
            style={{ color: settings.pageTabColor }}
          >
            Bill From:
          </h3>
          <div className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-600">
            <p className="font-bold text-gray-900">{orgName}</p>
            <p>{orgEmail}</p>
          </div>
        </div>
        <div>
          <h3
            className="text-xs font-bold uppercase tracking-widest mb-2 md:mb-4"
            style={{ color: settings.pageTabColor }}
          >
            Bill To:
          </h3>
          <div className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-600">
            {invoice.vendor ? (
              <>
                <p className="font-bold text-gray-900">
                  {invoice.vendor.first_name} {invoice.vendor.last_name}
                </p>
                {(invoice.vendor.company?.name ||
                  invoice.vendor.company_name) && (
                  <p>
                    {invoice.vendor.company?.name ||
                      invoice.vendor.company_name}
                  </p>
                )}
                <p className="flex items-center gap-2 px-1">
                  <Mail
                    size={14}
                    className="shrink-0"
                    style={{ color: settings.pageTabColor }}
                  />{" "}
                  <span>{invoice.vendor.email}</span>
                </p>
                {(invoice.tax_number ||
                  invoice.vendor.tax_number ||
                  invoice.vendor.settings?.tax_number) && (
                  <p className="flex items-center gap-2 px-1 text-[10px] md:text-xs">
                    <span
                      className="font-semibold"
                      style={{ color: settings.pageTabColor }}
                    >
                      Tax ID:
                    </span>
                    <span>
                      {invoice.tax_number ||
                        invoice.vendor.tax_number ||
                        invoice.vendor.settings?.tax_number}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-bold text-gray-900">
                  {invoice.agent?.first_name} {invoice.agent?.last_name}
                </p>
                <p className="flex items-start gap-2 px-1">
                  <MapPin
                    size={14}
                    className="shrink-0 mt-0.5"
                    style={{ color: settings.pageTabColor }}
                  />{" "}
                  <span>
                    {invoice.order?.property?.address},{" "}
                    {invoice.order?.property?.city},{" "}
                    {invoice.order?.property?.province}
                  </span>
                </p>
                <p className="flex items-center gap-2 px-1">
                  <Mail
                    size={14}
                    className="shrink-0"
                    style={{ color: settings.pageTabColor }}
                  />{" "}
                  <span>{invoice.agent?.email}</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-grow w-full">
        <table className="w-full block md:table">
          <thead className="hidden md:table-header-group">
            <tr
              className="border-t-2 border-opacity-30 text-[10px] font-bold uppercase text-gray-500"
              style={{ borderColor: settings.pageTabColor }}
            >
              <th className="py-3 md:py-4 text-left px-2 md:px-4 w-[60%]">
                Item
              </th>
              <th className="py-3 md:py-4 text-left w-[15%]">Quantity</th>
              <th className="py-3 md:py-4 text-left px-2 md:px-4 w-[25%]">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group divide-y-0 md:divide-y md:divide-gray-100 italic-text-container">
            {(isEditing ? editData.items : invoice.items || []).map(
              (item: any, idx: number) => {
                const serviceOption =
                  item.order_service?.option?.title ||
                  item.orderService?.option?.title;
                return (
                  <tr
                    key={idx}
                    className="group hover:bg-gray-50 transition-colors block md:table-row border border-[#EBEBEB] md:border-0 md:border-b md:border-gray-100 rounded-[8px] md:rounded-none bg-[#F8F9FA] md:bg-transparent p-3 md:p-0 mb-3 md:mb-0"
                  >
                    {/* Mobile layout wrapper - only visible on mobile */}
                    <td className="md:hidden block w-full">
                      <div className="flex flex-col gap-2 w-full">
                        {/* Top row: Description and Option */}
                        <div className="flex justify-between items-start w-full gap-2">
                          <div className="flex-grow">
                            {isEditing ? (
                              <Textarea
                                value={item.description}
                                onChange={(e) =>
                                  updateItem(idx, "description", e.target.value)
                                }
                                className="font-medium text-gray-900 min-h-[90px] w-full text-sm bg-white p-2 leading-relaxed resize-y"
                                rows={4}
                                placeholder="Item description"
                              />
                            ) : (
                              <span className="font-bold text-gray-900 text-sm leading-relaxed block whitespace-pre-line">
                                {item.description}
                              </span>
                            )}
                            {serviceOption && (
                              <span
                                className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-white"
                                style={{
                                  color: settings.pageTabColor,
                                  borderColor: `${settings.pageTabColor}33`,
                                }}
                              >
                                {serviceOption}
                              </span>
                            )}
                          </div>
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 bg-white"
                              onClick={() => removeItem(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Bottom row: Qty, Rate, Total Amount */}
                        <div className="flex justify-between items-end w-full mt-1 bg-white p-2.5 rounded-[6px] border border-[#EEEEEE] shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                Qty
                              </span>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(idx, "quantity", e.target.value)
                                  }
                                  className="w-14 text-center h-7 text-xs"
                                />
                              ) : (
                                <span className="text-sm font-semibold text-gray-700">
                                  {item.quantity}
                                </span>
                              )}
                            </div>
                            {isEditing && (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                  Rate
                                </span>
                                <Input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) =>
                                    updateItem(
                                      idx,
                                      "unit_price",
                                      e.target.value,
                                    )
                                  }
                                  className="w-20 text-right h-7 text-xs font-black"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                              Amount
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {isEditing
                                ? `$${Number(item.quantity * item.unit_price || 0).toFixed(2)}`
                                : `$${Number(item.amount || 0).toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Desktop layout wrapper - hidden on mobile */}
                    <td className="hidden md:table-cell py-3 md:py-4 px-2 md:px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-2 flex-wrap">
                          {isEditing ? (
                            <Textarea
                              value={item.description}
                              onChange={(e) =>
                                updateItem(idx, "description", e.target.value)
                              }
                              className="font-medium text-gray-900 min-h-[90px] flex-grow text-xs md:text-sm bg-white p-2 leading-relaxed resize-y"
                              rows={4}
                            />
                          ) : (
                            <span className="font-medium text-gray-900 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                              {item.description}
                            </span>
                          )}
                          {serviceOption && (
                            <span
                              className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border min-w-fit"
                              style={{
                                color: settings.pageTabColor,
                                backgroundColor: `${settings.pageTabColor}1A`,
                                borderColor: `${settings.pageTabColor}33`,
                              }}
                            >
                              {serviceOption}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-3 md:py-4 text-center text-gray-700 font-medium text-xs md:text-sm">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, "quantity", e.target.value)
                          }
                          className="w-full  text-center h-8"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="hidden md:table-cell py-3 md:py-4 text-right font-medium text-gray-900 px-2 md:px-4 text-xs md:text-sm">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-400">Rate:</span>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(idx, "unit_price", e.target.value)
                            }
                            className="w-full  text-right h-8 font-black"
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
                        `$${parseFloat(item.amount || "0").toFixed(2)}`
                      )}
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>

        {isEditing && (
          <div className="mt-4 flex justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              className="bg-white hover:brightness-95 flex items-center gap-2 border-[1px]"
              style={{
                color: settings.pageTabColor,
                borderColor: settings.pageTabColor,
              }}
            >
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>
        )}
      </div>

      {/* Footer Totals */}
      <div className="mt-6 md:mt-12 pt-4 md:pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-stretch md:items-end gap-6 md:gap-0">
        <div className="max-w-xs flex-grow mr-0 md:mr-10">
          <h4
            className="text-xs font-bold uppercase tracking-widest mb-2 md:mb-4"
            style={{ color: settings.pageTabColor }}
          >
            Notes:
          </h4>
          {isEditing ? (
            <Textarea
              value={editData.notes || ""}
              onChange={(e) =>
                setEditData({ ...editData, notes: e.target.value })
              }
              className="text-[10px] text-gray-600 h-20"
              placeholder="Add notes..."
            />
          ) : (
            <p className="text-[10px] text-gray-400 leading-relaxed italic">
              {invoice.notes ||
                "Payment is due within 30 days of issuance. Please include the invoice number with your payment. Thank you for your business!"}
            </p>
          )}
        </div>
        <div className="w-full md:w-80 space-y-2 md:space-y-3">
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px] md:text-xs">
              Subtotal:
            </span>
            <span className="font-bold text-gray-900">
              $
              {parseFloat(
                isEditing ? editData.subtotal : invoice.subtotal || "0",
              ).toFixed(2)}
            </span>
          </div>
          {/* Travel Compensation row — shown when travel_amount > 0 */}
          {(() => {
            const travelAmt = parseFloat(
              isEditing
                ? (editData.travel_amount ??
                    editData.items?.find((i: any) => i.type === "travel")
                      ?.amount ??
                    0)
                : (invoice.travel_amount ?? 0),
            );
            return travelAmt > 0 ? (
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px] md:text-xs">
                  Travel:
                </span>
                <span className="font-bold text-gray-900">
                  ${travelAmt.toFixed(2)}
                </span>
              </div>
            ) : null;
          })()}
          {isEditing ? (
            <div className="flex flex-col w-full">
              <div className="flex justify-between text-xs md:text-sm items-center w-full">
                <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px] md:text-xs">
                  {updateTaxType ? (
                    <Input
                      value={editData.tax_type || "Tax"}
                      onChange={(e) => updateTaxType(e.target.value)}
                      className="w-24 h-6 inline-block mr-1 py-0 px-1 text-xs"
                    />
                  ) : (
                    editData.tax_type || "Tax Rate"
                  )}
                  <Input
                    type="number"
                    value={editData.tax_rate}
                    onChange={(e) => updateTaxRate(e.target.value)}
                    className="w-16 h-6 inline-block ml-1 py-0 px-1 text-right"
                  />
                  %:
                </span>
                <span className="font-bold text-gray-900">
                  ${parseFloat(editData.tax_amount || "0").toFixed(2)}
                </span>
              </div>
              {editData.tax_snapshot &&
                editData.tax_snapshot.is_registered &&
                editData.tax_snapshot.taxes?.length > 0 && (
                  <div className="pl-4 border-l-2 border-indigo-100 mt-1 mb-2">
                    {editData.tax_snapshot.taxes.map((t: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between text-[10px] md:text-xs text-gray-400"
                      >
                        <span>
                          {t.name} ({t.rate}%):
                        </span>
                        <span>
                          $
                          {(
                            (parseFloat(editData.subtotal || 0) * t.rate) /
                            100
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              {editData.tax_snapshot &&
                !editData.tax_snapshot.is_registered && (
                  <div className="text-[10px] md:text-xs text-gray-400 mt-1 mb-2 text-right">
                    Vendor not registered for tax
                  </div>
                )}
            </div>
          ) : (
            <div className="flex flex-col w-full gap-2">
              {invoice.tax_snapshot && invoice.tax_snapshot.is_registered ? (
                <>
                  {invoice.tax_snapshot.taxes?.map((t: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs md:text-sm items-center"
                    >
                      <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px] md:text-xs">
                        {t.name} ({t.rate}%):
                      </span>
                      <span className="font-bold text-gray-900">
                        $
                        {(
                          (parseFloat(invoice.subtotal || 0) * t.rate) /
                          100
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {(!invoice.tax_snapshot?.taxes ||
                    invoice.tax_snapshot.taxes.length === 0) && (
                    <div className="flex justify-between text-xs md:text-sm items-center">
                      <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px] md:text-xs">
                        {invoice.tax_type || "Tax"} ({invoice.tax_rate || 0}%):
                      </span>
                      <span className="font-bold text-gray-900">
                        ${parseFloat(invoice.tax_amount || "0").toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              ) : invoice.tax_snapshot &&
                !invoice.tax_snapshot.is_registered ? (
                <div className="flex justify-between text-xs md:text-sm items-center">
                  <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px] md:text-xs">
                    Tax (Not Registered):
                  </span>
                  <span className="font-bold text-gray-900">$0.00</span>
                </div>
              ) : (
                <div className="flex justify-between text-xs md:text-sm items-center">
                  <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px] md:text-xs">
                    {invoice.tax_type || "Tax"} ({invoice.tax_rate || 0}%):
                  </span>
                  <span className="font-bold text-gray-900">
                    ${parseFloat(invoice.tax_amount || "0").toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
          <div
            className="flex justify-between items-center px-4 md:px-5 py-3 md:py-4 text-white rounded-sm mt-4 md:mt-6"
            style={{ backgroundColor: settings.pageTabColor }}
          >
            <span className="font-bold uppercase tracking-wider text-xs md:text-sm leading-normal">
              Total
            </span>
            <span className="text-base md:text-xl font-bold leading-normal">
              ${" "}
              {parseFloat(
                isEditing
                  ? editData.total
                  : invoice.total || invoice.total_amount || "0",
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDocument;
