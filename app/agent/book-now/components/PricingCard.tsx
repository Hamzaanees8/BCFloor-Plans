import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Services } from "@/app/dashboard/services/page";
import { useBookNowContext } from "../context/BookNowContext";
import { useAppContext } from "@/app/context/AppContext";

interface CleanedProductOption {
  uuid?: string;
  title?: string;
  amount?: string | number;
  quantity?: number;
  sq_ft_rate?: string;
  sq_ft_range?: string;
  min_price?: number;
}

interface PricingCardProps {
  title: string;
  pricingOptions?: CleanedProductOption[];
  service: Services;
  squareFootage: number;
  showAll?: boolean;
}

export default function PricingCard({
  title,
  pricingOptions,
  service,
  squareFootage,
  showAll,
}: PricingCardProps) {
  const {
    selectedServices,
    setSelectedServices,
    selectedOptions,
    setSelectedOptions,
    customPrices,
    setCustomPrices,
    customServiceNames,
    setCustomServiceNames,
  } = useBookNowContext();
  const { userType } = useAppContext();

  const fieldBg = "#f5f5f5";
  const fieldBorder = "#BBBBBB";
  const pageTabColor = "#4290E9";
  const pageText = "#666666";

  const selectedOption = selectedOptions[service.uuid] || null;
  const customPrice = customPrices[service.uuid] || "";
  const customServiceName = customServiceNames[service.uuid] || "";

  const selectedServiceItem = useMemo(() => {
    return selectedServices.find((s) => s.uuid === service.uuid);
  }, [selectedServices, service.uuid]);

  const isSelected = !!selectedServiceItem;
  const isPaid = selectedServiceItem?.payment_status?.toUpperCase() === "PAID";

  const selectedPrice = useMemo(() => {
    const option = selectedOptions[service.uuid];
    if (!option) return null;

    if (option === "custom") {
      return customPrices[service.uuid]
        ? Number(customPrices[service.uuid])
        : null;
    }

    const found = pricingOptions?.find((opt) => opt.title === option);
    if (found?.sq_ft_rate && parseFloat(String(found.sq_ft_rate)) > 0) {
      const calculated = parseFloat(String(found.sq_ft_rate)) * squareFootage;
      return found.min_price
        ? Math.max(calculated, found.min_price)
        : calculated;
    }
    return found?.amount ? Number(found.amount) : null;
  }, [selectedOptions, customPrices, pricingOptions, service.uuid, squareFootage]);

  useEffect(() => {
    if (!pricingOptions || pricingOptions.length === 0) return;
    if (selectedOption === "custom") return;

    let FilteredOptions = [];

    if (showAll) {
      FilteredOptions = pricingOptions;
    } else {
      const isPhotoService =
        service.name?.toLowerCase().includes("photo") ||
        service.category?.name?.toLowerCase().includes("photo") ||
        service.name?.toLowerCase().includes("twilight") ||
        service.category?.name?.toLowerCase().includes("twilight");

      if (isPhotoService || !squareFootage) {
        FilteredOptions = pricingOptions;
      } else {
        FilteredOptions = pricingOptions.filter((option) => {
          // Add check for sq_ft_rate
          if (option.sq_ft_rate && parseFloat(String(option.sq_ft_rate)) > 0)
            return true;

          if (
            !option?.sq_ft_range ||
            typeof option.sq_ft_range !== "string"
          )
            return false;
          const [minStr, maxStr] = option.sq_ft_range
            .split("-")
            .map((s) => s.trim());
          const min = parseInt(minStr, 10);
          const max = parseInt(maxStr, 10);
          if (isNaN(min) || isNaN(max)) return false;
          return squareFootage >= min && squareFootage <= max;
        });
      }
    }

    const isValid = FilteredOptions.some((opt) => opt.title === selectedOption);

    if (!isValid && FilteredOptions.length > 0) {
      const defaultVal = FilteredOptions[0].title ?? "";
      setSelectedOptions((prev) => ({
        ...prev,
        [service.uuid]: defaultVal,
      }));
    }
  }, [
    pricingOptions,
    selectedOption,
    service.uuid,
    setSelectedOptions,
    squareFootage,
    showAll,
    service.name,
    service.category?.name,
  ]);

  const handleSelectService = (optionValue?: string, customVal?: string) => {
    const currentOption = optionValue ?? selectedOption;
    const currentCustom = customVal ?? customPrice;

    if (!currentOption) return;

    const selectedOptionData = pricingOptions?.find(
      (opt) => opt.title === currentOption
    );
    let price: number | undefined = undefined;
    let quantity: number | undefined = selectedOptionData?.quantity ?? 1;
    let option_id: string | undefined = selectedOptionData?.uuid ?? undefined;
    let custom: string | undefined = undefined;
    let optionName: string;

    if (currentOption === "custom") {
      price = currentCustom ? Number(currentCustom) : undefined;
      quantity = 1;
      option_id = undefined;
      custom = customServiceName;
      optionName = customServiceName;
    } else {
      const opt = pricingOptions?.find((opt) => opt.title === currentOption);
      if (opt?.sq_ft_rate && parseFloat(String(opt.sq_ft_rate)) > 0) {
        const calculated = parseFloat(String(opt.sq_ft_rate)) * squareFootage;
        price = opt.min_price
          ? Math.max(calculated, opt.min_price)
          : calculated;
      } else {
        price = opt?.amount ? Number(opt.amount) : undefined;
      }
      optionName = opt?.title || "";
    }

    setSelectedServices((prev) => {
      const alreadySelected = prev.some((item) => item.uuid === service.uuid);
      if (alreadySelected) {
        return prev.map((item) =>
          item.uuid === service.uuid
            ? { ...item, price, quantity, option_id, custom, optionName }
            : item
        );
      }
      return prev;
    });
  };

  return (
    <Card
      className={`w-full h-fit border-2 rounded-[6px] px-2 py-4`}
      style={{
        backgroundColor: fieldBg,
        borderColor: isSelected ? pageTabColor : fieldBorder,
        color: pageText,
      }}
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex justify-between gap-2 w-full items-center">
            <div
              onClick={() => {
                if (isPaid) return;
                if (!selectedOption) return;

                let price: number | undefined = undefined;
                let quantity: number | undefined = 1;
                let option_id: string | undefined = undefined;
                let custom: string | undefined = undefined;
                let optionName: string;
                if (selectedOption === "custom") {
                  price = customPrice ? Number(customPrice) : undefined;
                  quantity = 1;
                  option_id = undefined;
                  optionName = customServiceName;
                  custom = customServiceName;
                } else {
                  const selectedOptionData = pricingOptions?.find(
                    (opt) => opt.title === selectedOption
                  );
                  if (
                    selectedOptionData?.sq_ft_rate &&
                    parseFloat(String(selectedOptionData.sq_ft_rate)) > 0
                  ) {
                    const calculated =
                      parseFloat(String(selectedOptionData.sq_ft_rate)) *
                      squareFootage;
                    price = selectedOptionData.min_price
                      ? Math.max(calculated, selectedOptionData.min_price)
                      : calculated;
                  } else {
                    price = selectedOptionData?.amount
                      ? Number(selectedOptionData.amount)
                      : undefined;
                  }
                  quantity = selectedOptionData?.quantity ?? 1;
                  option_id = selectedOptionData?.uuid;
                  optionName = selectedOptionData?.title || "";
                }

                setSelectedServices((prev) => {
                  const alreadySelected = prev.some(
                    (item) => item.uuid === service.uuid
                  );
                  if (alreadySelected) {
                    return prev.filter((item) => item.uuid !== service.uuid);
                  } else {
                    return [
                      ...prev,
                      {
                        title,
                        uuid: service.uuid,
                        price,
                        quantity,
                        option_id,
                        custom,
                        optionName,
                        payment_status: "UNPAID",
                        category_name: service.category?.name,
                      },
                    ];
                  }
                });
              }}
              title={
                isPaid ? "Cannot modify - service has been paid" : ""
              }
              style={{
                backgroundColor: isSelected ? pageTabColor : pageTabColor,
              }}
              className={`
                p-1 w-6 h-6 flex justify-center items-center rounded-md
                ${isPaid ? "cursor-not-allowed opacity-70" : !selectedOption ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                ${isSelected ? "bg-[#6BAE41]" : "bg-[#4290E9]"}
              `}
            >
              {isSelected ? (
                <Check className="text-white w-4 h-4" />
              ) : (
                <Plus className="text-white w-4 h-4" />
              )}
            </div>
            <div className="text-[16px] text-center" style={{ color: pageText }}>
              <p>{title}</p>
            </div>
            <div
              className={`text-[20px] font-[500]`}
              style={{
                color: isSelected ? pageTabColor : pageText,
              }}
            >
              ${selectedPrice !== null && selectedPrice !== undefined ? parseFloat(String(selectedPrice)).toFixed(2) : ""}
            </div>
          </div>
        </div>

        {Array.isArray(pricingOptions) && pricingOptions.length > 0 && (
          <Accordion type="single" collapsible defaultValue="pricing">
            <AccordionItem value="pricing" className="border-none">
              <AccordionTrigger className="text-[14px] font-[400] text-[#8E8E8E] flex justify-between">
                Pricing Options
              </AccordionTrigger>
              <AccordionContent className="text-[#666666] text-[11px] font-[400]">
                <RadioGroup
                  value={selectedOptions[service.uuid] || ""}
                  onValueChange={(value) => {
                    setSelectedOptions((prev) => ({
                      ...prev,
                      [service.uuid]: value,
                    }));
                    handleSelectService(value);
                  }}
                  className="flex flex-col"
                >
                  <div className="flex flex-col items-center justify-between gap-[10px]">
                    {pricingOptions
                      ?.filter((option) => {
                        const isPhotoService =
                          service.name?.toLowerCase().includes("photo") ||
                          service.category?.name?.toLowerCase().includes("photo") ||
                          service.name?.toLowerCase().includes("twilight") ||
                          service.category?.name?.toLowerCase().includes("twilight");

                        if (showAll || isPhotoService || !squareFootage)
                          return true;

                        // Check for sq_ft_rate
                        if (
                          option.sq_ft_rate &&
                          parseFloat(String(option.sq_ft_rate)) > 0
                        )
                          return true;

                        if (
                          !option.sq_ft_range ||
                          typeof option.sq_ft_range !== "string"
                        )
                          return false;

                        const [minStr, maxStr] = option.sq_ft_range
                          .split("-")
                          .map((s) => s.trim());
                        const min = parseInt(minStr, 10);
                        const max = parseInt(maxStr, 10);

                        if (isNaN(min) || isNaN(max)) return false;

                        return squareFootage >= min && squareFootage <= max;
                      })
                      .map((option, idx) => (
                        <div key={idx} className="w-full flex items-center justify-between">
                          <RadioGroupItem
                            value={option?.title ?? ""}
                            disabled={isPaid}
                            title={
                              isPaid
                                ? "Cannot modify - service has been paid"
                                : ""
                            }
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
                              "--checked-bg": pageTabColor,
                            }}
                          />
                          <label htmlFor={`option-${service.uuid}-${idx}`} className="">
                            {option?.title ?? ""}
                          </label>
                          <span className="">
                            $
                            {option.sq_ft_rate &&
                              parseFloat(String(option.sq_ft_rate)) > 0
                              ? (option.min_price
                                ? Math.max(
                                  parseFloat(String(option.sq_ft_rate)) *
                                  squareFootage,
                                  option.min_price
                                )
                                : parseFloat(String(option.sq_ft_rate)) *
                                squareFootage
                              ).toFixed(2)
                              : Number(option?.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mt-2">
                      <label htmlFor={`custom-${service.uuid}`} className="text-[11px] text-[#666666]">
                        Custom
                      </label>
                    </div>
                    <div className="grid grid-cols-8 gap-2 mt-2 items-center">
                      <RadioGroupItem
                        value="custom"
                        id={`custom-${service.uuid}`}
                        disabled={isPaid}
                        title={
                          isPaid
                            ? "Cannot modify - service has been paid"
                            : ""
                        }
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
                          "--checked-bg": pageTabColor,
                        }}
                      />
                      <Input
                        placeholder="Service Name"
                        disabled={isPaid}
                        className="h-[26px] px-[5px] bg-white text-[10px] col-span-5"
                        value={customServiceName}
                        onChange={(e) => {
                          if (isPaid) return;
                          setCustomServiceNames((prev) => ({
                            ...prev,
                            [service.uuid]: e.target.value,
                          }));
                        }}
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="$__"
                        disabled={isPaid || userType !== "admin"}
                        className="h-[26px] px-[3px] bg-gray-300 text-[10px] col-span-2"
                        value={customPrice}
                        onChange={(e) => {
                          if (isPaid || userType !== "admin") return;
                          setCustomPrices((prev) => ({
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
                </RadioGroup>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
