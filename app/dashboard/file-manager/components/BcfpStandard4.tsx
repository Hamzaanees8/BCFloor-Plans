import {  Pencil, Trash } from "lucide-react";
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
    setImage16(null);
    if (fileInputRef16.current) fileInputRef16.current.value = "";
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
    <div className="w-full flex  justify-center font-alexandria">
      <div className="w-1/2 flex flex-col">
        <div className="p-[50px] pb-[120px] bg-[#376173] ">
          <div className="w-[500px] h-[630px] place-self-center border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group">
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
                  className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete1}
                  className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
        </div>
        <div className=" relative mt-[-70px] px-[30px]">
          <svg
            viewBox="163 79 631 114"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-[-25px] right-0 left-0"
          >
            <g opacity={0.350006} filter="url(#filter0_d_20_1415)">
              <path
                d="M794 135C794 135 678.203 183.969 463 122C223 32 164.5 127 164.5 127V193H794V131.5"
                fill="black"
              />
            </g>
            <path
              d="M793.592 138.135C793.592 138.135 655.583 191.415 440.821 116.535C226.06 41.6551 163 128.055 163 128.055V193H477.5H794L793.592 139.575"
              fill="white"
            />
            <path
              opacity={0.350006}
              d="M794 115.5C794 115.5 656.323 173.19 441.12 104.904C225.916 36.6177 166 124.936 166 124.936L167.5 192.5H794V117.5"
              fill="white"
            />
            <defs>
              <filter
                id="filter0_d_20_1415"
                x={0.5}
                y={0.256348}
                width={953.5}
                height={433.744}
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity={0} result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dx={-2} dy={79} />
                <feGaussianBlur stdDeviation={81} />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_20_1415"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_20_1415"
                  result="shape"
                />
              </filter>
            </defs>
          </svg>
          <div className="relative p-6 z-2">
            <h2 className="font-bold text-[11px]"><span className="font-normal">CONTACT:</span> FIRSTNAME LASTNAME</h2>
            <p className="text-[11px]">MACDONALD REALTY</p>
            <p className="text-[11px]"><strong>PHONE:</strong> 604.000.0000 &nbsp; <strong>EMAIL:</strong> FIRST@LAST.COM</p>
            <p className="text-[6px] w-[67%] leading-tight">
              All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal.
              Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.
            </p>
            <p className="font-bold text-[10px]">
              DESIGNED AND PRINTED BY BC FLOOR PLANS
            </p>
          </div>
          <div className="absolute top-0 right-[55px] group">
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
      <div className="w-1/2 bg-[#376173] flex flex-col relative">
        <div className="relative z-10">
          <svg
            viewBox="163 83 631 114"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute top-0 right-0 left-0"
          >
            <g opacity={0.350006} filter="url(#filter0_d_20_1415)">
              <path
                d="M794 141C794 141 678.203 92.031 463 154C223 244 164.5 149 164.5 149V83H794V144.5"
                fill="black"
              />
            </g>
            <path
              d="M793.592 137.865C793.592 137.865 655.583 84.5849 440.821 159.465C226.06 234.345 163 147.945 163 147.945V83H477.5H794L793.592 136.425"
              fill="white"
            />
            <path
              opacity={0.350006}
              d="M794 160.5C794 160.5 656.323 102.81 441.12 171.096C225.916 239.382 166 151.064 166 151.064L167.5 83.5H794V158.5"
              fill="white"
            />
            <defs>
              <filter
                id="filter0_d_20_1415"
                x={0.5}
                y={0}
                width={953.5}
                height={433.744}
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity={0} result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dx={-2} dy={79} />
                <feGaussianBlur stdDeviation={81} />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_20_1415"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_20_1415"
                  result="shape"
                />
              </filter>
            </defs>
          </svg>
          <div className="absolute top-[18px] left-[68px] group">
            <div className="w-[170px] h-[94px] relative bg-white shadow-md">
              {/* logo */}
              {image3 ? (
                <>
                  <Image
                    src={image3}
                    alt="selected"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover "
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef3.current?.click()}
                    className="absolute top-2 right-10 z-8 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete3}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef3.current?.click()}
                  className="w-[200px] h-full bg-gray-200  text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
          </div>
        </div>
        <div className="w-full h-[420px] mt-[35px] place-self-center relative overflow-hidden flex items-center justify-center group">
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
                className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                title="Edit image"
              >
                <Pencil className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleDelete4}
                className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
        <div className="grid grid-cols-4">
          <div className="h-[116px] relative group">
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
          <div className="h-[116px] relative group">
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
                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                title="Edit image"
              >
                <Pencil className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleDelete6}
                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
          <div className="h-[116px] relative group">
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
                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                title="Edit image"
              >
                <Pencil className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleDelete7}
                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
          <div className="h-[116px] relative group">
            {image8 ? (
            <>
              <Image
                src={image8}
                alt="uploaded"
                width={200}
                height={300}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => fileInputRef8.current?.click()}
                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                title="Edit image"
              >
                <Pencil className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleDelete8}
                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                title="Delete image"
              >
                <Trash className="w-4 h-4 text-red-500" />
              </button>
            </>
            ) : (
              <div
                onClick={() => fileInputRef8.current?.click()}
                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
        <div className=" text-white flex flex-col items-center justify-center py-10 space-y-2">
          <div className="text-[30px] font-light tracking-wide mt-0">#000-0000</div>
          <div className="text-[60px] font-light leading-none mt-0">Number 0 Road</div>
          <div className="text-[13px] tracking-[2px] uppercase mt-0">
            Brighouse South, Richmond
          </div>
          <div className="text-[30px] font-light mt-0">$000,000</div>
        </div>
      </div>
    </div>
    <div className="w-full flex flex-col bg-[#376173] justify-center font-alexandria relative p-[50px]">
      <div className="flex gap-4">
        <div className="w-1/2 flex flex-col gap-4">
          <div className="w-full h-[420px] place-self-center z-10 relative overflow-hidden flex items-center justify-center group">
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-[180px] relative z-10 group">
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
            <div className="h-[180px] relative z-10 group">
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
          <div className="text-[10px] font-normal text-white italic relative z-10 leading-[1.6]">
            <p>On top of it all! Beautiful sub-penthouse in the well appointed CENTRO building. This centrally located 2 bedroom, 2 bathroom home
                boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South Westproviding unhindered privacy.
                The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring, S/S appliances, Gas range and a large
                open ‘den/nook’ area perfect for the home office. Huge private balcony, great building amenities including exercise room, sauna, roof top
                courtyard and outdoor kids playground. With parking, and storage locker and balance of the the 5-10 warranty, this home provides
                nothing but exceptional value. Call today to set up your viewing.</p>
          </div>
        </div>
        <div className="w-1/2 flex gap-4">
          <div className="w-[40%]">
            <div className="grid grid-cols-1 gap-4">
              <div className="h-[165px] relative z-10 group">
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
              <div className="h-[165px] relative z-10 group">
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
              <div className="h-[165px] relative z-10 group">
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
              <div className="h-[165px] relative z-10 group">
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
            </div>
          </div>
          <div className="w-[60%] flex flex-col gap-4">
            <div className="flex gap-4 text-white text-[12px] leading-relaxed">
              <div className="space-y-2 text-[8px]">
                <div>
                  <span className="font-bold">BY-LAW RESTRICTIONS:</span>{" "}
                  <span>Pets Allowed w/Rest., Rentals Allowed</span>
                </div>
                <div>
                  <span className="font-bold">MAINT. FEES:</span>{" "}
                  <span>$000.00</span>
                </div>
                <div>
                  <span className="font-bold">MAINT. FEES INCLUDE:</span>
                  <div>
                    Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker
                  </div>
                </div>
                <div>
                  <span className="font-bold">FEATURES INCLUDED:</span>
                  <div>
                    Clothes Washer/Dryer/Fridge/Stove/DW, Drapes/Window Coverings
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-[8px]">
                <div>
                  <span className="font-bold">SITE INFLUENCES:</span>
                  <div>
                    Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby
                  </div>
                </div>
                <div>
                  <span className="font-bold">AMENITIES:</span>
                  <div>
                    Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room
                  </div>
                </div>
                <div>
                  <span className="font-bold">VIEW:</span>{" "}
                  <span>South &amp; SW - Van Isl.</span>
                </div>
                <div className="mt-0">
                  <span className="font-bold">MLS#000000</span>
                </div>
              </div>
            </div>
            <div className="w-full h-[550px] place-self-center border-2 z-10 border-[#fff] relative overflow-hidden flex items-center justify-center group">
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
                    className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete16}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
      <svg viewBox="164 80 628 81.73" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-25 left-0 right-0">
        <path opacity="0.350006" d="M792 116.5C792 116.5 654.323 174.19 439.12 105.904C223.916 37.6178 164 125.936 164 125.936C164 125.936 210.5 45.0673 441.5 123.5C656.5 196.5 792 142.5 792 142.5V118.5" fill="white"></path>
        <g opacity="0.350006" filter="url(#filter0_d_36_1418)">
        <path d="M792 136.347C792 136.347 677.111 184.924 461.737 122.645C221.546 32.1944 164 126 164 126V128C164 128 218.35 46.7071 461.737 129C652.5 193.5 792 142.5 792 142.5V136.347Z" fill="black"></path>
        </g>
        <defs>
        <filter id="filter0_d_36_1418" x="0" y="0.296387" width="952" height="402.344" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix>
        <feOffset dx="-2" dy="79"></feOffset>
        <feGaussianBlur stdDeviation="81"></feGaussianBlur>
        <feComposite in2="hardAlpha" operator="out"></feComposite>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"></feColorMatrix>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_36_1418"></feBlend>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_36_1418" result="shape"></feBlend>
        </filter>
        </defs>
      </svg>
      <div className="font-bold text-white text-[27px] relative z-10 mt-8">
        <p>0 B E D R O O M • 0 B AT H R O O M • 0 0 0 S Q F T • B U I LT I N 0 0 0 0 • $ 0 0 0 , 0 0 0</p>
      </div>
    </div>
    </>
  );
};

export default BcfpStandard;
