"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SaveModal } from "@/components/SaveModal";
import RichTextEditor from "./RichTextEditor";
import { useAppContext } from "@/app/context/AppContext";
import { sendEmailNotification } from "../calendar";
import { 
  fetchGlobalTemplates, 
  interpolateTemplate, 
  prepareTemplateData, 
  EmailTemplate 
} from "@/lib/email-templates";

const fallbackTemplateOptions = [
  { id: "schedule_change", name: "Your upcoming appointment has changed", uuid: "schedule_change" },
];

export const templateHTMLs: Record<string, string> = {
  schedule_change: `
    <h1 style="font-size: 28px; font-weight: 400;">Appointment Change</h1>
    <hr style="border: 0 !important; height: 1px !important; background-color: #CCCCCC !important;" />
    <p style="margin: 24px 0 16px">Hello {agent name},</p>
    <p style="margin-bottom: 16px">
    Due to circumstance beyond our control, we have had to reschedule your
    {service name} at {listing location} with {vendor name}. Please find your new appointment date and time below.
    </p>
    <div className="se-listing" style="padding-left: 50px; padding-right: 50px; margin-bottom: 10px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px">{service name}</h3>
      <p style="margin: 4px 0; color: #d33434 !important; font-weight: bold; font-size: 16px">{schedule date} | {schedule time}</p>
      <p style="margin: 8px 0 0">Vendor: {vendor name}</p>
      <ul style="margin: 4px 0 0; padding-left: 20px">
        <li>{vendor email}</li>
        <li>{vendor number}</li>
      </ul>
    </div>
    <p style="margin-bottom: 16px">If you have any questions or concerns about your schedule change, do not hesitate to reach out to us.</p>
    <p style="margin-bottom: 32px">Kind regards,<br />the Tojuco. Customer Care Team</p>
    <hr style="border: 0 !important; height: 1px !important; background-color: #CCCCCC !important;" />
    <p style="font-size: 12px; color: #777; margin-top: 16px">
        You received this email because you signed up on our website. This is
        an automated email. If you need to get in touch, email us at support@bcfpsoftware.com.
    </p>`,
};

export const templateHTMLs2: Record<string, string> = {
  schedule_change: `
    <h1 style="font-size: 28px; font-weight: 400;">Appointment Change</h1>
    <hr style="border: 0 !important; height: 1px !important; background-color: #CCCCCC !important;" />
    <p style="margin: 24px 0 16px">Hello {vendor name},</p>
    <p style="margin-bottom: 16px">
    Due to circumstance beyond our control, we have had to reschedule your
    {service name} at {listing location}. Please find your new appointment date and time below.
    </p>
    <div className="se-listing" style="padding-left: 50px; padding-right: 50px; margin-bottom: 10px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px">{service name}</h3>
      <p style="margin: 4px 0; color: #d33434 !important; font-weight: bold; font-size: 16px">{schedule date} | {schedule time}</p>
      <p style="margin: 8px 0 0">Agent: {agent name}</p>
    </div>
    <p style="margin-bottom: 16px">If you have any questions or concerns about your schedule change, do not hesitate to reach out to us.</p>
    <p style="margin-bottom: 32px">Kind regards,<br />the Tojuco. Customer Care Team</p>
    <hr style="border: 0 !important; height: 1px !important; background-color: #CCCCCC !important;" />
    <p style="font-size: 12px; color: #777; margin-top: 16px">
        You received this email because you signed up on our website. This is
        an automated email. If you need to get in touch, email us at support@bcfpsoftware.com.
    </p>`,
};

// CoAgent type moved or removed if unused


import type { Order } from "../../orders/page";
import type { VendorData as Vendor } from "@/components/QuickViewCard";
import { AgentData } from "../../agents/page";

type Service = { name?: string };

type Slot = {
  service?: { name?: string; uuid?: string };
  service_id?: string | number;
  service_name?: string;
  vendor?: Vendor;
  date?: string;
  start_time?: string;
  end_time?: string;
};

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  showAgentModal?: boolean;
  setShowAgentModal?: (value: boolean) => void;
  showVendorModal?: boolean;
  setShowVendorModal?: (value: boolean) => void;
  bothSelected: boolean;
  vendorSelected?: boolean;
  setAgentChecked?: (value: boolean) => void;
  setVendorChecked?: (value: boolean) => void;
  order?: Order;
  agent?: AgentData;
  vendor?: Vendor;
  service?: Service;
};

const NotificationModal: React.FC<Props> = ({
  open,
  setOpen,
  showAgentModal,
  setShowAgentModal,
  showVendorModal,
  setShowVendorModal,
  bothSelected,
  setAgentChecked,
  setVendorChecked,
  order,
  agent,
  vendor,
  service,
}) => {
  const { userType } = useAppContext();
  const [selectedAgentTemplate, setSelectedAgentTemplate] = useState<string>("schedule_change");
  const [selectedVendorTemplate, setSelectedVendorTemplate] = useState<string>("schedule_change");
  const [descriptionAgent, setDescriptionAgent] = useState("");
  const [descriptionVendor, setDescriptionVendor] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [openSave, setOpenSave] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [dbTemplates, setDbTemplates] = useState<EmailTemplate[]>([]);

  function formatTime(time: string) {
    if (!time) return "";
    const [h, m] = time.split(":");
    let hour = parseInt(h, 10);
    const min = m;
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${min} ${ampm}`;
  }

  const getSingleServiceSummary = useCallback((slots: Slot[] = []) => {
    if (!slots.length) return null;
    const firstSlot = slots[0];
    const serviceName = service?.name || firstSlot?.service_name || firstSlot?.service?.name || order?.services?.[0]?.service?.name || "";
    const vendorData = firstSlot?.vendor;

    const sorted = [...slots].sort((a, b) => {
      if (!a.date || !b.date || !a.start_time || !b.start_time) return 0;
      if (a.date === b.date) return a.start_time.localeCompare(b.start_time);
      return a.date.localeCompare(b.date);
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first?.date || !first?.start_time || !last?.end_time) return null;

    const allSameDate = sorted.every((s) => s.date === first.date);
    let timeStr = "";
    if (allSameDate) {
      timeStr = `${first.date} | ${formatTime(first.start_time)} - ${formatTime(last.end_time)}`;
    } else {
      timeStr = `${formatTime(first.start_time)} ${first.date} - ${formatTime(last.end_time)} ${last.date}`;
    }
    return { serviceName, vendor: vendorData, timeStr };
  }, [order?.services, service?.name]);

  const fillTemplate = useCallback((template: string) => {
    if (!order) return template;
    const templateData = prepareTemplateData(order, agent, service, vendor);
    const slots = order?.slots || [];
    const summary = getSingleServiceSummary(slots);
    const vendorInfo = summary?.vendor;

    const dataWithContext = {
      ...templateData,
      vendor_name: vendorInfo ? `${vendorInfo.first_name || ""} ${vendorInfo.last_name || ""}`.trim() : templateData.vendor_name,
      vendor_email: vendorInfo?.email || (templateData as any).vendor_email || "",
      vendor_number: vendorInfo?.primary_phone || vendorInfo?.secondary_phone || templateData.vendor_number || "",
      vendor_phone: vendorInfo?.primary_phone || vendorInfo?.secondary_phone || templateData.vendor_phone || "",
      schedule_date: summary?.timeStr?.split(" | ")[1] ? summary?.timeStr?.split(" | ")[0] : templateData.schedule_date,
      schedule_time: summary?.timeStr?.split(" | ")[1] || templateData.schedule_time,
      service_name: summary?.serviceName || templateData.service_name || "",
      action_url: `${window.location.origin}/dashboard/orders/${order.uuid}`,
    };

    return interpolateTemplate(template, dataWithContext);
  }, [order, agent, service, vendor, getSingleServiceSummary]);

  const handleAgentTemplateChange = useCallback((val: string, templatesList: EmailTemplate[] = dbTemplates) => {
    setSelectedAgentTemplate(val);
    const dbMatch = templatesList.find(t => t.uuid === val);
    if (dbMatch) {
      setDescriptionAgent(fillTemplate(dbMatch.content));
    } else {
      const html = templateHTMLs[val];
      if (html) setDescriptionAgent(fillTemplate(html));
    }
  }, [dbTemplates, fillTemplate]);

  const handleVendorTemplateChange = useCallback((val: string, templatesList: EmailTemplate[] = dbTemplates) => {
    setSelectedVendorTemplate(val);
    const dbMatch = templatesList.find(t => t.uuid === val);
    if (dbMatch) {
      setDescriptionVendor(fillTemplate(dbMatch.content));
    } else {
      const html = templateHTMLs2[val];
      if (html) setDescriptionVendor(fillTemplate(html));
    }
  }, [dbTemplates, fillTemplate]);

  useEffect(() => {
    if (open) {
      const loadTemplates = async () => {
        const response = await fetchGlobalTemplates("schedule_change");
        let templates = [];
        if (response?.success) {
          templates = response.data;
          setDbTemplates(templates);
        }

        if (templates.length > 0) {
          const defaultTemplate = templates[0];
          setSelectedAgentTemplate(defaultTemplate.uuid);
          handleAgentTemplateChange(defaultTemplate.uuid, templates);
          setSelectedVendorTemplate(defaultTemplate.uuid);
          handleVendorTemplateChange(defaultTemplate.uuid, templates);
        } else {
          setSelectedAgentTemplate("schedule_change");
          handleAgentTemplateChange("schedule_change", []);
          setSelectedVendorTemplate("schedule_change");
          handleVendorTemplateChange("schedule_change", []);
        }
      };
      loadTemplates();
    }
  }, [open, handleAgentTemplateChange, handleVendorTemplateChange]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return toast.error("Authentication token not found");
      setIsSendingEmails(true);
      const emailPromises: Promise<any>[] = [];

      if (showAgentModal && descriptionAgent) {
        const recipients = new Set<string>();
        if (agent?.email) recipients.add(agent.email);
        
        recipients.forEach(email => {
          emailPromises.push(sendEmailNotification({ to: email, subject: "Order Notification", html: descriptionAgent }, token));
        });
      }

      if (showVendorModal && descriptionVendor) {
        const recipients = new Set<string>();
        if (order?.slots) {
          order.slots.forEach((s: Slot) => { if (s?.vendor?.email) recipients.add(s.vendor.email); });
        }

        recipients.forEach(email => {
          emailPromises.push(sendEmailNotification({ to: email, subject: "Order Notification", html: descriptionVendor }, token));
        });
      }

      if (emailPromises.length === 0) {
        setIsSendingEmails(false);
        return toast.warning("No recipients found.");
      }

      await Promise.all(emailPromises);
      toast.success("Notifications sent successfully");
      setShowConfirmation(true);
    } catch {
      toast.error("Failed to send notifications");
    } finally {
      setIsSendingEmails(false);
    }
  };

  const handleClose = () => {
    setAgentChecked?.(false);
    setVendorChecked?.(false);
    setOpen(false);
  };

  const handleNext = () => { setShowAgentModal?.(false); setShowVendorModal?.(true); };
  const handleOkClick = () => { setShowConfirmation(false); handleClose(); setOpenSave(true); };

  const allTemplateOptions = [
    ...dbTemplates.map((t) => ({ id: t.uuid, name: t.title, uuid: t.uuid })),
    ...fallbackTemplateOptions,
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#FAFAFA] w-[750px] max-w-[750px] max-h-[650px] rounded-[8px] font-alexandria gap-y-3 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={`${userType}-text flex items-center justify-between text-[18px] uppercase font-semibold border-b border-[#E4E4E4] pb-2`}>
            Edit Notification
            <Button onClick={handleClose} className="bg-transparent hover:bg-transparent shadow-none">
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="text-[#666666] text-[16px] font-[400] px-1">
          {showAgentModal && <p>Agent Notification</p>}
          {showVendorModal && <p>Vendor Notification</p>}
        </div>

        {showAgentModal && (
          <Select value={selectedAgentTemplate} onValueChange={(v) => handleAgentTemplateChange(v)}>
            <SelectTrigger className="h-[42px] w-[340px] bg-[#EEEEEE] border-[#BBBBBB]">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {allTemplateOptions.map((o) => (<SelectItem key={o.id} value={o.uuid}>{o.name}</SelectItem>))}
            </SelectContent>
          </Select>
        )}

        {showVendorModal && (
          <Select value={selectedVendorTemplate} onValueChange={(v) => handleVendorTemplateChange(v)}>
            <SelectTrigger className="h-[42px] w-[340px] bg-[#EEEEEE] border-[#BBBBBB]">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {allTemplateOptions.map((o) => (<SelectItem key={o.id} value={o.uuid}>{o.name}</SelectItem>))}
            </SelectContent>
          </Select>
        )}

        {showAgentModal && <RichTextEditor value={descriptionAgent} onChange={setDescriptionAgent} />}
        {showVendorModal && <RichTextEditor value={descriptionVendor} onChange={setDescriptionVendor} />}

        <div className="flex justify-end gap-3 mt-6">
          {bothSelected && showAgentModal ? (
            <Button onClick={handleNext} className={`${userType}-bg text-white w-[140px]`}>Next</Button>
          ) : (
            <Button onClick={handleSave} disabled={isSendingEmails} className={`${userType}-bg text-white w-[140px]`}>
              {isSendingEmails ? "Sending..." : "Save and Exit"}
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} className="w-[140px]">Cancel</Button>
        </div>

        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <AlertDialogContent className="font-alexandria">
            <AlertDialogHeader>
              <AlertDialogTitle>SAVE AND EXIT</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to save and exit? This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowConfirmation(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleOkClick} className="bg-[#4290E9]">OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SaveModal isOpen={openSave} onClose={() => setOpenSave(false)} isSuccess={true} />
      </DialogContent>
    </Dialog>
  );
};

export default NotificationModal;
