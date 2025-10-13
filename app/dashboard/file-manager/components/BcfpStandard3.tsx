import { House, Pencil, Trash } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";

interface BcfpStandard {
  orderData: Order | null;
}
const BcfpStandard = ({ }: BcfpStandard) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImage2, setSelectedImage2] = useState<string | null>(null);
  const [selectedImage3, setSelectedImage3] = useState<string | null>(null);
  const [imageMain, setImageMain] = useState<string | null>("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [amount, setAmount] = useState("");
  const [byLawRestrictions, setByLawRestrictions] = useState("");
  const [maintenanceFees, setMaintenanceFees] = useState("");
  const [maintenanceFeesInclude, setMaintenanceFeesInclude] = useState("");
  const [featuresIncluded, setFeaturesIncluded] = useState("");
  const [siteInfluences, setSiteInfluences] = useState("");
  const [amenities, setAmenities] = useState("");
  const [mlsNumber, setMlsNumber] = useState("");
  const [view, setView] = useState("");
  const [bedroom, setBedroom] = useState("");
  const [bathroom, setBathroom] = useState("");
  const [sqft, setSqft] = useState("");
  const [builtYear, setBuiltYear] = useState("");
  const [description, setDescription] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const fileInputRef3 = useRef<HTMLInputElement | null>(null);
  const fileInputMainRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setSelectedImage(imageURL);
    }
  };

  const handleImageChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setSelectedImage2(imageURL);
    }
  };
  const handleImageChange3 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setSelectedImage3(imageURL);
    }
  };

  const handleGridImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setter(imageURL);
    }
  };

  const handleDeleteGrid = (
    setter: React.Dispatch<React.SetStateAction<string | null>>,
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    setter(null);
    if (ref.current) ref.current.value = "";
  };

  const handleDelete = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete2 = () => {
    setSelectedImage2(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleDelete3 = () => {
    setSelectedImage3(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const ImageBlock = ({
    image,
    fileRef,
    onChange,
    onDelete,
  }: {
    image: string | null;
    fileRef: React.RefObject<HTMLInputElement | null>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: () => void;
  }) => (
    <div className="relative w-full h-full font-alexandria group">
      {image ? (
        <>
          {/* Image */}
          <Image
            src={image}
            alt="uploaded"
            fill
            className="object-cover rounded" // full height + crop
          />

          {/* Edit button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 
                     opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            title="Edit image"
          >
            <Pencil className="w-4 h-4 text-gray-700" />
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={onDelete}
            className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 
                     opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            title="Delete image"
          >
            <Trash className="w-4 h-4 text-red-500" />
          </button>
        </>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="w-full h-full bg-white text-gray-600 flex items-center justify-center cursor-pointer 
                   border border-dashed border-gray-400 rounded"
        >
          Select Image
        </div>
      )}

      {/* Hidden file input */}
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
    <div className="w-full items-center justify-center font-alexandria">
      <div className="">
        <div className=""> </div>
      </div>

      <div className="flex items-stretch ">
        <div
          className="w-1/2 flex flex-col relative overflow-hidden items-center justify-center group p-[50px]"
          style={{
            background:
              "linear-gradient(90deg, #00B9F2 0%, #0097C9 39%, #028DBD 52%, #1B6C9B 89%, #226392 100%)",
          }}
        >
          <div className="min-h-[400px] w-full">
            {selectedImage ? (
              <>
                <Image
                  src={selectedImage}
                  alt="uploaded"
                  width={200}
                  height={300}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
              >
                Select Image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <div className="my-3 w-[200px] h-[100] relative">
            {/* logo */}
            {selectedImage ? (
              <>
                <Image
                  src={selectedImage}
                  alt="selected"
                  width={200}
                  height={300}
                  className="w-full h-full object-cover rounded"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-[200px] h-full bg-gray-200  text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
              >
                Select Image
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <div className=" text-white leading-none text-center px-12 w-10/12">
            <div>
              <div className="font-semibold text-[20px] flex gap-3">
                <StyledInput
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className=" text-[28px] h-[30px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                  placeholder="Enter full name" />
                <StyledInput
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className=" text-[16px] h-[16px] mt-2 font- bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                  placeholder="MACDONALD  Realty" />
              </div>
              <div className="font-semibold text-[20px] flex gap-3">
                <StyledInput
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-semibold text-[16px] h-[30px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                  placeholder="Enter amount" />
                <StyledInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-thin text-[16px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                  placeholder="Enter email here" />
              </div>

            </div>
            <div className="w-full text-right">
              <StyledInput
                value={mlsNumber}
                onChange={(e) => setMlsNumber(e.target.value)}
                className="font-semibold text-[14px] bg-transparent text-center w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="Enter MLS number"
              />
            </div>
          </div>
          <div className=" text-white leading-none text-center px-12">
            <div className="text-start mt-3  font-thin flex">
              <span className="text-[8px]">
                All information deemed reliable but not guaranteed and should be
                independently verified. All properties are subject to prior
                sale, change or withdrawal. Neither listing broker(s) nor BC
                Floor Plans shall be responsible for any typographical errors,
                misinformation, misprints and shall be held totally harmless.
              </span>
              <span className="flex mt-2">
                <House className="w-4 h-4" />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 8 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.07208 6.90507H1.20908C1.29908 6.90507 1.36508 6.90507 1.41708 6.95207C1.46108 6.99307 1.48508 7.04807 1.48508 7.11207C1.48508 7.22007 1.40508 7.30107 1.28408 7.30107H1.19308L1.47508 7.75507H1.58608L1.35708 7.38907C1.48808 7.37607 1.58608 7.25507 1.58608 7.11207C1.58608 7.01407 1.53908 6.91807 1.46108 6.86707C1.39608 6.81707 1.32508 6.81007 1.23408 6.81007H0.981079V7.75507H1.07208V6.90507Z"
                    fill="white"
                  />
                  <path
                    d="M1.93073 6.81015V7.75415H2.41973V7.66515H2.02373V7.32915H2.41973V7.23415H2.02373V6.90415H2.41973V6.81015H1.93073Z"
                    fill="white"
                  />
                  <path
                    d="M3.04311 6.81015L2.67511 7.75415H2.77411L2.88611 7.45715H3.30711L3.42011 7.75415H3.51911L3.15411 6.81015H3.04311ZM3.09611 6.89915L3.27511 7.37315H2.92011L3.09611 6.89915Z"
                    fill="white"
                  />
                  <path
                    d="M3.7901 6.81015V7.75415H4.2151V7.66515H3.8821V6.81015H3.7901Z"
                    fill="white"
                  />
                  <path
                    d="M4.39758 6.81015V6.90415H4.58758V7.75415H4.67958V6.90415H4.86958V6.81015H4.39758Z"
                    fill="white"
                  />
                  <path
                    d="M5.06702 7.27662C5.06702 7.56062 5.27402 7.77362 5.54502 7.77362C5.68702 7.77362 5.80902 7.71862 5.90602 7.61262C5.99002 7.52262 6.03102 7.41062 6.03102 7.27662C6.03102 7.14462 5.98202 7.02362 5.88502 6.93162C5.79302 6.83962 5.68002 6.79162 5.54802 6.79162C5.41702 6.79162 5.30602 6.83962 5.21402 6.92862C5.11902 7.02362 5.06702 7.14462 5.06702 7.27662ZM5.16202 7.27662C5.16202 7.16162 5.22002 7.04762 5.30702 6.97162C5.37602 6.91262 5.45902 6.88262 5.54502 6.88262C5.76502 6.88262 5.93702 7.06462 5.93702 7.27662C5.93702 7.50762 5.76502 7.68462 5.55402 7.68462C5.33602 7.68462 5.16202 7.51362 5.16202 7.27662Z"
                    fill="white"
                  />
                  <path
                    d="M6.43873 6.90507H6.57373C6.66173 6.90507 6.72973 6.90507 6.77973 6.95207C6.82773 6.99307 6.84873 7.04807 6.84873 7.11207C6.84873 7.22007 6.76873 7.30107 6.64773 7.30107H6.55773L6.83973 7.75507H6.94873L6.71973 7.38907C6.85373 7.37607 6.94873 7.25507 6.94873 7.11207C6.94873 7.01407 6.90173 6.91807 6.82773 6.86707C6.75973 6.81707 6.68873 6.81007 6.60073 6.81007H6.34473V7.75507H6.43873V6.90507Z"
                    fill="white"
                  />
                  <path
                    d="M0.880005 6.474H6.89398V0.460997H0.880005V6.474ZM4.07703 1.183H4.74799C5.36499 1.245 5.81501 1.728 5.80701 2.328C5.80201 2.92 5.35999 3.386 4.74799 3.449H4.07703V1.183ZM3.42798 5.714H1.73199V1.178H3.42798V5.714ZM4.07703 5.724V3.467L6.427 5.724H4.07703Z"
                    fill="white"
                  />
                  <path
                    d="M7.07922 6.6356C7.03422 6.6356 6.99122 6.6546 6.96222 6.6886C6.92922 6.7186 6.91022 6.7646 6.91022 6.8076C6.91022 6.8516 6.92722 6.8956 6.96222 6.9276C6.99122 6.9616 7.03422 6.9776 7.07922 6.9776C7.12522 6.9776 7.16922 6.9616 7.20322 6.9276C7.23322 6.8956 7.25122 6.8546 7.25122 6.8076C7.25122 6.7626 7.23322 6.7186 7.20322 6.6886C7.16922 6.6546 7.12722 6.6356 7.07922 6.6356ZM7.23322 6.8076C7.23322 6.8516 7.21822 6.8856 7.19022 6.9156C7.15922 6.9436 7.11922 6.9586 7.07922 6.9586C7.03922 6.9586 7.00322 6.9436 6.97422 6.9156C6.94422 6.8856 6.92922 6.8466 6.92922 6.8076C6.92922 6.7696 6.94422 6.7286 6.97422 6.6976C7.00322 6.6706 7.03822 6.6546 7.07922 6.6546C7.12122 6.6546 7.15922 6.6706 7.19022 6.7016C7.21622 6.7286 7.23322 6.7656 7.23322 6.8076ZM7.08722 6.7066H7.01222V6.9016H7.04322V6.8156H7.08822L7.13122 6.9016H7.16522L7.11922 6.8106C7.15022 6.8076 7.16722 6.7896 7.16722 6.7626C7.16722 6.7236 7.14122 6.7066 7.08722 6.7066ZM7.07922 6.7256C7.11822 6.7256 7.13822 6.7366 7.13822 6.7646C7.13822 6.7896 7.11822 6.7976 7.07922 6.7976H7.04322V6.7256H7.07922Z"
                    fill="white"
                  />
                </svg>
              </span>
            </div>
            <div className="text-start font-semibold text-[10px] mt-1">
              DESIGNED AND PRINTED BY BC FLOOR PLANS
            </div>
          </div>
        </div>
        <div className="w-1/2 bg-gray-200 relative overflow-hidden flex items-center justify-center group">
          <div className="flex justify-center content-center absolute top-0 left-0 right-0 px-12 z-10">
            <div className="w-full text-start content-center">
              <StyledInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-semibold text-[26px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="Enter Title"
              />
              <StyledInput
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="font-semibold text-[13px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="Enter Subtitle"
              />
            </div>
            <div className="my-3 w-[200px] h-[100] relative">
              {/* logo */}
              {selectedImage ? (
                <>
                  <Image
                    src={selectedImage}
                    alt="selected"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover rounded"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-[200px] h-full bg-gray-200  text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                >
                  Select Image
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          <svg
            width="100%" // Now scales the viewBox
            height="418"
            viewBox="0 0 632 418"
            fill="none"
            preserveAspectRatio="none"
            className="absolute top-0 right-0 left-0 w-full"
          >
            {/* Wavy path (using the original fixed coordinates) */}
            <path
              d="M0.692032 115.581L631.688 101L630.405 418C630.405 418 587.402 78.0195 0.688049 173.546L0.692032 115.581Z"
              fill="#00B9F2"
            />

            {/* Mask Definition - keeps fixed coordinates */}
            <mask
              id="mask0_72_1672"
              style={{ maskType: "luminance" }}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="632"
              height="405"
            >
              <path
                d="M0 0L0.799988 146.9C590.8 64.1 631.3 404.8 631.3 404.8V0H0Z"
                fill="white"
              />
            </mask>

            {/* Group with Mask and Gradient Fill (Covers the whole viewBox) */}
            <g mask="url(#mask0_72_1672)">
              {/* Simple rectangle covering the entire 632x418 viewBox */}
              <rect
                x="0"
                y="0"
                width="632"
                height="418"
                fill="url(#paint0_linear_72_1672)"
              />
            </g>

            {/* Definitions for Linear Gradient */}
            <defs>
              <linearGradient
                id="paint0_linear_72_1672"
                x1="0" // Start at the left edge of the object
                y1="0"
                x2="1" // End at the right edge of the object
                y2="0"
                // Crucial Change: Scales the gradient to the object's dimensions
                gradientUnits="objectBoundingBox"
              >
                <stop stopColor="#00B9F2" />
                <stop offset="0.391667" stopColor="#0097C9" />
                <stop offset="0.515476" stopColor="#028DBD" />
                <stop offset="0.892857" stopColor="#1B6C9B" />
                <stop offset="1" stopColor="#226392" />
              </linearGradient>
            </defs>
          </svg>

          <div className="w-full h-full justify-center content-center">
            {selectedImage3 ? (
              <>
                <Image
                  src={selectedImage3}
                  alt="uploaded"
                  width={200}
                  height={300}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef3.current?.click()}
                  className="absolute top-1/3 right-10 bg-white p-1 rounded-full shadow  opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete3}
                  className="absolute top-1/3 right-2 bg-white p-1 rounded-full shadow  opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <div
                onClick={() => fileInputRef3.current?.click()}
                className="w-full relative z-10 h-[500px] text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
              >
                Select Image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef3}
              onChange={handleImageChange3}
              className="hidden"
            />
          </div>

          <svg
            width="100%"
            height="319"
            viewBox="0 0 634 319"
            fill="none"
            preserveAspectRatio="none"
            className="absolute bottom-0 -right-1 left-0 w-full"
          >
            <path
              d="M633.05 280.308L4.3773 293L0.0778809 -2.80029e-06C0.0778809 -2.80029e-06 43.2047 299.058 633.078 215.36L633.05 280.308Z"
              fill="#00B9F2"
            />

            <mask
              id="mask0_73_1690"
              style={{ maskType: "luminance" }}
              maskUnits="userSpaceOnUse"
              x="0"
              y="6"
              width="634"
              height="313"
            >
              <path
                d="M0 318.802H633.441V239.402C41.4401 313.502 0.802701 6.00183 0.802701 6.00183L0 318.802Z"
                fill="white"
              />
            </mask>

            <g mask="url(#mask0_73_1690)">
              <path
                d="M633.441 -509.198H-630.832V318.802H633.441V-509.198Z"
                fill="url(#paint0_linear_73_1690)"
              />
            </g>

            <defs>
              <linearGradient
                id="paint0_linear_73_1690"
                x1="633.441"
                y1="308.014"
                x2="0.837279"
                y2="308.014"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#00B9F2" />
                <stop offset="0.391667" stopColor="#0097C9" />
                <stop offset="0.515476" stopColor="#028DBD" />
                <stop offset="0.892857" stopColor="#1B6C9B" />
                <stop offset="1" stopColor="#226392" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="flex items-stretch  min-h-[990px] relative">
        <div className="w-1/2 relative ">
          <svg
            width="400px"
            height="100%"
            viewBox="0 0 569 828"
            fill="none"
            preserveAspectRatio="none"
            className="absolute top-0 right-0 bottom-0 w-full h-full"
          >
            <path
              d="M64.9235 -3.07471L42.1565 822.334L568.239 827.848C568.239 827.848 31.2785 771.359 181.536 -3.13971L64.9235 -3.07471Z"
              fill="#00B9F2"
            />

            <mask
              id="mask0_77_1804"
              style={{ maskType: "luminance" }}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="558"
              height="828"
            >
              <path
                d="M0.333252 0V828L557.333 827C557.333 827 12.8333 773.9 143.933 0H0.333252Z"
                fill="white"
              />
            </mask>

            <g mask="url(#mask0_77_1804)">
              <path
                d="M1260.33 0V828H0.333249V0H1260.33Z"
                fill="url(#paint0_linear_77_1804)"
              />
            </g>

            <defs>
              <linearGradient
                id="paint0_linear_77_1804"
                x1="22.4077"
                y1="-0.318146"
                x2="22.4077"
                y2="826.954"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#00B9F2" />
                <stop offset="0.391667" stopColor="#0097C9" />
                <stop offset="0.515476" stopColor="#028DBD" />
                <stop offset="0.892857" stopColor="#1B6C9B" />
                <stop offset="1" stopColor="#226392" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="w-1/2 relative ">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 692 828"
            fill="none"
            preserveAspectRatio="none"
            className="absolute top-0 bottom-0 left-0 w-full h-full"
          >
            <path
              d="M607.291 828.48L637.013 -3.89404L0.845947 -1.79901C0.845947 -1.79901 683.097 54.4949 490.964 828.559L607.291 828.48Z"
              fill="#00B9F2"
            />

            <mask
              id="mask0_77_1803"
              style={{ maskType: "luminance" }}
              maskUnits="userSpaceOnUse"
              x="40"
              y="0"
              width="652"
              height="828"
            >
              <path
                d="M40.0332 0C168.833 20.2 687.233 144.5 538.533 827L691.333 828V0H40.0332Z"
                fill="white"
              />
            </mask>

            <g mask="url(#mask0_77_1803)">
              <path
                d="M-568.667 828V4.1431e-05H691.333V828H-568.667Z"
                fill="url(#paint0_linear_77_1803)"
              />
            </g>

            <defs>
              <linearGradient
                id="paint0_linear_77_1803"
                x1="661.929"
                y1="826.95"
                x2="661.929"
                y2="-3.59994"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#00B9F2" />
                <stop offset="0.391667" stopColor="#0097C9" />
                <stop offset="0.515476" stopColor="#028DBD" />
                <stop offset="0.892857" stopColor="#1B6C9B" />
                <stop offset="1" stopColor="#226392" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="flex gap-4 z-10 tems-stretch absolute top-0 left-0 right-0 bottom-0 p-[50px]">
          <div className="w-1/2 h-full flex flex-col gap-4">
            <div className="h-[445px] border-2 border-[#fff]">
              <ImageBlock
                image={imageMain}
                fileRef={fileInputMainRef}
                onChange={(e) => handleGridImageChange(e, setImageMain)}
                onDelete={() =>
                  handleDeleteGrid(setImageMain, fileInputMainRef)
                }
              />
            </div>
            <div className="flex gap-8 ">
              <div className="w-[400px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group">
                {selectedImage2 ? (
                  <>
                    <Image
                      src={selectedImage2}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef2.current?.click()}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete2}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef2.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef2}
                  onChange={handleImageChange2}
                  className="hidden"
                />
              </div>
              <div className="w-fit flex flex-col gap-2">
                <div className="font-bold text-[14px] text-[#226292] flex flex-wrap gap-2">
                  <div className="inline">
                    <StyledInput
                      value={bedroom}
                      onChange={(e) => setBedroom(e.target.value)}
                      className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="0"
                    />
                  </div>
                  BEDROOM •
                  <div className="inline">
                    <StyledInput
                      value={bathroom}
                      onChange={(e) => setBathroom(e.target.value)}
                      className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="0"
                    />
                  </div>
                  BATHROOM •
                  <div className="inline">
                    <StyledInput
                      value={sqft}
                      onChange={(e) => setSqft(e.target.value)}
                      className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[60px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="000"
                    />
                  </div>
                  SQ FT •
                  BUILT IN
                  <div className="inline">
                    <StyledInput
                      value={builtYear}
                      onChange={(e) => setBuiltYear(e.target.value)}
                      className="font-semibold text-[13px] bg-transparent text-left h-[30px] w-[80px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="0000"
                    />
                  </div>
                </div>
                <div className="font-normal text-[14px] text-[#2C2E35]">

                </div>
                <StyledInput
                  value={description}
                  rows={8}
                  onChange={(e) => setDescription(e.target.value)}
                  className="font-normal text-[14px] max-h-[300px] bg-transparent text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                  placeholder="On top of it all! Beautiful sub-penthouse in the well
                  appointed CENTRO building. This centrally located 2 bedroom, 2
                  bathroom home boasts incredible, totally unobstructed VIEWS
                  overlooking Brighouse Park & to the South and South
                  Westproviding unhindered privacy. The perfect floorplan with
                  open concept living and cross unit bedrooms. Dark laminate
                  flooring, S/S appliances, Gas range and a large open
                  ‘den/nook’ area perfect for the home office.."
                />

              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-1/2 h-[200px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group">
                {selectedImage2 ? (
                  <>
                    <Image
                      src={selectedImage2}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef2.current?.click()}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete2}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef2.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef2}
                  onChange={handleImageChange2}
                  className="hidden"
                />
              </div>
              <div className="w-1/2 h-[200px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group">
                {selectedImage2 ? (
                  <>
                    <Image
                      src={selectedImage2}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef2.current?.click()}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-[#fff] " fill="#ccc" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete2}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef2.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef2}
                  onChange={handleImageChange2}
                  className="hidden"
                />
              </div>
            </div>
          </div>
          <div className="w-1/2 h-full flex flex-col gap-3">
            <div className="absolute top-[50px] right-[50px] z-10 text-right w-[300px] flex flex-col gap-0">
              <div className="text-white text-[12px] text-right">BY-LAW RESTRICTIONS:</div>
              <StyledInput
                value={byLawRestrictions}
                rows={1}
                onChange={(e) => setByLawRestrictions(e.target.value)}
                className="font-semibold text-[10px] bg-transparent text-white text-right h-[12px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="Pets Allowed w/Rest., Rentals Allowed"
              />
              <div className="text-white text-[12px] text-right">MAINTENANCE FEES:</div>
              <StyledInput
                value={maintenanceFees}
                rows={1}
                onChange={(e) => setMaintenanceFees(e.target.value)}
                className="font-semibold text-[10px] text-white bg-transparent text-right h-[12px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="$000.00"
              />
              <div className="text-white text-[12px] text-right">MAINTENANCE FEES INCLUDE:</div>
              <StyledInput
                value={maintenanceFeesInclude}
                rows={2}
                onChange={(e) => setMaintenanceFeesInclude(e.target.value)}
                className="font-semibold text-white text-[10px] bg-transparent  text-right h-auto min-h-[11px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="Gardening, Garbage  Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"

              />
              <div className="text-white text-[12px] text-right">FEATURES INCLUDED:</div>
              <StyledInput
                value={featuresIncluded}
                rows={2}
                onChange={(e) => setFeaturesIncluded(e.target.value)}
                className="font-semibold text-white text-[8px] bg-transparent  text-right h-[10px] min-h-[10px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="Clothes"

              />
              <div className="text-white text-[12px] text-right">SITE INFLUENCES:</div>
              <StyledInput
                value={siteInfluences}
                rows={1}
                onChange={(e) => setSiteInfluences(e.target.value)}
                className="font-semibold text-white text-[8px] bg-transparent  text-right h-[10px] min-h-[10px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="Central Location, Golf Course Nearby"

              />
              <div className="text-white text-[12px] text-right">AMENITIES:</div>
              <StyledInput
                value={amenities}
                rows={2}
                onChange={(e) => setAmenities(e.target.value)}
                className="font-semibold text-white text-[8px] bg-transparent  text-right h-[10px] min-h-[10px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="Exercise Centre, Garden, In Suite Laundry"
              />
              <div className="text-white text-[12px] text-right">VIEW:</div>
              {/* View */}
              <StyledInput
                value={view}
                rows={1}
                onChange={(e) => setView(e.target.value)}
                className="font-semibold text-white text-[8px] bg-transparent  text-right h-[10px] min-h-[10px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="Soutn & SW - van island"

              />
            </div>

            <div className="w-1/2 h-[230px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group">
              {selectedImage2 ? (
                <>
                  <Image
                    src={selectedImage2}
                    alt="uploaded"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef2.current?.click()}
                    className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete2}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef2.current?.click()}
                  className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                >
                  Select Image
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef2}
                onChange={handleImageChange2}
                className="hidden"
              />
            </div>
            <div className="flex gap-3">
              <div className="w-1/2 h-[212px] border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group">
                {selectedImage2 ? (
                  <>
                    <Image
                      src={selectedImage2}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef2.current?.click()}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete2}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef2.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef2}
                  onChange={handleImageChange2}
                  className="hidden"
                />
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-[150px] h-1/2 border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group">
                  {selectedImage2 ? (
                    <>
                      <Image
                        src={selectedImage2}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef2.current?.click()}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete2}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => fileInputRef2.current?.click()}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef2}
                    onChange={handleImageChange2}
                    className="hidden"
                  />
                </div>
                <div className="w-[150px] h-1/2 border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group">
                  {selectedImage2 ? (
                    <>
                      <Image
                        src={selectedImage2}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef2.current?.click()}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete2}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => fileInputRef2.current?.click()}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef2}
                    onChange={handleImageChange2}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 justify-end">
                <div className="w-[150px] h-1/2 border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group">
                  {selectedImage2 ? (
                    <>
                      <Image
                        src={selectedImage2}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef2.current?.click()}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete2}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => fileInputRef2.current?.click()}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef2}
                    onChange={handleImageChange2}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <div className="h-[500px] border-2 border-[#fff] ">
              <ImageBlock
                image={imageMain}
                fileRef={fileInputMainRef}
                onChange={(e) => handleGridImageChange(e, setImageMain)}
                onDelete={() =>
                  handleDeleteGrid(setImageMain, fileInputMainRef)
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BcfpStandard;
