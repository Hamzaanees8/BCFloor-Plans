import { House, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { Order } from "../../orders/page";
import '../../../globals.css';
import StyledInput from "./StyledInput";

interface BcfpStandard {
  orderData: Order | null;
}
const BcfpStandard = ({ }: BcfpStandard) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImage2, setSelectedImage2] = useState<string | null>(null);
  const [selectedImage3, setSelectedImage3] = useState<string | null>(null);
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [image3, setImage3] = useState<string | null>(null);
  const [imageMain, setImageMain] = useState<string | null>("");
  const [imageGrid1, setImageGrid1] = useState<string | null>("");
  const [imageGrid2, setImageGrid2] = useState<string | null>("");
  const [imageGrid3, setImageGrid3] = useState<string | null>("");
  const [imageGrid4, setImageGrid4] = useState<string | null>("");
  const [isFocused, setIsFocused] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState(``);
  const [siteInfluences, setSiteInfluences] = useState("");
  const [grossTaxes, setGrossTaxes] = useState("");
  const [featuresIncluded, setFeaturesIncluded] = useState("");
  const [outdoorAreas, setOutdoorAreas] = useState("");
  const [mlsNumber, setMlsNumber] = useState("");
  const [rightImage, setRightImage] = useState<string | null>(null);


  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const fileInputRef3 = useRef<HTMLInputElement | null>(null);
  const fileRef1 = useRef<HTMLInputElement | null>(null);
  const fileRef2 = useRef<HTMLInputElement | null>(null);
  const fileRef3 = useRef<HTMLInputElement | null>(null);
  const fileInputMainRef = useRef<HTMLInputElement | null>(null);
  const fileInputGrid1Ref = useRef<HTMLInputElement | null>(null);
  const fileInputGrid2Ref = useRef<HTMLInputElement | null>(null);
  const fileInputGrid3Ref = useRef<HTMLInputElement | null>(null);
  const fileInputGrid4Ref = useRef<HTMLInputElement | null>(null);
  const fileInputBottomRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setSelectedImage(imageURL);
    }
  };

  const handleBottomImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageURL = URL.createObjectURL(file);
      setRightImage(imageURL);
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

  const handleChangeImage =
    (setImage: React.Dispatch<React.SetStateAction<string | null>>) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          setImage(URL.createObjectURL(file));
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

  const handleReplaceImage = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteBottomImage = () => {
    setRightImage(null);
  };
  const handleDeleteGrid = (
    setter: React.Dispatch<React.SetStateAction<string | null>>,
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    setter(null);
    if (ref.current) ref.current.value = "";
  };


  const handleDeleteImage =
    (setImage: React.Dispatch<React.SetStateAction<string | null>>) => () => {
      setImage(null);
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
            <Trash2 className="w-4 h-4 text-red-500" />
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
      <div className="relative">
        <div className="bg-[#9A1F2F] group relative h-[100px] md:h-[100px] justify-center w-full flex flex-col md:flex-row items-center px-5 py-5 md:py-0 overflow-hidden">
          {selectedImage ? (
            <>
              <Image
                src={selectedImage}
                alt="selected"
                width={200}
                height={300}
                className="w-[200px] h-full object-cover rounded"
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
                <Trash2 className="w-4 h-4 text-red-500" />
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

        <div className="flex items-stretch min-h-[400px]">
          <div className="w-1/2 relative overflow-hidden flex items-center justify-center group">
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
                  <Trash2 className="w-4 h-4 text-red-500" />
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
          <div className="w-1/2 relative overflow-hidden flex items-center justify-center group">
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
                  className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                  <Trash2 className="w-4 h-4 text-red-500" />
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

        </div>


        <hr className="border-0 bg-[#a05067] h-3 m-0" />
        <div className="bg-[#851A2F] h-[200px] justify-center w-full flex md:flex-row items-center py-5 md:py-0">

          <div className="flex gap-5 w-1/2 px-14 h-[160px] ">

            <div className="w-full h-full relative overflow-hidden flex items-center justify-center group">
              {image1 ? (
                <>
                  <Image
                    src={image1}
                    alt="Image 1"
                    width={500}
                    height={500}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef1.current?.click()}
                    className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteImage(setImage1)}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileRef1.current?.click()}
                  className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                >
                  Select Image
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileRef1}
                onChange={handleChangeImage(setImage1)}
                className="hidden"
              />
            </div>

            <div className="w-full h-full relative overflow-hidden flex items-center justify-center group">
              {image2 ? (
                <>
                  <Image
                    src={image2}
                    alt="Image 2"
                    width={500}
                    height={500}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef2.current?.click()}
                    className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteImage(setImage2)}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileRef2.current?.click()}
                  className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                >
                  Select Image
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileRef2}
                onChange={handleChangeImage(setImage2)}
                className="hidden"
              />
            </div>

            <div className="w-full h-full relative overflow-hidden flex items-center justify-center group">
              {image3 ? (
                <>
                  <Image
                    src={image3}
                    alt="Image 3"
                    width={500}
                    height={500}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef3.current?.click()}
                    className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteImage(setImage3)}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => fileRef3.current?.click()}
                  className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                >
                  Select Image
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileRef3}
                onChange={handleChangeImage(setImage3)}
                className="hidden"
              />
            </div>
          </div>

          <div className="w-1/2 text-white leading-none text-center">
            <StyledInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-semibold text-[48px] h-[55px] bg-transparent text-center w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
              placeholder="Enter Title" />
            <StyledInput
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="font-semibold text-[28px] h-[55px] bg-transparent text-center w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
              placeholder="Enter Subtitle" />
          </div>
        </div>
        <hr className="border-0 bg-[#fff] h-3 m-0" />
        <div className="bg-[#601730] h-[150px] justify-center w-full flex md:flex-row items-center py-2 md:py-0">
          <div className="w-1/2 text-white leading-none text-center px-12">
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
                  className=" text-[16px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                  placeholder="RE/MAX City Realty" />
              </div>
              <div className="font-semibold text-[20px] flex gap-1">
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
            <div className="text-center mt-3  font-thin flex">
              <span className="text-[8px]">All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floorplans
                shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless. </span>
              <span className="flex">
                <House className="w-4 h-4" />
                <svg width="16" height="16" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.07208 6.90507H1.20908C1.29908 6.90507 1.36508 6.90507 1.41708 6.95207C1.46108 6.99307 1.48508 7.04807 1.48508 7.11207C1.48508 7.22007 1.40508 7.30107 1.28408 7.30107H1.19308L1.47508 7.75507H1.58608L1.35708 7.38907C1.48808 7.37607 1.58608 7.25507 1.58608 7.11207C1.58608 7.01407 1.53908 6.91807 1.46108 6.86707C1.39608 6.81707 1.32508 6.81007 1.23408 6.81007H0.981079V7.75507H1.07208V6.90507Z" fill="white" />
                  <path d="M1.93073 6.81015V7.75415H2.41973V7.66515H2.02373V7.32915H2.41973V7.23415H2.02373V6.90415H2.41973V6.81015H1.93073Z" fill="white" />
                  <path d="M3.04311 6.81015L2.67511 7.75415H2.77411L2.88611 7.45715H3.30711L3.42011 7.75415H3.51911L3.15411 6.81015H3.04311ZM3.09611 6.89915L3.27511 7.37315H2.92011L3.09611 6.89915Z" fill="white" />
                  <path d="M3.7901 6.81015V7.75415H4.2151V7.66515H3.8821V6.81015H3.7901Z" fill="white" />
                  <path d="M4.39758 6.81015V6.90415H4.58758V7.75415H4.67958V6.90415H4.86958V6.81015H4.39758Z" fill="white" />
                  <path d="M5.06702 7.27662C5.06702 7.56062 5.27402 7.77362 5.54502 7.77362C5.68702 7.77362 5.80902 7.71862 5.90602 7.61262C5.99002 7.52262 6.03102 7.41062 6.03102 7.27662C6.03102 7.14462 5.98202 7.02362 5.88502 6.93162C5.79302 6.83962 5.68002 6.79162 5.54802 6.79162C5.41702 6.79162 5.30602 6.83962 5.21402 6.92862C5.11902 7.02362 5.06702 7.14462 5.06702 7.27662ZM5.16202 7.27662C5.16202 7.16162 5.22002 7.04762 5.30702 6.97162C5.37602 6.91262 5.45902 6.88262 5.54502 6.88262C5.76502 6.88262 5.93702 7.06462 5.93702 7.27662C5.93702 7.50762 5.76502 7.68462 5.55402 7.68462C5.33602 7.68462 5.16202 7.51362 5.16202 7.27662Z" fill="white" />
                  <path d="M6.43873 6.90507H6.57373C6.66173 6.90507 6.72973 6.90507 6.77973 6.95207C6.82773 6.99307 6.84873 7.04807 6.84873 7.11207C6.84873 7.22007 6.76873 7.30107 6.64773 7.30107H6.55773L6.83973 7.75507H6.94873L6.71973 7.38907C6.85373 7.37607 6.94873 7.25507 6.94873 7.11207C6.94873 7.01407 6.90173 6.91807 6.82773 6.86707C6.75973 6.81707 6.68873 6.81007 6.60073 6.81007H6.34473V7.75507H6.43873V6.90507Z" fill="white" />
                  <path d="M0.880005 6.474H6.89398V0.460997H0.880005V6.474ZM4.07703 1.183H4.74799C5.36499 1.245 5.81501 1.728 5.80701 2.328C5.80201 2.92 5.35999 3.386 4.74799 3.449H4.07703V1.183ZM3.42798 5.714H1.73199V1.178H3.42798V5.714ZM4.07703 5.724V3.467L6.427 5.724H4.07703Z" fill="white" />
                  <path d="M7.07922 6.6356C7.03422 6.6356 6.99122 6.6546 6.96222 6.6886C6.92922 6.7186 6.91022 6.7646 6.91022 6.8076C6.91022 6.8516 6.92722 6.8956 6.96222 6.9276C6.99122 6.9616 7.03422 6.9776 7.07922 6.9776C7.12522 6.9776 7.16922 6.9616 7.20322 6.9276C7.23322 6.8956 7.25122 6.8546 7.25122 6.8076C7.25122 6.7626 7.23322 6.7186 7.20322 6.6886C7.16922 6.6546 7.12722 6.6356 7.07922 6.6356ZM7.23322 6.8076C7.23322 6.8516 7.21822 6.8856 7.19022 6.9156C7.15922 6.9436 7.11922 6.9586 7.07922 6.9586C7.03922 6.9586 7.00322 6.9436 6.97422 6.9156C6.94422 6.8856 6.92922 6.8466 6.92922 6.8076C6.92922 6.7696 6.94422 6.7286 6.97422 6.6976C7.00322 6.6706 7.03822 6.6546 7.07922 6.6546C7.12122 6.6546 7.15922 6.6706 7.19022 6.7016C7.21622 6.7286 7.23322 6.7656 7.23322 6.8076ZM7.08722 6.7066H7.01222V6.9016H7.04322V6.8156H7.08822L7.13122 6.9016H7.16522L7.11922 6.8106C7.15022 6.8076 7.16722 6.7896 7.16722 6.7626C7.16722 6.7236 7.14122 6.7066 7.08722 6.7066ZM7.07922 6.7256C7.11822 6.7256 7.13822 6.7366 7.13822 6.7646C7.13822 6.7896 7.11822 6.7976 7.07922 6.7976H7.04322V6.7256H7.07922Z" fill="white" />
                </svg>
              </span>
            </div>
          </div>
          <div className="flex gap-5 w-1/2 px-14">
          </div>

        </div>
        {/* <div className="absolute bottom-0 left-0 w-[340px] h-[362px] bg-[#ffffff] opacity-[.2]"></div> */}
        <div className="absolute bottom-0 right-0 w-[180px] h-[200px] bg-[#ffffff] "></div>
      </div>

      <div className="relative">
        <div className="bg-[#9A1F2F] justify-center w-full flex gap-7 items-center px-7 py-5 h-[550px]">
          <div className="flex w-1/2 h-full group">
            <ImageBlock
              image={imageMain}
              fileRef={fileInputMainRef}
              onChange={(e) => handleGridImageChange(e, setImageMain)}
              onDelete={() => handleDeleteGrid(setImageMain, fileInputMainRef)}
            />
          </div>

          <div className="w-1/2 grid grid-cols-2 gap-2 h-full">
            <ImageBlock
              image={imageGrid1}
              fileRef={fileInputGrid1Ref}
              onChange={(e) => handleGridImageChange(e, setImageGrid1)}
              onDelete={() => handleDeleteGrid(setImageGrid1, fileInputGrid1Ref)}
            />
            <ImageBlock
              image={imageGrid2}
              fileRef={fileInputGrid2Ref}
              onChange={(e) => handleGridImageChange(e, setImageGrid2)}
              onDelete={() => handleDeleteGrid(setImageGrid2, fileInputGrid2Ref)}
            />
            <ImageBlock
              image={imageGrid3}
              fileRef={fileInputGrid3Ref}
              onChange={(e) => handleGridImageChange(e, setImageGrid3)}
              onDelete={() => handleDeleteGrid(setImageGrid3, fileInputGrid3Ref)}
            />
            <ImageBlock
              image={imageGrid4}
              fileRef={fileInputGrid4Ref}
              onChange={(e) => handleGridImageChange(e, setImageGrid4)}
              onDelete={() => handleDeleteGrid(setImageGrid4, fileInputGrid4Ref)}
            />
          </div>
        </div>


        <hr className="border-0 bg-[#fff] h-3 m-0" />
        <div className="bg-[#601730]  w-full flex gap-7 px-7 py-5">
          {/* Left Text Section */}
          <div className="flex flex-col gap-3 w-1/2 text-white">
            {/* Description */}

            <textarea
              className={`text-white rounded-[8px] p-2 placeholder-white font-thin leading-none text-left w-full h-48 resize-none outline-none transition-colors duration-200
              ${isFocused || !description ? "bg-gray-100 bg-opacity-20" : "bg-transparent"}`}
              value={description}
              placeholder="Enter details here"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setDescription(e.target.value)}
            />


            <div className="flex">
              <div className="w-1/2 text-left">
                <div className="font-bold text-[14px]">SITE INFLUENCES:</div>
                <StyledInput
                  value={siteInfluences}
                  onChange={(e) => setSiteInfluences(e.target.value)}
                  className="font-semibold text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                  placeholder="Enter Site Influences Here"
                />
              </div>
              <div className="w-1/2 text-right">
                <div className="font-bold text-[14px]">GROSS TAXES:</div>
                <StyledInput
                  value={grossTaxes}
                  onChange={(e) => setGrossTaxes(e.target.value)}
                  className="font-semibold text-[12px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                  placeholder="Enter Gross Taxes Here"
                />
              </div>
            </div>

            <div className="flex">
              <div className="w-1/2 text-left">
                <div className="font-bold text-[14px]">FEATURES INCLUDED:</div>
                <StyledInput
                  value={featuresIncluded}
                  onChange={(e) => setFeaturesIncluded(e.target.value)}
                  className="font-semibold text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                  placeholder="Enter Features Here"
                />
              </div>
              <div className="w-1/2 text-right">
                <div className="font-bold text-[14px]">OUTDOOR AREAS:</div>
                <StyledInput
                  value={outdoorAreas}
                  onChange={(e) => setOutdoorAreas(e.target.value)}
                  className="font-semibold text-[12px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                  placeholder="Enter Outdoor Area Here"
                />
              </div>
            </div>

            <div className="flex">
              <div className="w-1/2 text-left"></div>
              <div className="w-1/2 text-right">
                <StyledInput
                  value={mlsNumber}
                  onChange={(e) => setMlsNumber(e.target.value)}
                  className="font-semibold text-[14px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                  placeholder="Enter MLS number"
                />
              </div>
            </div>
          </div>

          <div className="relative flex w-1/2 group">
            {rightImage ? (
              <Image
                src={rightImage}
                alt="featured"
                width={200}
                height={300}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                onClick={() => fileInputBottomRef.current?.click()}
                className="w-full h-full bg-white rounded-md cursor-pointer flex items-center justify-center text-gray-400"
              >
                Click to upload image
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputBottomRef}
              onChange={handleBottomImageChange}
            />

            {rightImage && (
              <div className="absolute top-2 right-2 flex space-x-2">
                <button
                  type="button"
                  onClick={handleReplaceImage}
                  className="bg-white rounded-full p-1 shadow opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBottomImage}
                  className="bg-white rounded-full p-1 shadow opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BcfpStandard;