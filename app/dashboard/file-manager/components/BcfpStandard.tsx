import { LinkedIcon, ReltorIcon } from "@/components/Icons";
import { AvatarFallback } from "@/components/ui/avatar";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { CircleCheckBig, Eye, File, Mail, Phone, Wrench } from "lucide-react";
import Image from "next/image";
import { useFileManagerContext } from "../FileManagerContext ";
import React, { JSX } from "react";
import { Order } from "../../orders/page";
import { useAppContext } from "@/app/context/AppContext";
import '../../../globals.css';

interface BcfpStandard {
  orderData: Order | null;
}
const BcfpStandard = ({ orderData }: BcfpStandard) => {
  const { formData } = useFileManagerContext();
  const { userType } = useAppContext();

  const iconMap: Record<string, JSX.Element> = {
    eye: <Eye className="text-[#4290E9] w-8 h-8 md:w-11 md:h-11" />,
    wrench: <Wrench className="text-[#4290E9] w-8 h-8 md:w-11 md:h-11" />,
    circlecheckbig: <CircleCheckBig className="text-[#4290E9] w-8 h-8 md:w-11 md:h-11" />,
    file: <File className="text-[#4290E9] w-8 h-8 md:w-11 md:h-11" />,
  };
  const defaultIcon = <Eye className="text-[#4290E9] w-8 h-8 md:w-11 md:h-11" />;
  
  return (
    <div className="w-full items-center justify-center">
      <div className={`${userType}-bg h-auto md:h-[221px] w-full flex flex-col md:flex-row items-center justify-between px-5 py-5 md:py-0`}>
       
        <div className="flex flex-col text-[14px] md:text-[18px] font-[400] text-[#F2F2F2] gap-1 md:gap-3 mb-4 md:mb-0">
          <div className="flex justify-center">
            <ReltorIcon className="w-10 h-10 md:w-auto md:h-auto" />
          </div>
          <div className="text-center md:text-left">
            <div>{orderData?.agent.first_name}{" "}{orderData?.agent.last_name}</div>
            <div>{orderData?.agent.company_name} Realtor</div>
          </div>
        </div>

        
        <div className="flex flex-col md:flex-row gap-4 md:gap-[60px] items-center w-full md:w-auto">
          
          <div className="flex flex-col font-alexandria gap-2 md:gap-5 text-center md:text-right w-full md:w-auto">
            <div className="font-bold text-[20px] md:text-[26px] text-[#F2F2F2]">
              Offered at
            </div>
            <div className="text-[40px] md:text-[80px] leading-[40px] md:leading-[80px] font-light text-[#F2F2F2]">
              $1,275,000
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 md:gap-5 items-center font-alexandria w-full justify-center md:justify-start">
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
            <div className="text-[14px] md:text-[16px] font-normal text-[#F2F2F2] text-center md:text-left">
              <div>Realtor</div>
              <div>{orderData?.agent.first_name}{" "}{orderData?.agent.last_name}</div>
              <div>{orderData?.agent.company_name} Realtor Services</div>
            </div>
            <div className="flex flex-row md:flex-col gap-3 md:gap-2">
              {orderData?.agent.primary_phone && (
                <a href={`tel:${orderData.agent.primary_phone}`}>
                  <Phone className="text-transparent fill-white w-6 h-6" />
                </a>
              )}
              {orderData?.agent.email && (
                <a
                  href={`mailto:${orderData.agent.email}`} >
                  <LinkedIcon className="text-white w-10 h-10  md:w-auto md:h-auto" />
                </a>
              )}
              {orderData?.agent.email && (
                <a href={`mailto:${orderData.agent.email}`}>
                  <Mail className="text-white w-6 h-6" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <Image
          src={formData.imageUpload || "/featuresheetimage.png"}
          alt="logo"
          width={72}
          height={72}
          className="w-full h-auto"
        />
      </div>

      <div className="flex flex-col md:flex-row px-4 md:px-5 py-4 mt-4 gap-4 md:gap-6">
        <div className="flex flex-col w-full md:w-[30%]">
          <label htmlFor="Key Highlight" className="text-[#4290E9] text-[24px] md:text-[36px] font-light">
            Key Highlight
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 md:gap-y-5 gap-x-4 md:gap-x-6 mt-[24px] md:mt-[48px]">
            {formData.Keyhighlights.map(
              (item, index) =>
                item && (
                  <div key={index} className="flex items-center gap-3 md:gap-5 font-alexandria">
                    <span className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] bg-blue-500 rounded-full"></span>
                    <span className="text-[16px] md:text-[20px] text-[#303030] font-light">
                      {item}
                    </span>
                  </div>
                )
            )}
          </div>
        </div>
        <div className="flex flex-col w-full md:w-[70%] gap-[24px] md:gap-[48px] font-alexandria">
          <label htmlFor="Key Highlight" className="text-[#4290E9] text-[24px] md:text-[36px] font-light">
            {formData.propertyNotesTitle.trim() === ""
              ? "Property Notes"
              : formData.propertyNotesTitle}
          </label>
          <div className="text-[16px] md:text-[20px] text-[#303030] font-light leading-[120%] md:leading-[100%]">
            {formData.propertyNotesDescription || "No property notes provided."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {[formData.featuredImage1Preview, formData.featuredImage2Preview, formData.featuredImage3Preview].map((src, index) => (
          <div key={index} className="h-[200px] md:h-[300px] overflow-hidden">
            <Image
              src={src || "/featuresheetimage1.png"}
              alt="featured"
              width={500}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-5 px-4 md:px-5 py-6 md:py-10">
        <div className="flex flex-col w-full md:w-[50%] gap-[24px] md:gap-[48px] font-alexandria">
          <label htmlFor="Key Highlight" className="text-[#4290E9] text-[24px] md:text-[36px] font-light">
            {formData.expandedDetail1.trim() === ""
              ? "Expanded Detail 1"
              : formData.expandedDetail1}
          </label>
          <div className="text-[16px] md:text-[20px] text-[#303030] font-light leading-[120%] md:leading-[100%]">
            {formData.expandedDetail1Description ||
              "No Expanded Detail provided."}
          </div>
        </div>
        <div className="flex flex-col w-full md:w-[50%] gap-[24px] md:gap-[48px] font-alexandria">
          <label htmlFor="Key Highlight" className="text-[#4290E9] text-[24px] md:text-[36px] font-light">
            {formData.expandedDetail2.trim() === ""
              ? "Expanded Detail 2"
              : formData.expandedDetail2}
          </label>
          <div className="text-[16px] md:text-[20px] text-[#303030] font-light leading-[120%] md:leading-[100%]">
            {formData.expandedDetail2Description ||
              "No Expanded Detail provided."}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 px-4 md:px-5 py-6 md:py-10">
        {formData.highlights.map((highlight, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-4 md:gap-6 font-alexandria w-full sm:w-[45%] md:w-[300px]"
          >
            <label
              htmlFor={`highlight-${index}`}
              className="text-[#4290E9] text-[24px] md:text-[36px] font-light leading-7 md:leading-9 text-center"
            >
              {highlight.title.trim() || "Highlight"}
            </label>

            <div className="text-[20px] justify-center self-center">
              {iconMap[highlight.icon] || defaultIcon}
            </div>

            <div className="text-[16px] md:text-[20px] text-[#303030] font-light leading-[120%] md:leading-[100%] text-center">
              {highlight.value || "Value"}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between px-4 md:px-5 py-6 md:py-10 bg-[#4290E9] font-alexandria">
        <div className="flex flex-col gap-3 md:gap-5">
          <label htmlFor="" className="text-[#F2F2F2] text-[14px] md:text-[16px] font-bold">
            Contact
          </label>
          <div className="text-[14px] md:text-[16px] text-[#F2F2F2] font-light leading-[120%] md:leading-[100%]">
            Realtor contact info
          </div>
          <div className="text-[14px] md:text-[16px] text-[#F2F2F2] font-light leading-[120%] md:leading-[100%]">
            CTA
          </div>
        </div>
      </div>
    </div>
  );
};

export default BcfpStandard;