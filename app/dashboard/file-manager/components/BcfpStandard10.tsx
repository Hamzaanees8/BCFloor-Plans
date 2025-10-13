import { House, Pencil, Trash } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";

interface BcfpStandard {
  orderData: Order | null;
}
const BcfpStandard = ({}: BcfpStandard) => {
  const [byLawRestrictions, setByLawRestrictions] = useState("");
  const [maintFees, setMaintFees] = useState("");
  const [maintFeesInclude, setMaintFeesInclude] = useState("");
  const [featuresIncluded, setFeaturesIncluded] = useState("");
  const [siteInfluences, setSiteInfluences] = useState("");
  const [amenities, setAmenities] = useState("");
  const [view, setView] = useState("");
  const [description, setDescription] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [amount, setAmount] = useState("");
  const [number, setNumber] = useState("");
  const [addressCode, setAddressCode] = useState("");
  const [roadName, setRoadName] = useState("");
  const [cityLine, setCityLine] = useState("");
  const [bedroom, setBedroom] = useState("");
  const [bathroom, setBathroom] = useState("");
  const [sqft, setSqft] = useState("");
  const [builtYear, setBuiltYear] = useState("");

  // --- States ---
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [image3, setImage3] = useState<string | null>(null);
  const [image4, setImage4] = useState<string | null>(null);
  const [image5, setImage5] = useState<string | null>(null);
  const [image6, setImage6] = useState<string | null>(null);
  const [image7, setImage7] = useState<string | null>(null);
  const [image8, setImage8] = useState<string | null>(null);
  const [image9, setImage9] = useState<string | null>(null);
  const [image10, setImage10] = useState<string | null>(null);
  const [image11, setImage11] = useState<string | null>(null);
  const [image12, setImage12] = useState<string | null>(null);
  const [image13, setImage13] = useState<string | null>(null);
  const [image14, setImage14] = useState<string | null>(null);
  const [image15, setImage15] = useState<string | null>(null);
  const [image16, setImage16] = useState<string | null>(null);

  // --- Refs ---
  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const fileInputRef3 = useRef<HTMLInputElement | null>(null);
  const fileInputRef4 = useRef<HTMLInputElement | null>(null);
  const fileInputRef5 = useRef<HTMLInputElement | null>(null);
  const fileInputRef6 = useRef<HTMLInputElement | null>(null);
  const fileInputRef7 = useRef<HTMLInputElement | null>(null);
  const fileInputRef8 = useRef<HTMLInputElement | null>(null);
  const fileInputRef9 = useRef<HTMLInputElement | null>(null);
  const fileInputRef10 = useRef<HTMLInputElement | null>(null);
  const fileInputRef11 = useRef<HTMLInputElement | null>(null);
  const fileInputRef12 = useRef<HTMLInputElement | null>(null);
  const fileInputRef13 = useRef<HTMLInputElement | null>(null);
  const fileInputRef14 = useRef<HTMLInputElement | null>(null);
  const fileInputRef15 = useRef<HTMLInputElement | null>(null);
  const fileInputRef16 = useRef<HTMLInputElement | null>(null);

  // --- Handlers ---
  const handleDelete1 = () => {
    setImage1(null);
    if (fileInputRef1.current) fileInputRef1.current.value = "";
  };
  const handleImageChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage1(imageURL);
    }
  };

  const handleDelete2 = () => {
    setImage2(null);
    if (fileInputRef2.current) fileInputRef2.current.value = "";
  };
  const handleImageChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage2(imageURL);
    }
  };

  const handleDelete3 = () => {
    setImage3(null);
    if (fileInputRef3.current) fileInputRef3.current.value = "";
  };
  const handleImageChange3 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage3(imageURL);
    }
  };

  const handleDelete4 = () => {
    setImage4(null);
    if (fileInputRef4.current) fileInputRef4.current.value = "";
  };
  const handleImageChange4 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage4(imageURL);
    }
  };

  const handleDelete5 = () => {
    setImage5(null);
    if (fileInputRef5.current) fileInputRef5.current.value = "";
  };
  const handleImageChange5 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage5(imageURL);
    }
  };

  const handleDelete6 = () => {
    setImage6(null);
    if (fileInputRef6.current) fileInputRef6.current.value = "";
  };
  const handleImageChange6 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage6(imageURL);
    }
  };

  const handleDelete7 = () => {
    setImage7(null);
    if (fileInputRef7.current) fileInputRef7.current.value = "";
  };
  const handleImageChange7 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage7(imageURL);
    }
  };

  const handleDelete8 = () => {
    setImage8(null);
    if (fileInputRef8.current) fileInputRef8.current.value = "";
  };
  const handleImageChange8 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage8(imageURL);
    }
  };

  const handleDelete9 = () => {
    setImage9(null);
    if (fileInputRef9.current) fileInputRef9.current.value = "";
  };
  const handleImageChange9 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage9(imageURL);
    }
  };

  const handleDelete10 = () => {
    setImage10(null);
    if (fileInputRef10.current) fileInputRef10.current.value = "";
  };
  const handleImageChange10 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage10(imageURL);
    }
  };

  const handleDelete11 = () => {
    setImage11(null);
    if (fileInputRef11.current) fileInputRef11.current.value = "";
  };
  const handleImageChange11 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage11(imageURL);
    }
  };

  const handleDelete12 = () => {
    setImage12(null);
    if (fileInputRef12.current) fileInputRef12.current.value = "";
  };
  const handleImageChange12 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage12(imageURL);
    }
  };

  const handleDelete13 = () => {
    setImage13(null);
    if (fileInputRef13.current) fileInputRef13.current.value = "";
  };
  const handleImageChange13 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage13(imageURL);
    }
  };

  const handleDelete14 = () => {
    setImage14(null);
    if (fileInputRef14.current) fileInputRef14.current.value = "";
  };
  const handleImageChange14 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage14(imageURL);
    }
  };

  const handleDelete15 = () => {
    setImage15(null);
    if (fileInputRef15.current) fileInputRef15.current.value = "";
  };
  const handleImageChange15 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage15(imageURL);
    }
  };

  const handleDelete16 = () => {
    setImage15(null);
    if (fileInputRef15.current) fileInputRef15.current.value = "";
  };
  const handleImageChange16 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setImage16(imageURL);
    }
  };


  return (
    <>
      <div className="flex gap-10  px-[50px] py-[40px] bg-[#2E4F23] relative">
        <div className="w-1/2 flex flex-col gap-4 relative z-[1]">
          <div className="w-full h-[600px] bg-white border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group">
            {image1 ? (
              <>
                <Image
                  src={image1}
                  alt="uploaded"
                  width={200}
                  height={300}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef1.current?.click()}
                  className="absolute top-5 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete1}
                  className="absolute top-5 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <div
                onClick={() => fileInputRef1.current?.click()}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
              >
                Select Image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef1}
              onChange={handleImageChange1}
              className="hidden"
            />
          </div>
          <div className="flex gap-4">
            <div className="">
              <span className="text-[20px] text-[#B3B394]">CONTACT:</span>
              <StyledInput
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className=" text-[20px] text-[#B3B394] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
                placeholder="FIRSTNAME LASTNAME"
              />
              <StyledInput
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className=" text-[20px] font-thin h-[22px] font- bg-transparent text-left text-white w-full focus:outline-none border-none placeholder-white placeholder:font-[200]"
                placeholder="MACDONALD  Realty"
              />
              <div className="flex gap-2 font-normal text-[20px] text-white">
                Phone:
                <StyledInput
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="font-thin text-[20px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
                  placeholder="604.000.0000"
                />
              </div>
              <div className="flex gap-2 font-normal text-[20px] text-white">
                Email:
                <StyledInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-thin text-[20px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[200]"
                  placeholder="Enter email here"
                />
              </div>
            </div>
          </div>
          <div className="text-start mt-3  font-thin flex gap-2 text-white ">
            <div className="flex flex-col">
              <div className="flex gap-3">
                <span className="flex flex-col mt-1">
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
                <span className="text-[10px] font-bold">
                  All information deemed reliable but not guaranteed and should be
                  independently verified. All properties are subject to prior sale,
                  change or withdrawal. Neither listing broker(s) nor BC Floor Plans
                  shall be responsible for any typographical errors, misinformation,
                  misprints and shall be held totally harmless.
                </span>
              </div>
              <div className="text-[15px] mt-2 font-bold text-white">
                DESIGNED AND PRINTED BY BC FLOOR PLANS
              </div>
            </div>
            
            <div className="group z-10">
              <div className="w-[200px] h-[110px] relative bg-white shadow-md">
                {/* logo */}
                {image2 ? (
                  <>
                    <Image
                      src={image2}
                      alt="selected"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover "
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef2.current?.click()}
                      className="absolute top-2 right-10 z-8 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                    className="w-[200px] h-full bg-gray-200  text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
          
        </div>

        <div className="w-1/2 flex flex-col relative z-[1] gap-4">
          <div className="relative">
            <div className="w-full h-[450px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group">
              {image3 ? (
                <>
                  <Image
                    src={image3}
                    alt="uploaded"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef3.current?.click()}
                    className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete3}
                    className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef3.current?.click()}
                  className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
            <div className="flex w-full flex-col justify-center py-3 absolute top-0 bg-[#fff]/50 z-[19] items-center">
              <div className="text-[28px] font-light leading-none mt-0 text-[#2E4F23] flex">
                <span className="text-[16px]">#</span>
                <span className="inline">
                  <StyledInput
                    value={addressCode}
                    onChange={(e) => setAddressCode(e.target.value)}
                    className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-[#2E4F23] text-left focus:outline-none border-none placeholder-[#2E4F23] placeholder:font-[200]"
                    placeholder="0000-0000"
                  />
                </span>
                <span className="text-[#2E4F23] flex">
                  Number
                  <StyledInput
                    value={roadName}
                    onChange={(e) => setRoadName(e.target.value)}
                    className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-[#2E4F23] text-center w-[65px] focus:outline-none border-none placeholder-[#2E4F23] placeholder:font-[200]"
                    placeholder="0"
                  />
                  Road
                </span>
              </div>
              <div className="text-[#2E4F23] text-[10px]">
                <StyledInput
                  value={cityLine}
                  onChange={(e) => setCityLine(e.target.value)}
                  className="text-white text-[10px] h-[20px] bg-transparent text-left w-[150px] focus:outline-none border-none placeholder-[#2E4F23] placeholder:font-[200]"
                  placeholder="BRIGHOUSE SOUTH, RICHMOND"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col relative top-[-48px] justify-center items-center">
            <div className="grid grid-cols-2 gap-3 w-[70%]">
              <div className="w-full h-[160px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group">
                {image4 ? (
                  <>
                    <Image
                      src={image4}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef4.current?.click()}
                      className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete4}
                      className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef4.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef4}
                  onChange={handleImageChange4}
                  className="hidden"
                />
              </div>
              <div className="w-full h-[160px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group">
                {image5 ? (
                  <>
                    <Image
                      src={image5}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef5.current?.click()}
                      className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete5}
                      className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef5.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef5}
                  onChange={handleImageChange5}
                  className="hidden"
                />
              </div>
              <div className="w-full h-[160px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group">
                {image6 ? (
                  <>
                    <Image
                      src={image6}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef6.current?.click()}
                      className="absolute top-4 left-2 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete6}
                      className="absolute top-4 left-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef6.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef6}
                  onChange={handleImageChange6}
                  className="hidden"
                />
              </div>
              <div className="w-full h-[160px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group">
                {image7 ? (
                  <>
                    <Image
                      src={image7}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef7.current?.click()}
                      className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete7}
                      className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef7.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef7}
                  onChange={handleImageChange7}
                  className="hidden"
                />
              </div>
            </div>
            <div className="absolute  group z-10">
              <div className="w-[200px] h-[110px] relative bg-white shadow-md">
                {/* logo */}
                {image8 ? (
                  <>
                    <Image
                      src={image8}
                      alt="selected"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover "
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef8.current?.click()}
                      className="absolute top-2 right-10 z-8 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    <button
                      type="button"
                      onClick={handleDelete8}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef8.current?.click()}
                    className="w-[200px] h-full bg-gray-200  text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef8}
                  onChange={handleImageChange8}
                  className="hidden"
                />
              </div>
            </div>
            <div className="text-[#B3B394] w-[70%] absolute bottom-[-96px] text-center">
              <div>ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING.</div>
              <div className="mt-2">
                <StyledInput
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-semibold text-center text-[#B3B394] text-[30px] h-[40px] bg-transparent w-full focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[500]"
                  placeholder="$000,000"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 bg-[#2E4F23] p-[40px] relative">
        <div className="w-1/2 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-[200px] border-[2px] border-white shadow-sm relative z-10 group">
              {image10 ? (
                <>
                  <Image
                    src={image10}
                    alt="uploaded"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef10.current?.click()}
                    className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete10}
                    className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef10.current?.click()}
                  className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                >
                  Select Image
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef10}
                onChange={handleImageChange10}
                className="hidden"
              />
            </div>
            <div className="h-[200px] border-[2px] border-white shadow-sm relative z-10 group">
              {image11 ? (
                <>
                  <Image
                    src={image11}
                    alt="uploaded"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef11.current?.click()}
                    className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete11}
                    className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef11.current?.click()}
                  className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                >
                  Select Image
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef11}
                onChange={handleImageChange11}
                className="hidden"
              />
            </div>
          </div>
          <StyledInput
            value={description}
            rows={5}
            onChange={(e) => setDescription(e.target.value)}
            className="font-normal text-[10px] max-h-[300px] z-20 text-white leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
            placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South
              and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring,
              S/S appliances, Gas range and a large open ‘den/nook’ area perfect for the home office. Huge private balcony, great building amenities
              including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage locker and balance of the the 5-10
              warranty, this home provides nothing but exceptional value. Call today to set up your viewing. MLS # 000000"
          />
          <div className="grid grid-cols-3 text-white">
              <div>
                <div>
                  <span className="font-bold text-[#B3B394] text-[12px]">
                    BY-LAW RESTRICTIONS:
                  </span>
                  <StyledInput
                    value={byLawRestrictions}
                    rows={1}
                    onChange={(e) => setByLawRestrictions(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="Pets Allowed w/Rest., Rentals Allowed"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#B3B394] text-[12px]">
                    MAINT. FEES:
                  </span>
                  <StyledInput
                    value={maintFees}
                    rows={1}
                    onChange={(e) => setMaintFees(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="$000.00"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#B3B394] text-[12px]">
                    VIEW:
                  </span>
                  <StyledInput
                    value={view}
                    rows={1}
                    onChange={(e) => setView(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="South & SW - Van Isl."
                  />
                </div>
              </div>
              <div>
                <div>
                  <span className="font-bold text-[#B3B394] text-[12px]">
                    MAINT. FEES INCLUDE:
                  </span>
                  <StyledInput
                    value={maintFeesInclude}
                    onChange={(e) => setMaintFeesInclude(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
                    placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#B3B394] text-[12px]">
                    FEATURES INCLUDED:
                  </span>
                  <StyledInput
                    value={featuresIncluded}
                    onChange={(e) => setFeaturesIncluded(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#fff] placeholder:font-[500]"
                    placeholder="Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings"
                  />
                </div>
              </div>
              <div>
                <div>
                  <span className="font-bold text-[#B3B394] text-[12px]">
                    SITE INFLUENCES:
                  </span>
                  <StyledInput
                    value={siteInfluences}
                    onChange={(e) => setSiteInfluences(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                  />
                </div>
                <div>
                  <span className="font-bold text-[#B3B394] text-[12px]">
                    AMENITIES:
                  </span>
                  <StyledInput
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                    className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                    placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                  />
                </div>
              </div>
          </div>
          <div className="w-full h-[420px] border-[2px] border-white shadow-sm place-self-center z-10 relative overflow-hidden flex items-center justify-center group">
            {image9 ? (
              <>
                <Image
                  src={image9}
                  alt="uploaded"
                  width={200}
                  height={300}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef9.current?.click()}
                  className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete9}
                  className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <div
                onClick={() => fileInputRef9.current?.click()}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
              >
                Select Image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef9}
              onChange={handleImageChange9}
              className="hidden"
            />
            <div className="absolute top-4 place-items-center w-[80%] m-auto place-self-center">
              <div className="font-bold text-[14px] text-[#2E4F23] flex flex-wrap gap-2">
                <div className="inline">
                  <StyledInput
                    value={bedroom}
                    onChange={(e) => setBedroom(e.target.value)}
                    className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="0"
                  />
                </div>
                BEDROOM |
                <div className="inline">
                  <StyledInput
                    value={bathroom}
                    onChange={(e) => setBathroom(e.target.value)}
                    className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="0"
                  />
                </div>
                BATHROOM |
                <div className="inline">
                  <StyledInput
                    value={sqft}
                    onChange={(e) => setSqft(e.target.value)}
                    className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="000"
                  />
                </div>
                SQ FT |
                <div className="inline">
                  <StyledInput
                    value={builtYear}
                    onChange={(e) => setBuiltYear(e.target.value)}
                    className="font-semibold text-[13px] bg-transparent text-left h-[30px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="0000"
                  />
                </div>
                BUILT IN
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/2 flex gap-4">
          <div className="w-full flex flex-col gap-4 ">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-[200px] relative z-10 group border-[2px] border-white shadow-sm">
                {image12 ? (
                  <>
                    <Image
                      src={image12}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef12.current?.click()}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete12}
                      className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef12.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef12}
                  onChange={handleImageChange12}
                  className="hidden"
                />
              </div>
              <div className="h-[200px] relative z-10 group border-[2px] border-white shadow-sm">
                {image13 ? (
                  <>
                    <Image
                      src={image13}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef13.current?.click()}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete13}
                      className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef13.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef13}
                  onChange={handleImageChange13}
                  className="hidden"
                />
              </div>
            </div>
            <div className="h-[440px] relative z-10 group border-[2px] border-white shadow-sm">
              {image14 ? (
                <>
                  <Image
                    src={image14}
                    alt="uploaded"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef14.current?.click()}
                    className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete14}
                    className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef14.current?.click()}
                  className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                >
                  Select Image
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef14}
                onChange={handleImageChange14}
                className="hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-[200px] relative z-10 group border-[2px] border-white shadow-sm">
                {image15 ? (
                  <>
                    <Image
                      src={image15}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef15.current?.click()}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete15}
                      className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef15.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef15}
                  onChange={handleImageChange15}
                  className="hidden"
                />
              </div>
              <div className="h-[200px] relative z-10 group border-[2px] border-white shadow-sm">
                {image16 ? (
                  <>
                    <Image
                      src={image16}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef16.current?.click()}
                      className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete16}
                      className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef16.current?.click()}
                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                  >
                    Select Image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef16}
                  onChange={handleImageChange16}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BcfpStandard;
