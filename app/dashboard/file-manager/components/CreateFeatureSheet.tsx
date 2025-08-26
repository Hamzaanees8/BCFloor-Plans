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
import { Textarea } from "@/components/ui/textarea";
import {
  CircleCheckBig,
  Eye,
  File,
  Wrench,
} from "lucide-react";
import { useFileManagerContext } from "../FileManagerContext ";
import BcfpStandard from "./BcfpStandard";
import DownloadPdf from "./DownloadPdf";
import BcfpStandard1 from "./BcfpStandard1";

interface TourSettingProps {
  orderData: Order | null;
}

const CreateFeatureSheet = ({ orderData }: TourSettingProps) => {
  const { formData, setFormData } = useFileManagerContext();

  const [openColorPicker, setOpenColorPicker] = useState(false);
  const [openColorPicker1, setOpenColorPicker1] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef1 = useRef<HTMLDivElement | null>(null);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const featuredImage1InputRef = useRef<HTMLInputElement | null>(null);
  const featuredImage2InputRef = useRef<HTMLInputElement | null>(null);
  const featuredImage3InputRef = useRef<HTMLInputElement | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("BCFP Standard");

  const handleHighlightChange = (index: number, value: string) => {
    const updated = [...formData.Keyhighlights];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, Keyhighlights: updated }));
  };

  const handleChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.highlights];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, highlights: updated };
    });
  };

  const handleImageUploadChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imageUpload: URL.createObjectURL(file),
        imageUploadFileName: file.name,
      }));
    }
  };

  const triggerImageUploadInput = () => {
    imageUploadInputRef.current?.click();
  };

  const handleFeaturedImage1Change = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        featuredImage1Preview: URL.createObjectURL(file),
        featuredImage1FileName: file.name,
      }));
    }
  };

  const triggerFeaturedImage1Input = () => {
    featuredImage1InputRef.current?.click();
  };

  const handleFeaturedImage2Change = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        featuredImage2Preview: URL.createObjectURL(file),
        featuredImage2FileName: file.name,
      }));
    }
  };

  const triggerFeaturedImage2Input = () => {
    featuredImage2InputRef.current?.click();
  };

  const handleFeaturedImage3Change = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        featuredImage3Preview: URL.createObjectURL(file),
        featuredImage3FileName: file.name,
      }));
    }
  };

  const triggerFeaturedImage3Input = () => {
    featuredImage3InputRef.current?.click();
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
        setOpenColorPicker1(false);
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
            className="text-center px-4 py-2 text-[13px] w-[164px] h-[32px] transition-colors bg-[#4290E9] text-white  rounded-[6px] font-[500]">
            Download PDF
          </button>
        </div>
        <div className="text-center">
          <div className="text-[16px] font-alexandria font-bold text-[#4290E9]">
            HDR Stills
          </div>
          <div className="text-[12px] font-alexandria font-normal text-[#7D7D7D]">
            20 Photos
          </div>
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <div className="text-[24px] font-alexandria font-normal leading-[18px] text-[#4290E9]">
              $155.00
            </div>
            <div className="text-[12px] font-alexandria font-normal text-[#7D7D7D]">
              25 Printed Copies
            </div>
          </div>
          <button className="text-center px-4 py-2 text-[13px] w-[133px] h-[32px] transition-colors bg-[#4290E9] text-white  rounded-[6px] font-[500]">
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
            <AccordionTrigger className=" overflow-visible px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current">
              General Information
            </AccordionTrigger>
            <AccordionContent className="grid gap-4 !overflow-visible">
              <div className="w-full flex flex-col items-center">
                <div className="w-[656px] mt-3">
                  <div className="col-span-2">
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 mt-4 gap-3">
                    <div ref={wrapperRef} className="relative w-full ">
                      <label
                        htmlFor="bgcolor"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Primary Color{" "}
                      </label>

                      <div className="relative w-full mt-2">
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
                          className="pl-6 pr-10 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB]"
                          maxLength={6}
                          style={{
                            color: `#${formData.background || ""}`,
                          }}
                        />
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
                    <div ref={wrapperRef1} className="relative w-full ">
                      <label
                        htmlFor="brcolor"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Secondary Color
                      </label>
                      <div className="relative w-full mt-2">
                        <span
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700"
                          style={{ color: `#${formData.border || ""}` }}
                        >
                          #
                        </span>

                        <Input
                          id="brcolor"
                          value={formData.border}
                          onFocus={() => setOpenColorPicker1(true)}
                          onClick={() => setOpenColorPicker1(true)}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/[^0-9a-fA-F]/g, "")
                              .slice(0, 6);
                            setFormData((prev) => ({ ...prev, border: value }));
                          }}
                          className="pl-6 pr-10 w-full h-[42px] bg-[#E4E4E4] border border-[#BBBBBB]"
                          maxLength={6}
                          style={{ color: `#${formData.border || ""}` }}
                        />
                      </div>

                      {openColorPicker1 && (
                        <div className="absolute z-10 mt-2 rounded shadow-md border border-gray-300 bg-white p-3">
                          <HexColorPicker
                            className="!w-[175px]"
                            color={`#${formData.border}`}
                            onChange={(newColor) =>
                              setFormData((prev) => ({
                                ...prev,
                                border: newColor.replace(/^#/, ""),
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="" className="text-[#666666] ">
                      Header Image
                    </label>
                    <div className="flex gap-3">
                      <div className="flex h-[128px] items-end gap-x-[6px]">
                        {formData.imageUpload ? (
                          <div className="w-[193px] h-[128px] object-cover border rounded-[6px] overflow-hidden">
                            <Image
                              unoptimized
                              src={formData.imageUpload}
                              alt="Image Preview"
                              width={193}
                              height={128}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-[193px] h-[128px] bg-[#E4E4E4] rounded-[6px]"></div>
                        )}
                      </div>

                      <div className="flex flex-1 w-full">
                        <div className="flex flex-col gap-3 justify-between w-full">
                          <div>
                            <button
                              type="button"
                              onClick={triggerImageUploadInput}
                              className="px-4 py-2 bg-[#E4E4E4] text-base font-normal w-[156px] h-full rounded-[6px] text-[#666666] border border-[#A8A8A8]"
                            >
                              Choose Image
                            </button>
                          </div>
                          <div className="flex items-center bg-gray-100 border border-[#A8A8A8] justify-between rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                            <span className="bg-[#EEEEEE] max-w-[300px] text-[16px] font-normal py-2 w-full h-full px-4 truncate whitespace-nowrap overflow-hidden">
                              {formData.imageUploadFileName}
                            </span>
                            <button
                              type="button"
                              onClick={triggerImageUploadInput}
                              className="px-4 bg-[#E4E4E4] text-base font-normal w-[156px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                            >
                              Upload Image
                            </button>
                          </div>
                          <input
                            type="file"
                            accept="image/png, image/jpeg"
                            ref={imageUploadInputRef}
                            onChange={handleImageUploadChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#4290E9] ">
                      1440 x 581, PNG or JPG
                    </p>
                  </div>

                  <div className="grid grid-cols-2 mt-4 gap-3">
                    {formData.Keyhighlights.map((highlight, index) => (
                      <div key={index}>
                        <label htmlFor="">Key Highlight {index + 1}</label>
                        <Input
                          value={highlight}
                          onChange={(e) =>
                            handleHighlightChange(index, e.target.value)
                          }
                          placeholder=""
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] text-black"
                          type="text"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 mt-4 gap-0">
                    <div>
                      <label htmlFor="">Property Notes</label>
                      <Input
                        value={formData.propertyNotesTitle}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            propertyNotesTitle: e.target.value,
                          }))
                        }
                        placeholder="Title"
                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                        type="text"
                      />
                    </div>
                    <div>
                      <Textarea
                        value={formData.propertyNotesDescription}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            propertyNotesDescription: e.target.value,
                          }))
                        }
                        placeholder=""
                        className="h-[113px] resize-none bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                      />
                    </div>
                  </div>

                 
                  <div className="mt-4">
                    <label className="text-[#666666] ">Featured Image 1</label>
                    <div className="flex gap-3">
                      <div className="flex h-[128px] items-end gap-x-[6px]">
                        {formData.featuredImage1Preview ? (
                          <div className="w-[193px] h-[128px] object-cover border rounded-[6px] overflow-hidden">
                            <Image
                              unoptimized
                              src={formData.featuredImage1Preview}
                              alt="Featured Image 1 Preview"
                              width={193}
                              height={128}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-[193px] h-[128px] bg-[#E4E4E4] rounded-[6px]"></div>
                        )}
                      </div>

                      <div className="flex flex-1 w-full">
                        <div className="flex flex-col gap-3 justify-between w-full">
                          <div>
                            <button
                              type="button"
                              onClick={triggerFeaturedImage1Input}
                              className="px-4 py-2 bg-[#E4E4E4] text-base font-normal w-[156px] h-full rounded-[6px] text-[#666666] border border-[#A8A8A8]"
                            >
                              Choose Image
                            </button>
                          </div>
                          <div className="flex items-center bg-gray-100 border border-[#A8A8A8] justify-between rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                            <span className="bg-[#EEEEEE] max-w-[300px] text-[16px] font-normal py-2 w-full h-full px-4 truncate whitespace-nowrap overflow-hidden">
                              {formData.featuredImage1FileName}
                            </span>
                            <button
                              type="button"
                              onClick={triggerFeaturedImage1Input}
                              className="px-4 bg-[#E4E4E4] text-base font-normal w-[156px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                            >
                              Upload Image
                            </button>
                          </div>
                          <input
                            type="file"
                            accept="image/png, image/jpeg"
                            ref={featuredImage1InputRef}
                            onChange={handleFeaturedImage1Change}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#4290E9] ">
                      1440 x 581, PNG or JPG
                    </p>
                  </div>

                  
                  <div className="mt-4">
                    <label className="text-[#666666] ">Featured Image 2</label>
                    <div className="flex gap-3">
                      <div className="flex h-[128px] items-end gap-x-[6px]">
                        {formData.featuredImage2Preview ? (
                          <div className="w-[193px] h-[128px] object-cover border rounded-[6px] overflow-hidden">
                            <Image
                              unoptimized
                              src={formData.featuredImage2Preview}
                              alt="Featured Image 2 Preview"
                              width={193}
                              height={128}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-[193px] h-[128px] bg-[#E4E4E4] rounded-[6px]"></div>
                        )}
                      </div>

                      <div className="flex flex-1 w-full">
                        <div className="flex flex-col gap-3 justify-between w-full">
                          <div>
                            <button
                              type="button"
                              onClick={triggerFeaturedImage2Input}
                              className="px-4 py-2 bg-[#E4E4E4] text-base font-normal w-[156px] h-full rounded-[6px] text-[#666666] border border-[#A8A8A8]"
                            >
                              Choose Image
                            </button>
                          </div>
                          <div className="flex items-center bg-gray-100 border border-[#A8A8A8] justify-between rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                            <span className="bg-[#EEEEEE] max-w-[300px] text-[16px] font-normal py-2 w-full h-full px-4 truncate whitespace-nowrap overflow-hidden">
                              {formData.featuredImage2FileName}
                            </span>
                            <button
                              type="button"
                              onClick={triggerFeaturedImage2Input}
                              className="px-4 bg-[#E4E4E4] text-base font-normal w-[156px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                            >
                              Upload Image
                            </button>
                          </div>
                          <input
                            type="file"
                            accept="image/png, image/jpeg"
                            ref={featuredImage2InputRef}
                            onChange={handleFeaturedImage2Change}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#4290E9] ">
                      1440 x 581, PNG or JPG
                    </p>
                  </div>

                  
                  <div className="mt-4">
                    <label className="text-[#666666] ">Featured Image 3</label>
                    <div className="flex gap-3">
                      <div className="flex h-[128px] items-end gap-x-[6px]">
                        {formData.featuredImage3Preview ? (
                          <div className="w-[193px] h-[128px] object-cover border rounded-[6px] overflow-hidden">
                            <Image
                              unoptimized
                              src={formData.featuredImage3Preview}
                              alt="Featured Image 3 Preview"
                              width={193}
                              height={128}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-[193px] h-[128px] bg-[#E4E4E4] rounded-[6px]"></div>
                        )}
                      </div>

                      <div className="flex flex-1 w-full">
                        <div className="flex flex-col gap-3 justify-between w-full">
                          <div>
                            <button
                              type="button"
                              onClick={triggerFeaturedImage3Input}
                              className="px-4 py-2 bg-[#E4E4E4] text-base font-normal w-[156px] h-full rounded-[6px] text-[#666666] border border-[#A8A8A8]"
                            >
                              Choose Image
                            </button>
                          </div>
                          <div className="flex items-center bg-gray-100 border border-[#A8A8A8] justify-between rounded-[8px] shadow-inner w-full h-10 overflow-hidden">
                            <span className="bg-[#EEEEEE] max-w-[300px] text-[16px] font-normal py-2 w-full h-full px-4 truncate whitespace-nowrap overflow-hidden">
                              {formData.featuredImage3FileName}
                            </span>
                            <button
                              type="button"
                              onClick={triggerFeaturedImage3Input}
                              className="px-4 bg-[#E4E4E4] text-base font-normal w-[156px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                            >
                              Upload Image
                            </button>
                          </div>
                          <input
                            type="file"
                            accept="image/png, image/jpeg"
                            ref={featuredImage3InputRef}
                            onChange={handleFeaturedImage3Change}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#4290E9] ">
                      1440 x 581, PNG or JPG
                    </p>
                  </div>

                  <div className="grid grid-cols-1 mt-4 gap-0">
                    <div>
                      <label htmlFor="">Expanded Detail 1</label>
                      <Input
                        value={formData.expandedDetail1}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            expandedDetail1: e.target.value,
                          }))
                        }
                        placeholder="Title"
                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                        type="text"
                      />
                    </div>
                    <div>
                      <Textarea
                        value={formData.expandedDetail1Description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            expandedDetail1Description: e.target.value,
                          }))
                        }
                        placeholder=""
                        className="h-[113px] resize-none bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 mt-4 gap-0">
                    <div>
                      <label htmlFor="">Expanded Detail 2</label>
                      <Input
                        value={formData.expandedDetail2}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            expandedDetail2: e.target.value,
                          }))
                        }
                        placeholder="Title"
                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                        type="text"
                      />
                    </div>
                    <div>
                      <Textarea
                        value={formData.expandedDetail2Description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            expandedDetail2Description: e.target.value,
                          }))
                        }
                        placeholder=""
                        className="h-[113px] resize-none bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 mt-4 gap-3">
                    {formData.highlights.map((highlight, index) => (
                      <div key={index} className="flex flex-col">
                        <label htmlFor="">Highlight {index + 1}</label>
                        <Input
                          value={highlight.title}
                          onChange={(e) =>
                            handleChange(index, "title", e.target.value)
                          }
                          placeholder="Title"
                          className="h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />

                        <div className="flex gap-2">
                          <Select
                            value={highlight.icon}
                            onValueChange={(value) =>
                              handleChange(index, "icon", value)
                            }
                          >
                            <SelectTrigger className="w-[35%] h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                              <SelectValue placeholder="" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="eye">
                                <Eye className="text-[#A8A8A8] w-8 h-8" />
                              </SelectItem>
                              <SelectItem value="wrench">
                                <Wrench className="text-[#A8A8A8] w-8 h-8" />
                              </SelectItem>
                              <SelectItem value="circlecheckbig">
                                <CircleCheckBig className="text-[#A8A8A8] w-8 h-8" />
                              </SelectItem>
                              <SelectItem value="file">
                                <File className="text-[#A8A8A8] w-8 h-8" />
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            value={highlight.value}
                            onChange={(e) =>
                              handleChange(index, "value", e.target.value)
                            }
                            placeholder="Value"
                            className="h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[12px]"
                            type="text"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <h2 className="text-[#4290E9] font-semibold text-[18px]">
                      Printing Options
                    </h2>
                    <div className="grid grid-cols-2 mt-4 gap-3">
                      <div className="">
                        <label htmlFor="">Page Dimension</label>
                        <Select>
                          <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                            <SelectValue placeholder="8.5x11 inches (standard)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="8.5x11 inches (standard)">
                              8.5x11 inches (standard)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="">
                        <label htmlFor="">Paper Type</label>
                        <Select>
                          <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                            <SelectValue placeholder="Glosssy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Glosssy">Glosssy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 justify-center">
                    <div className="text-center">
                      <div className="text-[24px] font-alexandria font-normal leading-[18px] text-[#4290E9]">
                        $155.00
                      </div>
                      <div className="text-[12px] font-alexandria font-normal text-[#7D7D7D]">
                        25 Printed Copies
                      </div>
                    </div>
                    <button className="text-center px-4 py-2 text-[13px] w-[133px] h-[32px] transition-colors bg-[#8E8E8E] text-white leading-3 rounded-[6px] font-[500]">
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="FeatureSheetPreview">
            <AccordionTrigger className="px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current">
              <span className="flex items-center gap-2">
                Feature Sheet Preview
              </span>
            </AccordionTrigger>
            <AccordionContent className="grid gap-4">
              <div id="pdf-section" style={{ fontFamily: "'Alexandria', sans-serif" }}>
                {selectedTemplate === "BCFP Standard" && <BcfpStandard orderData={orderData || null} />}
                {selectedTemplate === "BCFP Standard1" && <BcfpStandard1 orderData={orderData || null} />}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>
    </div>
  );
};

export default CreateFeatureSheet;
