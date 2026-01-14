import { Input } from "@/components/ui/input";
import React from "react";

const Property: React.FC = () => {
  const [formData, setFormData] = React.useState({
    address: "",
    unitNumber: "",
    squareFootage: "",
    specialNotes: "",
  });

  const [errors, setErrors] = React.useState({
    address: "",
    squareFootage: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: "This field is required" }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="w-full flex flex-col justify-center items-center font-alexandria text-[#666666]">
      <div className="grid grid-cols-2 items-center gap-4 w-full max-w-3xl">
        <div className="col-span-2 flex flex-col gap-[10px]">
          <label
            className={`text-[14px] font-[500] ${errors.address ? "text-red-500" : ""}`}
            htmlFor="address"
          >
            Property Address
          </label>
          <Input
            className="h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[12px]"
            type="text"
            id="address"
            name="address"
            placeholder="Enter property address"
            value={formData.address}
            onChange={handleChange}
          />
          {errors.address && <span className="text-red-500 text-sm">{errors.address}</span>}
        </div>

        <div className="col-span-1 flex flex-col gap-[10px]">
          <label
            className={`text-[14px] font-[500] `}
            htmlFor="unitNumber"
          >
            Unit Number (if applicable)
          </label>
          <Input
            className="h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[12px]"
            type="text"
            id="unitNumber"
            name="unitNumber"
            placeholder="Enter unit number"
            value={formData.unitNumber}
            onChange={handleChange}
          />
        </div>

        <div className="col-span-1 flex flex-col gap-[10px]">
          <label
            className={`text-[14px] font-[500] ${errors.squareFootage ? "text-red-500" : ""}`}
            htmlFor="squareFootage"
          >
            Square Footage
          </label>
          <Input
            className="h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[12px]"
            type="number"
            id="squareFootage"
            name="squareFootage"
            placeholder="Enter square footage"
            value={formData.squareFootage}
            onChange={handleChange}
          />
          {errors.squareFootage && (
            <span className="text-red-500 text-sm">{errors.squareFootage}</span>
          )}
        </div>

        <div className="col-span-2 flex flex-col gap-[10px]">
          <label
            className={`text-[14px] font-[500] `}
            htmlFor="specialNotes"
          >
            Special Notes
          </label>
          <Input
            className="h-[42px] bg-[#EEEEEE] border border-[#BBBBBB] mt-[12px]"
            type="text"
            id="specialNotes"
            name="specialNotes"
            placeholder="Add any special instructions"
            value={formData.specialNotes}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Property;
