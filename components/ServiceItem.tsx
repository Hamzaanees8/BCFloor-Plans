import React, { useState } from "react";
import { ChevronDownIcon, DropDownArrow } from "./Icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { DeleteVendorService } from "@/app/dashboard/vendors/vendors";
import { Button } from "./ui/button";
import { useAppContext } from "@/app/context/AppContext";
import { CurrentUser, SelectedService, Services } from "./WorkHours";
import { toast } from "sonner";

// Define timeNeededOptions as an array of strings
const timeNeededOptions = [
  "no adjustment",
  "5 Minutes less",
  "10 Minutes less",
  "15 Minutes less",
  "30 Minutes less",
  "45 Minutes less",
];

interface ServiceItemProps {
  selectedService: SelectedService;
  servicesData: Services[];
  index: number;
  onChange: (
    index: number,
    optionUuid: string,
    field: "vendor_price" | "adjustment_time",
    value: number | string
  ) => void;
  onRemove: (index: number) => void;
  currentUser: CurrentUser | null;
  fieldErrors?: Record<string, string[]>;
}

const ServiceItem = ({
  selectedService,
  servicesData,
  index,
  onChange,
  onRemove,
  currentUser,
  fieldErrors,
}: ServiceItemProps) => {
  const [showTimeFields, setShowTimeFields] = useState(false);
  const { userType } = useAppContext();

  // Find the full service data
  const serviceData = servicesData.find(
    (s) => s.uuid === selectedService.service_id
  );
  const serviceName = serviceData?.name || "Unknown Service";

  // Get product options from service data
  const productOptions = serviceData?.product_options || [];

  const handleOptionPriceChange = (optionUuid: string, price: string) => {
    const numericPrice = price === "" ? 0 : Number(price);
    onChange(index, optionUuid, "vendor_price", numericPrice);
  };

  const handleTimeAdjustmentChange = (
    optionUuid: string,
    adjustment: string
  ) => {
    onChange(index, optionUuid, "adjustment_time", adjustment);
  };

  // Find option data from selectedService
  const getOptionData = (optionUuid: string) => {
    return selectedService.options.find(
      (opt) => opt.option_uuid === optionUuid
    );
  };

  async function handleRemove(vendor_service_id?: string) {
    try {
      if (vendor_service_id) {
        await DeleteVendorService(currentUser?.uuid ?? "", vendor_service_id);
        toast.success("Service removed from database");
      }
      onRemove(index);
    } catch (error) {
      console.log(error);
      toast.error("Failed to remove service");
    }
  }
  return (
    <div className="p-4 w-[450px] text-[#666] font-alexandria">
      <label htmlFor="serviceName" className="block text-sm font-normal mb-2">
        Service Name <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center justify-between gap-3 w-full">
          <span
            className={`w-[400px] border rounded-[8px] h-[42px] flex items-center pl-2 ${fieldErrors?.[`services[${index}].service_id`]
              ? "border-red-500"
              : "border-[#BBBBBB]"
              }`}
            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
          >
            {serviceName}
          </span>
          <button
            type="button"
            onClick={() => setShowTimeFields(!showTimeFields)}
            className="p-1 hover:bg-gray-100 rounded flex items-center justify-center border border-gray-300 hover:border-gray-400 transition h-[42px] w-[42px]"
          >
            {showTimeFields ? <ChevronDownIcon /> : <DropDownArrow />}
          </button>
        </div>
      </div>
      {fieldErrors?.[`services[${index}].service_id`] && (
        <p className="text-red-500 text-xs mt-1 mb-2">
          {fieldErrors[`services[${index}].service_id`][0]}
        </p>
      )}

      {showTimeFields && productOptions.length > 0 && (
        <div className="space-y-3">
          <Accordion type="single" collapsible className="space-y-3">
            {productOptions.map((option) => {
              const optionData = getOptionData(option.uuid ?? "");
              const priceErrorKey = `services[${index}].options[${option.uuid}].vendor_price`;
              const hasError = fieldErrors?.[priceErrorKey];

              return (
                <AccordionItem key={option.uuid} value={option.uuid ?? ""}>
                  <AccordionTrigger className="flex justify-between items-center px-3 py-2">
                    <span className="font-medium text-sm">{option.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 text-[#666]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label
                          htmlFor={`price-${option.uuid}`}
                          className="block text-sm font-normal mb-1"
                        >
                          Vendor Pay Amount<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`price-${option.uuid}`}
                          type="number"
                          inputMode="decimal"
                          placeholder="Enter price"
                          value={optionData?.vendor_price || ""}
                          onChange={(e) =>
                            handleOptionPriceChange(
                              option.uuid ?? "",
                              e.target.value
                            )
                          }
                          className={`h-[42px] w-full border text-[16px] mt-[12px] placeholder:text-[#9ca3af] ${hasError ? "border-red-500" : "border-[#BBBBBB]"
                            }`}
                          style={{
                            backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                          }}
                        />
                        {hasError && (
                          <p className="text-red-500 text-xs mt-1">
                            {fieldErrors[priceErrorKey][0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor={`time-${option.uuid}`}
                          className="block text-sm font-normal mb-1"
                        >
                          Time Adjustment{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={optionData?.adjustment_time || "no adjustment"}
                          onValueChange={(value) =>
                            handleTimeAdjustmentChange(option.uuid ?? "", value)
                          }
                        >
                          <SelectTrigger
                            className="h-[42px] w-full border text-[16px] border-[#BBBBBB] mt-[12px] placeholder:text-[#9ca3af]"
                            style={{
                              backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                            }}
                          >
                            <SelectValue placeholder="Select Time Adjustment" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeNeededOptions.map((opt, idx) => (
                              <SelectItem key={idx} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
      <div className="flex justify-end mr-9 mt-4">
        <Button
          className={`w-[110px] h-[35px] border-[1px] ${userType}-border ${userType}-bg text-[14px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg`}
          onClick={() => handleRemove(selectedService?.vendor_service_id ?? "")}
        >
          Remove
        </Button>
      </div>
      {showTimeFields && productOptions.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No product options available for this service
        </div>
      )}
    </div>
  );
};

export default ServiceItem;
