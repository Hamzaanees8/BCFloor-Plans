import { LinkedIcon, ReltorIcon } from "@/components/Icons";
import { AvatarFallback } from "@/components/ui/avatar";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { CircleCheckBig, Eye, File, Mail, Phone, Wrench, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useFileManagerContext } from "../FileManagerContext ";
import React, { JSX, useRef, useState } from "react";
import { Order } from "../../orders/page";
import '../../../globals.css';

interface BcfpStandard {
  orderData: Order | null;
}
const BcfpStandard = ({ orderData }: BcfpStandard) => {
  const { formData } = useFileManagerContext();

  // State for editable text fields
  const [offeredAtPrice, setOfferedAtPrice] = useState("$1,275,000");
  const [realtorTitle, setRealtorTitle] = useState("Realtor");
  const [realtorName, setRealtorName] = useState(`${orderData?.agent.first_name || ""} ${orderData?.agent.last_name || ""}`);
  const [companyName, setCompanyName] = useState(`${orderData?.agent.company_name || ""} Realtor Services`);
  const [keyHighlightLabel, setKeyHighlightLabel] = useState("Key Highlight");
  const [propertyNotesTitle, setPropertyNotesTitle] = useState(formData.propertyNotesTitle.trim() === "" ? "Property Notes" : formData.propertyNotesTitle);
  const [propertyNotesDescription, setPropertyNotesDescription] = useState(formData.propertyNotesDescription || "No property notes provided.");
  const [expandedDetail1Title, setExpandedDetail1Title] = useState(formData.expandedDetail1.trim() === "" ? "Expanded Detail 1" : formData.expandedDetail1);
  const [expandedDetail1Description, setExpandedDetail1Description] = useState(formData.expandedDetail1Description || "No Expanded Detail provided.");
  const [expandedDetail2Title, setExpandedDetail2Title] = useState(formData.expandedDetail2.trim() === "" ? "Expanded Detail 2" : formData.expandedDetail2);
  const [expandedDetail2Description, setExpandedDetail2Description] = useState(formData.expandedDetail2Description || "No Expanded Detail provided.");
  const [contactLabel, setContactLabel] = useState("Contact");
  const [contactInfo, setContactInfo] = useState("Realtor contact info");
  const [ctaText, setCtaText] = useState("CTA");

  // State for editable key highlights
  const [keyHighlights, setKeyHighlights] = useState<string[]>(formData.Keyhighlights.filter(item => item));

  // State for editable highlights
  const [highlights, setHighlights] = useState(formData.highlights.map(highlight => ({
    ...highlight,
    title: highlight.title.trim() || "Highlight",
    value: highlight.value || "Value"
  })));

  // State for images
  const [mainImage, setMainImage] = useState(formData.imageUpload || "/featuresheetimage.png");
  const [featuredImage1, setFeaturedImage1] = useState(formData.featuredImage1Preview || "/featuresheetimage1.png");
  const [featuredImage2, setFeaturedImage2] = useState(formData.featuredImage2Preview || "/featuresheetimage1.png");
  const [featuredImage3, setFeaturedImage3] = useState(formData.featuredImage3Preview || "/featuresheetimage1.png");
  const [agentAvatar, setAgentAvatar] = useState(orderData?.agent.avatar_url || "https://github.com/shadcn.png");

  // File input refs
  const mainImageRef = useRef<HTMLInputElement>(null);
  const featuredImage1Ref = useRef<HTMLInputElement>(null);
  const featuredImage2Ref = useRef<HTMLInputElement>(null);
  const featuredImage3Ref = useRef<HTMLInputElement>(null);
  const agentAvatarRef = useRef<HTMLInputElement>(null);

  const iconMap: Record<string, JSX.Element> = {
    eye: <Eye className="text-[#4290E9] w-8 h-8 md:w-11 md:h-11" />,
    wrench: <Wrench className="text-[#4290E9] w-8 h-8 md:w-11 md:h-11" />,
    circlecheckbig: <CircleCheckBig className="text-[#4290E9] w-8 h-8 md:w-11 md:h-11" />,
    file: <File className="text-[#4290E9] w-8 h-8 md:w-11 md:h-11" />,
  };
  const defaultIcon = <Eye className="text-[#4290E9] w-8 h-8 md:w-11 md:h-11" />;

  const handleImageChange = (setImage: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage(imageURL);
    }
  };

  const handleDeleteImage = (setImage: React.Dispatch<React.SetStateAction<string>>, defaultValue: string) => () => {
    setImage(defaultValue);
  };

  const handleKeyHighlightChange = (index: number, value: string) => {
    const newHighlights = [...keyHighlights];
    newHighlights[index] = value;
    setKeyHighlights(newHighlights);
  };

  const handleHighlightTitleChange = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index].title = value;
    setHighlights(newHighlights);
  };

  const handleHighlightValueChange = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index].value = value;
    setHighlights(newHighlights);
  };

  const ImageBlock = ({
    image,
    fileRef,
    onChange,
    onDelete
  }: {
    image: string;
    fileRef: React.RefObject<HTMLInputElement | null>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: () => void;
    defaultImage: string;
  }) => (
    <div className="relative w-full h-full group">
      <Image
        src={image}
        alt="uploaded"
        width={500}
        height={300}
        className="w-full h-full object-cover"
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
        title="Edit image"
      >
        <Pencil className="w-4 h-4 text-gray-700" />
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
        title="Delete image"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>

      <input
        type="file"
        accept="image/*"
        ref={fileRef}
        onChange={onChange}
        className="hidden"
      />
    </div>
  );

  return (
    <div className="w-full items-center justify-center">
      <div className={`bg-[#4290E9] h-auto md:h-[221px] w-full flex flex-col md:flex-row items-center justify-between px-5 py-5 md:py-0`}>
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
            <input
              type="text"
              value={offeredAtPrice}
              onChange={(e) => setOfferedAtPrice(e.target.value)}
              className="text-[40px] md:text-[80px] leading-[40px] md:leading-[80px] font-light text-[#F2F2F2] bg-transparent border-none outline-none text-center md:text-right w-full"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-5 items-center font-alexandria w-full justify-center md:justify-start">
            <div className="h-[60px] w-[60px] md:h-[80px] md:w-[80px] rounded-full overflow-hidden relative group">
              <Avatar className="h-[60px] w-[60px] md:h-[80px] md:w-[80px]">
                <AvatarImage src={agentAvatar} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>

              <button
                type="button"
                onClick={() => agentAvatarRef.current?.click()}
                className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit avatar"
              >
                <Pencil className="w-4 h-4 text-white" />
              </button>

              <button
                type="button"
                onClick={handleDeleteImage(setAgentAvatar, "https://github.com/shadcn.png")}
                className="absolute top-0 right-0 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 group-hover:opacity-100"
                title="Delete avatar"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>

              <input
                type="file"
                accept="image/*"
                ref={agentAvatarRef}
                onChange={handleImageChange(setAgentAvatar)}
                className="hidden"
              />
            </div>

            <div className="text-[14px] md:text-[16px] font-normal text-[#F2F2F2] text-center md:text-left">
              <input
                type="text"
                value={realtorTitle}
                onChange={(e) => setRealtorTitle(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-center md:text-left"
              />
              <input
                type="text"
                value={realtorName}
                onChange={(e) => setRealtorName(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-center md:text-left"
              />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-center md:text-left"
              />
            </div>

            <div className="flex flex-row md:flex-col gap-3 md:gap-2">
              {orderData?.agent.primary_phone && (
                <a href={`tel:${orderData.agent.primary_phone}`}>
                  <Phone className="text-transparent fill-white w-6 h-6" />
                </a>
              )}
              {orderData?.agent.email && (
                <a href={`mailto:${orderData.agent.email}`}>
                  <LinkedIcon className="text-white w-10 h-10 md:w-auto md:h-auto" />
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

      <div className="relative group">
        <ImageBlock
          image={mainImage}
          fileRef={mainImageRef}
          onChange={handleImageChange(setMainImage)}
          onDelete={handleDeleteImage(setMainImage, "/featuresheetimage.png")}
          defaultImage="/featuresheetimage.png"
        />
      </div>

      <div className="flex flex-col md:flex-row px-4 md:px-5 py-4 mt-4 gap-4 md:gap-6">
        <div className="flex flex-col w-full md:w-[30%]">
          <input
            type="text"
            value={keyHighlightLabel}
            onChange={(e) => setKeyHighlightLabel(e.target.value)}
            className="text-[#4290E9] text-[24px] md:text-[36px] font-light bg-transparent border-none outline-none w-full"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 md:gap-y-5 gap-x-4 md:gap-x-6 mt-[24px] md:mt-[48px]">
            {keyHighlights.map(
              (item, index) =>
                item && (
                  <div key={index} className="flex items-center gap-3 md:gap-5 font-alexandria">
                    <span className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] bg-blue-500 rounded-full"></span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleKeyHighlightChange(index, e.target.value)}
                      className="text-[16px] md:text-[20px] text-[#303030] font-light bg-transparent border-none outline-none w-full"
                    />
                  </div>
                )
            )}
          </div>
        </div>

        <div className="flex flex-col w-full md:w-[70%] gap-[24px] md:gap-[48px] font-alexandria">
          <input
            type="text"
            value={propertyNotesTitle}
            onChange={(e) => setPropertyNotesTitle(e.target.value)}
            className="text-[#4290E9] text-[24px] md:text-[36px] font-light bg-transparent border-none outline-none w-full"
          />
          <textarea
            value={propertyNotesDescription}
            onChange={(e) => setPropertyNotesDescription(e.target.value)}
            className="text-[16px] md:text-[20px] text-[#303030] font-light leading-[120%] md:leading-[100%] bg-transparent border-none outline-none w-full resize-none h-32"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {[featuredImage1, featuredImage2, featuredImage3].map((src, index) => (
          <div key={index} className="h-[200px] md:h-[300px] overflow-hidden relative group">
            <ImageBlock
              image={src}
              fileRef={index === 0 ? featuredImage1Ref : index === 1 ? featuredImage2Ref : featuredImage3Ref}
              onChange={index === 0
                ? handleImageChange(setFeaturedImage1)
                : index === 1
                  ? handleImageChange(setFeaturedImage2)
                  : handleImageChange(setFeaturedImage3)
              }
              onDelete={index === 0
                ? handleDeleteImage(setFeaturedImage1, "/featuresheetimage1.png")
                : index === 1
                  ? handleDeleteImage(setFeaturedImage2, "/featuresheetimage1.png")
                  : handleDeleteImage(setFeaturedImage3, "/featuresheetimage1.png")
              }
              defaultImage="/featuresheetimage1.png"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-5 px-4 md:px-5 py-6 md:py-10">
        <div className="flex flex-col w-full md:w-[50%] gap-[24px] md:gap-[48px] font-alexandria">
          <input
            type="text"
            value={expandedDetail1Title}
            onChange={(e) => setExpandedDetail1Title(e.target.value)}
            className="text-[#4290E9] text-[24px] md:text-[36px] font-light bg-transparent border-none outline-none w-full"
          />
          <textarea
            value={expandedDetail1Description}
            onChange={(e) => setExpandedDetail1Description(e.target.value)}
            className="text-[16px] md:text-[20px] text-[#303030] font-light leading-[120%] md:leading-[100%] bg-transparent border-none outline-none w-full resize-none h-32"
          />
        </div>

        <div className="flex flex-col w-full md:w-[50%] gap-[24px] md:gap-[48px] font-alexandria">
          <input
            type="text"
            value={expandedDetail2Title}
            onChange={(e) => setExpandedDetail2Title(e.target.value)}
            className="text-[#4290E9] text-[24px] md:text-[36px] font-light bg-transparent border-none outline-none w-full"
          />
          <textarea
            value={expandedDetail2Description}
            onChange={(e) => setExpandedDetail2Description(e.target.value)}
            className="text-[16px] md:text-[20px] text-[#303030] font-light leading-[120%] md:leading-[100%] bg-transparent border-none outline-none w-full resize-none h-32"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 px-4 md:px-5 py-6 md:py-10">
        {highlights.map((highlight, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-4 md:gap-6 font-alexandria w-full sm:w-[45%] md:w-[300px]"
          >
            <input
              type="text"
              value={highlight.title}
              onChange={(e) => handleHighlightTitleChange(index, e.target.value)}
              className="text-[#4290E9] text-[24px] md:text-[36px] font-light leading-7 md:leading-9 text-center bg-transparent border-none outline-none w-full"
            />

            <div className="text-[20px] justify-center self-center">
              {iconMap[highlight.icon] || defaultIcon}
            </div>

            <input
              type="text"
              value={highlight.value}
              onChange={(e) => handleHighlightValueChange(index, e.target.value)}
              className="text-[16px] md:text-[20px] text-[#303030] font-light leading-[120%] md:leading-[100%] text-center bg-transparent border-none outline-none w-full"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between px-4 md:px-5 py-6 md:py-10 bg-[#4290E9] font-alexandria">
        <div className="flex flex-col gap-3 md:gap-5">
          <input
            type="text"
            value={contactLabel}
            onChange={(e) => setContactLabel(e.target.value)}
            className="text-[#F2F2F2] text-[14px] md:text-[16px] font-bold bg-transparent border-none outline-none"
          />
          <input
            type="text"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            className="text-[14px] md:text-[16px] text-[#F2F2F2] font-light leading-[120%] md:leading-[100%] bg-transparent border-none outline-none"
          />
          <input
            type="text"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            className="text-[14px] md:text-[16px] text-[#F2F2F2] font-light leading-[120%] md:leading-[100%] bg-transparent border-none outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default BcfpStandard;