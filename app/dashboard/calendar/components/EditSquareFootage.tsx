'use client';
import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Pencil, ChevronDown } from "lucide-react";
import { Order } from '../../orders/page';
import AddExtraDialog from './AddExtraDialog'; // We will reuse this for all sections now
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Area } from './OrderDetailView';
import { SquareFootageTitles, defaultTitles } from './SquareFootageSettings';
import { useAppContext } from '@/app/context/AppContext';
import { GetTourSettings } from '../../global-settings/global-settings';

interface TourSetting {
  uuid: string;
  area: string;
  type: string;
  status: boolean;
}

interface Field {
  id: number;
  label: string;
  value: number;
  custom_title?: string;
  showSecondInput?: boolean;
  secondValue?: number;
  category: "Finished" | "Subtotal" | "Other";
}


interface SquareFootageProps {
  currentOrder: Order | undefined
  area: Area[];
  setArea: React.Dispatch<React.SetStateAction<Area[]>>;
  updateInvoice: boolean;
  setUpdateInvoice: React.Dispatch<React.SetStateAction<boolean>>;
  hideHeader?: boolean;
}

let uniqueId = 0;

export default function EditSquareFootage({ currentOrder, setArea, updateInvoice, setUpdateInvoice, hideHeader }: SquareFootageProps) {
  const { userType } = useAppContext();
  const [titles, setTitles] = useState<SquareFootageTitles>(defaultTitles);
  const [finishedAreas, setFinishedAreas] = useState<Field[]>([]);
  const [subtotalAreas, setSubtotalAreas] = useState<Field[]>([]);
  const [otherAreas, setOtherAreas] = useState<Field[]>([]);
  const [tourSettings, setTourSettings] = useState<TourSetting[]>([]);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [dialogDefaultCategory, setDialogDefaultCategory] = useState<"Finished" | "Subtotal" | "Other">("Finished");

  // Fetch tour settings from global settings API
  useEffect(() => {
    GetTourSettings()
      .then((res) => {
        const settings: TourSetting[] = (res?.data?.tour_settings ?? []).filter(
          (s: TourSetting) => s.status
        );
        setTourSettings(settings);
      })
      .catch((err) => console.error("Failed to fetch tour settings:", err));
  }, []);

  const handleTitleChange = (key: keyof SquareFootageTitles, value: string) => {
    setTitles(prev => ({ ...prev, [key]: value }));
  };

  const handleTitleSave = async () => {
    // await SaveSquareFootageTitles(titles);
  };


  useEffect(() => {
    if (tourSettings.length === 0) return;

    const finished: Field[] = [];
    const subtotal: Field[] = [];
    const other: Field[] = [];

    // 1. Add all existing areas from current order
    currentOrder?.areas?.forEach((area: Area) => {
      const category = (area.category || area.type) as "Finished" | "Subtotal" | "Other";
      const label = area.custom_title || area.type;
      
      const field: Field = {
        id: uniqueId++,
        label,
        value: area.footage || 0,
        custom_title: area.custom_title,
        category: ["Finished", "Subtotal", "Other"].includes(category) ? category : "Other",
      };

      if (field.category === "Finished") finished.push(field);
      else if (field.category === "Subtotal") subtotal.push(field);
      else other.push(field);
    });

    // 2. Add defaults if empty
    const finishedSettings = tourSettings.filter(s => s.type === "Finished Area");

    if (finished.length === 0 && finishedSettings.length > 0) {
      const mainLevelSetting = finishedSettings.find(s => s.area.trim().toLowerCase() === "main level") || finishedSettings[0];
      finished.push({
        id: uniqueId++,
        label: mainLevelSetting.area,
        value: 0,
        custom_title: mainLevelSetting.area,
        category: "Finished"
      });
    }

    setFinishedAreas(finished);
    setSubtotalAreas(subtotal);
    setOtherAreas(other);
  }, [tourSettings, currentOrder]);


  // Sync state back to parent
  useEffect(() => {
    const allFields = [...finishedAreas, ...subtotalAreas, ...otherAreas];
    const newAreas: Area[] = allFields
      .filter(item => item.value > 0)
      .map(item => ({
        type: item.category,
        footage: item.value,
        custom_title: item.label,
        category: item.category
      }));

    setArea(newAreas);
  }, [finishedAreas, subtotalAreas, otherAreas, setArea]);

  const handleChange = (id: number, list: Field[], setList: React.Dispatch<React.SetStateAction<Field[]>>, field: Partial<Field>) => {
    setList(list.map(item => item.id === id ? { ...item, ...field } : item));
  };

  const handleRemove = (id: number, list: Field[], setList: React.Dispatch<React.SetStateAction<Field[]>>) => {
    setList(list.filter(item => item.id !== id));
  };

  const total = (list: Field[]) =>
    list.reduce((sum, item) => sum + (item.value > 0 ? item.value : 0), 0);

  const grandTotal = total(finishedAreas) + total(subtotalAreas);

  const handleAddExtra = (label: string, sqft: number, category: "Finished" | "Subtotal" | "Other", customLabel?: string) => {
    const newField: Field = {
      id: uniqueId++,
      label,
      value: sqft,
      category,
      custom_title: customLabel
    };

    if (category === "Finished") setFinishedAreas(prev => [...prev, newField]);
    else if (category === "Subtotal") setSubtotalAreas(prev => [...prev, newField]);
    else setOtherAreas(prev => [...prev, newField]);
  };

  /* New Toggle Logic */
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    finished: true,
    subtotal: true,
    other: true
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSection = (
    titleKey: keyof SquareFootageTitles,
    list: Field[],
    setList: React.Dispatch<React.SetStateAction<Field[]>>,
    showTotal: boolean = true
  ) => {
    const isOpen = openSections[titleKey] ?? true;

    // Map titleKey to category
    const getCategoryFromKey = (key: keyof SquareFootageTitles): "Finished" | "Subtotal" | "Other" => {
      if (key === 'finished') return 'Finished';
      if (key === 'subtotal') return 'Subtotal';
      return 'Other';
    };

    return (
      <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden md:rounded md:shadow-none md:border-gray-200 md:border">
        {/* Header Bar */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer transition-colors md:bg-[#F3F4F6] md:py-2"
          onClick={() => toggleSection(titleKey)}
        >
          <div className="flex items-center gap-2">
            <Input
              value={titles[titleKey]}
              onChange={(e) => handleTitleChange(titleKey, e.target.value)}
              onBlur={handleTitleSave}
              readOnly={userType === 'agent'}
              onClick={(e) => e.stopPropagation()} // Prevent toggling when editing title
              className="text-sm font-semibold text-gray-700 bg-transparent border-none w-auto max-w-[120px] h-auto p-0 focus-visible:ring-0 md:text-[14px] md:min-w-[150px] md:px-2 md:h-8 md:hover:border-gray-300 md:focus-visible:border-[#4290E9] shadow-none"
            />
            {userType !== 'agent' && <Pencil className="hidden md:block w-4 h-4 text-gray-400" />}
            
            {/* Mobile section total badge */}
            <span className="block md:hidden text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">
              {total(list).toLocaleString()} sq ft
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="divide-y divide-gray-100 md:divide-none md:p-4 md:space-y-3 bg-white">
            {list.map(field => (
              <div key={field.id} className="flex flex-row items-center justify-between px-4 py-3 md:px-0 md:py-0 md:pb-0 md:border-none md:gap-2">
                <span className="flex-1 text-[13px] md:text-[14px] font-medium md:font-normal truncate pr-2 text-gray-600 md:text-black">{field.label}</span>
                <div className="flex items-center gap-2 w-auto">
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    inputMode="decimal"
                    value={field.value === 0 ? '' : field.value}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      handleChange(field.id, list, setList, { value: isNaN(value) ? 0 : value });
                    }}
                    readOnly={userType === 'agent'}
                    placeholder="0"
                    className="w-24 h-12 text-right text-lg font-semibold rounded-lg border border-gray-200 px-3 bg-white md:w-[130px] md:h-[42px] md:text-left md:text-[16px] md:font-normal md:bg-[#EEEEEE] md:border-[#7D7D7D] md:rounded-md appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus-visible:ring-[#4290E9] md:focus-visible:ring-0"
                  />
                  <span className="hidden md:inline text-[13px] sm:text-[14px]">FT²</span>
                  {userType !== 'agent' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 md:text-[#666666] hover:text-red-500 shrink-0 h-[36px] w-[36px]"
                      onClick={() => handleRemove(field.id, list, setList)}
                    >
                      <X className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="px-4 py-3 bg-gray-50/50 md:bg-transparent md:p-0 md:pt-2 flex flex-row justify-between items-center md:pr-[50px] w-full md:max-w-[400px] md:gap-2">
              {userType !== 'agent' && (
                <Button
                  className='w-full text-[#4290E9] hover:bg-blue-50 h-10 border border-dashed border-[#4290E9]/30 text-sm md:w-auto md:border-none md:p-0 md:h-auto md:justify-start md:bg-transparent'
                  variant="ghost"
                  onClick={() => {
                    setDialogDefaultCategory(getCategoryFromKey(titleKey));
                    setOpenAddDialog(true);
                  }}
                >
                  + Add area
                </Button>
              )}
              {showTotal && list.length > 0 && <div className="hidden md:flex font-semibold gap-4 text-gray-700 sm:text-black"><span>TOTAL</span> <span className="sm:ml-[80px]">{total(list)} Sq.ft</span></div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-transparent p-0 border-none space-y-3 md:bg-[#F5F5F5] md:p-4 md:rounded md:border md:border-gray-300 text-[14px] text-[#666666] font-alexandria md:space-y-6 pb-4 md:pb-0">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-4 md:px-0">
          <div className="text-[16px] md:text-[24px] font-[400] break-words">{currentOrder?.property_address}, {currentOrder?.property_location}</div>
          {userType !== 'vendor' && (
            <div className="flex items-center space-x-2">
              <Switch id="update-invoice-sqft" checked={updateInvoice} onCheckedChange={setUpdateInvoice} className="data-[state=checked]:bg-[#6BAE41] data-[state=unchecked]:bg-[#E06D5E]" />
              <Label htmlFor="update-invoice-sqft" className="text-[14px] font-[500] text-[#424242]">Update Invoice</Label>
            </div>
          )}
        </div>
      )}

      <div className="px-4 md:px-0 space-y-3 md:space-y-6">
        {renderSection('finished', finishedAreas, setFinishedAreas)}
        {renderSection('subtotal', subtotalAreas, setSubtotalAreas)}

        {/* Grand Total Row (Desktop) */}
        <div className="hidden md:flex justify-between items-center pr-[50px] w-full max-w-[400px] py-2 bg-gray-100 rounded my-2">
          <span className="font-bold pl-2">Grand Total</span>
          <span className="font-bold">{grandTotal} Sq.ft</span>
        </div>
        
        {/* Grand Total Row (Mobile) */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-t border-b my-2">
          <span className="text-sm font-medium text-gray-600">Grand Total</span>
          <span className="text-xl font-bold text-gray-900">
            {grandTotal.toLocaleString()} <span className="text-sm font-normal text-gray-400">sq ft</span>
          </span>
        </div>

        {renderSection('other', otherAreas, setOtherAreas)}
      </div>

      <AddExtraDialog
        open={openAddDialog}
        onOpenChange={setOpenAddDialog}
        onAddExtra={handleAddExtra}
        defaultCategory={dialogDefaultCategory}
        tourSettings={tourSettings}
      />
    </div>
  );
}
