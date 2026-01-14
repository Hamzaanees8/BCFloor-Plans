"use client";
import React from "react";
import { Switch } from "./ui/switch";
import DropdownActions from "./DropdownActions";
import { AreaData } from "./AddAreaPopup";


interface TourSettingTableProps {
  data: AreaData[];
  onEdit: (area: AreaData) => void;
  onDelete: (area: AreaData) => void;
  onStatusChange: (area: AreaData, status: boolean) => void;
  loading: boolean;
}

export default function TourSettingTable({ data, onEdit, onDelete, onStatusChange, loading }: TourSettingTableProps) {

  if (loading && data.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center font-alexandria text-[#666666]">
        Loading tour settings...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center font-alexandria text-[#666666]">
        No tour settings available.
      </div>
    );
  }

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
              <tr key={row.id ?? row.uuid} className="border-t">
                <td className="px-3 py-2 text-[#666666]">{row.area}</td>
                <td className="px-3 py-2 text-[#666666]">{row.type}</td>
                <td className="px-3 py-2 text-[#666666]">{row.charge}</td>
                <td className="px-3 py-2 text-[#666666]">{row.discount}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={row.status}
                      onCheckedChange={(checked) => onStatusChange(row, checked)}
                      className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                    />
                    <DropdownActions
                      options={[
                        {
                          label: "Edit",
                          onClick: () => onEdit(row),
                        },
                        {
                          label: "Delete",
                          onClick: () => onDelete(row),
                          confirm1: true,
                        }
                      ]}
                    />
                  </div>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
