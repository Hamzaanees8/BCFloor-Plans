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
    const subtotalSettings = tourSettings.filter(s => s.type === "Sub Area");
    const otherSettings = tourSettings.filter(s => s.type !== "Finished Area" && s.type !== "Sub Area");

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

    if (subtotal.length === 0 && subtotalSettings.length > 0) {
      subtotal.push({
        id: uniqueId++,
        label: subtotalSettings[0].area,
        value: 0,
        custom_title: subtotalSettings[0].area,
        category: "Subtotal"
      });
    }

    if (other.length === 0 && otherSettings.length > 0) {
      other.push({
        id: uniqueId++,
        label: otherSettings[0].area,
        value: 0,
        custom_title: otherSettings[0].area,
        category: "Other"
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
      <div className="border border-gray-200 rounded overflow-hidden">
        {/* Header Bar */}
        <div
          className="flex items-center justify-between bg-[#F3F4F6] px-4 py-2 cursor-pointer transition-colors hover:bg-gray-200"
          onClick={() => toggleSection(titleKey)}
        >
          <div className="flex items-center gap-2">
            <Input
              value={titles[titleKey]}
              onChange={(e) => handleTitleChange(titleKey, e.target.value)}
              onBlur={handleTitleSave}
              readOnly={userType === 'agent'}
              onClick={(e) => e.stopPropagation()} // Prevent toggling when editing title
              className="text-[14px] font-semibold border-transparent hover:border-gray-300 focus:border-[#4290E9] bg-transparent w-auto min-w-[150px] px-2 h-8"
            />
            {userType !== 'agent' && <Pencil className="w-4 h-4 text-gray-400" />}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="p-4 space-y-3 bg-white">
            {list.map(field => (
              <div key={field.id} className="flex items-center gap-2">
                <span className="w-[120px]">{field.label}</span>
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
                  className="w-[130px] h-[42px] border-[#7D7D7D] bg-[#EEEEEE] text-[16px] border appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span>FT²</span>
                {userType !== 'agent' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#666666] hover:text-red-500"
                    onClick={() => handleRemove(field.id, list, setList)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            <div className="flex justify-between items-center pr-[50px] w-full max-w-[400px]">
              {userType !== 'agent' && (
                <Button
                  className='text-[#4290E9] hover:bg-blue-50 p-0 h-auto'
                  variant="ghost"
                  onClick={() => {
                    setDialogDefaultCategory(getCategoryFromKey(titleKey));
                    setOpenAddDialog(true);
                  }}
                >
                  +Add area
                </Button>
              )}
              {showTotal && <div className="font-semibold">TOTAL <span className="ml-[80px]">{total(list)} Sq.ft</span></div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#F5F5F5] p-4 rounded border border-gray-300 text-[14px] text-[#666666] font-alexandria space-y-6">
      {!hideHeader && (
        <div className="flex justify-between items-center">
          <div className="text-[24px] font-[400]">{currentOrder?.property_address}, {currentOrder?.property_location}</div>
          {userType !== 'vendor' && (
            <div className="flex items-center space-x-2">
              <Switch id="update-invoice-sqft" checked={updateInvoice} onCheckedChange={setUpdateInvoice} className="data-[state=checked]:bg-[#6BAE41] data-[state=unchecked]:bg-[#E06D5E]" />
              <Label htmlFor="update-invoice-sqft" className="text-[14px] font-[500] text-[#424242]">Update Invoice</Label>
            </div>
          )}
        </div>
      )}

      {renderSection('finished', finishedAreas, setFinishedAreas)}
      {renderSection('subtotal', subtotalAreas, setSubtotalAreas)}
      {renderSection('other', otherAreas, setOtherAreas)}

      {/* Grand Total Row */}
      <div className="flex justify-between items-center pr-[50px] w-full max-w-[400px] py-2 bg-gray-100 rounded">
        <span className="font-bold pl-2">Grand Total</span>
        <span className="font-bold">{grandTotal} Sq.ft</span>
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
