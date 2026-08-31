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

const timeNeededOptions = [
  "no adjustment",
  "less than 15 minutes",
  "more than 15 minutes",
  "less than 30 minutes",
  "more than 30 minutes",
  "less than 45 minutes",
  "more than 45 minutes",
  "less than 60 minutes",
  "more than 60 minutes",
  "less than 75 minutes",
  "more than 75 minutes",
  "less than 90 minutes",
  "more than 90 minutes",
  "less than 105 minutes",
  "more than 105 minutes",
  "less than 120 minutes",
  "more than 120 minutes",
];

interface ServiceItemProps {
  selectedService: SelectedService;
  servicesData: Services[];
  index: number;
  onChange: (
    index: number,
    optionUuid: string,
    field: "vendor_price" | "adjustment_time" | "pay_type" | "sq_ft_rate" | "min_price",
    value: number | string,
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
    (s) => s.uuid === selectedService.service_id,
  );
  const serviceName = serviceData?.name || "Unknown Service";

  // Get product options from service data
  const productOptions = serviceData?.product_options || [];

  const handleOptionChange = (
    optionUuid: string,
    field: "vendor_price" | "adjustment_time" | "pay_type" | "sq_ft_rate" | "min_price",
    value: string | number,
  ) => {
    onChange(index, optionUuid, field, value);
  };

  // Find option data from selectedService
  const getOptionData = (optionUuid: string) => {
    return selectedService.options.find(
      (opt) => opt.option_uuid === optionUuid,
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

  const isVendor = userType === "vendor";

  return (
    <div className="p-4 w-full md:w-[480px] text-[#666] font-alexandria">
      <label htmlFor="serviceName" className="block text-sm font-normal mb-2">
        Service Name <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center justify-between gap-3 w-full">
          <span
            className={`flex-1 border rounded-[8px] h-[42px] flex items-center pl-2 text-sm font-medium ${
              fieldErrors?.[`services[${index}].service_id`]
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
              const defaultOptionPayType = (option as any)?.vendor_pay_type || (serviceData as any)?.vendor_pay_type || "flat";
              const payType = optionData?.pay_type || defaultOptionPayType;
              const defaultPrice = (option as any)?.vendor_price ?? (serviceData as any)?.vendor_price ?? 0;
              const defaultSqFtRate = (option as any)?.vendor_sq_ft_rate ?? (serviceData as any)?.vendor_sq_ft_rate ?? 0;
              const defaultMinPrice = (option as any)?.vendor_min_price ?? (serviceData as any)?.vendor_min_price ?? 0;

              return (
                <AccordionItem key={option.uuid} value={option.uuid ?? ""} className="border border-gray-200 rounded-lg overflow-hidden">
                  <AccordionTrigger className="flex justify-between items-center px-4 py-2.5 bg-gray-50/70 hover:bg-gray-100/70 text-sm">
                    <span className="font-semibold text-gray-800">{option.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 text-[#666] space-y-3.5 bg-white">
                    {/* Pay Type Selector */}
                    <div>
                      <Label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Payout Calculation Type
                      </Label>
                      <Select
                        value={payType}
                        onValueChange={(val) =>
                          handleOptionChange(option.uuid ?? "", "pay_type", val)
                        }
                        disabled={isVendor}
                      >
                        <SelectTrigger
                          className="h-[38px] w-full border text-xs border-gray-300"
                          style={{
                            backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                          }}
                        >
                          <SelectValue placeholder="Select Payout Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">Flat Rate ($)</SelectItem>
                          <SelectItem value="per_sq_ft">Per Sq. Ft. ($/sq.ft)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rate inputs based on Pay Type */}
                    {payType === "per_sq_ft" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label
                            htmlFor={`sqft-rate-${option.uuid}`}
                            className="block text-xs font-semibold text-gray-700 mb-1"
                          >
                            Sq. Ft. Rate ($/sq.ft) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`sqft-rate-${option.uuid}`}
                            type="number"
                            step="0.001"
                            placeholder={defaultSqFtRate > 0 ? `e.g. ${defaultSqFtRate} (Default)` : "e.g. 0.035"}
                            value={optionData?.sq_ft_rate ?? ""}
                            onChange={(e) =>
                              handleOptionChange(
                                option.uuid ?? "",
                                "sq_ft_rate",
                                e.target.value === "" ? "" : Number(e.target.value),
                              )
                            }
                            className="h-[38px] w-full border text-xs border-gray-300"
                            style={{
                              backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                            }}
                            disabled={isVendor}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`min-price-${option.uuid}`}
                            className="block text-xs font-semibold text-gray-700 mb-1"
                          >
                            Guaranteed Minimum ($)
                          </Label>
                          <Input
                            id={`min-price-${option.uuid}`}
                            type="number"
                            step="0.01"
                            placeholder={defaultMinPrice > 0 ? `e.g. ${Number(defaultMinPrice).toFixed(2)} (Default)` : "e.g. 75.00"}
                            value={optionData?.min_price ?? ""}
                            onChange={(e) =>
                              handleOptionChange(
                                option.uuid ?? "",
                                "min_price",
                                e.target.value === "" ? "" : Number(e.target.value),
                              )
                            }
                            className="h-[38px] w-full border text-xs border-gray-300"
                            style={{
                              backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                            }}
                            disabled={isVendor}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label
                          htmlFor={`price-${option.uuid}`}
                          className="block text-xs font-semibold text-gray-700 mb-1"
                        >
                          Flat Payout Amount ($) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`price-${option.uuid}`}
                          type="number"
                          step="0.01"
                          placeholder={defaultPrice > 0 ? `e.g. ${Number(defaultPrice).toFixed(2)} (Default)` : "e.g. 120.00"}
                          value={optionData?.vendor_price || ""}
                          onChange={(e) =>
                            handleOptionChange(
                              option.uuid ?? "",
                              "vendor_price",
                              e.target.value === "" ? 0 : Number(e.target.value),
                            )
                          }
                          className={`h-[38px] w-full border text-xs ${
                            hasError ? "border-red-500" : "border-gray-300"
                          }`}
                          style={{
                            backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                          }}
                          disabled={isVendor}
                        />
                        {hasError && (
                          <p className="text-red-500 text-xs mt-1">
                            {fieldErrors[priceErrorKey][0]}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Time Adjustment */}
                    <div>
                      <Label
                        htmlFor={`time-${option.uuid}`}
                        className="block text-xs font-semibold text-gray-700 mb-1"
                      >
                        Time Adjustment <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={optionData?.adjustment_time !== null && optionData?.adjustment_time !== undefined ? String(optionData.adjustment_time) : "no adjustment"}
                        onValueChange={(value) =>
                          handleOptionChange(option.uuid ?? "", "adjustment_time", value)
                        }
                        disabled={isVendor}
                      >
                        <SelectTrigger
                          className="h-[38px] w-full border text-xs border-gray-300"
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
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
      {!isVendor && (
        <div className="flex justify-end mr-0 md:mr-9 mt-4">
          <Button
            className={`w-[110px] h-[35px] border-[1px] ${userType}-border ${userType}-bg text-[14px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg`}
            onClick={() =>
              handleRemove(selectedService?.vendor_service_id ?? "")
            }
          >
            Remove
          </Button>
        </div>
      )}
      {showTimeFields && productOptions.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-xs">
          No product options available for this service
        </div>
      )}
    </div>
  );
};

export default ServiceItem;
