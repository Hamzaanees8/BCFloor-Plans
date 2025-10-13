'use client';
import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { Order } from '../../orders/page';
import { Area } from './OrderDetailView';
import AddLevelDialog from '../../calendar/components/AddLevelDialog';
import AddExtraDialog from '../../calendar/components/AddExtraDialog';

interface Field {
  id: number;
  label: string;
  value: number;
  custom_title?: string;
  showSecondInput?: boolean;
  secondValue?: number;
}


interface SquareFootageProps {
  currentOrder: Order | undefined
  area: Area[];
  setArea: React.Dispatch<React.SetStateAction<Area[]>>
}

let uniqueId = 0;

export default function EditSquareFootage({ currentOrder, setArea }: SquareFootageProps) {
  const [levels, setLevels] = useState<Field[]>([
    { id: uniqueId++, label: '1st Level', value: 0 },
    { id: uniqueId++, label: '2nd Level', value: 0 },
    { id: uniqueId++, label: '3rd Level', value: 0 },
  ]);

  const [extras, setExtras] = useState<Field[]>([
    { id: uniqueId++, label: 'Garage', value: 0 },
    { id: uniqueId++, label: 'Mechanical', value: 0 },
    { id: uniqueId++, label: 'Storage', value: 0 },
  ]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openAddExtraDialog, setOpenAddExtraDialog] = useState(false);

  useEffect(() => {
    if (!currentOrder) return;

    const isLevel = (label: string) => /\d+(st|nd|rd|th) Level/.test(label);
    const levelsFromAPI: Field[] = [];
    const extrasFromAPI: Field[] = [];

    currentOrder.areas?.forEach((area: Area) => {
      const field: Field = {
        id: uniqueId++,
        label: area.type,
        value: area.footage,
        ...(area.custom_title ? { custom_title: area.custom_title } : {})
      };

      if (isLevel(area.type)) {
        levelsFromAPI.push(field);
      } else {
        extrasFromAPI.push(field);
      }
    });

    const defaultLevelLabels = ['1st Level', '2nd Level', '3rd Level'];
    const allLevels = [...defaultLevelLabels, ...levelsFromAPI.map(l => l.label)]
      .filter((label, i, arr) => arr.indexOf(label) === i)
      .map(label => {
        const existing = levelsFromAPI.find(l => l.label === label);
        return existing || { id: uniqueId++, label, value: 0 };
      });

    setLevels(allLevels);
    setExtras(extrasFromAPI);
  }, [currentOrder]);




  useEffect(() => {
    const levelAreas: Area[] = levels
      .filter(item => item.value > 0)
      .map(item => ({
        type: item.label,
        footage: item.value,
      }));

    const extraAreas: Area[] = extras
      .filter(item => item.value > 0)
      .map(item => ({
        type: item.label,
        footage: item.value,
        ...(item.custom_title ? { custom_title: item.custom_title } : {})
      }));

    setArea([...levelAreas, ...extraAreas]);
  }, [levels, extras, setArea]);

  console.log('levels and extras', [...levels, ...extras]);

  const handleChange = (id: number, list: Field[], setList: React.Dispatch<React.SetStateAction<Field[]>>, field: Partial<Field>) => {
    setList(list.map(item => item.id === id ? { ...item, ...field } : item));
  };

  const handleRemove = (id: number, list: Field[], setList: React.Dispatch<React.SetStateAction<Field[]>>) => {
    setList(list.filter(item => item.id !== id));
  };

  const total = (list: Field[]) =>
    list.reduce((sum, item) => sum + (item.value > 0 ? item.value : 0), 0);

  return (
    <div className="bg-[#F5F5F5] p-4 rounded border border-gray-300 text-[14px] text-[#666666] font-alexandria space-y-6">
      <div className="text-[24px] font-[400]">{currentOrder?.property_address}, {currentOrder?.property_location}</div>
      <div className="space-y-3">
        <div className="text-[14px] font-semibold">Chargeable</div>
        {levels.map(field => (
          <div key={field.id} className="flex items-center gap-2">
            <Checkbox
              checked={field.showSecondInput}
              onCheckedChange={(val) => handleChange(field.id, levels, setLevels, { showSecondInput: !!val })}
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
            <span className="w-[120px]">{field.label}</span>
            <Input
              type="number"
              min={0}
              step="1"
              inputMode="decimal"
              value={field.value === 0 ? '' : field.value}
              onChange={(e) => {
                const value = Number(e.target.value);
                handleChange(field.id, levels, setLevels, { value: isNaN(value) ? 0 : value });
              }}
              className="w-[130px] h-[42px] border-[#7D7D7D] bg-[#EEEEEE] text-[16px] border appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />

            <span>FT²</span>



            {field.showSecondInput && (
              <Input
                type="number"
                min={1}
                step="1"
                inputMode="decimal"
                placeholder='Cost'
                value={field.secondValue ?? ''}
                onChange={(e) => {
                  const secondValue = Number(e.target.value);
                  handleChange(field.id, levels, setLevels, { secondValue: isNaN(secondValue) ? 0 : secondValue });
                }}
                className="w-[130px] h-[42px] border-[#7D7D7D] bg-[#EEEEEE] text-[16px] border appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-[#666666] hover:text-red-500"
              onClick={() => handleRemove(field.id, levels, setLevels)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

        ))}

        <div className="border-t border-dashed border-gray-400 my-2 w-1/2"></div>
        <div className="flex justify-between items-center pr-[50px] w-1/2">
          <span className='w-1/2 flex justify-start'>Total:</span>
          <span className='w-1/2 flex justify-center'>{total(levels)} FT²</span>
        </div>

        <Button className='bg-[#4290E9] hover:bg-[#4999f4]' variant="default" onClick={() => setOpenAddDialog(true)}>
          Add a Level
        </Button>
        <AddLevelDialog
          open={openAddDialog}
          onOpenChange={setOpenAddDialog}
          onAddLevel={(label, sqft) => {
            setLevels(prev => [
              ...prev,
              { id: uniqueId++, label, value: sqft, checked: true },
            ]);
          }}
        />

      </div>

      <div className="space-y-3">
        {extras.map(field => (
          <div key={field.id} className="flex items-center gap-2">
            <Checkbox
              checked={field.showSecondInput}
              onCheckedChange={(val) =>
                handleChange(field.id, extras, setExtras, { showSecondInput: !!val })
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
                 data-[state=checked]:before:bg-[#4290E9]
                 data-[state=checked]:before:rounded-[2px]"
            />

            <span className="w-[120px]">{field.label}</span>

            <Input
              type="number"
              min={0}
              step="1"
              inputMode="decimal"
              value={field.value === 0 ? '' : field.value}
              onChange={(e) => {
                const value = Number(e.target.value);
                handleChange(field.id, extras, setExtras, { value: isNaN(value) ? 0 : value });
              }}

              className="w-[130px] h-[42px] border-[#7D7D7D] bg-[#EEEEEE] text-[16px] border appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />

            <span>FT²</span>


            {field.showSecondInput && (
              <Input
                type="number"
                min={1}
                step="1"
                placeholder='Cost'
                inputMode="decimal"
                value={field.secondValue ?? ''}
                onChange={(e) => {
                  const secondValue = Number(e.target.value);
                  handleChange(field.id, extras, setExtras, { secondValue: isNaN(secondValue) ? 0 : secondValue });
                }}

                className="w-[130px] h-[42px] border-[#7D7D7D] bg-[#EEEEEE] text-[16px] border appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-[#666666] hover:text-red-500"
              onClick={() => handleRemove(field.id, extras, setExtras)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

        ))}

        <div className="border-t border-dashed border-gray-400 my-2 w-1/2"></div>
        <div className="flex justify-between items-center pr-[50px] w-1/2">
          <span className='w-1/2 flex justify-start'>Total:</span>
          <span className='w-1/2 flex justify-center'>{total(extras)} FT²</span>
        </div>

        <Button className='bg-[#4290E9] hover:bg-[#4999f4]' variant="default" onClick={() => setOpenAddExtraDialog(true)}>
          Add a Custom Field
        </Button>
        <AddExtraDialog
          open={openAddExtraDialog}
          onOpenChange={setOpenAddExtraDialog}
          onAddExtra={(label: string, sqft: number, customLabel?: string) => {
            setExtras(prev => [
              ...prev,
              { id: uniqueId++, label, value: sqft, checked: true, ...(customLabel && { custom_title: customLabel }) },
            ]);
          }}
        />

      </div>
    </div>
  );
}
