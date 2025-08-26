import {
  Bathrooms,
  Bedrooms,
  LinkedIcon,
  Parking,
  ReltorIcon,
  UtilitiesIncluded,
} from "@/components/Icons";
import { AvatarFallback } from "@/components/ui/avatar";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import {
  Mail,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { useFileManagerContext } from "../FileManagerContext ";
import React from "react";
import { Order } from "../../orders/page";

interface BcfpStandard {
  orderData: Order | null;
}
const BcfpStandard1 = ({ orderData }: BcfpStandard) => {
  const { formData } = useFileManagerContext();

  
  return (
    <div className="w-full items-center justify-center">
      <div className="w-full relative">
        <div className="absolute top-[20px] left-[20px] md:top-[35px] md:left-[40px] flex flex-col text-[14px] md:text-[18px] font-[400] text-[#F2F2F2] gap-1 md:gap-3">
          <div className="flex justify-center">
            <ReltorIcon className="w-8 h-8 md:w-auto md:h-auto" />
          </div>
          <div>
            <div>{orderData?.agent.first_name}{" "}{orderData?.agent.last_name}</div>
            <div>{orderData?.agent.company_name} Realtor</div>
          </div>
        </div>
        <Image
          src={formData.imageUpload || "/featuresheetimage.png"}
          alt="logo"
          width={72}
          height={72}
          className="w-full h-auto"
        />
      </div>
      
      <div className="mt-[-80px] md:mt-[-120px]">
        <div className="relative w-full h-[200px] md:h-[350px]">
          <div className="w-full h-[200px] md:h-[350px] absolute inset-0">
            <svg
              viewBox="0 0 345 132"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0 7V26.6C5 56 132 51 195 45C124 46 36 20 0 7Z"
                fill="#D9D9D9"
              />
              <path
                d="M345 0C312 22 205 39 155 44L162 56L345 38V0Z"
                fill="#404953"
              />
              <path d="M345 25C249 61 75 40 0 25V132H345V25Z" fill="#2E353D" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="mt-[-120px] md:mt-[-200px] py-[20px] md:py-[50px] relative bg-[#2E353D] m-auto h-auto flex items-center justify-center px-5 z-10">
        <div className="flex flex-col md:flex-row justify-between gap-[20px] md:gap-[50px] w-full md:w-[90%] lg:w-[80%] xl:w-[60%]">
          <div className="flex flex-col text-[30px] md:text-[50px] leading-[30px] md:leading-[40px] font-[300] text-[#FFFFFF] gap-2 md:gap-4 font-inter uppercase">
            <div className="font-[700]">Luxury Homes</div>
            <div>Affordable</div>
            <div>Prices</div>
          </div>
          <div className="flex flex-col gap-3 md:gap-5 text-[12px] md:text-[14px] font-[300] text-[#FFFFFF] uppercase">
            <div className="flex flex-col md:flex-row gap-2 md:gap-12 border-b border-white pb-3 md:pb-5">
              <div>Starting at</div>
              <div className="text-[24px] md:text-[30px] font-[600]">$450,000</div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:gap-12 border-b border-white pb-3 md:pb-5">
              <div>Type</div>
              <div className="">Single Family Residence</div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:gap-12 pb-3 md:pb-5">
              <div className="flex gap-2 md:gap-4">
                <div>Size</div>
                <div>1,500 SQFT</div>
              </div>
              <div className="flex gap-2 md:gap-4">
                <div>Built In</div>
                <div>1995</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-[20px] md:gap-[50px] py-[20px] md:py-[50px] px-[20px] sm:px-[50px] md:px-[100px] bg-white w-full md:w-[90%] lg:w-[80%] m-auto">
        
        <div className="grid grid-cols-2 gap-4 md:gap-7 flex-shrink-0 w-full md:w-[60%]">
          {['LIVING ROOM', 'MASTER BEDROOM', 'KITCHEN', 'BASEMENT'].map((room) => (
            <div key={room} className="flex flex-col">
              <div className="bg-gray-300 h-[100px] md:h-[150px] w-full"></div>
              <span className="mt-2 text-xs md:text-sm font-bold">{room}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between w-full md:w-[40%] gap-4 md:gap-0 font-alexandria">
          <div>
            <h2 className="text-xs md:text-sm font-bold uppercase mb-2">House Overview</h2>
            <p className="text-xs md:text-sm mb-3 font-[300]">
              Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do
              Eiusmod Tempor Incididunt Ut Labore Et Dolore Magna Aliqua.
            </p>
            <hr className="border-gray-400 my-3 md:my-4" />

            <div className="grid grid-cols-2 gap-y-3 md:gap-y-4 justify-items-center text-[#2E353D]">
              {[
                { icon: <Bedrooms className="w-8 h-8 md:w-10 md:h-10" />, value: "4", label: "Bedrooms" },
                { icon: <Bathrooms className="w-8 h-8 md:w-10 md:h-10" />, value: "2", label: "Bathrooms" },
                { icon: <Parking className="w-8 h-8 md:w-10 md:h-10" />, value: "3", label: "Parking" },
                { icon: <UtilitiesIncluded className="w-8 h-8 md:w-10 md:h-10" />, value: "Yes", label: "Utilities Included" },
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2 md:gap-3">
                  <div className="flex gap-2 md:gap-4">
                    {item.icon}
                    <div className="text-base md:text-lg font-semibold">{item.value}</div>
                  </div>
                  <div className="text-xs uppercase">{item.label}</div>
                </div>
              ))}
            </div>

            <hr className="border-gray-400 my-3 md:my-4" />

            <p className="text-xs md:text-sm font-[300]">123 House Street, City, Province, PC</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between px-5 py-5 md:py-10 bg-[#2E353D] font-alexandria">
        <div className="flex gap-3 md:gap-5 items-center font-alexandria mb-4 md:mb-0">
          <div className="h-[60px] w-[60px] md:h-[80px] md:w-[80px] rounded-full overflow-hidden">
            <Avatar className="h-[60px] w-[60px] md:h-[80px] md:w-[80px]">
              <AvatarImage
                src={
                  orderData?.agent.avatar_url
                    ? orderData?.agent.avatar_url
                    : "https://github.com/shadcn.png"
                }
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
          <div className="text-[14px] md:text-[16px] font-normal text-[#F2F2F2]">
            <div>Realtor</div>
            <div>{orderData?.agent.first_name}{" "}{orderData?.agent.last_name}</div>
            <div>{orderData?.agent.company_name} Realtor Services</div>
          </div>
        </div>
        <div className="flex gap-10 items-center font-alexandria justify-end">
          {orderData?.agent.primary_phone && (
            <a
              href={`tel:${orderData.agent.primary_phone}`}
              className=""
            >
              <Phone className="text-transparent fill-white w-6 h-6 md:w-auto md:h-auto" />
            </a>
          )}
          {orderData?.agent.email && (
            <a
              href={`mailto:${orderData.agent.email}`}
              className=" "
            >
              <LinkedIcon className="text-white w-10 h-10  md:w-auto md:h-auto" />
            </a>
          )}
          {orderData?.agent.email && (
            <a
              href={`mailto:${orderData.agent.email}`}
              className=" "
            >
              <Mail className="text-white w-6 h-6 md:w-auto md:h-auto" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default BcfpStandard1;