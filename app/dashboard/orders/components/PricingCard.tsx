import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { CleanedProductOption } from "../../services/services";
import { SelectedService } from "./Services";
import { Services } from "../../services/page";
import { useOrderContext } from "../context/OrderContext";
import { useAppContext } from "@/app/context/AppContext";

interface PricingCardProps {
  title: string;
  pricingOptions?: CleanedProductOption[];
  setSelectedServices?: React.Dispatch<React.SetStateAction<SelectedService[]>>;
  selectedServices?: SelectedService[];
  service: Services;
  squareFootage: number
}

export default function PricingCard({ title, pricingOptions, setSelectedServices, service, selectedServices, squareFootage }: PricingCardProps) {
  const {
    selectedOptions,
    setSelectedOptions,
    customPrices,
    setCustomPrices,
    customServiceNames,
    setCustomServiceNames,
    selectedListingId
  } = useOrderContext();
  const { userType } = useAppContext()
  const selectedOption = selectedOptions[service.uuid] || null;
  const customPrice = customPrices[service.uuid] || '';
  const customServiceName = customServiceNames[service.uuid] || '';
  //const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const isSelected = useMemo(() => {
    return (selectedServices ?? []).some((s) => s.uuid === service.uuid);
  }, [selectedServices, service.uuid]);
  const selectedPrice = useMemo(() => {
    const option = selectedOptions[service.uuid];
    if (!option) return null;

    if (option === "custom") {
      return customPrices[service.uuid] ? Number(customPrices[service.uuid]) : null;
    }

    const found = pricingOptions?.find(opt => opt.title === option);
    return found?.amount ?? null;
  }, [selectedOptions, customPrices, pricingOptions, service.uuid]);

  console.log('selected option', selectedOption);
  console.log('pricingoption', pricingOptions)

  useEffect(() => {
    if (selectedOption === "custom") return;

    const FilteredOptions = pricingOptions?.filter((option) => {
      if (!option?.sq_ft_range || typeof option.sq_ft_range !== "string") return false;
      const [minStr, maxStr] = option.sq_ft_range.split("-").map(s => s.trim());
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      if (isNaN(min) || isNaN(max)) return false;
      return squareFootage >= min && squareFootage <= max;
    }) ?? [];

    const isValid = FilteredOptions.some(opt => opt.title === selectedOption);

    if (!isValid && FilteredOptions.length > 0) {
      const defaultVal = FilteredOptions[0].title ?? '';
      setSelectedOptions(prev => ({
        ...prev,
        [service.uuid]: defaultVal,
      }));
    }
  }, [pricingOptions, selectedOption, service.uuid, setSelectedOptions, selectedListingId, squareFootage]);


  const handleSelectService = (optionValue?: string, customVal?: string) => {
    const currentOption = optionValue ?? selectedOption;
    const currentCustom = customVal ?? customPrice;

    if (!currentOption) return;
    const selectedOptionData = pricingOptions?.find(opt => opt.title === currentOption);
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
      price = pricingOptions?.find(opt => opt.title === currentOption)?.amount ?? undefined;
    }

    if (setSelectedServices) {
      setSelectedServices(prev => {
        const alreadySelected = prev.some(item => item.uuid === service.uuid);
        if (alreadySelected) {
          // Only update price for the selected service
          return prev.map(item =>
            item.uuid === service.uuid ? { ...item, price, quantity, option_id, custom, optionName } : item
          );
        }
        // If not already selected, do nothing
        return prev;
      });
    }
  };
  console.log("seeeee", selectedPrice)
  console.log('selectedService', selectedServices)
  console.log('selected option', selectedOption)
  return (
    <Card
      className={`!w-[250px] h-fit ${isSelected ? "border-[#6BAE41]" : "border-[#BBBBBB]"
        } bg-[#f5f5f5] border-2 rounded-[6px] px-2 py-4 text-[#333]`}
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex justify-between gap-2 w-full items-center">
            <div
              onClick={() => {
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
                  const selectedOptionData = pricingOptions?.find(opt => opt.title === selectedOption);
                  price = pricingOptions?.find(opt => opt.title === selectedOption)?.amount ?? undefined;
                  quantity = selectedOptionData?.quantity ?? 1;
                  option_id = selectedOptionData?.uuid;
                  optionName = selectedOptionData?.title || "";
                }

                if (setSelectedServices) {
                  setSelectedServices(prev => {
                    const alreadySelected = prev.some(item => item.uuid === service.uuid);
                    if (alreadySelected) {
                      return prev.filter(item => item.uuid !== service.uuid);
                    } else {
                      return [...prev, { title, uuid: service.uuid, price, quantity, option_id, custom, optionName }];
                    }
                  });
                }
              }}

              className={`
                        ${!selectedOption ? "cursor-not-allowed opacity-50" : ""}
                        ${isSelected ? "bg-[#6BAE41] cursor-pointer" : "bg-[#4290E9] cursor-pointer"}
                        p-1 w-6 h-6 flex justify-center items-center rounded-md
                      `}
            >
              {isSelected ? (
                <Check className="text-white w-4 h-4" />
              ) : (
                <Plus className="text-white w-4 h-4" />
              )}
            </div>
            <div className="text-[16px] text-[#424242] text-center"><p>{title}</p></div>
            <div className={`text-[20px] font-[500] ${isSelected ? "text-[#6BAE41]" : "text-[#424242]"}`}>
              ${selectedPrice ? Number(selectedPrice).toFixed(2) : ''}
            </div>

          </div>
        </div>

        {Array.isArray(pricingOptions) && pricingOptions.length > 0 &&
          <Accordion type="single" collapsible defaultValue="pricing">
            <AccordionItem value="pricing" className="border-none">
              <AccordionTrigger className="text-[14px]font-[400] text-[#8E8E8E] flex justify-between">
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
                    if (value === "custom") {
                      //setSelectedPrice(customPrice ? Number(customPrice) : null);
                    } else {
                      //const matched = pricingOptions.find((opt) => opt.title === value);
                      //if (matched) setSelectedPrice(matched.amount ?? null);
                    }
                    handleSelectService(value);
                  }}
                  className="flex flex-col ">
                  <div className="flex flex-col items-center justify-between gap-[10px]">
                    {pricingOptions?.filter((option) => {
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
                                  ${userType === 'admin'
                              ? 'data-[state=checked]:before:bg-[#4290E9]'
                              : 'data-[state=checked]:before:bg-[#6BAE41]'
                            }
                                  data-[state=checked]:before:rounded-[2px]`}
                        />
                        <label htmlFor={`option-${idx}`} className="">
                          {option?.title ?? ''}
                        </label>
                        <span className="">${Number(option?.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mt-2">
                      <label htmlFor="custom" className="text-[11px] text-[#666666]">Custom</label>
                    </div>
                    <div className="grid grid-cols-8 gap-2 mt-2 items-center">
                      <RadioGroupItem
                        value="custom"
                        id="custom"
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
                          data-[state=checked]:before:bg-[#4290E9]
                          data-[state=checked]:before:rounded-[2px]"
                      />
                      <Input
                        placeholder="Service Name"
                        className="h-[26px] px-[5px] bg-white text-[10px] col-span-5"
                        value={customServiceName}
                        onChange={(e) => {
                          setCustomServiceNames(prev => ({
                            ...prev,
                            [service.uuid]: e.target.value,
                          }));
                        }}
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="$__"
                        className="h-[26px] px-[3px] bg-white text-[10px] col-span-2"
                        value={customPrice}
                        onChange={e => {
                          setCustomPrices(prev => ({
                            ...prev,
                            [service.uuid]: e.target.value,
                          }));
                          if (selectedOption === "custom") {
                            //setSelectedPrice(e.target.value ? Number(e.target.value) : null);
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

        }
      </CardContent>
    </Card>
  );
}
