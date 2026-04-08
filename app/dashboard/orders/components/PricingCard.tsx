import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { CleanedProductOption } from "../../services/services";
import { SelectedService } from "./Services";
import { Services } from "../../services/page";
import { useOrderContext } from "../context/OrderContext";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { useSearchParams } from 'next/navigation';

interface PricingCardProps {
  title: string;
  pricingOptions?: CleanedProductOption[];
  setSelectedServices?: React.Dispatch<React.SetStateAction<SelectedService[]>>;
  selectedServices?: SelectedService[];
  service: Services;
  squareFootage: number
  showAll?: boolean
}

export default function PricingCard({ title, pricingOptions, setSelectedServices, service, selectedServices, squareFootage, showAll }: PricingCardProps) {
  const {
    selectedOptions,
    setSelectedOptions,
    customPrices,
    setCustomPrices,
    customServiceNames,
    setCustomServiceNames,
    selectedListingId,
    setSelectedSlots,
  } = useOrderContext();
  const [switchEnabled, setSwitchEnabled] = useState(false);
  const { userType } = useAppContext()
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string)?.toLowerCase() || 'admin';
  const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

  const fieldBg = `color-mix(in srgb, ${roleSettings.pageBg} 95%, black)`;
  const fieldBorder = `color-mix(in srgb, ${roleSettings.pageBg} 80%, black)`;

  const selectedOption = selectedOptions[service.uuid] || null;
  const customPrice = customPrices[service.uuid] || '';
  const customServiceName = customServiceNames[service.uuid] || '';

  const selectedServiceItem = useMemo(() => {
    return (selectedServices ?? []).find((s) => s.uuid === service.uuid);
  }, [selectedServices, service.uuid]);

  const searchParams = useSearchParams();
  const isEdit = searchParams.get('isEdit') === 'true';

  const isSelected = !!selectedServiceItem;
  const isPaid = selectedServiceItem?.payment_status?.toUpperCase() === 'PAID';
  const isOriginallyBooked = !!selectedServiceItem?.service_uuid && !isEdit;
  const isCompleted = !!(selectedServiceItem?.is_completed);
  const isBooked = isOriginallyBooked && !switchEnabled;

  const isNewBookingSelected = useMemo(() => {
    return (selectedServices ?? []).some((s) => s.uuid === service.uuid && !s.service_uuid);
  }, [selectedServices, service.uuid]);

  const isEffectivelySelected = useMemo(() => {
    if (isOriginallyBooked) {
      if (!switchEnabled) return true; // Card shows as selected/booked when switch is off
      if (isCompleted) return isNewBookingSelected; // Re-book: starts unselected
      return true; // Upgrade: starts pre-selected
    }
    return isSelected;
  }, [isOriginallyBooked, switchEnabled, isCompleted, isNewBookingSelected, isSelected]);

  const isPhotoService = useMemo(() => {
    const name = service.name?.toLowerCase() || '';
    const cat = service.category?.name?.toLowerCase() || '';
    const keywords = ['photo', 'twilight', 'hdr', 'still', 'drone', 'video', 'pano', 'matterport'];
    return keywords.some(k => name.includes(k) || cat.includes(k));
  }, [service.name, service.category?.name]);

  const calculatedPriceForPhoto = useMemo(() => {
    if (!isPhotoService || !pricingOptions || pricingOptions.length === 0) return null;
    const firstOpt = pricingOptions[0];
    const baseAmount = firstOpt?.amount ?? 0;
    const baseQty = firstOpt?.quantity || 1;
    const qtyValue = parseInt(customServiceNames[service.uuid]) || 0;
    return (baseAmount / baseQty) * qtyValue;
  }, [isPhotoService, pricingOptions, customServiceNames, service.uuid]);

  const selectedPrice = useMemo(() => {
    const option = selectedOptions[service.uuid];
    if (!option) return null;

    if (option === "custom") {
      if (isPhotoService) {
        return calculatedPriceForPhoto;
      }
      return customPrices[service.uuid] ? Number(customPrices[service.uuid]) : null;
    }

    const found = pricingOptions?.find(opt => opt.title === option);
    if (found?.sq_ft_rate && parseFloat(found.sq_ft_rate) > 0) {
      const calculated = parseFloat(found.sq_ft_rate) * squareFootage;
      return found.min_price ? Math.max(calculated, found.min_price) : calculated;
    }

    return found?.amount ?? null;
  }, [selectedOptions, customPrices, pricingOptions, service.uuid, squareFootage, isPhotoService, calculatedPriceForPhoto]);

  const displayPrice = useMemo(() => {
    if (isPhotoService && selectedOption === "custom") {
      return calculatedPriceForPhoto !== null ? Number(calculatedPriceForPhoto).toFixed(2) : '';
    }
    if (selectedOption === "custom") {
      return customPrice !== '' ? Number(customPrice).toFixed(2) : '';
    }
    return selectedPrice !== null ? Number(selectedPrice).toFixed(2) : '';
  }, [isPhotoService, calculatedPriceForPhoto, selectedOption, customPrice, selectedPrice]);


  useEffect(() => {
    if (!pricingOptions || pricingOptions.length === 0) return;
    if (selectedOption === "custom") return;

    let FilteredOptions = [];

    if (showAll) {
      FilteredOptions = pricingOptions;
    } else {
      if (isPhotoService || !squareFootage) {
        FilteredOptions = pricingOptions;
      } else {
        FilteredOptions = pricingOptions.filter((option) => {
          if (option.sq_ft_rate && parseFloat(option.sq_ft_rate) > 0) return true;
          if (!option?.sq_ft_range || typeof option.sq_ft_range !== "string") return false;
          const [minStr, maxStr] = option.sq_ft_range.split("-").map(s => s.trim());
          const min = parseInt(minStr, 10);
          const max = parseInt(maxStr, 10);
          if (isNaN(min) || isNaN(max)) return false;
          return squareFootage >= min && squareFootage <= max;
        });
      }
    }

    const isValid = FilteredOptions.some(opt => opt.title === selectedOption);

    if (!isValid && FilteredOptions.length > 0) {
      const defaultVal = FilteredOptions[0].title ?? '';
      setSelectedOptions(prev => ({
        ...prev,
        [service.uuid]: defaultVal,
      }));
    }
  }, [pricingOptions, selectedOption, service.uuid, setSelectedOptions, selectedListingId, squareFootage, showAll, isPhotoService]);

  const getEffectivePriceAndQty = (optionTitle?: string, customAmt?: string, forcedQty?: string) => {
    const currentOption = optionTitle ?? selectedOption;
    const currentCustom = customAmt ?? customPrice;
    const currentCustomName = forcedQty ?? customServiceName;

    if (!currentOption) return { price: undefined, quantity: 1, option_id: undefined, custom: undefined, optionName: "" };

    const selectedOptionData = pricingOptions?.find(opt => opt.title === currentOption);
    let price: number | undefined = undefined;
    let quantity = selectedOptionData?.quantity ?? 1;
    let option_id = selectedOptionData?.uuid;
    let custom: string | undefined = undefined;
    let optionName = currentOption;

    if (currentOption === "custom") {
      if (isPhotoService) {
        const firstOpt = pricingOptions?.[0];
        const baseAmount = firstOpt?.amount ?? 0;
        const baseQty = firstOpt?.quantity || 1;
        const qtyValue = parseInt(currentCustomName) || 0;

        quantity = qtyValue;
        price = (baseAmount / baseQty) * quantity;
        option_id = undefined;
        custom = `${quantity} Units`;
        optionName = custom;
      } else {
        price = currentCustom ? Number(currentCustom) : undefined;
        quantity = 1;
        option_id = undefined;
        custom = customServiceName;
        optionName = customServiceName;
      }
    } else {
      if (selectedOptionData?.sq_ft_rate && parseFloat(selectedOptionData.sq_ft_rate) > 0) {
        const calculated = parseFloat(selectedOptionData.sq_ft_rate) * squareFootage;
        price = selectedOptionData.min_price ? Math.max(calculated, selectedOptionData.min_price) : calculated;
      } else {
        price = selectedOptionData?.amount ?? 0;
        quantity = selectedOptionData?.quantity || 1;
      }
    }

    return { price, quantity, option_id, custom, optionName };
  };

  const handleSelectService = (optionValue?: string, customVal?: string, forcedQty?: string) => {
    const { price, quantity, option_id, custom, optionName } = getEffectivePriceAndQty(optionValue, customVal, forcedQty);

    if (setSelectedServices) {
      setSelectedServices(prev => {
        const targetPredicate = (item: SelectedService) =>
          item.uuid === service.uuid && (isOriginallyBooked && isCompleted ? !item.service_uuid : true);

        const alreadySelected = prev.some(targetPredicate);
        if (alreadySelected) {
          return prev.map(item =>
            targetPredicate(item) ? { ...item, price, quantity, option_id, custom, optionName } : item
          );
        }
        return prev;
      });
    }
  };

  const handleToggleService = () => {
    if (isPaid || isBooked) return;
    if (!selectedOption) return;

    if (setSelectedServices) {
      setSelectedServices(prev => {
        if (isOriginallyBooked && switchEnabled) {
          if (isCompleted) {
            const isRebooked = prev.some(item => item.uuid === service.uuid && !item.service_uuid);
            if (isRebooked) {
              return prev.filter(item => !(item.uuid === service.uuid && !item.service_uuid));
            } else {
              const { price, quantity, option_id, custom, optionName } = getEffectivePriceAndQty();
              return [...prev, { title, uuid: service.uuid, price, quantity, option_id, custom, optionName, payment_status: 'UNPAID' }];
            }
          } else {
            const exists = prev.some(item => item.uuid === service.uuid);
            if (exists) {
              return prev.filter(item => item.uuid !== service.uuid);
            } else {
              const { price, quantity, option_id, custom, optionName } = getEffectivePriceAndQty();
              return [...prev, { title, uuid: service.uuid, price, quantity, option_id, custom, optionName, payment_status: 'UNPAID' }];
            }
          }
        } else {
          const alreadySelected = prev.some(item => item.uuid === service.uuid);
          if (alreadySelected) {
            return prev.filter(item => item.uuid !== service.uuid);
          } else {
            const { price, quantity, option_id, custom, optionName } = getEffectivePriceAndQty();
            return [...prev, { title, uuid: service.uuid, price, quantity, option_id, custom, optionName, payment_status: 'UNPAID' }];
          }
        }
      });
    }
  };

  return (
    <div className="relative group/card-wrapper pt-5 pl-5">
      {isOriginallyBooked && !isPaid && (
        <div className="absolute top-0 left-0 z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-white rounded-full p-1 shadow-md border hover:scale-110 transition-transform cursor-pointer">
                  <Switch
                    checked={switchEnabled}
                    onCheckedChange={(val) => {
                      setSwitchEnabled(val);
                      // When enabling Re-book mode on a completed service,
                      // clear previously loaded slots for this service so the
                      // schedule tab shows a fresh, empty calendar.
                      if (val && isCompleted) {
                        setSelectedSlots(prev =>
                          prev.filter(slot => slot.service_id !== service.uuid)
                        );
                      }
                    }}
                    className="scale-75 data-[state=checked]:bg-[var(--app-tab-color)]"
                    style={{
                      "--app-tab-color": roleSettings.pageTabColor
                    } as React.CSSProperties}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{isCompleted ? "rebook service" : "upgrade service"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <Card
        className={`!w-[250px] h-fit border-2 rounded-[6px] px-2 py-4 relative ${isBooked ? 'opacity-60 pointer-events-none' : ''}`}
        style={{
          backgroundColor: fieldBg,
          borderColor: isEffectivelySelected ? "#6BAE41" : fieldBorder,
          color: roleSettings.pageText
        }}
      >
        {isBooked && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#6BAE41] text-white px-3 py-0.5 rounded-full text-[10px] uppercase font-bold z-10 shadow-sm whitespace-nowrap">
            Booked
          </div>
        )}
        <CardContent className="p-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex justify-between gap-2 w-full items-center">
              <div
                onClick={handleToggleService}
                title={isPaid ? "Cannot modify - service has been paid" : isBooked ? "Service is already booked" : ""}
                className={`
                          p-1  w-6 h-6 flex justify-center items-center rounded-md border-[2px]
                          ${(isPaid || isBooked) ? "cursor-not-allowed opacity-100" : !selectedOption ? "cursor-not-allowed opacity-100" : "cursor-pointer"}
                          ${isEffectivelySelected ? "bg-[#6BAE41] border-[#6BAE41]" : "bg-transparent border-[#BBBBBB]"}
                        `}
              >
                {isEffectivelySelected && (
                  <Check className="text-white w-4 h-4" />
                )}
              </div>
              <div
                className={`text-[16px] flex-1 text-left select-none ${!selectedOption || isPaid || isBooked ? "" : "cursor-pointer"}`}
                style={{ color: roleSettings.pageText }}
                onClick={handleToggleService}
              >
                <p>{title}</p>
              </div>
              <div className={`text-[20px] font-[500]`} style={{ color: isEffectivelySelected ? "#6BAE41" : roleSettings.pageText }}>
                ${selectedPrice !== null ? Number(selectedPrice).toFixed(2) : ''}
              </div>
            </div>
          </div>

          {Array.isArray(pricingOptions) && pricingOptions.length > 0 &&
            <Accordion type="single" collapsible defaultValue="pricing">
              <AccordionItem value="pricing" className="border-none">
                <AccordionTrigger className="text-[14px] font-[400] text-[#8E8E8E] flex justify-between">
                  Pricing Options
                </AccordionTrigger>
                <AccordionContent className="text-[#666666] text-[11px] font-[400]">
                  <RadioGroup
                    value={selectedOptions[service.uuid] || ''}
                    onValueChange={(value) => {
                      setSelectedOptions(prev => ({
                        ...prev,
                        [service.uuid]: value,
                      }));
                      handleSelectService(value);
                    }}
                    className="flex flex-col ">
                    <div className="flex flex-col items-center justify-between gap-[10px]">
                      {pricingOptions?.filter((option) => {
                        if (showAll || isPhotoService || !squareFootage) return true;
                        if (option.sq_ft_rate && parseFloat(option.sq_ft_rate) > 0) return true;
                        if (!option.sq_ft_range || typeof option.sq_ft_range !== "string") return false;
                        const [minStr, maxStr] = option.sq_ft_range.split("-").map(s => s.trim());
                        const min = parseInt(minStr, 10);
                        const max = parseInt(maxStr, 10);
                        if (isNaN(min) || isNaN(max)) return false;
                        return squareFootage >= min && squareFootage <= max;
                      }).map((option, idx) => (
                        <div key={idx} className="w-full flex items-center justify-between">
                          <RadioGroupItem
                            value={option?.title ?? ""}
                            disabled={isPaid || isBooked}
                            title={isPaid ? "Cannot modify - service has been paid" : isBooked ? "Service is already booked" : ""}
                            id={`option-${idx}`}
                            className={`w-[18px] h-[18px] border border-gray-400 rounded-[3px] relative
                                    appearance-none
                                    after:hidden
                                    data-[state=checked]:bg-transparent
                                    data-[state=checked]:before:content-['']
                                    data-[state=checked]:before:absolute
                                    data-[state=checked]:before:inset-0
                                    data-[state=checked]:before:m-auto
                                    data-[state=checked]:before:w-[14px]
                                    data-[state=checked]:before:h-[14px]
                                    data-[state=checked]:before:bg-[var(--checked-bg)]
                                    data-[state=checked]:before:rounded-[2px]`}
                            style={{
                              // @ts-expect-error: Custom CSS property for dynamic checked background
                              '--checked-bg': roleSettings.pageTabColor
                            }}
                          />
                          <label htmlFor={`option-${idx}`} className="">
                            {option?.title ?? ''}
                          </label>
                          <span className="">${
                            option.sq_ft_rate && parseFloat(option.sq_ft_rate) > 0
                              ? (option.min_price ? Math.max(parseFloat(option.sq_ft_rate) * squareFootage, option.min_price) : parseFloat(option.sq_ft_rate) * squareFootage).toFixed(2)
                              : Number(option?.amount).toFixed(2)
                          }</span>
                        </div>
                      ))}
                    </div>
                    {isPhotoService && (
                      <div>
                        <div className="flex items-center gap-2 mt-2">
                          <label htmlFor="custom" className="text-[11px] text-[#666666]">Custom</label>
                        </div>
                        <div className="grid grid-cols-8 gap-2 mt-2 items-center">
                          <RadioGroupItem
                            value="custom"
                            id="custom"
                            disabled={isPaid || isBooked}
                            title={isPaid ? "Cannot modify - service has been paid" : isBooked ? "Service is already booked" : ""}
                            className="w-[18px] h-[18px] border border-gray-400 rounded-[3px] relative
                              appearance-none
                              after:hidden
                              data-[state=checked]:bg-transparent
                              data-[state=checked]:before:content-['']
                              data-[state=checked]:before:absolute
                              data-[state=checked]:before:inset-0
                              data-[state=checked]:before:m-auto
                              data-[state=checked]:before:w-[14px]
                              data-[state=checked]:before:h-[14px]
                              data-[state=checked]:before:bg-[var(--checked-bg)]
                              data-[state=checked]:before:rounded-[2px]"
                            style={{
                              // @ts-expect-error: Custom CSS property for dynamic checked background
                              '--checked-bg': roleSettings.pageTabColor
                            }}
                          />
                          <Input
                            placeholder={isPhotoService ? "Qty" : "Service Name"}
                            type={isPhotoService ? "number" : "text"}
                            disabled={isPaid || isBooked}
                            className="h-[26px] px-[5px] bg-white text-[12px] font-medium text-gray-800 col-span-4 disabled:opacity-100 disabled:text-gray-800"
                            value={customServiceName}
                            onChange={(e) => {
                              if (isPaid || isBooked) return;
                              setCustomServiceNames(prev => ({
                                ...prev,
                                [service.uuid]: e.target.value,
                              }));
                              if (isPhotoService) {
                                setSelectedOptions(prev => ({ ...prev, [service.uuid]: "custom" }));
                                handleSelectService("custom", undefined, e.target.value);
                              }
                            }}
                          />
                          <div className="relative col-span-3 flex items-center h-[26px]">
                            <span className="absolute left-[6px] text-[12px] font-medium text-gray-800 pointer-events-none">$</span>
                            <Input
                              type="number"
                              min={0}
                              placeholder="__"
                              disabled={isPaid || isBooked || (isPhotoService && selectedOption === "custom")}
                              className="h-full pl-[16px] pr-[3px] bg-white text-[12px] font-medium text-gray-800 w-full disabled:opacity-100 disabled:text-gray-800"
                              value={displayPrice}
                              onChange={e => {
                                if (isPaid || isBooked) return;
                                if (isPhotoService && selectedOption === "custom") return;
                                setCustomPrices(prev => ({
                                  ...prev,
                                  [service.uuid]: e.target.value,
                                }));
                                if (selectedOption === "custom") {
                                  handleSelectService("custom", e.target.value);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </RadioGroup>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          }
        </CardContent>
      </Card>
    </div>
  );
}
