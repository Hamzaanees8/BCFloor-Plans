'use client';
import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Pencil, ChevronDown } from "lucide-react";
import { Order } from '../../orders/page';
import AddExtraDialog from './AddExtraDialog'; // We will reuse this for all sections now
import { Area } from './OrderDetailView';
import { SquareFootageTitles, defaultTitles } from './SquareFootageSettings';

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
  setArea: React.Dispatch<React.SetStateAction<Area[]>>
}

let uniqueId = 0;

export default function EditSquareFootage({ currentOrder, setArea }: SquareFootageProps) {
  const [titles, setTitles] = useState<SquareFootageTitles>(defaultTitles);
  const [finishedAreas, setFinishedAreas] = useState<Field[]>([]);
  const [subtotalAreas, setSubtotalAreas] = useState<Field[]>([]);
  const [otherAreas, setOtherAreas] = useState<Field[]>([]);


  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [dialogDefaultCategory, setDialogDefaultCategory] = useState<"Finished" | "Subtotal" | "Other">("Finished");



  const handleTitleChange = (key: keyof SquareFootageTitles, value: string) => {
    setTitles(prev => ({ ...prev, [key]: value }));
  };

  const handleTitleSave = async () => {
    // await SaveSquareFootageTitles(titles);
  };


  useEffect(() => {
    if (!currentOrder) return;

    const finished: Field[] = [];
    const subtotal: Field[] = [];
    const other: Field[] = [];

    currentOrder.areas?.forEach((area: Area) => {
      // API returns: type = category (Finished/Subtotal/Other), custom_title = label
      const category = area.type as "Finished" | "Subtotal" | "Other";
      const label = area.custom_title || area.type; // Use custom_title as label

      const field: Field = {
        id: uniqueId++,
        label: label,
        value: area.footage,
        custom_title: area.custom_title,
        category: category
      };

      if (category === "Finished") finished.push(field);
      else if (category === "Subtotal") subtotal.push(field);
      else other.push(field);
    });

    // Always ensure default floor levels exist in Finished areas
    const defaultFloors = ['1st Floor', '2nd Floor', '3rd Floor'];
    const mergedFinished: Field[] = [];

    defaultFloors.forEach(floorLabel => {
      const existing = finished.find(f => f.label === floorLabel);
      if (existing) {
        mergedFinished.push(existing);
      } else {
        mergedFinished.push({ id: uniqueId++, label: floorLabel, value: 0, category: 'Finished' });
      }
    });

    // Add any other finished areas that aren't default floors
    finished.forEach(f => {
      if (!defaultFloors.includes(f.label)) {
        mergedFinished.push(f);
      }
    });

    setFinishedAreas(mergedFinished);
    setSubtotalAreas(subtotal);
    setOtherAreas(other);

  }, [currentOrder]);


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

  const grandTotal = total(finishedAreas) + total(subtotalAreas) + total(otherAreas);

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
              onClick={(e) => e.stopPropagation()} // Prevent toggling when editing title
              className="text-[14px] font-semibold border-transparent hover:border-gray-300 focus:border-[#4290E9] bg-transparent w-auto min-w-[150px] px-2 h-8"
            />
            <Pencil className="w-4 h-4 text-gray-400" />
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
                  className="w-[130px] h-[42px] border-[#7D7D7D] bg-[#EEEEEE] text-[16px] border appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span>FT²</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[#666666] hover:text-red-500"
                  onClick={() => handleRemove(field.id, list, setList)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="flex justify-between items-center pr-[50px] w-full max-w-[400px]">
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
              {showTotal && <div className="font-semibold">TOTAL <span className="ml-[80px]">{total(list)} Sq.ft</span></div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#F5F5F5] p-4 rounded border border-gray-300 text-[14px] text-[#666666] font-alexandria space-y-6">
      <div className="text-[24px] font-[400]">{currentOrder?.property_address}, {currentOrder?.property_location}</div>

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
      />
    </div>
  );
}
