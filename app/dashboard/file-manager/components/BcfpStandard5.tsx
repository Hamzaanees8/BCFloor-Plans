import {  House, Pencil, Trash } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";

interface BcfpStandard {
  orderData: Order | null;
}
const BcfpStandard = ({}: BcfpStandard) => {
  // --- States ---
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [image3, setImage3] = useState<string | null>(null);
  const [image4, setImage4] = useState<string | null>(null);
  const [image5, setImage5] = useState<string | null>(null);
  const [image6, setImage6] = useState<string | null>(null);
  const [image7, setImage7] = useState<string | null>(null);

  // --- Refs ---
  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const fileInputRef3 = useRef<HTMLInputElement | null>(null);
  const fileInputRef4 = useRef<HTMLInputElement | null>(null);
  const fileInputRef5 = useRef<HTMLInputElement | null>(null);
  const fileInputRef6 = useRef<HTMLInputElement | null>(null);
  const fileInputRef7 = useRef<HTMLInputElement | null>(null);

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

  


  return (
    <>
    <div className="w-full flex  justify-center font-alexandria">
      <div className="w-full bg-[#376173] flex flex-col relative">
        <div className="flex w-full flex-col justify-center relative z-[19] items-center pt-[50px]">
          <div className="text-[28px] font-light leading-none mt-0 text-[#00B9F2]">0000-0000 <span className="text-[#226292]">Number 0 Road</span></div>
          <div className="text-[#2C2E35] text-[10px]">BRIGHOUSE SOUTH, RICHMOND</div> 
        </div>
        <svg
          className="absolute top-0 left-0 w-full z-[18]"
          height="193"
          viewBox="0 0 648 193"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <mask
            id="mask0_125_1511"
            className="absolute top-0 right-0 left-0"
            maskUnits="userSpaceOnUse"
            x="0"
            y="70"
            width="648"
            height="123"
          >
            <path
              d="M0 128.56V152.86C7.9 161.46 75.7 226.86 284.2 169.96C507.1 109.16 647.2 160.66 647.2 160.66V159.36L648 136.96V88.2596L2 70.5596L0 128.56Z"
              fill="white"
            />
          </mask>
          <g mask="url(#mask0_125_1511)">
            <path
              d="M673.274 40.7318L0.604411 20.1799L-25.274 867.187L647.396 887.739L673.274 40.7318Z"
              fill="url(#paint0_linear_125_1511)"
            />
          </g>
          <path
            d="M648 141.354C648 141.354 506.181 93.772 285.49 160.644C64.8 227.517 0 150.356 0 150.356V1.52588e-05H648V140.068"
            fill="white"
          />
          <defs>
            <linearGradient
              id="paint0_linear_125_1511"
              x1="645.986"
              y1="208.835"
              x2="-1.93693"
              y2="189.039"
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
        <div className="w-full h-[730px] mt-[25px] place-self-center relative overflow-hidden flex items-center justify-center group">
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
                className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                title="Edit image"
              >
                <Pencil className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleDelete1}
                className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
          <div className="text-[18px] text-white font-bold absolute bottom-5 shadow-sm ">0 BEDROOM • 0 BATHROOM • 000 SQ FT • BUILT IN 0000</div>
        </div>
        <div className="grid grid-cols-4">
          <div className="h-[230px] relative group">
            {image2 ? (
            <>
              <Image
                src={image2}
                alt="uploaded"
                width={200}
                height={300}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => fileInputRef2.current?.click()}
                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                title="Edit image"
              >
                <Pencil className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleDelete2}
                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
          <div className="h-[230px] relative group">
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
                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                title="Edit image"
              >
                <Pencil className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleDelete3}
                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
          <div className="h-[230px] relative group">
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
                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                title="Edit image"
              >
                <Pencil className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleDelete4}
                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
          <div className="h-[230px] relative group">
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
                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                title="Edit image"
              >
                <Pencil className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleDelete5}
                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
        </div>
        <div className="p-6 bg-white">
          <div className="flex gap-8 px-[70px]" >
            <div className="flex-1 flex gap-8 ">
              <div className="flex-1 space-y-4 text-sm">
                <div className="text-[#226292] text-[30px]">$000,000</div>
                <div>
                  <p  className="font-bold text-[#00B9F2] text-[10px]">BY-LAW RESTRICTIONS:</p>
                  <p className="text-[9px]">Pets Allowed w/Rest., Rentals Allowed</p>
                </div>
                <div>
                  <p  className="font-bold text-[#00B9F2] text-[10px]">MAINT. FEES:</p>
                  <p className="text-[9px]">$000.00</p>
                </div>
                <div>
                  <p  className="font-bold text-[#00B9F2] text-[10px]">MAINT. FEES INCLUDE:</p>
                  <p className="text-[9px]">
                    Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation
                    Facility, Other, Caretaker
                  </p>
                </div>
                <div>
                  <p className="font-bold text-[#00B9F2] text-[10px]">FEATURES INCLUDED:</p>
                  <p className="text-[9px]">
                    Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings
                  </p>
                </div>
              </div>

              {/* Right Column inside Left Side */}
              <div className="flex-1 space-y-4 text-sm">
                <div>
                  <p  className="font-bold text-[#00B9F2] text-[10px]">SITE INFLUENCES:</p>
                  <p className="text-[9px]">
                    Central Location, Golf Course Nearby, Recreation Nearby, Shopping
                    Nearby
                  </p>
                </div>
                <div>
                  <p  className="font-bold text-[#00B9F2] text-[10px]">AMENITIES:</p>
                  <p className="text-[9px]">
                    Exercise Centre, Garden, In Suite Laundry, Sauna/ Steam Room
                  </p>
                </div>
                <div>
                  <p  className="font-bold text-[#00B9F2] text-[10px]">VIEW:</p>
                  <p className="text-[9px]">South & SW - Van Isl.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 text-sm leading-relaxed">
              <p className="text-[9px]">
                On top of it all! Beautiful sub-penthouse in the well appointed CENTRO
                building. This centrally located 2 bedroom, 2 bathroom home boasts
                incredible, totally unobstructed VIEWS overlooking Brighouse Park & to
                the South and South West providing unhindered privacy. The perfect
                floorplan with open concept living and cross unit bedrooms. Dark
                laminate flooring, S/S appliances, Gas range and a large open ‘den/nook’
                area perfect for the home office.
              </p>
              <p className="text-[9px] mt-3" >
                Huge private balcony, great building amenities including exercise room,
                sauna, roof top courtyard and outdoor kids playground. With parking, and
                storage locker and balance of the the 5-10 warranty, this home provides
                nothing but exceptional value. Call today to set up your viewing.{" "}
                <span className="text-[#00B9F2] text-[10px]">MLS # 0000000</span>
              </p>
            </div>
          </div>
        </div>
        <div className="w-full h-[100px] relative px-[90px] pt-[10px]" style={{background: "linear-gradient(90deg, #00B9F2 0%, #0097C9 39%, #028DBD 52%, #186C9B 89%, #226392 100%)",}}>
          <div className="absolute top-[-60px] right-[55px] group">
            <div className="w-[200px] h-[110px] relative bg-white shadow-md">
              {/* logo */}
              {image6 ? (
                <>
                  <Image
                    src={image6}
                    alt="selected"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover "
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef6.current?.click()}
                    className="absolute top-2 right-10 z-8 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete6}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef6.current?.click()}
                  className="w-[200px] h-full bg-gray-200  text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
          </div>
          <div className=" text-white leading-none text-left ">
            <div className=" text-white leading-none text-left ">
              <div className="font-semibold text-[20px] mb-1">
                FIRSTNAME LASTNAME &nbsp;{" "}
                <span className="font-thin">MACDONALD REALTY</span>
              </div>
              <div className="font-thin text-[20px] mb-1 ">
                604.000.0000 &nbsp;
                <span>
                  <a href="mailto:FIRST@LAST.COM"> Email</a>
                </span>
              </div>
            </div>
            <div className="text-start mt-3  font-thin flex w-[60%]">
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
            
          </div>
        </div>



      </div>
    </div>
    <div className="w-full flex  justify-center font-alexandria">
      <div className="w-full bg-[#376173] flex flex-col relative">
        <div className="flex w-full flex-col justify-center relative z-[19] items-center pt-[50px]">
          <div className="text-[28px] font-light leading-none mt-0 text-[#00B9F2]">0000-0000 <span className="text-[#226292]">Number 0 Road</span></div>
          <div className="text-[#2C2E35] text-[10px]">BRIGHOUSE SOUTH, RICHMOND</div> 
        </div>
        <svg
          className="absolute top-0 left-0 w-full z-[18]"
          height="193"
          viewBox="0 0 648 193"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <mask
            id="mask0_125_1511"
            className="absolute top-0 right-0 left-0"
            maskUnits="userSpaceOnUse"
            x="0"
            y="70"
            width="648"
            height="123"
          >
            <path
              d="M0 128.56V152.86C7.9 161.46 75.7 226.86 284.2 169.96C507.1 109.16 647.2 160.66 647.2 160.66V159.36L648 136.96V88.2596L2 70.5596L0 128.56Z"
              fill="white"
            />
          </mask>
          <g mask="url(#mask0_125_1511)">
            <path
              d="M673.274 40.7318L0.604411 20.1799L-25.274 867.187L647.396 887.739L673.274 40.7318Z"
              fill="url(#paint0_linear_125_1511)"
            />
          </g>
          <path
            d="M648 141.354C648 141.354 506.181 93.772 285.49 160.644C64.8 227.517 0 150.356 0 150.356V1.52588e-05H648V140.068"
            fill="white"
          />
          <defs>
            <linearGradient
              id="paint0_linear_125_1511"
              x1="645.986"
              y1="208.835"
              x2="-1.93693"
              y2="189.039"
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
        <div className="w-full h-[830px] mt-[25px] px-[150px] place-self-center relative overflow-hidden flex items-center justify-center group">
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
                className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                title="Edit image"
              >
                <Pencil className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleDelete7}
                className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
        <div className="w-full relative h-[70px]">
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 648 79"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <mask
              id="mask0_125_1512"
              style={{ maskType: "luminance" }}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="648"
              height="79"
            >
              <path
                d="M362.5 18C141.8 62.2 0 30.8 0 30.8V31.6V78.5H648V24.8C648 24.8 616.5 0 522.4 0C481.7 0 429.2 4.7 362.5 18Z"
                fill="white"
              />
            </mask>
            <g mask="url(#mask0_125_1512)">
              <path
                d="M0 78H648V-1H0V78Z"
                fill="url(#paint0_linear_125_1512)"
              />
            </g>
            <defs>
              <linearGradient
                id="paint0_linear_125_1512"
                x1="0"
                y1="70.5122"
                x2="648"
                y2="70.5122"
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
          <div className="absolute top-0 right-10 z-10 text-right text-white px-[50px]">
            DESIGNED AND PRINTED BY BC FLOOR PLANS
          </div>
        </div>



      </div>
    </div>
    </>
  );
};

export default BcfpStandard;
