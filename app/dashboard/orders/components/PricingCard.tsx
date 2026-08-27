import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, AlertTriangle } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { CleanedProductOption } from "../../services/services";
import { SelectedService } from "./Services";
import { Services } from "../../services/page";
import { useOrderContext } from "../context/OrderContext";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { useSearchParams } from 'next/navigation';
import { calcCustomSqftPrice, calcCustomQtyPrice, isSqFtInRange } from "@/lib/pricingUtils";

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
    selectedAddOns,
    setSelectedAddOns,
    selectedListingId,
    setSelectedSlots,
    selectedSlots,
    isBookNowMode,
  } = useOrderContext();
  const [switchEnabled, setSwitchEnabled] = useState(false);
  const { userType } = useAppContext()
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string)?.toLowerCase() || (isBookNowMode ? 'agent' : 'admin');
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

  const hasPastSlots = useMemo(() => {
    const serviceSlots = (selectedSlots || []).filter(
      (slot) =>
        String(slot.service_id) === String(service.uuid) ||
        (service.id && String(slot.service_id) === String(service.id))
    );
    return serviceSlots.some((slot) => {
      try {
        const slotDate = new Date(`${slot.date} ${slot.start_time}`);
        return slotDate < new Date();
      } catch {
        return false;
      }
    });
  }, [selectedSlots, service.uuid, service.id]);

  const isNewBookingSelected = useMemo(() => {
    return (selectedServices ?? []).some((s) => s.uuid === service.uuid && !s.service_uuid);
  }, [selectedServices, service.uuid]);

  const isEffectivelySelected = useMemo(() => {
    if (isOriginallyBooked) {
      if (!switchEnabled) return true;
      if (isCompleted) return isNewBookingSelected;
      return true;
    }
    return isSelected;
  }, [isOriginallyBooked, switchEnabled, isCompleted, isNewBookingSelected, isSelected]);

  const { hasAreaType, hasQuantityType, isLegacyPhotoService, isFloorplanOrTour } = useMemo(() => {
    const name = service.name?.toLowerCase() || '';
    const cat = service.category?.name?.toLowerCase() || '';
    const photoKeywords = ['photo', 'twilight', 'hdr', 'still', 'drone', 'pano'];
    const fpKeywords = ['floorplan', 'floor plan', '3d tour', 'matterport', 'video'];

    return {
      hasAreaType: service.category?.type?.includes('area') || false,
      hasQuantityType: service.category?.type?.includes('quantity') || false,
      isLegacyPhotoService: photoKeywords.some(k => name.includes(k) || cat.includes(k)) && !name.includes('video'),
      isFloorplanOrTour: fpKeywords.some(k => name.includes(k) || cat.includes(k))
    };
  }, [service.name, service.category?.name, service.category?.type]);

  const isQuantityModeSupported = hasQuantityType || (!hasAreaType && !hasQuantityType && !isFloorplanOrTour);
  const isAreaModeSupported = hasAreaType || (!hasAreaType && !hasQuantityType && !isLegacyPhotoService);
  const isHybrid = isQuantityModeSupported && isAreaModeSupported;

  const defaultMode = isFloorplanOrTour ? 'area' : (isLegacyPhotoService ? 'quantity' : (hasAreaType ? 'area' : 'quantity'));

  const [activeCalculationMode, setActiveCalculationMode] = useState<'area' | 'quantity'>(defaultMode);

  const currentCalcMode = isHybrid ? activeCalculationMode : (isQuantityModeSupported ? 'quantity' : 'area');

  const customCalcResult = useMemo(() => {
    if (!pricingOptions || pricingOptions.length === 0) return null;
    // Bug 4 fixed: use parseFloat so decimal sqft values (e.g. "1500.5") are not truncated
    const inputVal = parseFloat(customServiceNames[service.uuid] ?? '') || 0;

    if (currentCalcMode === 'quantity') {
      // Bug 6 fixed: do NOT fall back to qty=1 when field is empty — return null instead
      if (inputVal <= 0) return null;
      return calcCustomQtyPrice(pricingOptions, inputVal);
    } else {
      // SqFt mode: prefer what the user typed, fall back to property sqft
      const sqft = inputVal > 0 ? inputVal : squareFootage;
      if (sqft <= 0) return null;
      return calcCustomSqftPrice(pricingOptions, sqft);
    }
  }, [currentCalcMode, pricingOptions, customServiceNames, service.uuid, squareFootage]);

  const calculatedCustomPrice = customCalcResult?.price ?? null;

  const recommendedOption = useMemo(() => {
    if (!pricingOptions || pricingOptions.length === 0 || !squareFootage || squareFootage <= 0) return null;
    return pricingOptions.find(
      (opt) =>
        opt.sq_ft_range &&
        typeof opt.sq_ft_range === "string" &&
        opt.sq_ft_range.trim() !== "" &&
        isSqFtInRange(opt.sq_ft_range, squareFootage)
    ) || null;
  }, [pricingOptions, squareFootage]);

  const selectedPrice = useMemo(() => {
    const option = selectedOptions[service.uuid];
    if (!option) return null;

    if (option === "custom") {
      if (currentCalcMode === 'quantity' || (currentCalcMode === 'area' && calculatedCustomPrice !== null)) {
        if (customPrices[service.uuid]) return Number(customPrices[service.uuid]);
        return calculatedCustomPrice;
      }
      return customPrices[service.uuid] ? Number(customPrices[service.uuid]) : null;
    }

    const found = pricingOptions?.find(opt => opt.title === option);
    if (!found?.sq_ft_range && found?.sq_ft_rate && parseFloat(found.sq_ft_rate) > 0) {
      const calculated = parseFloat(found.sq_ft_rate) * squareFootage;
      return found.min_price ? Math.max(calculated, found.min_price) : calculated;
    }

    return found?.amount ?? null;
  }, [selectedOptions, customPrices, pricingOptions, service.uuid, squareFootage, currentCalcMode, calculatedCustomPrice]);

  const displayPrice = useMemo(() => {
    if (customPrice !== '') return Number(customPrice).toFixed(2);
    // Only auto-fill the calculated price when the user has explicitly chosen
    // the "custom" option — never populate it for a regular tier selection.
    if (selectedOption === 'custom' && calculatedCustomPrice !== null)
      return Number(calculatedCustomPrice).toFixed(2);
    return '';
  }, [calculatedCustomPrice, customPrice, selectedOption]);


  useEffect(() => {
    if (!pricingOptions || pricingOptions.length === 0) return;

    if (title.toLowerCase().includes("matterport") || service.name?.toLowerCase().includes("matterport")) {
      console.log("=== MATTERPORT PRICING DEBUG ===");
      console.log("Service Name:", service.name);
      console.log("Property Square Footage:", squareFootage);
      console.log("All Pricing Options:", pricingOptions);
      console.log("Current Selected Option:", selectedOption);
      console.log("Current Calc Mode:", currentCalcMode);
      
      pricingOptions.forEach(opt => {
        console.log(`Option: "${opt.title}" | Range: "${opt.sq_ft_range}" | Amount: ${opt.amount} | Is In Range? ->`, isSqFtInRange(opt.sq_ft_range, squareFootage));
      });
    }

    if (selectedOption === "custom" && !isHybrid) return;

    let FilteredOptions = [];

    if (showAll) {
      FilteredOptions = pricingOptions;
    } else {
      if (currentCalcMode === 'quantity' || !squareFootage || !isFloorplanOrTour) {
        FilteredOptions = pricingOptions;
      } else {
        FilteredOptions = pricingOptions.filter((option) => {
          if (option.sq_ft_range && typeof option.sq_ft_range === "string" && option.sq_ft_range.trim() !== "") {
            return isSqFtInRange(option.sq_ft_range, squareFootage);
          }
          if (option.sq_ft_rate && parseFloat(option.sq_ft_rate) > 0) return true;
          return false;
        });
      }
    }

    const isValid = FilteredOptions.some(opt => opt.title === selectedOption);

    if (title.toLowerCase().includes("matterport") || service.name?.toLowerCase().includes("matterport")) {
      console.log("Filtered Options matching sqft:", FilteredOptions);
      console.log("Is current selected option valid for sqft?:", isValid);
    }

    if (FilteredOptions.length === 0 && pricingOptions.length > 0) {
      if (userType === 'admin') {
        if (selectedOption !== "custom") {
          setSelectedOptions(prev => ({
            ...prev,
            [service.uuid]: "custom",
          }));
        }
        // Pre-fill the sqft input with the property's square footage so the
        // calculated price is immediately correct and visible to the user.
        if (squareFootage > 0) {
          setCustomServiceNames(prev => {
            // Only set if the user hasn't already typed a custom value
            if (!prev[service.uuid]) {
              return { ...prev, [service.uuid]: String(squareFootage) };
            }
            return prev;
          });
        }
      }
    } else if (selectedOption !== "custom") {
      const suggestedVal = (recommendedOption && FilteredOptions.some(opt => opt.title === recommendedOption.title))
        ? recommendedOption.title
        : null;

      if (!selectedOption) {
        const defaultVal = suggestedVal || FilteredOptions[0]?.title || '';
        if (defaultVal) {
          setSelectedOptions(prev => ({
            ...prev,
            [service.uuid]: defaultVal,
          }));
        }
      } else if (!isValid && FilteredOptions.length > 0) {
        const defaultVal = suggestedVal || FilteredOptions[0]?.title || '';
        console.log("Auto-selecting valid matching option:", defaultVal);
        setSelectedOptions(prev => ({
          ...prev,
          [service.uuid]: defaultVal,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingOptions, selectedOption, service.uuid, setSelectedOptions, selectedListingId, squareFootage, showAll, currentCalcMode, isHybrid, recommendedOption]);

  // Sync the recalculated price into selectedServices whenever squareFootage changes
  // so the right-panel "Order" section always reflects the current price.
  useEffect(() => {
    if (!isEffectivelySelected) return;
    if (!selectedOption || selectedOption === "custom") return;
    if (squareFootage <= 0) return;
    handleSelectService(selectedOption);
    // Only re-run when squareFootage changes — intentionally narrow to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squareFootage]);

  const availableAddOns = useMemo(() => {
    const rawAddOns = service.service_add_ons || (service as any).serviceAddOns || [];
    return rawAddOns.map((a: any) => ({
      uuid: a.uuid,
      title: a.title,
      amount: parseFloat(String(a.amount || 0)) || 0,
    }));
  }, [service]);

  const currentServiceAddOns = selectedAddOns[service.uuid] || [];
  const addOnsTotal = currentServiceAddOns.reduce((sum, a) => sum + (parseFloat(String(a.amount || 0)) || 0), 0);

  const getEffectivePriceAndQty = (optionTitle?: string, customAmt?: string, forcedQty?: string, customAddOns?: typeof currentServiceAddOns) => {
    const currentOption = optionTitle ?? selectedOption;
    const currentCustom = customAmt ?? customPrice;
    const currentCustomName = forcedQty ?? customServiceName;
    const activeAddOns = customAddOns !== undefined ? customAddOns : currentServiceAddOns;
    const activeAddOnsTotal = activeAddOns.reduce((sum, a) => sum + (parseFloat(String(a.amount || 0)) || 0), 0);

    if (!currentOption) {
      const fallbackPrice = activeAddOnsTotal > 0 ? activeAddOnsTotal : undefined;
      return { price: fallbackPrice, quantity: 1, option_id: undefined, custom: undefined, optionName: "", addOns: activeAddOns };
    }

    const selectedOptionData = pricingOptions?.find(opt => opt.title === currentOption);
    let basePrice: number | undefined = undefined;
    let quantity = selectedOptionData?.quantity ?? 1;
    let option_id = selectedOptionData?.uuid;
    let custom: string | undefined = undefined;
    let optionName = currentOption;

    if (currentOption === "custom") {
      if (currentCalcMode === 'quantity') {
        const qtyValue = parseInt(currentCustomName) || 0;
        const result = calcCustomQtyPrice(pricingOptions || [], qtyValue > 0 ? qtyValue : 1);
        quantity = qtyValue;
        basePrice = currentCustom ? parseFloat(currentCustom) : (result?.price !== undefined ? parseFloat(String(result.price)) : undefined);
        option_id = undefined;
        custom = `${quantity} Units`;
        optionName = custom;
      } else {
        // Bug 5 fixed: only fall back to squareFootage when it is actually > 0
        const sqftValue = parseFloat(currentCustomName) > 0
          ? parseFloat(currentCustomName)
          : (squareFootage > 0 ? squareFootage : 0);
        if (sqftValue > 0) {
          const result = calcCustomSqftPrice(pricingOptions || [], sqftValue);
          basePrice = currentCustom ? parseFloat(currentCustom) : (result?.price !== undefined ? parseFloat(String(result.price)) : undefined);
        } else {
          basePrice = currentCustom ? parseFloat(currentCustom) : undefined;
        }
        quantity = 1;
        option_id = undefined;
        custom = parseFloat(currentCustomName) > 0
          ? `${currentCustomName} sqft`
          : (squareFootage > 0 ? `${squareFootage} sqft` : 'Custom');
        optionName = custom;
      }
    } else {
      if (
        (!selectedOptionData?.sq_ft_range || String(selectedOptionData.sq_ft_range).trim() === '') &&
        selectedOptionData?.sq_ft_rate &&
        parseFloat(selectedOptionData.sq_ft_rate) > 0
      ) {
        const calculated = parseFloat(selectedOptionData.sq_ft_rate) * squareFootage;
        basePrice = selectedOptionData.min_price ? Math.max(calculated, selectedOptionData.min_price) : calculated;
      } else {
        basePrice = selectedOptionData?.amount !== undefined && selectedOptionData?.amount !== null ? parseFloat(String(selectedOptionData.amount)) : 0;
        quantity = selectedOptionData?.quantity || 1;
      }
    }

    const price = basePrice !== undefined ? (basePrice + activeAddOnsTotal) : (activeAddOnsTotal > 0 ? activeAddOnsTotal : undefined);

    return { price, quantity, option_id, custom, optionName, addOns: activeAddOns };
  };

  const handleSelectService = (optionValue?: string, customVal?: string, forcedQty?: string, customAddOns?: typeof currentServiceAddOns) => {
    const { price, quantity, option_id, custom, optionName, addOns } = getEffectivePriceAndQty(optionValue, customVal, forcedQty, customAddOns);

    if (setSelectedServices) {
      setSelectedServices(prev => {
        const targetPredicate = (item: SelectedService) =>
          item.uuid === service.uuid && (isOriginallyBooked && isCompleted ? !item.service_uuid : true);

        const alreadySelected = prev.some(targetPredicate);
        if (alreadySelected) {
          return prev.map(item =>
            targetPredicate(item) ? { ...item, price, quantity, option_id, custom, optionName, addOns } : item
          );
        }
        return prev;
      });
    }
  };

  const handleToggleAddOn = (addon: { uuid?: string; title: string; amount: number }) => {
    if (isPaid || isBooked || hasPastSlots) return;
    const existing = selectedAddOns[service.uuid] || [];
    const isChecked = existing.some(a => (addon.uuid && a.uuid === addon.uuid) || a.title === addon.title);
    const updatedAddOns = isChecked
      ? existing.filter(a => !(addon.uuid && a.uuid === addon.uuid) && a.title !== addon.title)
      : [...existing, { ...addon, amount: parseFloat(String(addon.amount || 0)) || 0 }];

    setSelectedAddOns(prev => ({
      ...prev,
      [service.uuid]: updatedAddOns
    }));

    if (setSelectedServices) {
      setSelectedServices(prev => {
        const targetPredicate = (item: SelectedService) =>
          item.uuid === service.uuid && (isOriginallyBooked && isCompleted ? !item.service_uuid : true);

        const alreadySelected = prev.some(targetPredicate);
        const effectiveOption = selectedOption || recommendedOption?.title || (pricingOptions && pricingOptions[0]?.title) || "";
        const effectiveData = getEffectivePriceAndQty(effectiveOption, undefined, undefined, updatedAddOns);

        if (alreadySelected) {
          return prev.map(item =>
            targetPredicate(item)
              ? { ...item, price: effectiveData.price, quantity: effectiveData.quantity, option_id: effectiveData.option_id, custom: effectiveData.custom, optionName: effectiveData.optionName, addOns: updatedAddOns }
              : item
          );
        } else {
          // If the service is not currently selected, selecting an add-on selects the service too
          if (!selectedOption && effectiveOption) {
            setSelectedOptions(p => ({ ...p, [service.uuid]: effectiveOption }));
          }
          return [...prev, {
            title,
            uuid: service.uuid,
            price: effectiveData.price,
            quantity: effectiveData.quantity,
            option_id: effectiveData.option_id,
            custom: effectiveData.custom,
            optionName: effectiveData.optionName,
            addOns: updatedAddOns,
            payment_status: 'UNPAID'
          }];
        }
      });
    }
  };

  const handleToggleService = () => {
    if (isPaid || isBooked || hasPastSlots) return;
    if (!selectedOption) return;

    if (setSelectedServices) {
      setSelectedServices(prev => {
        if (isOriginallyBooked && switchEnabled) {
          if (isCompleted) {
            const isRebooked = prev.some(item => item.uuid === service.uuid && !item.service_uuid);
            if (isRebooked) {
              return prev.filter(item => !(item.uuid === service.uuid && !item.service_uuid));
            } else {
              const { price, quantity, option_id, custom, optionName, addOns } = getEffectivePriceAndQty();
              return [...prev, { title, uuid: service.uuid, price, quantity, option_id, custom, optionName, addOns, payment_status: 'UNPAID' }];
            }
          } else {
            const exists = prev.some(item => item.uuid === service.uuid);
            if (exists) {
              return prev.filter(item => item.uuid !== service.uuid);
            } else {
              const { price, quantity, option_id, custom, optionName, addOns } = getEffectivePriceAndQty();
              return [...prev, { title, uuid: service.uuid, price, quantity, option_id, custom, optionName, addOns, payment_status: 'UNPAID' }];
            }
          }
        } else {
          const alreadySelected = prev.some(item => item.uuid === service.uuid);
          if (alreadySelected) {
            return prev.filter(item => item.uuid !== service.uuid);
          } else {
            const { price, quantity, option_id, custom, optionName, addOns } = getEffectivePriceAndQty();
            return [...prev, { title, uuid: service.uuid, price, quantity, option_id, custom, optionName, addOns, payment_status: 'UNPAID' }];
          }
        }
      });
    }
  };

  const noTierMatch = currentCalcMode === 'area' && pricingOptions && pricingOptions.length > 0 && !pricingOptions.some((option) => {
    if (option.sq_ft_rate && parseFloat(option.sq_ft_rate) > 0) return true;
    return isSqFtInRange(option.sq_ft_range, squareFootage);
  });

  return (
    <div className="relative group/card-wrapper pt-5 pl-5">
      {isOriginallyBooked && !isPaid && !hasPastSlots && (
        <div className="absolute top-0 left-0 z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-white rounded-full p-1 shadow-md border hover:scale-110 transition-transform cursor-pointer">
                  <Switch
                    checked={switchEnabled}
                    onCheckedChange={(val) => {
                      setSwitchEnabled(val);
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
        className={`w-full h-fit border-2 rounded-[6px] px-2 py-4 relative ${isBooked ? 'opacity-60 pointer-events-none' : ''}`}
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
                title={isPaid ? "Cannot modify - service has been paid" : hasPastSlots ? "Cannot modify - service schedule is in the past" : isBooked ? "Service is already booked" : ""}
                className={`
                          p-1  w-6 h-6 flex justify-center items-center rounded-md border-[2px]
                          ${(isPaid || isBooked || hasPastSlots) ? "cursor-not-allowed opacity-100" : !selectedOption ? "cursor-not-allowed opacity-100" : "cursor-pointer"}
                          ${isEffectivelySelected ? "bg-[#6BAE41] border-[#6BAE41]" : "bg-transparent border-[#BBBBBB]"}
                        `}
              >
                {isEffectivelySelected && (
                  <Check className="text-white w-4 h-4" />
                )}
              </div>
              <div
                className={`text-[16px] flex-1 text-left select-none ${!selectedOption || isPaid || isBooked || hasPastSlots ? "" : "cursor-pointer"}`}
                style={{ color: roleSettings.pageText }}
                onClick={handleToggleService}
              >
                <p>{title}</p>
              </div>
              <div className={`text-[20px] font-[500]`} style={{ color: isEffectivelySelected ? "#6BAE41" : roleSettings.pageText }}>
                ${selectedPrice !== null ? Number(selectedPrice + addOnsTotal).toFixed(2) : ''}
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
                  {noTierMatch && squareFootage > 0 && userType === 'admin' && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px]">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>
                        No pricing tier matches <strong>{squareFootage} sqft</strong>. Please enter a custom price below.
                      </span>
                    </div>
                  )}
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
                        // Photos, Staging, and all non-sqft-gated services: always show every option
                        if (!isFloorplanOrTour) return true;
                        // Admin showAll override
                        if (showAll) return true;
                        // No sqft entered yet: show all so the user can see available tiers
                        if (!squareFootage) return true;
                        // If option has a sq_ft_range string, test against range
                        if (option.sq_ft_range && typeof option.sq_ft_range === "string" && option.sq_ft_range.trim() !== "") {
                          return isSqFtInRange(option.sq_ft_range, squareFootage);
                        }
                        // Pure sq_ft_rate option without range (e.g. 2D/3D Floor Plans): always visible
                        if (option.sq_ft_rate && parseFloat(option.sq_ft_rate) > 0) return true;
                        return false;
                      }).map((option, idx) => {
                        const isRecommended = Boolean(
                          squareFootage > 0 &&
                          option.sq_ft_range &&
                          typeof option.sq_ft_range === "string" &&
                          option.sq_ft_range.trim() !== "" &&
                          isSqFtInRange(option.sq_ft_range, squareFootage)
                        );

                        return (
                        <div
                          key={idx}
                          className={`w-full flex items-center justify-between gap-2 p-1.5 rounded-md transition-all ${
                            isRecommended
                              ? 'bg-emerald-50/80 border border-emerald-300/80 shadow-xs'
                              : 'hover:bg-black/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem
                              value={option?.title ?? ""}
                              disabled={isPaid || isBooked || hasPastSlots}
                              title={isPaid ? "Cannot modify - service has been paid" : hasPastSlots ? "Cannot modify - service schedule is in the past" : isBooked ? "Service is already booked" : ""}
                              id={`option-${service.uuid}-${idx}`}
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
                            <label
                              htmlFor={`option-${service.uuid}-${idx}`}
                              className="text-left flex items-center gap-1.5 cursor-pointer select-none"
                            >
                              <span className={isRecommended ? 'font-semibold text-emerald-950' : ''}>
                                {option?.title ?? ''}
                              </span>
                              {isRecommended && (
                                <span className="text-[9px] font-bold tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-full uppercase leading-none">
                                  Recommended
                                </span>
                              )}
                            </label>
                          </div>
                          <span className={isRecommended ? 'font-semibold text-emerald-950' : ''}>${
                            (() => {
                              // If option has sq_ft_range (e.g. "2001-3000"), it is a tier-based fixed price option.
                              // sq_ft_rate in DB for ranges is often set to the flat amount (e.g. "235.00"), not a per-sqft multiplier.
                              const isPerSqFtRate = !option.sq_ft_range && option.sq_ft_rate && parseFloat(option.sq_ft_rate) > 0;
                              const calculatedPrice = isPerSqFtRate
                                ? (option.min_price ? Math.max(parseFloat(option.sq_ft_rate!) * squareFootage, option.min_price) : parseFloat(option.sq_ft_rate!) * squareFootage).toFixed(2)
                                : Number(option?.amount).toFixed(2);
                              
                              if (title.toLowerCase().includes("matterport") || service.name?.toLowerCase().includes("matterport")) {
                                console.log(`[MATTERPORT RENDER OPTION] Title: "${option.title}" | amount:`, option.amount, "| sq_ft_rate:", option.sq_ft_rate, "| output: $", calculatedPrice);
                              }
                              return calculatedPrice;
                            })()
                          }</span>
                        </div>
                      );})}
                    </div>

                    {userType === 'admin' && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <label htmlFor={`custom-${service.uuid}`} className="text-[11px] text-[#666666]">Custom Price</label>
                          {isHybrid && (
                            <select
                              className="text-[9px] bg-gray-200 border border-gray-300 rounded p-0.5 px-1 outline-none focus:ring-1 focus:ring-gray-400 cursor-pointer"
                              value={currentCalcMode}
                              disabled={isPaid || isBooked || hasPastSlots}
                              onChange={(e) => {
                                setActiveCalculationMode(e.target.value as 'area' | 'quantity');
                              }}
                            >
                              <option value="area">SqFt Mode</option>
                              <option value="quantity">Qty Mode</option>
                            </select>
                          )}
                        </div>

                        {currentCalcMode === 'area' && selectedOption === "custom" && customCalcResult && (
                          <div className="text-[9px] text-gray-500 mb-1">
                            {customCalcResult.method === 'explicit'
                              ? `${parseInt(customServiceNames[service.uuid]) || squareFootage || 0} sqft × $${customCalcResult.rate.toFixed(4)}/sqft = $${customCalcResult.price.toFixed(2)}`
                              : `${parseInt(customServiceNames[service.uuid]) || squareFootage || 0} sqft × $${customCalcResult.rate.toFixed(4)}/sqft (nearest tier) = $${customCalcResult.price.toFixed(2)}`
                            }
                          </div>
                        )}

                        <div className="grid grid-cols-8 gap-2 mt-1 items-center">
                          <RadioGroupItem
                            value="custom"
                            id={`custom-${service.uuid}`}
                            disabled={isPaid || isBooked || hasPastSlots}
                            title={isPaid ? "Cannot modify - service has been paid" : hasPastSlots ? "Cannot modify - service schedule is in the past" : isBooked ? "Service is already booked" : ""}
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
                            placeholder={currentCalcMode === 'quantity' ? "Enter quantity" : "Enter sqft."}
                            type="number"
                            disabled={isPaid || isBooked || hasPastSlots}
                            className="h-[30px] px-[5px] bg-white text-[12px] font-medium text-gray-800 col-span-4 disabled:opacity-100 disabled:text-gray-800"
                            value={customServiceName}
                            onChange={(e) => {
                              if (isPaid || isBooked || hasPastSlots) return;
                              setCustomServiceNames(prev => ({
                                ...prev,
                                [service.uuid]: e.target.value,
                              }));
                              setSelectedOptions(prev => ({ ...prev, [service.uuid]: "custom" }));
                              handleSelectService("custom", undefined, e.target.value);
                            }}
                          />
                          <div className="relative col-span-3 flex items-center h-[30px]">
                            <span className="absolute left-[6px] text-[12px] font-medium text-gray-800 pointer-events-none">$</span>
                            <Input
                              type="number"
                              min={0}
                              placeholder="__"
                              disabled={isPaid || isBooked || hasPastSlots}
                              className="h-full pl-[16px] pr-[3px] bg-white text-[12px] font-medium text-gray-800 w-full disabled:opacity-100 disabled:text-gray-800"
                              value={displayPrice}
                              onChange={e => {
                                if (isPaid || isBooked) return;
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

                  {availableAddOns && availableAddOns.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-semibold text-[#8E8E8E] uppercase tracking-wider">Add-ons</span>
                        {currentServiceAddOns.length > 0 && (
                          <span className="text-[10px] text-[#6BAE41] font-semibold">
                            +{currentServiceAddOns.length} selected (+${addOnsTotal.toFixed(2)})
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {availableAddOns.map((addon, aIdx) => {
                          const isAddonChecked = currentServiceAddOns.some(
                            a => (addon.uuid && a.uuid === addon.uuid) || a.title === addon.title
                          );
                          return (
                            <div
                              key={aIdx}
                              onClick={() => handleToggleAddOn(addon)}
                              className={`flex items-center justify-between p-1.5 px-2 rounded-md border transition-all cursor-pointer ${
                                isAddonChecked
                                  ? 'bg-green-50/80 border-[#6BAE41] text-gray-900'
                                  : 'bg-white/60 border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                                    isAddonChecked ? 'bg-[#6BAE41] border-[#6BAE41]' : 'border-gray-400 bg-white'
                                  }`}
                                >
                                  {isAddonChecked && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-[12px] font-medium select-none">{addon.title}</span>
                              </div>
                              <span className={`text-[12px] font-semibold ${isAddonChecked ? 'text-[#6BAE41]' : 'text-gray-600'}`}>
                                +${Number(addon.amount).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          }
          {(!Array.isArray(pricingOptions) || pricingOptions.length === 0) && availableAddOns && availableAddOns.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 px-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-[#8E8E8E] uppercase tracking-wider">Add-ons</span>
                {currentServiceAddOns.length > 0 && (
                  <span className="text-[10px] text-[#6BAE41] font-semibold">
                    +{currentServiceAddOns.length} selected (+${addOnsTotal.toFixed(2)})
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {availableAddOns.map((addon, aIdx) => {
                  const isAddonChecked = currentServiceAddOns.some(
                    a => (addon.uuid && a.uuid === addon.uuid) || a.title === addon.title
                  );
                  return (
                    <div
                      key={aIdx}
                      onClick={() => handleToggleAddOn(addon)}
                      className={`flex items-center justify-between p-1.5 px-2 rounded-md border transition-all cursor-pointer ${
                        isAddonChecked
                          ? 'bg-green-50/80 border-[#6BAE41] text-gray-900'
                          : 'bg-white/60 border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                            isAddonChecked ? 'bg-[#6BAE41] border-[#6BAE41]' : 'border-gray-400 bg-white'
                          }`}
                        >
                          {isAddonChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-[12px] font-medium select-none">{addon.title}</span>
                      </div>
                      <span className={`text-[12px] font-semibold ${isAddonChecked ? 'text-[#6BAE41]' : 'text-gray-600'}`}>
                        +${Number(addon.amount).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
