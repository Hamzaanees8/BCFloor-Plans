"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WarningIcon, {
  DropDownArrow,
} from "@/components/Icons";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GetUser } from "../../orders/orders";
import { SaveModal } from "@/components/SaveModal";
import RichTextEditor from "./RichTextEditor";
import { useAppContext } from "@/app/context/AppContext";
const templateOptions = [{ id: "schedule_change", name: "Schedule Change" }];
export const templateHTMLs: Record<string, string> = {
  schedule_change: `
    <h1 style="font-size: 28px; font-weight: 400;">Appointment Change</h1>
   <hr style="border: 0 !important; height: 1px !important; background-color: #CCCCCC !important;" />
    <p style="margin: 24px 0 16px">
    Hello {agent name},
    </p>
 
    <p style="margin-bottom: 16px">
    Due to circumstance beyond our control, we have had to reschedule your
    {service name} at {listing location} with {vendor name} on April 19,
    2025. Please find your new appointment date and time below.
    </p>
 
    <div
    className="se-listing"
  style="
    padding-left: 50px;
    padding-right: 50px;
    margin-bottom: 10px;
  "
>
  <h3 style="margin: 0 0 8px 0; font-size: 18px">
    Standard Still Photos
  </h3>
  <p
    style="margin: 4px 0; color: #d33434 !important; font-weight: bold; font-size: 16px"
  >
    April 23, 2025 | 5:00 PM - 6:00 PM
  </p>
  <p style="margin: 8px 0 0">
    Vendor: { vendor name }
  </p>
  <ul style="margin: 4px 0 0; padding-left: 20px">
    <li>mail@bcfloorplans.com</li>
    <li>(604) 788-7834</li>
    <li>8988 Fraserton Ct #309B, Burnaby, BC V5J 4H8</li>
  </ul>
</div>

 
    <p style="margin-bottom: 16px">
        If you have any questions or concerns about your schedule change, do
        not hesitate to reach out to us.
    </p>
 
    <p style="margin-bottom: 32px">
        Kind regards,<br />
        the Tojuco. Customer Care Team
    </p>
 
<hr style="border: 0 !important; height: 1px !important; background-color: #CCCCCC !important;" />
    <p style="font-size: 12px; color: #777; margin-top: 16px">
        You received this email because you signed up on our website. This is
        an automated email. If you need to get in touch, email us at
        support@bcfpsoftware.com.
        <a href="#" style="color: #337ab7">Unsubscribe</a>
    </p>`,
};
export const templateHTMLs2: Record<string, string> = {
  schedule_change: `
    <h1 style="font-size: 28px; font-weight: 400;">Appointment Change</h1>
   <hr style="border: 0 !important; height: 1px !important; background-color: #CCCCCC !important;" />
    <p style="margin: 24px 0 16px">
    Hello {vendor name},
    </p>
 
    <p style="margin-bottom: 16px">
    Due to circumstance beyond our control, we have had to reschedule your
    {service name} at {listing location} on April 19,
    2025. Please find your new appointment date and time below.
    </p>
 
    <div
    className="se-listing"
  style="
    padding-left: 50px;
    padding-right: 50px;
    margin-bottom: 10px;
  "
>
  <h3 style="margin: 0 0 8px 0; font-size: 18px">
    Standard Still Photos
  </h3>
  <p
    style="margin: 4px 0; color: #d33434 !important; font-weight: bold; font-size: 16px"
  >
    April 23, 2025 | 5:00 PM - 6:00 PM
  </p>
  <p style="margin: 8px 0 0">
    Agent: { agent name }
  </p>
  <ul style="margin: 4px 0 0; padding-left: 20px">
    <li>mail@bcfloorplans.com</li>
    <li>(604) 788-7834</li>
    <li>8988 Fraserton Ct #309B, Burnaby, BC V5J 4H8</li>
  </ul>
</div>

 
    <p style="margin-bottom: 16px">
        If you have any questions or concerns about your schedule change, do
        not hesitate to reach out to us.
    </p>
 
    <p style="margin-bottom: 32px">
        Kind regards,<br />
        the Tojuco. Customer Care Team
    </p>
 
<hr style="border: 0 !important; height: 1px !important; background-color: #CCCCCC !important;" />
    <p style="font-size: 12px; color: #777; margin-top: 16px">
        You received this email because you signed up on our website. This is
        an automated email. If you need to get in touch, email us at
        support@bcfpsoftware.com.
        <a href="#" style="color: #337ab7">Unsubscribe</a>
    </p>`,
};
type CoAgent = {
  name: string;
  email: string;
  primary_phone?: string;
  split?: string;
  percentage?: number;
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
}) => {
  const { userType } = useAppContext();
  const [selectedAgentTemplate, setSelectedAgentTemplate] =
    useState<string>("schedule_change");
  const [selectedVendorTemplate, setSelectedVendorTemplate] =
    useState<string>("schedule_change");
  const [descriptionAgent, setDescriptionAgent] = useState("");
  const [descriptionVendor, setDescriptionVendor] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [openSave, setOpenSave] = useState(false);
  const [openAddCoAgentDialog, setOpenAddCoAgentDialog] = useState(false);
  const [coAgentEmail, setCoAgentEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [coAgents, setCoAgents] = useState<CoAgent[]>([]);
  const [draftCoAgents, setDraftCoAgents] = useState<typeof coAgents>([]);
  const [coAgentEmailVendor, setCoAgentEmailVendor] = useState("");
  const [adminEmailVendor, setAdminEmailVendor] = useState("");
  const [coAgentsVendor, setCoAgentsVendor] = useState<CoAgent[]>([]);
  const [draftCoAgentsVendor, setDraftCoAgentsVendor] = useState<
    typeof coAgentsVendor
  >([]);
  useEffect(() => {
    if (openAddCoAgentDialog) {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("Token not found.");
        return;
      }

      GetUser(token)
        .then((res) => {
          setAdminEmail(res?.data?.email || "");
          setAdminEmailVendor(res?.data?.email || "");
        })
        .catch((err) => console.log("Error fetching data:", err.message));
    }
  }, [openAddCoAgentDialog]);
  useEffect(() => {
    if (open) {
      setSelectedAgentTemplate("schedule_change");
      handleAgentTemplateChange("schedule_change");
    }
  }, [open]);
  useEffect(() => {
    if (open) {
      setSelectedVendorTemplate("schedule_change");
      handleVendorTemplateChange("schedule_change");
    }
  }, [open]);
  const handleNext = () => {
    setShowAgentModal?.(false);
    setShowVendorModal?.(true);
  };

  const handleSave = () => {
    setAgentChecked?.(false);
    setVendorChecked?.(false);
    setCoAgents([]);
    setDraftCoAgents([]);
    setCoAgentsVendor([]);
    setDraftCoAgentsVendor([]);
    setDescriptionAgent("");
    setDescriptionVendor("");
    setSelectedAgentTemplate("");
    setSelectedVendorTemplate("");
    setCoAgentEmail("");
    setCoAgentEmailVendor("");
    setAdminEmail("");
    setAdminEmailVendor("");
    setShowConfirmation(true);
  };
  const handleOkClick = () => {
    setShowConfirmation(false);
    setShowAgentModal?.(false);
    setShowVendorModal?.(false);
    setOpen(false);
    setOpenSave(true);
  };
  const handleClose = () => {
    setAgentChecked?.(false);
    setVendorChecked?.(false);
    setCoAgents([]);
    setSelectedAgentTemplate("schedule_change");
    setSelectedVendorTemplate("schedule_change");
    setDraftCoAgents([]);
    setCoAgentsVendor([]);
    setDraftCoAgentsVendor([]);
    setDescriptionAgent("");
    setDescriptionVendor("");
    setCoAgentEmail("");
    setCoAgentEmailVendor("");
    setAdminEmail("");
    setAdminEmailVendor("");
    setShowAgentModal?.(false);
    setShowVendorModal?.(false);
    setOpen(false);
  };
  const handleBack = () => {
    setShowAgentModal?.(true);
    setShowVendorModal?.(false);
  };
  const handleOpenAddCoAgentDialog = () => {
    setDraftCoAgents(coAgents); // clear input
    setOpenAddCoAgentDialog(true);
  };
  const handleAgentTemplateChange = (val: string) => {
    setSelectedAgentTemplate(val);
    const html = templateHTMLs[val];
    if (html) {
      setDescriptionAgent(html);
    }
  };
  const handleVendorTemplateChange = (val: string) => {
    setSelectedVendorTemplate(val);
    const html = templateHTMLs2[val];
    if (html) {
      setDescriptionVendor(html);
    }
  };
  const removeAdmin = () => setAdminEmail("");
  const handleAdd = () => {
    const email = coAgentEmail.trim();

    // ✅ Don't proceed if email is empty or invalid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error("Please enter a valid email.");
      return;
    }
    const extractedName = email.split("@")[0];

    const newAgent = {
      email,
      name: extractedName,
    };

    setDraftCoAgents((prev) => [...prev, newAgent]);
    setCoAgentEmail("");
  };
  const handleRemove = (index: number) => {
    setDraftCoAgents((prev) => prev.filter((_, i) => i !== index));
  };
  const handleRemoveCoAgent = (index: number) => {
    const updated = [...coAgents];
    updated.splice(index, 1);
    setCoAgents(updated);
  };
  const handleOpenAddCoAgentDialog1 = () => {
    setDraftCoAgentsVendor(coAgentsVendor); // clear input
    setOpenAddCoAgentDialog(true);
  };
  const removeAdmin1 = () => setAdminEmailVendor("");
  const handleAdd1 = () => {
    const email = coAgentEmailVendor.trim();

    // ✅ Don't proceed if email is empty or invalid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error("Please enter a valid email.");
      return;
    }
    const extractedName = email.split("@")[0];

    const newAgent = {
      email,
      name: extractedName,
    };

    setDraftCoAgentsVendor((prev) => [...prev, newAgent]);
    setCoAgentEmailVendor("");
  };
  const handleRemove1 = (index: number) => {
    setDraftCoAgentsVendor((prev) => prev.filter((_, i) => i !== index));
  };
  const handleRemoveCoAgent1 = (index: number) => {
    const updated = [...coAgentsVendor];
    updated.splice(index, 1);
    setCoAgentsVendor(updated);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="bg-[#FAFAFA]  w-[750px] max-w-[750px] max-h-[650px] rounded-[8px] font-alexandria gap-y-3 overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle
            className={`${userType}-text flex items-center justify-between text-[18px] uppercase font-semibold border-b border-[#E4E4E4] pb-2`}
          >
            Edit Notification
            <Button
              onClick={handleClose}
              className="bg-transparent hover:bg-transparent shadow-none"
            >
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </Button>
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="text-[#666666] text-[16px] font-[400]">
          {showAgentModal && <p>Choose Template: Agents</p>}
          {showVendorModal && <p>Choose Template: Vendors</p>}
        </div>
        <div className="text-[#424242] text-[14px] font-[400]">
          {showAgentModal && <p>Agent Notification</p>}
          {showVendorModal && <p>Vendor Notification</p>}
        </div>
        {showAgentModal && (
          <Select
            value={selectedAgentTemplate}
            onValueChange={(value) => handleAgentTemplateChange(value)}
          >
            <SelectTrigger className="h-[42px] w-[340px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] [&>svg]:hidden [&>span.custom-arrow>svg]:block">
              <SelectValue placeholder="Select a template type" />
              <span className="custom-arrow">
                <ChevronDown className={` ${userType}-text `} />
              </span>
            </SelectTrigger>
            <SelectContent>
              {templateOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {showVendorModal && (
          <Select
            value={selectedVendorTemplate}
            onValueChange={handleVendorTemplateChange}
          >
            <SelectTrigger className="h-[42px] w-[340px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] [&>svg]:hidden [&>span.custom-arrow>svg]:block">
              <SelectValue placeholder="Select a template type" />
              <span className="custom-arrow">
                <DropDownArrow />
              </span>
            </SelectTrigger>
            <SelectContent>
              {templateOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {showAgentModal && (
          <RichTextEditor
            value={descriptionAgent}
            onChange={setDescriptionAgent}
          />
        )}
        {showVendorModal && (
          <RichTextEditor
            value={descriptionVendor}
            onChange={setDescriptionVendor}
          />
        )}
        {showAgentModal && (
          <div className="w-full mt-8">
            <div className="flex items-center justify-between">
              <p className="text-[#424242] font-normal text-sm">CC</p>
              <div
                className="flex items-center gap-x-[10px] cursor-pointer"
                onClick={handleOpenAddCoAgentDialog}
              >
                <p className="text-base font-semibold font-raleway text-[#6BAE41]">
                  Add
                </p>
                <Plus className="w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm " />
              </div>
              <AlertDialog
                open={openAddCoAgentDialog}
                onOpenChange={setOpenAddCoAgentDialog}
              >
                <AlertDialogContent className="w-[320px] md:w-[470px] h-[360px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center uppercase justify-between text-[#4290E9] text-[18px] font-[600]">
                      CC
                      <AlertDialogCancel
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenAddCoAgentDialog(false);
                          setCoAgentEmail("");
                          setDraftCoAgents([]);
                        }}
                        className="border-none !shadow-none"
                      >
                        <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                      </AlertDialogCancel>
                    </AlertDialogTitle>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                  </AlertDialogHeader>

                  <div className="flex flex-col ">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-col gap-4"
                    >
                      <form>
                        <div className="flex flex-col gap-4">
                          {/* Admin Section */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-base font-normal text-[#666666]">
                                Admin
                              </span>
                              <button
                                type="button"
                                className="flex items-center text-[#E06D5E] text-base font-semibold font-raleway"
                                onClick={removeAdmin}
                              >
                                Remove{" "}
                                <Minus className="w-[18px] h-[18px] bg-[#E06D5E] text-white rounded-sm ml-[10px]" />
                              </button>
                            </div>
                            {adminEmail && (
                              <div className="bg-[#E4E4E4] text-[#424242] w-fit flex items-center px-3 py-1 rounded-full text-sm">
                                {adminEmail}
                                <button
                                  type="button"
                                  className="ml-2 text-red-500"
                                  onClick={() => removeAdmin()}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Co Agents Section */}
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <label className="text-base font-normal text-[#666666]">
                                Co Agents
                              </label>
                              <button
                                type="button"
                                className="flex items-center text-[#6BAE41] text-base font-semibold mt-1 font-raleway"
                                onClick={handleAdd}
                              >
                                Add
                                <Plus className="w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm ml-[10px]" />
                              </button>
                            </div>

                            {/* 👇 Render added co-agents above the form fields */}
                            {draftCoAgents.length > 0 && (
                              <div className="flex flex-wrap gap-2 py-3">
                                {draftCoAgents.map((agent, index) => (
                                  <div
                                    key={index}
                                    className="bg-[#E4E4E4] text-[#424242] flex items-center px-3 py-1 rounded-full text-sm"
                                  >
                                    {agent.email}{" "}
                                    {agent.percentage !== undefined &&
                                      `(${agent.percentage}%)`}
                                    <button
                                      type="button"
                                      className="ml-2 text-red-500"
                                      onClick={() => handleRemove(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="grid grid-cols-2 w-full gap-x-2.5 text-[#666666]">
                              <div className="relative w-full col-span-2">
                                <label
                                  htmlFor="email"
                                  className="block text-sm font-normal"
                                >
                                  Email <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={coAgentEmail}
                                  onChange={(e) => {
                                    setCoAgentEmail(e.target.value);
                                  }}
                                  className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <hr className="w-full h-[1px] text-[#BBBBBB] my-[16px]" />
                        <AlertDialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                          <AlertDialogCancel
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenAddCoAgentDialog(false);
                              setCoAgentEmail("");
                              setDraftCoAgents([]);
                            }}
                            className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]"
                          >
                            Cancel
                          </AlertDialogCancel>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              const email = coAgentEmail.trim();
                              const isValidEmail =
                                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                              const needsToAdd = email !== "";

                              if (needsToAdd) {
                                if (!isValidEmail) {
                                  toast.error("Please enter a valid email.");
                                  return;
                                }

                                const extractedName = email.split("@")[0];
                                const newAgent = {
                                  email,
                                  name: extractedName,
                                };

                                draftCoAgents.push(newAgent);
                              }

                              // Only proceed after validation
                              setCoAgents(draftCoAgents);
                              setCoAgentEmail("");
                              setDraftCoAgents([]);
                              setOpenAddCoAgentDialog(false);
                            }}
                            className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full md:w-[176px] h-[44px] font-[400] text-[20px] rounded-md"
                          >
                            Add
                          </button>
                        </AlertDialogFooter>
                      </form>
                    </div>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="border border-[#BBBBBB] mt-[12px] px-[6px] py-[8px] rounded-[6px] bg-[#EEEEEE] flex flex-wrap gap-[6px] min-h-[67px]">
              {adminEmail && (
                <div className="flex items-center bg-[#E4E4E4] px-[6px] h-[24px] py-1.5 rounded-[10px] shadow-sm max-w-full break-words cursor-pointer overflow-hidden">
                  <span className="text-sm font-normal text-[#7D7D7D] break-words whitespace-pre-wrap overflow-hidden text-ellipsis">
                    Admin: {adminEmail}
                  </span>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                    onClick={() => removeAdmin()}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {coAgents.map((coagent, index) => (
                <div
                  key={index}
                  className="flex items-center bg-[#E4E4E4] px-[6px] h-[24px] py-1.5 rounded-[10px] shadow-sm max-w-full break-words cursor-pointer overflow-hidden"
                  style={{ maxWidth: "100%" }}
                >
                  <span
                    className="text-sm font-normal text-[#7D7D7D] break-words whitespace-pre-wrap overflow-hidden text-ellipsis"
                    onClick={() => setOpenAddCoAgentDialog(true)}
                  >
                    {coagent.email || "No Email Provided"}{" "}
                    {coagent.percentage !== undefined &&
                      `(${coagent.percentage}%)`}
                  </span>
                  <button
                    onClick={() => handleRemoveCoAgent(index)}
                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {showVendorModal && (
          <div className="w-full mt-8">
            <div className="flex items-center justify-between">
              <p className="text-[#424242] font-normal text-sm">CC</p>
              <div
                className="flex items-center gap-x-[10px] cursor-pointer"
                onClick={handleOpenAddCoAgentDialog1}
              >
                <p className="text-base font-semibold font-raleway text-[#6BAE41]">
                  Add
                </p>
                <Plus className="w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm " />
              </div>
              <AlertDialog
                open={openAddCoAgentDialog}
                onOpenChange={setOpenAddCoAgentDialog}
              >
                <AlertDialogContent className="w-[320px] md:w-[470px] h-[360px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center uppercase justify-between text-[#4290E9] text-[18px] font-[600]">
                      CC
                      <AlertDialogCancel
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenAddCoAgentDialog(false);
                          setCoAgentEmailVendor("");
                          setDraftCoAgentsVendor([]);
                        }}
                        className="border-none !shadow-none"
                      >
                        <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                      </AlertDialogCancel>
                    </AlertDialogTitle>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                  </AlertDialogHeader>

                  <div className="flex flex-col ">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-col gap-4"
                    >
                      <form>
                        <div className="flex flex-col gap-4">
                          {/* Admin Section */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-base font-normal text-[#666666]">
                                Admin
                              </span>
                              <button
                                type="button"
                                className="flex items-center text-[#E06D5E] text-base font-semibold font-raleway"
                                onClick={removeAdmin1}
                              >
                                Remove{" "}
                                <Minus className="w-[18px] h-[18px] bg-[#E06D5E] text-white rounded-sm ml-[10px]" />
                              </button>
                            </div>
                            {adminEmailVendor && (
                              <div className="bg-[#E4E4E4] text-[#424242] w-fit flex items-center px-3 py-1 rounded-full text-sm">
                                {adminEmailVendor}
                                <button
                                  type="button"
                                  className="ml-2 text-red-500"
                                  onClick={() => removeAdmin1()}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Co Agents Section */}
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <label className="text-base font-normal text-[#666666]">
                                Co Agents
                              </label>
                              <button
                                type="button"
                                className="flex items-center text-[#6BAE41] text-base font-semibold mt-1 font-raleway"
                                onClick={handleAdd1}
                              >
                                Add
                                <Plus className="w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm ml-[10px]" />
                              </button>
                            </div>

                            {/* 👇 Render added co-agents above the form fields */}
                            {draftCoAgentsVendor.length > 0 && (
                              <div className="flex flex-wrap gap-2 py-3">
                                {draftCoAgentsVendor.map((agent, index) => (
                                  <div
                                    key={index}
                                    className="bg-[#E4E4E4] text-[#424242] flex items-center px-3 py-1 rounded-full text-sm"
                                  >
                                    {agent.email}{" "}
                                    {agent.percentage !== undefined &&
                                      `(${agent.percentage}%)`}
                                    <button
                                      type="button"
                                      className="ml-2 text-red-500"
                                      onClick={() => handleRemove1(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="grid grid-cols-2 w-full gap-x-2.5 text-[#666666]">
                              <div className="relative w-full col-span-2">
                                <label
                                  htmlFor="email"
                                  className="block text-sm font-normal"
                                >
                                  Email <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={coAgentEmailVendor}
                                  onChange={(e) => {
                                    setCoAgentEmailVendor(e.target.value);
                                  }}
                                  className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <hr className="w-full h-[1px] text-[#BBBBBB] my-[16px]" />
                        <AlertDialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px]  mt-2 font-alexandria">
                          <AlertDialogCancel
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenAddCoAgentDialog(false);
                              setCoAgentEmailVendor("");
                              setDraftCoAgentsVendor([]);
                            }}
                            className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]"
                          >
                            Cancel
                          </AlertDialogCancel>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              const email = coAgentEmailVendor.trim();
                              const isValidEmail =
                                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                              const needsToAdd = email !== "";

                              if (needsToAdd) {
                                if (!isValidEmail) {
                                  toast.error("Please enter a valid email.");
                                  return;
                                }

                                const extractedName = email.split("@")[0];
                                const newAgent = {
                                  email,
                                  name: extractedName,
                                };

                                draftCoAgentsVendor.push(newAgent);
                              }
                              setCoAgentsVendor(draftCoAgentsVendor);
                              setCoAgentEmailVendor("");
                              setDraftCoAgentsVendor([]);
                              setOpenAddCoAgentDialog(false);
                            }}
                            className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full md:w-[176px] h-[44px] font-[400] text-[20px] rounded-md"
                          >
                            Add
                          </button>
                        </AlertDialogFooter>
                      </form>
                    </div>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="border border-[#BBBBBB] mt-[12px] px-[6px] py-[8px] rounded-[6px] bg-[#EEEEEE] flex flex-wrap gap-[6px] min-h-[67px]">
              {adminEmailVendor && (
                <div className="flex items-center bg-[#E4E4E4] px-[6px] h-[24px] py-1.5 rounded-[10px] shadow-sm max-w-full break-words cursor-pointer overflow-hidden">
                  <span className="text-sm font-normal text-[#7D7D7D] break-words whitespace-pre-wrap overflow-hidden text-ellipsis">
                    Admin: {adminEmail}
                  </span>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                    onClick={() => removeAdmin1()}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {coAgentsVendor.map((coagent, index) => (
                <div
                  key={index}
                  className="flex items-center bg-[#E4E4E4] px-[6px] h-[24px] py-1.5 rounded-[10px] shadow-sm max-w-full break-words cursor-pointer overflow-hidden"
                  style={{ maxWidth: "100%" }}
                >
                  <span
                    className="text-sm font-normal text-[#7D7D7D] break-words whitespace-pre-wrap overflow-hidden text-ellipsis"
                    onClick={() => setOpenAddCoAgentDialog(true)}
                  >
                    {coagent.email || "No Email Provided"}{" "}
                    {coagent.percentage !== undefined &&
                      `(${coagent.percentage}%)`}
                  </span>
                  <button
                    onClick={() => handleRemoveCoAgent1(index)}
                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="border-b-[1px] border-[#E4E4E4] pb-2"></div>
        <div className="flex justify-end gap-3">
          {bothSelected && showAgentModal && (
            // Step 1 of 2 (Agent only)
            <div className="flex items-center gap-x-4 font-raleway">
              <AlertDialogCancel
                onClick={handleClose}
                className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[600] ${userType}-border ${userType}-text hover-${userType}-bg  ${userType}-button`}
              >
                Cancel
              </AlertDialogCancel>
              <Button
                onClick={handleNext}
                className={`${userType}-bg  w-full md:w-[170px] h-[44px] text-[20px] font-[600] hover:opacity-95 text-white hover-${userType}-bg`}
              >
                Next
              </Button>
            </div>
          )}

          {bothSelected && showVendorModal && (
            // Step 2 of 2 (Vendor only)
            <div className="flex items-center gap-x-4 font-raleway">
              <Button
                onClick={handleBack}
                className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[600] ${userType}-border ${userType}-text hover-${userType}-bg  ${userType}-button`}
              >
                Back
              </Button>
              <Button
                onClick={handleSave}
                className={`${userType}-bg  w-full md:w-[170px] h-[44px] text-[20px] font-[600] hover:opacity-95 text-white hover-${userType}-bg`}
              >
                Save And Exit
              </Button>
            </div>
          )}

          {!bothSelected && showAgentModal && (
            <div className="flex items-center gap-x-4 font-raleway">
              <AlertDialogCancel
                onClick={handleClose}
                className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[600] ${userType}-border ${userType}-text hover-${userType}-bg ${userType}-button`}
              >
                Cancel
              </AlertDialogCancel>
              <Button
                onClick={handleSave}
                className={`${userType}-bg  w-full md:w-[170px] h-[44px] text-[20px] font-[600] hover:opacity-95 text-white hover-${userType}-bg`}
              >
                Save And Exit
              </Button>
            </div>
          )}

          {!bothSelected && showVendorModal && (
            <div className="flex items-center gap-x-4 font-raleway">
              <AlertDialogCancel
                onClick={handleClose}
                className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[600] ${userType}-border ${userType}-text hover-${userType}-bg ${userType}-button `}
              >
                Cancel
              </AlertDialogCancel>
              <Button
                onClick={handleSave}
                className={`${userType}-bg  w-full md:w-[170px] h-[44px] text-[20px] font-[600] hover:opacity-95 text-white hover-${userType}-bg`}
              >
                Save And Exit
              </Button>
            </div>
          )}
        </div>
      </AlertDialogContent>
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="w-[320px] md:w-[565px] max-w-[565px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria">
          <AlertDialogHeader className="mb-2">
            <AlertDialogTitle className="flex items-center justify-between text-[#4290E9] text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2">
              SAVE AND EXIT
              <AlertDialogCancel className="border-none !shadow-none">
                <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
              </AlertDialogCancel>
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="flex items-start gap-3">
            <div className="w-fit">
              <WarningIcon width={48} fill="#DC9600" />
            </div>
            <AlertDialogDescription className="text-[16px] font-[400] text-[#666666]">
              Are you sure you want to save and exit? This cannot be undone.
            </AlertDialogDescription>
          </div>

          <AlertDialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px]  mt-2 font-alexandria">
            <AlertDialogCancel className="bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full  md:w-[170px] h-[44px] font-[400] text-[20px]"
              onClick={handleOkClick}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        <SaveModal
          isOpen={openSave}
          onClose={() => setOpenSave(false)}
          // isLoading={true}
          isSuccess={true}
          // backLink="/dashboard/agents"
          // title={'Agents'}
        />
      </AlertDialog>
    </AlertDialog>
  );
};

export default NotificationModal;
