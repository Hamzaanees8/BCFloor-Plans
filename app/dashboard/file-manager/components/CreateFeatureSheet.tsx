import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Order } from "../../orders/page";
import { useFileManagerContext } from "../FileManagerContext ";
import BcfpStandard from "./BcfpStandard";
import DownloadPdf from "./DownloadPdf";
import BcfpStandard1 from "./BcfpStandard1";
import BcfpStandard2 from "./BcfpStandard2";
import BcfpStandard3 from "./BcfpStandard3";
import BcfpStandard4 from "./BcfpStandard4";
// import BcfpStandard5 from "./BcfpStandard5";
import BcfpStandard6 from "./BcfpStandard6";
import BcfpStandard7 from "./BcfpStandard7";
import BcfpStandard8 from "./BcfpStandard8";
import BcfpStandard9 from "./BcfpStandard9";
import BcfpStandard10 from "./BcfpStandard10";
import BcfpStandard11 from "./BcfpStandard11";
// import BcfpStandard12 from "./BcfpStandard12";
import { useAppContext } from "@/app/context/AppContext";

interface TourSettingProps {
  orderData: Order | null;
}

const CreateFeatureSheet = ({ orderData }: TourSettingProps) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState<string>("");
  const [linkedin, setLinkedin] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const { formData, setFormData } = useFileManagerContext();
  const { userType } = useAppContext()
  const [openColorPicker, setOpenColorPicker] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef1 = useRef<HTMLDivElement | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("BCFP Standard");
  const [realtorPreview, setRealtorPreview] = useState<string | null>(null);
  const realtorInputRef = useRef<HTMLInputElement | null>(null);

  const triggerRealtorInput = () => {
    realtorInputRef.current?.click();
  };

  const handleRealtorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRealtorPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const triggerLogoInput = () => {
    logoInputRef.current?.click();
  };

  useEffect(() => {
    if (orderData) {
      setFormData((prev) => ({
        ...prev,
        avatar_url: orderData.agent.avatar_url,
        AvatarfileName: orderData.agent.avatar,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        event.target instanceof Node &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpenColorPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside1(event: MouseEvent) {
      if (
        wrapperRef1.current &&
        event.target instanceof Node &&
        !wrapperRef1.current.contains(event.target)
      ) {
        // setOpenColorPicker1(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside1);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside1);
    };
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-between h-[60px] items-center bg-[#E4E4E4] px-4">
        <div className="">
          <button
            onClick={() => DownloadPdf("pdf-section", formData.propertyNotesTitle || "my-file.pdf")}
            className={`text-center px-4 py-2 text-[13px] w-[164px] h-[32px] transition-colors ${userType}-bg text-white  rounded-[6px] font-[500]`}>
            Download PDF
          </button>
        </div>
        <div className="text-center">
          <div className={`text-[16px] font-alexandria font-bold ${userType}-text`}>
            Feature Sheets
          </div>
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <div className={`text-[24px] font-alexandria font-normal leading-[18px] ${userType}-text`}>
              $155.00
            </div>
            <div className="text-[12px] font-alexandria font-normal text-[#7D7D7D]">
              25 Printed Copies
            </div>
          </div>
          <button className={`text-center px-4 py-2 text-[13px] w-[133px] h-[32px] transition-colors ${userType}-bg text-white  rounded-[6px] font-[500]`}>
            Paid
          </button>
        </div>
      </div>

      <form>
        <Accordion
          type="multiple"
          defaultValue={["FeatureSheetSettings", "FeatureSheetPreview"]}
          className="w-full space-y-4"
        >
          <AccordionItem value="FeatureSheetSettings">
            <AccordionTrigger className={` overflow-visible px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
              General Information
            </AccordionTrigger>
            <AccordionContent className="grid gap-4 !overflow-visible">
              <div className="w-full flex flex-col items-center px-[16px]">
                <div className="flex w-full gap-3 mt-4 justify-end">
                  <div className="text-center">
                    <div className="text-[24px] font-alexandria font-normal leading-[18px] text-[#7D7D7D]">
                      25 Copies
                    </div>
                    <div className="text-[12px] font-alexandria font-normal text-[#7D7D7D]">
                      Printed 
                    </div>
                  </div>
                  <button className="text-center px-4 py-2 text-[13px] w-[133px] h-[32px] transition-colors bg-[#8E8E8E] text-white leading-3 rounded-[6px] font-[500]">
                    Upgrade Plan
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-6 ">
                  <div className="">
                    <div ref={wrapperRef} className="relative w-full">
                      <label
                        htmlFor="bgcolor"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Primary Color
                      </label>

                      {/* Box + Input side by side */}
                      <div className="flex items-center gap-3 mt-2">
                        {/* Color preview box */}
                        <div
                          className="w-8 h-8 border border-gray-400 rounded"
                          style={{
                            backgroundColor: `#${formData.background || "ffffff"}`,
                          }}
                        />

                        {/* Input wrapper */}
                        <div className="relative flex-1">
                          <span
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700"
                            style={{
                              color: `#${formData.background || ""}`,
                            }}
                          >
                            #
                          </span>

                          <Input
                            id="bgcolor"
                            value={formData.background}
                            onFocus={() => setOpenColorPicker(true)}
                            onClick={() => setOpenColorPicker(true)}
                            onChange={(e) => {
                              const value = e.target.value
                                .replace(/[^0-9a-fA-F]/g, "")
                                .slice(0, 6);
                              setFormData((prev) => ({
                                ...prev,
                                background: value,
                              }));
                            }}
                            className="pl-6 pr-4 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB]"
                            maxLength={6}
                            style={{
                              color: `#${formData.background || ""}`,
                            }}
                          />
                        </div>
                      </div>

                      {openColorPicker && (
                        <div className="absolute z-10 mt-2 rounded shadow-md border border-gray-300 bg-white p-3">
                          <HexColorPicker
                            className="!w-[175px]"
                            color={`#${formData.background}`}
                            onChange={(newColor) =>
                              setFormData((prev) => ({
                                ...prev,
                                background: newColor.replace(/^#/, ""),
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                    <div>
                       <div className="mt-4 w-full">
                        <label className="text-[#666666]">Logo</label>
                        <div className="flex gap-3">
                          {/* Preview */}
                          <div className="flex h-[128px] items-end gap-x-[6px]">
                            <div className="w-[193px] h-[128px] bg-[#E4E4E4] rounded-[6px] overflow-hidden border">
                              {logoPreview && (
                                <Image
                                  unoptimized
                                  src={logoPreview}
                                  alt="Logo Preview"
                                  width={193}
                                  height={128}
                                  className="object-cover w-full h-full"
                                />
                              )}
                            </div>
                          </div>

                          {/* Button */}
                          <div className="flex flex-1 w-full">
                            <div className="flex flex-col gap-3 justify-between w-full self-center">
                              <div>
                                <button
                                  type="button"
                                  onClick={triggerLogoInput}
                                  className="px-4 py-2 bg-[#E4E4E4] text-base font-normal w-[156px] h-full rounded-[6px] text-[#666666] border border-[#A8A8A8]"
                                >
                                  Choose Image
                                </button>
                              </div>
                              <input
                                type="file"
                                accept="image/png, image/jpeg"
                                ref={logoInputRef}
                                onChange={handleLogoChange}
                                className="hidden"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="">
                    <div>
                      <label htmlFor="">Template</label>
                      <Select
                        value={selectedTemplate}
                        onValueChange={setSelectedTemplate}
                      >
                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                          <SelectValue placeholder="Select Priority Hosted Expiry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BCFP Standard">
                            BCFP Standard
                          </SelectItem>
                          <SelectItem value="BCFP Standard1">
                            BCFP Standard1
                          </SelectItem>
                          <SelectItem value="BCFP Standard2">
                            BCFP Standard2
                          </SelectItem>
                          <SelectItem value="BCFP Standard3">
                            BCFP Standard3
                          </SelectItem>
                          <SelectItem value="BCFP Standard4">
                            BCFP Standard4
                          </SelectItem>
                          {/* <SelectItem value="BCFP Standard5">
                            BCFP Standard5
                          </SelectItem> */}
                          <SelectItem value="BCFP Standard6">
                            BCFP Standard6
                          </SelectItem>
                          <SelectItem value="BCFP Standard7">
                            BCFP Standard7
                          </SelectItem>
                          <SelectItem value="BCFP Standard8">
                            BCFP Standard8
                          </SelectItem>
                          <SelectItem value="BCFP Standard9">
                            BCFP Standard9
                          </SelectItem>
                          <SelectItem value="BCFP Standard10">
                            BCFP Standard10
                          </SelectItem>
                          <SelectItem value="BCFP Standard11">
                            BCFP Standard11
                          </SelectItem>
                          {/* <SelectItem value="BCFP Standard12">
                            BCFP Standard12
                          </SelectItem> */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-4 w-full">
                      <label className="text-[#666666]">Realtor Image</label>
                      <div className="flex gap-3 mt-2">
                        {/* Circle Preview */}
                        <div className="flex items-center gap-x-[6px]">
                          <div className="w-[62px] h-[62px] bg-[#E4E4E4] rounded-full overflow-hidden border">
                            {realtorPreview && (
                              <Image
                                unoptimized
                                src={realtorPreview}
                                alt="Realtor Preview"
                                width={62}
                                height={62}
                                className="object-cover w-full h-full rounded-full"
                              />
                            )}
                          </div>
                        </div>

                        {/* Button */}
                        <div className="flex flex-1 w-full">
                          <div className="flex flex-col gap-3 justify-between w-full self-center">
                            <div>
                              <button
                                type="button"
                                onClick={triggerRealtorInput}
                                className="px-4 py-2 bg-[#E4E4E4] text-base font-normal w-[156px] h-full rounded-[6px] text-[#666666] border border-[#A8A8A8]"
                              >
                                Choose Image
                              </button>
                            </div>
                            <input
                              type="file"
                              accept="image/png, image/jpeg"
                              ref={realtorInputRef}
                              onChange={handleRealtorChange}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                  <div>
                    <div className="space-y-4 mt-4">
                      {/* Email Link */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email Link
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@gmail.com"
                          className="pl-2 pr-2 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB] text-black rounded-md placeholder:text-[#7D7D7D]"
                        />
                      </div>

                      {/* LinkedIn Link */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          LinkedIn Link
                        </label>
                        <input
                          type="url"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="linkedin.com/in/yourname"
                          className="pl-2 pr-2 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB] text-black rounded-md placeholder:text-[#7D7D7D]"
                        />
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="123-123-1234"
                          className="pl-2 pr-2 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB] text-black rounded-md placeholder:text-[#7D7D7D]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="FeatureSheetPreview">
            <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
              <span className="flex items-center gap-2">
                Feature Sheet Preview
              </span>
            </AccordionTrigger>
            <AccordionContent className="grid gap-4">
              <div id="pdf-section" style={{ fontFamily: "'Alexandria', sans-serif" }}>
                {selectedTemplate === "BCFP Standard" && <BcfpStandard orderData={orderData || null} />}
                {selectedTemplate === "BCFP Standard1" && <BcfpStandard1 orderData={orderData || null} />}
                {selectedTemplate === "BCFP Standard2" && <BcfpStandard2 orderData={orderData || null} />}
                {selectedTemplate === "BCFP Standard3" && <BcfpStandard3 orderData={orderData || null} />}
                {selectedTemplate === "BCFP Standard4" && <BcfpStandard4 orderData={orderData || null} />}
                {/* {selectedTemplate === "BCFP Standard5" && <BcfpStandard5 orderData={orderData || null} />} */}
                {selectedTemplate === "BCFP Standard6" && <BcfpStandard6 orderData={orderData || null} />}
                {selectedTemplate === "BCFP Standard7" && <BcfpStandard7 orderData={orderData || null} />}
                {selectedTemplate === "BCFP Standard8" && <BcfpStandard8 orderData={orderData || null} />}
                {selectedTemplate === "BCFP Standard9" && <BcfpStandard9 orderData={orderData || null} />}
                {selectedTemplate === "BCFP Standard10" && <BcfpStandard10 orderData={orderData || null} />}
                {selectedTemplate === "BCFP Standard11" && <BcfpStandard11 orderData={orderData || null} />}
                {/* {selectedTemplate === "BCFP Standard12" && <BcfpStandard12 orderData={orderData || null} />} */}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>
    </div>
  );
};

export default CreateFeatureSheet;
