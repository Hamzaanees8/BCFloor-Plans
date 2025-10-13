"use client";
import React, { useState, useEffect } from "react";
import { Switch } from "./ui/switch";

type AreaRow = {
  id: number;
  area: string;
  type: string;
  charges: string; 
  discount: string;
};

export default function TourSettingTable({ data }: { data: AreaRow[] }) {
  const [statuses, setStatuses] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // when data changes, reset statuses
    const initialStatuses = data.reduce((acc, item) => {
      acc[item.id] = true;
      return acc;
    }, {} as Record<number, boolean>);
    setStatuses(initialStatuses);
  }, [data]);

  const handleStatusChange = (id: number, checked: boolean) => {
    setStatuses((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  return (
    <div className="w-full font-alexandria">
      <div className="rounded-none border">
        <table className="w-full border-collapse text-[15px] font-normal">
          <thead>
            <tr className="bg-[#E4E4E4] text-[#666666] font-bold h-[54px]">
              <th className="px-3 py-2 text-left">AREAS</th>
              <th className="px-3 py-2 text-left">TYPE</th>
              <th className="px-3 py-2 text-left">CHARGE</th>
              <th className="px-3 py-2 text-left">DISCOUNT</th>
              <th className="px-3 py-2 text-left">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2 text-[#666666]">{row.area}</td>
                <td className="px-3 py-2 text-[#666666]">{row.type}</td>
                <td className="px-3 py-2 text-[#666666]">{row.charges}</td>
                <td className="px-3 py-2 text-[#666666]">{row.discount}</td>
                <td className="px-3 py-2">
                  <Switch
                    checked={statuses[row.id]}
                    onCheckedChange={(checked) =>
                      handleStatusChange(row.id, checked)
                    }
                    className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
