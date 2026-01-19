import * as React from "react";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Services } from "../../services/page";
import { useAppContext } from "@/app/context/AppContext";

type Vendor = {
  uuid?: string;
  id?: number;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  status?: boolean;
  // vendor_services: VendorService[];
  company?: { uuid: string, company_name: string, vendor_id?: string }
  address?: string
  primary_phone?: string;
  secondary_phone?: string;
  company_name: string;
  avatar_url?: string;
  // addresses: Address[];
  work_hours: {
    start_time: string;
    end_time: string;
    break_start: string;
    break_end: string;
  }
};
type Option = {
  label: string;
  value: string;
};

type MultiSelectType = "vendor" | "service" | "day";

interface BaseProps {
  selected: string[];
  setSelected: (values: string[]) => void;
  title: string;
  singleSelect: boolean;
  type: MultiSelectType;
}

interface VendorProps extends BaseProps {
  type: "vendor";
  options: Vendor[];
}

interface ServiceProps extends BaseProps {
  type: "service";
  options: Services[];
}

interface DayProps extends BaseProps {
  type: "day";
  options: Option[];
}

type MultiSelectProps = VendorProps | ServiceProps | DayProps;
function toOption(item: Vendor | Services | Option, type: MultiSelectType): Option {
  if (type === "vendor") {
    const vendor = item as Vendor;
    return { label: vendor.first_name + " " + vendor.last_name, value: String(vendor.uuid ?? '') };
  } else if (type === "service") {
    const service = item as Services;
    return { label: service.name || '', value: String(service.id ?? 0) };
  } else {
    return item as Option;
  }
}

export function MultiSelectDropdown({
  options,
  selected,
  setSelected,
  title,
  singleSelect,
  type,
}: MultiSelectProps) {
  const { userType } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const isSelectAll = selected.length === 1 && selected[0] === "ALL";
  //('options', options);

  useEffect(() => {
    if (selected.length === 0 && options.length > 0) {
      if (singleSelect) {
        const first = toOption(options[0], type);
        setSelected([first.value]);
      } else {
        setSelected(["ALL"]);
      }
    }
  }, [singleSelect, selected, setSelected, options, type]);

  const handleToggle = (value: string) => {
    if (singleSelect) {
      setSelected([value]);
    } else {
      if (value === "ALL") {
        setSelected(["ALL"]);
      } else {
        const filtered = selected.filter((v) => v !== "ALL");
        if (selected.includes(value)) {
          setSelected(filtered.filter((v) => v !== value));
        } else {
          setSelected([...filtered, value]);
        }
      }
    }
  };

  function getHSLColorFromID(id: number): string {
    const hue = (id * 137.508) % 360;
    const saturation = 70;
    const lightness = 85;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  const allLabel =
    type === "vendor" ? "All Vendors" :
      type === "service" ? "All Services" :
        "Select All";

  // const selectedLabels = isSelectAll
  //   ? [allLabel]
  //   : options
  //     .map((item) => toOption(item, type))
  //     .filter((opt) => selected.includes(opt.value))
  //     .map((opt) => opt.label);

  let selectedLabels: string[] = [];

  if (isSelectAll) {
    selectedLabels = [allLabel];
  } else {
    selectedLabels = options
      .map((item) => toOption(item, type))
      .filter((opt) => selected.includes(opt.value))
      .map((opt) => opt.label);

    if (type === 'service' && selected.includes('TIME_OFF')) {
      selectedLabels.unshift('Time Off');
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-[42px] bg-[#F2F2F2] border-[#BBBBBB] text-[#666666] font-alexandria flex items-center justify-between space-x-2"
        >
          <span className="truncate max-w-[calc(100%-1.5rem)] flex items-center gap-2">
            {isSelectAll ? (allLabel) : (
              <>
                {type === 'service' && selected.includes('TIME_OFF') && (
                  <span className="flex items-center gap-1">Time Off{selected.length > 1 ? ',' : ''}</span>
                )}
                {options
                  .filter((item) => selected.includes(toOption(item, type).value))
                  .map((item, idx, arr) => {
                    const opt = toOption(item, type);
                    return (
                      <span key={opt.value} className="flex items-center gap-1">
                        {type === 'vendor' && (
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-400 shadow-sm"
                            style={{ backgroundColor: getHSLColorFromID(Number((item as Vendor).company?.vendor_id ?? 0)) }}
                          />
                        )}
                        {type === 'service' && (
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                            style={{
                              backgroundColor: (item as Services).background_color || '#cccccc',
                              borderColor: (item as Services).border_color || '#aaaaaa',
                              borderWidth: '1.5px',
                              borderStyle: 'solid'
                            }}
                          />
                        )}
                        {opt.label}{idx < arr.length - 1 ? ',' : ''}
                      </span>
                    );
                  })}
                {!isSelectAll && selected.length === 0 && selected.filter(s => s !== 'TIME_OFF').length === 0 && !selected.includes('TIME_OFF') && title}
              </>
            )}
          </span>
          <ChevronDown className={`h-4 w-4 opacity-50 shrink-0 ${userType}-text`} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-2 bg-[#E4E4E4] border border-[#BBBBBB] text-[#666666] font-alexandria"
      >
        <div className="flex items-center space-x-2 px-2 pb-2 border-b border-[#ccc] mb-2">
          <Search className="h-4 w-4 opacity-50 shrink-0" />
          <Input
            placeholder="Search..."
            className="h-8 text-xs bg-transparent border-none focus-visible:ring-0 px-0 placeholder:text-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col space-y-1 max-h-64 overflow-y-auto">
          {type === 'service' && (
            <label
              key="TIME_OFF"
              className={cn(
                "flex items-center space-x-2 rounded-md px-2 py-2 hover:bg-muted cursor-pointer"
              )}
            >
              <Checkbox
                checked={selected.includes("TIME_OFF")}
                onCheckedChange={() => handleToggle("TIME_OFF")}
                id="TIME_OFF"
              />
              <span className="text-sm">Time Off</span>
            </label>
          )}

          {options
            .filter((item) => {
              const option = toOption(item, type);
              return option.label.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .map((item) => {
              const option = toOption(item, type);
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center space-x-2 rounded-md px-2 py-2 hover:bg-muted cursor-pointer"
                  )}
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    onCheckedChange={() => handleToggle(option.value)}
                    id={option.value}
                  />

                  {type === 'vendor' && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-400 shadow-sm"
                      style={{ backgroundColor: getHSLColorFromID(Number((item as Vendor).company?.vendor_id ?? 0)) }}
                    />
                  )}

                  {type === 'service' && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                      style={{
                        backgroundColor: (item as Services).background_color || '#cccccc',
                        borderColor: (item as Services).border_color || '#aaaaaa',
                        borderWidth: '2px', // Make border visible as per user mentions border color
                        borderStyle: 'solid'
                      }}
                    />
                  )}

                  <span className="text-sm">{option.label}</span>
                </label>
              );
            })}

          {!singleSelect && (
            <div className="border-t-[1px] border-[#A8A8A8]">
              <label
                key="ALL"
                className="flex items-center space-x-2 rounded-md px-2 py-2 hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={isSelectAll}
                  onCheckedChange={() => handleToggle("ALL")}
                  id="ALL"
                />
                <span className="text-sm">{allLabel}</span>
              </label>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

