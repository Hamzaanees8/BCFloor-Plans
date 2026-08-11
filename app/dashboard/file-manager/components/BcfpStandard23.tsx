import { House, Pencil, Trash, ZoomIn, ZoomOut } from "lucide-react";
import NextImage from "next/image";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import { featureSheetService } from "../file-manager";
import { FeatureSheetPayload, FeatureSheetResponse } from "../types/featureSheetTypes";

export interface BcfpStandard23Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard23Props {
  orderData: Order | null;
}

const BcfpStandard23 = forwardRef<BcfpStandard23Ref, BcfpStandard23Props>(
  ({ orderData }, ref) => {
    // const [title, setTitle] = useState("");
    // const [subtitle, setSubtitle] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [amount, setAmount] = useState("");
    // const [byLawRestrictions, setByLawRestrictions] = useState("");
    // const [maintenanceFees, setMaintenanceFees] = useState("");
    // const [maintenanceFeesInclude, setMaintenanceFeesInclude] = useState("");
    const [featuresIncluded, setFeaturesIncluded] = useState("");
    const [siteInfluences, setSiteInfluences] = useState("");
    const [outdoorArea, setOutdoorArea] = useState("");
    const [grossTaxes, setGrossTaxes] = useState("");
    // const [amenities, setAmenities] = useState("");
    const [mlsNumber, setMlsNumber] = useState("");
    // const [view, setView] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");
    const [description, setDescription] = useState("");
    const [number, setNumber] = useState("");
    const [fieldStyles, setFieldStyles] = useState<Record<string, any>>({});

    const updateFieldStyle = (fieldName: string, style: any) => {
      setFieldStyles((prev) => ({ ...prev, [fieldName]: style }));
    };

    // --- images States ---
    const [images, setImages] = useState({
      image1: null as string | null,
      image2: null as string | null,
      image3: null as string | null,
      image4: null as string | null,
      image5: null as string | null,
      image6: null as string | null,
      image7: null as string | null,
      image8: null as string | null,
      image9: null as string | null,
      image10: null as string | null,
      image11: null as string | null,
      image12: null as string | null,
      image13: null as string | null,
      image14: null as string | null,
      image15: null as string | null,
      image16: null as string | null,
      image17: null as string | null,
      image18: null as string | null,
    });


    const [scale, setScale] = useState({
      image1: 1,
      image2: 1,
      image3: 1,
      image4: 1,
      image5: 1,
      image6: 1,
      image7: 1,
      image8: 1,
      image9: 1,
      image10: 1,
      image11: 1,
      image12: 1,
      image13: 1,
      image14: 1,
      image15: 1,
      image16: 1,
      image17: 1,
      image18: 1,
    });

    const [position, setPosition] = useState({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image3: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
      image8: { x: 0, y: 0 },
      image9: { x: 0, y: 0 },
      image10: { x: 0, y: 0 },
      image11: { x: 0, y: 0 },
      image12: { x: 0, y: 0 },
      image13: { x: 0, y: 0 },
      image14: { x: 0, y: 0 },
      image15: { x: 0, y: 0 },
      image16: { x: 0, y: 0 },
      image17: { x: 0, y: 0 },
      image18: { x: 0, y: 0 },
    });

    const [dragging, setDragging] = useState({
      image1: false,
      image2: false,
      image3: false,
      image4: false,
      image5: false,
      image6: false,
      image7: false,
      image8: false,
      image9: false,
      image10: false,
      image11: false,
      image12: false,
      image13: false,
      image14: false,
      image15: false,
      image16: false,
      image17: false,
      image18: false,
    });

    const lastPosition = useRef({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image3: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
      image8: { x: 0, y: 0 },
      image9: { x: 0, y: 0 },
      image10: { x: 0, y: 0 },
      image11: { x: 0, y: 0 },
      image12: { x: 0, y: 0 },
      image13: { x: 0, y: 0 },
      image14: { x: 0, y: 0 },
      image15: { x: 0, y: 0 },
      image16: { x: 0, y: 0 },
      image17: { x: 0, y: 0 },
      image18: { x: 0, y: 0 },
    });
    const [showImageSourceModal, setShowImageSourceModal] = useState(false);
    const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);
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
    const fileInputRef17 = useRef<HTMLInputElement | null>(null);
    const fileInputRef18 = useRef<HTMLInputElement | null>(null);
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard23",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#427F6D",
          offeredAtPrice: amount,
          realtorName: fullName,
          emailLink: email,
          companyName: propertyName,
          propertyNotesDescription: description,
          expandedDetail4Title: "Features Included",
          expandedDetail4Description: featuresIncluded,
          keyHighlightLabel: "Site Influences",
          keyHighlights: siteInfluences ? siteInfluences.split("\n").filter(Boolean) : [],
          otherDetails: {
            featuresIncluded,
            siteInfluences,
            outdoorArea,
            grossTaxes,
            bedroom,
            bathroom,
            sqft,
            builtYear,
            number,
            mlsNumber,
          },
          images,
          imageScales: scale,
          imagePositions: position,
          fieldStyles,
        });
        return payload;
      },
      importFromPayload: (payload: FeatureSheetResponse) => {
        const state = featureSheetService.parsePayloadToState(payload);
        if (state.offeredAtPrice) setAmount(state.offeredAtPrice as string);
        if (state.realtorName) setFullName(state.realtorName as string);
        if (state.emailLink) setEmail(state.emailLink as string);
        if (state.companyName) setPropertyName(state.companyName as string);
        if (state.propertyNotesDescription) setDescription(state.propertyNotesDescription as string);

        if (state.expandedDetail4Description) setFeaturesIncluded(state.expandedDetail4Description as string);

        if (state.keyHighlights) setSiteInfluences(state.keyHighlights.join("\n"));

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
          if (details.featuresIncluded) setFeaturesIncluded(details.featuresIncluded as string);
          if (details.siteInfluences) setSiteInfluences(details.siteInfluences as string);
          if (details.outdoorArea) setOutdoorArea(details.outdoorArea as string);
          if (details.grossTaxes) setGrossTaxes(details.grossTaxes as string);
          if (details.bedroom) setBedroom(details.bedroom as string);
          if (details.bathroom) setBathroom(details.bathroom as string);
          if (details.sqft) setSqft(details.sqft as string);
          if (details.builtYear) setBuiltYear(details.builtYear as string);
          if (details.number) setNumber(details.number as string);
          if (details.mlsNumber) setMlsNumber(details.mlsNumber as string);
        }

        if (state.imagePositions) setPosition((prev) => ({ ...prev, ...(state.imagePositions as unknown as typeof position) }));
        if (state.fieldStyles) {
          setFieldStyles(state.fieldStyles as Record<string, any>);
        }
      },
    }));

    console.log("orderData", orderData);


    // --- Handlers ---
    const handleImageChange = (
      key: keyof typeof images,
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setImages((prev) => ({ ...prev, [key]: url }));
      }
    };

    const handleDelete = (
      key: keyof typeof images,
      ref: React.RefObject<HTMLInputElement | null>
    ) => {
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      if (ref.current) ref.current.value = "";
    };

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        const bounded = Math.min(Math.max(newScale, 1), 3);
        if (bounded <= 1) {
          setPosition((p) => ({ ...p, [key]: { x: 0, y: 0 } }));
        }
        return { ...prev, [key]: bounded };
      });
    };

    const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
      if (scale[key] <= 1) return;
      setDragging((prev) => ({ ...prev, [key]: true }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
      if (!dragging[key]) return;
      const dx = e.clientX - lastPosition.current[key].x;
      const dy = e.clientY - lastPosition.current[key].y;

      setPosition((prev) => ({
        ...prev,
        [key]: { x: prev[key].x + dx, y: prev[key].y + dy },
      }));

      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (key: keyof typeof images) => {
      setDragging((prev) => ({ ...prev, [key]: false }));
    };

    const handleMouseLeave = (key: keyof typeof images) => {
      setDragging((prev) => ({ ...prev, [key]: false }));
    };

    const handleImageSourceSelect = (source: "local" | "gallery") => {
      setShowImageSourceModal(false);

      if (source === "local") {
        switch (currentImageSlot) {
          case "image1":
            fileInputRef1.current?.click();
            break;
          case "image2":
            fileInputRef2.current?.click();
            break;
          case "image3":
            fileInputRef3.current?.click();
            break;
          case "image4":
            fileInputRef4.current?.click();
            break;
          case "image5":
            fileInputRef5.current?.click();
            break;
          case "image6":
            fileInputRef6.current?.click();
            break;
          case "image7":
            fileInputRef7.current?.click();
            break;
          case "image8":
            fileInputRef8.current?.click();
            break;
          case "image9":
            fileInputRef9.current?.click();
            break;
          case "image10":
            fileInputRef10.current?.click();
            break;
          case "image11":
            fileInputRef11.current?.click();
            break;
          case "image12":
            fileInputRef12.current?.click();
            break;
          case "image13":
            fileInputRef13.current?.click();
            break;
          case "image14":
            fileInputRef14.current?.click();
            break;
          case "image15":
            fileInputRef15.current?.click();
            break;
          case "image16":
            fileInputRef16.current?.click();
            break;
          case "image17":
            fileInputRef17.current?.click();
            break;
          case "image18":
            fileInputRef18.current?.click();
            break;
          default:
            break;
        }
      } else if (source === "gallery") {
        setShowGallery(true);
      }
    };

    const handleGalleryImageSelect = (imageUrl: string) => {
      if (!currentImageSlot) return;


      switch (currentImageSlot) {
        case "image1":
          setImages((prev) => ({ ...prev, image1: imageUrl }));
          break;
        case "image2":
          setImages((prev) => ({ ...prev, image2: imageUrl }));
          break;
        case "image3":
          setImages((prev) => ({ ...prev, image3: imageUrl }));
          break;
        case "image4":
          setImages((prev) => ({ ...prev, image4: imageUrl }));
          break;
        case "image5":
          setImages((prev) => ({ ...prev, image5: imageUrl }));
          break;
        case "image6":
          setImages((prev) => ({ ...prev, image6: imageUrl }));
          break;
        case "image7":
          setImages((prev) => ({ ...prev, image7: imageUrl }));
          break;
        case "image8":
          setImages((prev) => ({ ...prev, image8: imageUrl }));
          break;
        case "image9":
          setImages((prev) => ({ ...prev, image9: imageUrl }));
          break;
        case "image10":
          setImages((prev) => ({ ...prev, image10: imageUrl }));
          break;
        case "image11":
          setImages((prev) => ({ ...prev, image11: imageUrl }));
          break;
        case "image12":
          setImages((prev) => ({ ...prev, image12: imageUrl }));
          break;
        case "image13":
          setImages((prev) => ({ ...prev, image13: imageUrl }));
          break;
        case "image14":
          setImages((prev) => ({ ...prev, image14: imageUrl }));
          break;
        case "image15":
          setImages((prev) => ({ ...prev, image15: imageUrl }));
          break;
        case "image16":
          setImages((prev) => ({ ...prev, image16: imageUrl }));
          break;
        case "image17":
          setImages((prev) => ({ ...prev, image17: imageUrl }));
          break;
        case "image18":
          setImages((prev) => ({ ...prev, image18: imageUrl }));
          break;
        default:
          break;
      }
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    const openImageSourceModal = (imageSlot: string) => {
      setCurrentImageSlot(imageSlot);
      setShowGallery(true);
    };

    return (
      <>
        {showImageSourceModal && (
          <ImageSourceModal
            onClose={() => setShowImageSourceModal(false)}
            onSelectSource={handleImageSourceSelect}
          />
        )}

        {showGallery && (
          <FileManagerGallery
            isOpen={showGallery}
            onClose={() => {
              setShowGallery(false);
              setCurrentImageSlot(null);
            }}
            onImageSelect={handleGalleryImageSelect}
          />
        )}
        <div className="w-full items-center justify-center font-alexandria">
          <div className="flex items-stretch ">
            <div className="w-1/2 flex flex-col relative overflow-hidden items-center justify-center group p-[50px] bg-[#427F6D]">
              <div className="min-h-[400px] w-full relative overflow-hidden group">
                {/* image1 */}
                <div
                  className="w-full h-full relative overflow-hidden flex items-center justify-center"
                  onMouseDown={(e) => handleMouseDown("image1", e)}
                  onMouseMove={(e) => handleMouseMove("image1", e)}
                  onMouseUp={() => handleMouseUp("image1")}
                  onMouseLeave={() => handleMouseLeave("image1")}
                >
                  {images.image1 ? (
                    <>
                      <NextImage
                        unoptimized
                        src={images.image1}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-150"
                        style={{
                          transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                          cursor: dragging.image1
                            ? "grabbing"
                            : scale.image1 > 1
                              ? "grab"
                              : "default",
                        }}
                      />

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image1", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image1", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image1")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete("image1", fileInputRef1)}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image1")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef1}
                    onChange={(e) => handleImageChange("image1", e)}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="my-3 w-[200px] h-[100] relative overflow-hidden group">
                {/* image2 */}
                <div
                  className="w-full h-full relative overflow-hidden flex items-center justify-center"
                  onMouseDown={(e) => handleMouseDown("image2", e)}
                  onMouseMove={(e) => handleMouseMove("image2", e)}
                  onMouseUp={() => handleMouseUp("image2")}
                  onMouseLeave={() => handleMouseLeave("image2")}
                >
                  {images.image2 ? (
                    <>
                      <NextImage
                        unoptimized
                        src={images.image2}
                        alt="selected"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover rounded transition-transform duration-150"
                        style={{
                          transform: `scale(${scale.image2}) translate(${position.image2.x}px, ${position.image2.y}px)`,
                          cursor: dragging.image2
                            ? "grabbing"
                            : scale.image2 > 1
                              ? "grab"
                              : "default",
                        }}
                      />

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image2", "in")}
                          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3 h-3 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image2", "out")}
                          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3 h-3 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image2")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete("image2", fileInputRef2)}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image2")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef2}
                    onChange={(e) => handleImageChange("image2", e)}
                    className="hidden"
                  />
                </div>
              </div>
              <div className=" text-white leading-none text-center px-12 w-10/12">
                <div>
                  <div className="font-semibold text-[20px] flex gap-3">
                    <StyledInput
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      inputStyle={fieldStyles["fullName"]}
                      onChangeStyle={(s) => updateFieldStyle("fullName", s)}
                      className=" text-[28px] h-[30px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Enter full name"
                    />
                    <StyledInput
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      inputStyle={fieldStyles["propertyName"]}
                      onChangeStyle={(s) => updateFieldStyle("propertyName", s)}
                      className=" text-[16px] h-[16px] mt-2 font- bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                      placeholder="MACDONALD  Realty"
                    />
                  </div>
                  <div className="font-semibold text-[20px] flex gap-3">
                    <StyledInput
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputStyle={fieldStyles["amount"]}
                      onChangeStyle={(s) => updateFieldStyle("amount", s)}
                      className="font-semibold text-[16px] h-[30px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Enter amount"
                    />
                    <StyledInput
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      inputStyle={fieldStyles["email"]}
                      onChangeStyle={(s) => updateFieldStyle("email", s)}
                      className="font-thin text-[16px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                      placeholder="Enter email here"
                    />
                  </div>
                </div>
                <div className="w-full text-right">
                  <StyledInput
                    value={mlsNumber}
                    onChange={(e) => setMlsNumber(e.target.value)}
                    inputStyle={fieldStyles["mlsNumber"]}
                    onChangeStyle={(s) => updateFieldStyle("mlsNumber", s)}
                    className="font-semibold text-[14px] bg-transparent text-center w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="Enter MLS number"
                  />
                </div>
              </div>
              <div className=" text-white leading-none text-center px-12">
                <div className="text-start mt-3  font-thin flex">
                  <span className="text-[8px]">
                    All information deemed reliable but not guaranteed and should
                    be independently verified. All properties are subject to prior
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
            <div className="w-1/2 bg-[#427F6D] relative overflow-hidden flex items-center justify-center group">
              <div className="flex justify-center content-center items-center h-full w-full">
                <div className="w-[20%]  h-full">
                  <div className="flex flex-col justify-center h-full pt-20 pb-16">
                    <div className="h-full border-b-4 border-t-8 border-white">
                      <div
                        className="h-full w-full group relative overflow-hidden"
                        onMouseDown={(e) => handleMouseDown("image1", e)}
                        onMouseMove={(e) => handleMouseMove("image1", e)}
                        onMouseUp={() => handleMouseUp("image1")}
                        onMouseLeave={() => handleMouseLeave("image1")}
                      >
                        {images.image1 ? (
                          <>
                            <NextImage
                              unoptimized
                              src={images.image1}
                              alt="uploaded"
                              width={200}
                              height={300}
                              className="w-full h-full object-cover transition-transform duration-150"
                              style={{
                                transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                                cursor: dragging.image1
                                  ? "grabbing"
                                  : scale.image1 > 1
                                    ? "grab"
                                    : "default",
                              }}
                            />

                            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => handleZoom("image1", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image1", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image1")}
                              className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image1", fileInputRef1)
                              }
                              className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image1")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef1}
                          onChange={(e) => handleImageChange("image1", e)}
                          className="hidden"
                        />
                      </div>
                    </div>
                    <div className="h-full border-t-4 border-b-8 border-white">
                      <div
                        className="h-full w-full group relative overflow-hidden"
                        onMouseDown={(e) => handleMouseDown("image1", e)}
                        onMouseMove={(e) => handleMouseMove("image1", e)}
                        onMouseUp={() => handleMouseUp("image1")}
                        onMouseLeave={() => handleMouseLeave("image1")}
                      >
                        {images.image1 ? (
                          <>
                            <NextImage
                              unoptimized
                              src={images.image1}
                              alt="uploaded"
                              width={200}
                              height={300}
                              className="w-full h-full object-cover transition-transform duration-150"
                              style={{
                                transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                                cursor: dragging.image1
                                  ? "grabbing"
                                  : scale.image1 > 1
                                    ? "grab"
                                    : "default",
                              }}
                            />

                            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => handleZoom("image1", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image1", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image1")}
                              className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image1", fileInputRef1)
                              }
                              className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image1")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef1}
                          onChange={(e) => handleImageChange("image1", e)}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-[80%] h-full border-l-8 border-white">
                  <div className="flex flex-col h-full w-full">
                    <div className="h-[80%]  w-full">
                      <div className="flex w-full h-full">
                        <div className="w-[70%]  h-full border-r-8 border-white">
                          <div className="flex flex-col h-full w-full">
                            <div className="h-[35%] w-full border-b-4 border-white">
                              <div
                                className="h-full w-full group relative overflow-hidden"
                                onMouseDown={(e) => handleMouseDown("image1", e)}
                                onMouseMove={(e) => handleMouseMove("image1", e)}
                                onMouseUp={() => handleMouseUp("image1")}
                                onMouseLeave={() => handleMouseLeave("image1")}
                              >
                                {images.image1 ? (
                                  <>
                                    <NextImage
                                      unoptimized
                                      src={images.image1}
                                      alt="uploaded"
                                      width={200}
                                      height={300}
                                      className="w-full h-full object-cover transition-transform duration-150"
                                      style={{
                                        transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                                        cursor: dragging.image1
                                          ? "grabbing"
                                          : scale.image1 > 1
                                            ? "grab"
                                            : "default",
                                      }}
                                    />

                                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                      <button
                                        type="button"
                                        onClick={() => handleZoom("image1", "in")}
                                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                        title="Zoom In"
                                      >
                                        <ZoomIn className="w-4 h-4 text-gray-700" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleZoom("image1", "out")
                                        }
                                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                        title="Zoom Out"
                                      >
                                        <ZoomOut className="w-4 h-4 text-gray-700" />
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openImageSourceModal("image1")
                                      }
                                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                      title="Edit image"
                                    >
                                      <Pencil className="w-4 h-4 text-gray-700" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete("image1", fileInputRef1)
                                      }
                                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                      title="Delete image"
                                    >
                                      <Trash className="w-4 h-4 text-red-500" />
                                    </button>
                                  </>
                                ) : (
                                  <div
                                    onClick={() => openImageSourceModal("image1")}
                                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                                  >
                                    Select Image
                                  </div>
                                )}

                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={fileInputRef1}
                                  onChange={(e) => handleImageChange("image1", e)}
                                  className="hidden"
                                />
                              </div>
                            </div>
                            <div className="h-[35%] w-full border-y-4 border-white flex flex-col items-center justify-center ">
                              <div className="my-3 w-[200px] h-[100] relative overflow-hidden group">
                                <div
                                  className="w-full h-full relative overflow-hidden flex items-center justify-center"
                                  onMouseDown={(e) =>
                                    handleMouseDown("image2", e)
                                  }
                                  onMouseMove={(e) =>
                                    handleMouseMove("image2", e)
                                  }
                                  onMouseUp={() => handleMouseUp("image2")}
                                  onMouseLeave={() => handleMouseLeave("image2")}
                                >
                                  {images.image2 ? (
                                    <>
                                      <NextImage
                                        unoptimized
                                        src={images.image2}
                                        alt="selected"
                                        width={200}
                                        height={300}
                                        className="w-full h-full object-cover rounded transition-transform duration-150"
                                        style={{
                                          transform: `scale(${scale.image2}) translate(${position.image2.x}px, ${position.image2.y}px)`,
                                          cursor: dragging.image2
                                            ? "grabbing"
                                            : scale.image2 > 1
                                              ? "grab"
                                              : "default",
                                        }}
                                      />

                                      {/* Zoom Controls */}
                                      <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleZoom("image2", "in")
                                          }
                                          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                          title="Zoom In"
                                        >
                                          <ZoomIn className="w-3 h-3 text-gray-700" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleZoom("image2", "out")
                                          }
                                          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                          title="Zoom Out"
                                        >
                                          <ZoomOut className="w-3 h-3 text-gray-700" />
                                        </button>
                                      </div>

                                      {/* Edit Button */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openImageSourceModal("image2")
                                        }
                                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                        title="Edit image"
                                      >
                                        <Pencil className="w-4 h-4 text-gray-700" />
                                      </button>

                                      {/* Delete Button */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDelete("image2", fileInputRef2)
                                        }
                                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                        title="Delete image"
                                      >
                                        <Trash className="w-4 h-4 text-red-500" />
                                      </button>
                                    </>
                                  ) : (
                                    <div
                                      onClick={() =>
                                        openImageSourceModal("image2")
                                      }
                                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                                    >
                                      Select Image
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef2}
                                    onChange={(e) =>
                                      handleImageChange("image2", e)
                                    }
                                    className="hidden"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 text-[#ffffff] text-[18px]">
                                <div className="w-[50px]">
                                  <StyledInput
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    inputStyle={fieldStyles["addressLine1"]}
                                    onChangeStyle={(s) => updateFieldStyle("addressLine1", s)}
                                    rows={1}
                                    className="font-thin inline text-[18px] w-full h-[22px] bg-transparent text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
                                    placeholder="0000"
                                  />
                                </div>
                                SEVENTH AVENUE
                              </div>
                              <div className="w-full flex justify-center text-[#ffffff] text-[14px] ">
                                <StyledInput
                                  value={number}
                                  onChange={(e) => setNumber(e.target.value)}
                                  inputStyle={fieldStyles["cityLine"]}
                                  onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                                  className="font-thin inline w-full h-[22px] text-center bg-transparent focus:outline-none border-none placeholder-[#ffffff] "
                                  placeholder="WEST END, NEW WESTMINSTER"
                                />
                              </div>
                              <div className="w-full flex justify-center text-[#ffffff] text-[14px] ">
                                <StyledInput
                                  value={amount}
                                  onChange={(e) => setAmount(e.target.value)}
                                  inputStyle={fieldStyles["amount"]}
                                  onChangeStyle={(s) => updateFieldStyle("amount", s)}
                                  className="font-semibold text-[24px] bg-transparent text-center h-[20px] w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
                                  placeholder="$000,000"
                                />
                              </div>
                            </div>
                            <div className="h-[30%] w-full border-t-4 border-white">
                              <div
                                className="h-full w-full group relative overflow-hidden"
                                onMouseDown={(e) => handleMouseDown("image1", e)}
                                onMouseMove={(e) => handleMouseMove("image1", e)}
                                onMouseUp={() => handleMouseUp("image1")}
                                onMouseLeave={() => handleMouseLeave("image1")}
                              >
                                {images.image1 ? (
                                  <>
                                    <NextImage
                                      unoptimized
                                      src={images.image1}
                                      alt="uploaded"
                                      width={200}
                                      height={300}
                                      className="w-full h-full object-cover transition-transform duration-150"
                                      style={{
                                        transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                                        cursor: dragging.image1
                                          ? "grabbing"
                                          : scale.image1 > 1
                                            ? "grab"
                                            : "default",
                                      }}
                                    />

                                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                      <button
                                        type="button"
                                        onClick={() => handleZoom("image1", "in")}
                                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                        title="Zoom In"
                                      >
                                        <ZoomIn className="w-4 h-4 text-gray-700" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleZoom("image1", "out")
                                        }
                                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                        title="Zoom Out"
                                      >
                                        <ZoomOut className="w-4 h-4 text-gray-700" />
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openImageSourceModal("image1")
                                      }
                                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                      title="Edit image"
                                    >
                                      <Pencil className="w-4 h-4 text-gray-700" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete("image1", fileInputRef1)
                                      }
                                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                      title="Delete image"
                                    >
                                      <Trash className="w-4 h-4 text-red-500" />
                                    </button>
                                  </>
                                ) : (
                                  <div
                                    onClick={() => openImageSourceModal("image1")}
                                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                                  >
                                    Select Image
                                  </div>
                                )}

                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={fileInputRef1}
                                  onChange={(e) => handleImageChange("image1", e)}
                                  className="hidden"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="w-[30%]  h-full">
                          <div className="flex flex-col justify-center h-full pb-20">
                            <div className="h-full border-b-4 border-white">
                              <div
                                className="h-full w-full group relative overflow-hidden"
                                onMouseDown={(e) => handleMouseDown("image1", e)}
                                onMouseMove={(e) => handleMouseMove("image1", e)}
                                onMouseUp={() => handleMouseUp("image1")}
                                onMouseLeave={() => handleMouseLeave("image1")}
                              >
                                {images.image1 ? (
                                  <>
                                    <NextImage
                                      unoptimized
                                      src={images.image1}
                                      alt="uploaded"
                                      width={200}
                                      height={300}
                                      className="w-full h-full object-cover transition-transform duration-150"
                                      style={{
                                        transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                                        cursor: dragging.image1
                                          ? "grabbing"
                                          : scale.image1 > 1
                                            ? "grab"
                                            : "default",
                                      }}
                                    />

                                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                      <button
                                        type="button"
                                        onClick={() => handleZoom("image1", "in")}
                                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                        title="Zoom In"
                                      >
                                        <ZoomIn className="w-4 h-4 text-gray-700" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleZoom("image1", "out")
                                        }
                                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                        title="Zoom Out"
                                      >
                                        <ZoomOut className="w-4 h-4 text-gray-700" />
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openImageSourceModal("image1")
                                      }
                                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                      title="Edit image"
                                    >
                                      <Pencil className="w-4 h-4 text-gray-700" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete("image1", fileInputRef1)
                                      }
                                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                      title="Delete image"
                                    >
                                      <Trash className="w-4 h-4 text-red-500" />
                                    </button>
                                  </>
                                ) : (
                                  <div
                                    onClick={() => openImageSourceModal("image1")}
                                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                                  >
                                    Select Image
                                  </div>
                                )}

                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={fileInputRef1}
                                  onChange={(e) => handleImageChange("image1", e)}
                                  className="hidden"
                                />
                              </div>
                            </div>
                            <div className="h-full border-t-4 border-b-8 border-white">
                              <div
                                className="h-full w-full group relative overflow-hidden"
                                onMouseDown={(e) => handleMouseDown("image1", e)}
                                onMouseMove={(e) => handleMouseMove("image1", e)}
                                onMouseUp={() => handleMouseUp("image1")}
                                onMouseLeave={() => handleMouseLeave("image1")}
                              >
                                {images.image1 ? (
                                  <>
                                    <NextImage
                                      unoptimized
                                      src={images.image1}
                                      alt="uploaded"
                                      width={200}
                                      height={300}
                                      className="w-full h-full object-cover transition-transform duration-150"
                                      style={{
                                        transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                                        cursor: dragging.image1
                                          ? "grabbing"
                                          : scale.image1 > 1
                                            ? "grab"
                                            : "default",
                                      }}
                                    />

                                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                      <button
                                        type="button"
                                        onClick={() => handleZoom("image1", "in")}
                                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                        title="Zoom In"
                                      >
                                        <ZoomIn className="w-4 h-4 text-gray-700" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleZoom("image1", "out")
                                        }
                                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                        title="Zoom Out"
                                      >
                                        <ZoomOut className="w-4 h-4 text-gray-700" />
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openImageSourceModal("image1")
                                      }
                                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                      title="Edit image"
                                    >
                                      <Pencil className="w-4 h-4 text-gray-700" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete("image1", fileInputRef1)
                                      }
                                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                      title="Delete image"
                                    >
                                      <Trash className="w-4 h-4 text-red-500" />
                                    </button>
                                  </>
                                ) : (
                                  <div
                                    onClick={() => openImageSourceModal("image1")}
                                    className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                                  >
                                    Select Image
                                  </div>
                                )}

                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={fileInputRef1}
                                  onChange={(e) => handleImageChange("image1", e)}
                                  className="hidden"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="h-[20%] w-full border-t-8 border-white">
                      <div className="flex h-full w-full">
                        <div className="w-[30%] border-r-8 border-white"></div>
                        <div className="w-[70%]">
                          <div
                            className="h-full w-full group relative overflow-hidden"
                            onMouseDown={(e) => handleMouseDown("image1", e)}
                            onMouseMove={(e) => handleMouseMove("image1", e)}
                            onMouseUp={() => handleMouseUp("image1")}
                            onMouseLeave={() => handleMouseLeave("image1")}
                          >
                            {images.image1 ? (
                              <>
                                <NextImage
                                  unoptimized
                                  src={images.image1}
                                  alt="uploaded"
                                  width={200}
                                  height={300}
                                  className="w-full h-full object-cover transition-transform duration-150"
                                  style={{
                                    transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                                    cursor: dragging.image1
                                      ? "grabbing"
                                      : scale.image1 > 1
                                        ? "grab"
                                        : "default",
                                  }}
                                />

                                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image1", "in")}
                                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image1", "out")}
                                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => openImageSourceModal("image1")}
                                  className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image1", fileInputRef1)
                                  }
                                  className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Delete image"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <div
                                onClick={() => openImageSourceModal("image1")}
                                className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                              >
                                Select Image
                              </div>
                            )}

                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef1}
                              onChange={(e) => handleImageChange("image1", e)}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex border-8 border-white bg-[#427F6D]">
            <div className="w-[30%] flex flex-col">
              <div className="h-[30%] w-full border-b-4 border-white">
                <div
                  className="h-full w-full group relative overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image1", e)}
                  onMouseMove={(e) => handleMouseMove("image1", e)}
                  onMouseUp={() => handleMouseUp("image1")}
                  onMouseLeave={() => handleMouseLeave("image1")}
                >
                  {images.image1 ? (
                    <>
                      <NextImage
                        unoptimized
                        src={images.image1}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-150"
                        style={{
                          transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                          cursor: dragging.image1
                            ? "grabbing"
                            : scale.image1 > 1
                              ? "grab"
                              : "default",
                        }}
                      />

                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image1", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image1", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image1")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete("image1", fileInputRef1)}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image1")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef1}
                    onChange={(e) => handleImageChange("image1", e)}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="h-[10%] w-full border-y-4 border-white"></div>
              <div className="h-[30%] w-full border-y-4 border-white">
                <div
                  className="h-full w-full group relative overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image1", e)}
                  onMouseMove={(e) => handleMouseMove("image1", e)}
                  onMouseUp={() => handleMouseUp("image1")}
                  onMouseLeave={() => handleMouseLeave("image1")}
                >
                  {images.image1 ? (
                    <>
                      <NextImage
                        unoptimized
                        src={images.image1}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-150"
                        style={{
                          transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                          cursor: dragging.image1
                            ? "grabbing"
                            : scale.image1 > 1
                              ? "grab"
                              : "default",
                        }}
                      />

                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image1", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image1", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image1")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete("image1", fileInputRef1)}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image1")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef1}
                    onChange={(e) => handleImageChange("image1", e)}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="h-[30%]  border-t-4 border-white">
                <div
                  className="h-full w-full group relative overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image1", e)}
                  onMouseMove={(e) => handleMouseMove("image1", e)}
                  onMouseUp={() => handleMouseUp("image1")}
                  onMouseLeave={() => handleMouseLeave("image1")}
                >
                  {images.image1 ? (
                    <>
                      <NextImage
                        unoptimized
                        src={images.image1}
                        alt="uploaded"
                        width={200}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-150"
                        style={{
                          transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                          cursor: dragging.image1
                            ? "grabbing"
                            : scale.image1 > 1
                              ? "grab"
                              : "default",
                        }}
                      />

                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image1", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image1", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image1")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete("image1", fileInputRef1)}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image1")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef1}
                    onChange={(e) => handleImageChange("image1", e)}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <div className="w-[70%] py-6 px-7 flex flex-col border-l-8 border-white">
              <div className="flex flex-col justify-center items-center">
                <div className="flex gap-2 text-[#ffffff] text-[30px]">
                  <div className="w-[75px]">
                    <StyledInput
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      inputStyle={fieldStyles["addressLine1"]}
                      onChangeStyle={(s) => updateFieldStyle("addressLine1", s)}
                      rows={1}
                      className="font-thin inline text-[30px] w-full h-[25px] bg-transparent text-right focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
                      placeholder="0000"
                    />
                  </div>
                  SEVENTH AVENUE
                </div>
                <div className="w-full flex justify-center text-[#ffffff] text-[14px] ">
                  <StyledInput
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    inputStyle={fieldStyles["cityLine"]}
                    onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                    className="font-thin inline w-full h-[22px] text-center bg-transparent focus:outline-none border-none placeholder-[#ffffff] "
                    placeholder="WEST END, NEW WESTMINSTER"
                  />
                </div>
              </div>
              <hr className="border-b-1 border-white " />
              <div className="flex flex-col gap-1 px-6 py-2">
                <StyledInput
                  value={description}
                  rows={13}
                  onChange={(e) => setDescription(e.target.value)}
                  inputStyle={fieldStyles["description"]}
                  onChangeStyle={(s) => updateFieldStyle("description", s)}
                  className="font-thin text-[11px] z-20 text-[#ffffff] leading-[1.6]  bg-transparent text-left focus:outline-none border-none placeholder-[#ffffff]"
                  placeholder="A fine example of Royal City character built by Hustler Thomas. This 1892 Victorian home stands out on the street with a sweeping steep gabled cedar shake roof sheltering the wrap-around veranda. Step inside onto newly refinished hardwood floors that flow throughout living room & front room office. New granite counters surround the 1950 O’Keefe & Merritt gas stove as a centerpiece, splitting a magnificent Southeast view from the kitchen & dining area toward Mt. Baker. A private main floor deck steps out from the kitchen. The glorious unobstructed view is further taken advantage of from the top floor master bedroom & sundeck. An ideal location for the hot tub perched on the deck to take in twilight summer evenings & snowy winter nights. The top floor bathroom maintains heritage components of the home & a skylight to pour in natural light. The front bedroom looks out to a beautiful mature Maple. The legal downstairs suite has a single bedroom plus storage & separate entrance off its living room & kitchen. A large utility & laundry room separates the downstairs from the main floor. A stone terraced back yard is bathed in sun throughout the day, landscaped with a variety of flowers & fruit trees, that leads to the 18x20 garage built in 2009 with carriage doors & roof lines to complement the home’s design. Interior stairs in the 9’ ceiling garage lead up to a 7’ loft & a recessed apiary & balcony overlooking the lane. Consideration was made during construction to accommodate a possible future laneway home with city approval including the current half bathroom and hot & cold running water. This tight knit neighbourhood known for friendly neighbours & a strong sense of community is only minutes to Burnaby & connecting routes to Vancouver, Richmond & the Fraser Valley. Walking distance to 22ndStreet Skytrain station just past beautiful Grimston Park 1 block West of this home which features a new adventure playground, tennis court, lacrosse box & kids wading pool. Additionally, only 1 block from Tweedsmuir elementary. Close to shopping, restaurants & amenities on 22ndStreet, Columbia Street & New Westminster Quay. Don’t miss this opportunity to own a piece of Royal City history!"
                />
                <div className=" w-full place-self-center">
                  <div className="font-bold text-[24px] text-[#ffffff] flex flex-wrap items-center gap-2">
                    <div className="inline">
                      <StyledInput
                        value={bedroom}
                        onChange={(e) => setBedroom(e.target.value)}
                        inputStyle={fieldStyles["bedroom"]}
                        onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
                        className="font-semibold text-[24px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                        placeholder="0"
                      />
                    </div>
                    BEDROOM •
                    <div className="inline">
                      <StyledInput
                        value={bathroom}
                        onChange={(e) => setBathroom(e.target.value)}
                        inputStyle={fieldStyles["bathroom"]}
                        onChangeStyle={(s) => updateFieldStyle("bathroom", s)}
                        className="font-semibold text-[24px] bg-transparent text-left w-[20px] h-[20px]  focus:outline-none border-none placeholder-white placeholder:font-[500]"
                        placeholder="0"
                      />
                    </div>
                    BATHROOM •
                    <div className="inline">
                      <StyledInput
                        value={sqft}
                        onChange={(e) => setSqft(e.target.value)}
                        inputStyle={fieldStyles["sqft"]}
                        onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                        className="font-semibold text-[24px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                        placeholder="000"
                      />
                    </div>
                    SQ FT • BUILT IN
                    <div className="inline">
                      <StyledInput
                        value={builtYear}
                        onChange={(e) => setBuiltYear(e.target.value)}
                        inputStyle={fieldStyles["builtYear"]}
                        onChangeStyle={(s) => updateFieldStyle("builtYear", s)}
                        className="font-semibold text-[24px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                        placeholder="0000"
                      />
                    </div>
                    •
                    <div className="inline w-[115px]">
                      <StyledInput
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        inputStyle={fieldStyles["amount"]}
                        onChangeStyle={(s) => updateFieldStyle("amount", s)}
                        className="font-semibold text-[24px] bg-transparent text-left h-[20px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                        placeholder="$000,000"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <hr className="border-b-1 border-white  " />
              <div className="flex justify-between items-center px-6 py-2">
                <div className="flex flex-col gap-3 self-start ">
                  <div>
                    <span className="font-bold text-[#ffffff] text-[16px]">
                      SITE INFLUENCES:
                    </span>
                    <StyledInput
                      value={siteInfluences}
                      onChange={(e) => setSiteInfluences(e.target.value)}
                      inputStyle={fieldStyles["siteInfluences"]}
                      onChangeStyle={(s) => updateFieldStyle("siteInfluences", s)}
                      className="font-normal text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[#ffffff] text-[16px]">
                      FEATURES INCLUDED:
                    </span>
                    <StyledInput
                      value={featuresIncluded}
                      onChange={(e) => setFeaturesIncluded(e.target.value)}
                      inputStyle={fieldStyles["featuresIncluded"]}
                      onChangeStyle={(s) => updateFieldStyle("featuresIncluded", s)}
                      className="font-normal text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-right justify-start ">
                  <div>
                    <span className="font-bold text-[#ffffff] text-[16px]">
                      GROSS TAXES:
                    </span>
                    <StyledInput
                      value={grossTaxes}
                      onChange={(e) => setGrossTaxes(e.target.value)}
                      inputStyle={fieldStyles["grossTaxes"]}
                      onChangeStyle={(s) => updateFieldStyle("grossTaxes", s)}
                      className="font-normal text-[12px] bg-transparent h-[22px] text-right w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="$0,000.00"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[#ffffff] text-[16px]">
                      OUTDOOR AREAS:
                    </span>
                    <StyledInput
                      value={outdoorArea}
                      onChange={(e) => setOutdoorArea(e.target.value)}
                      inputStyle={fieldStyles["outdoorArea"]}
                      onChangeStyle={(s) => updateFieldStyle("outdoorArea", s)}
                      className="font-normal text-[12px] bg-transparent h-[22px] text-right w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="Patio(s), Deck(s)"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[#ffffff] text-[16px]">
                      MLS #:
                    </span>
                    <StyledInput
                      value={mlsNumber}
                      onChange={(e) => setMlsNumber(e.target.value)}
                      inputStyle={fieldStyles["mlsNumber"]}
                      onChangeStyle={(s) => updateFieldStyle("mlsNumber", s)}
                      className="font-normal text-[12px] bg-transparent h-[22px] text-right w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="R00000"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center gap-4 px-6 py-2 h-[250px]">
                <div className="w-[40%] h-full">
                  <div
                    className="h-full w-full group relative overflow-hidden"
                    onMouseDown={(e) => handleMouseDown("image1", e)}
                    onMouseMove={(e) => handleMouseMove("image1", e)}
                    onMouseUp={() => handleMouseUp("image1")}
                    onMouseLeave={() => handleMouseLeave("image1")}
                  >
                    {images.image1 ? (
                      <>
                        <NextImage
                          unoptimized
                          src={images.image1}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover transition-transform duration-150"
                          style={{
                            transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                            cursor: dragging.image1
                              ? "grabbing"
                              : scale.image1 > 1
                                ? "grab"
                                : "default",
                          }}
                        />

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => handleZoom("image1", "in")}
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoom("image1", "out")}
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image1")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image1", fileInputRef1)}
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        onClick={() => openImageSourceModal("image1")}
                        className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                      >
                        Select Image
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef1}
                      onChange={(e) => handleImageChange("image1", e)}
                      className="hidden"
                    />
                  </div>
                </div>
                <div className="w-[60%] h-full">
                  <div
                    className="h-full w-full group relative overflow-hidden"
                    onMouseDown={(e) => handleMouseDown("image1", e)}
                    onMouseMove={(e) => handleMouseMove("image1", e)}
                    onMouseUp={() => handleMouseUp("image1")}
                    onMouseLeave={() => handleMouseLeave("image1")}
                  >
                    {images.image1 ? (
                      <>
                        <NextImage
                          unoptimized
                          src={images.image1}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover transition-transform duration-150"
                          style={{
                            transform: `scale(${scale.image1}) translate(${position.image1.x}px, ${position.image1.y}px)`,
                            cursor: dragging.image1
                              ? "grabbing"
                              : scale.image1 > 1
                                ? "grab"
                                : "default",
                          }}
                        />

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => handleZoom("image1", "in")}
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoom("image1", "out")}
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image1")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image1", fileInputRef1)}
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        onClick={() => openImageSourceModal("image1")}
                        className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                      >
                        Select Image
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef1}
                      onChange={(e) => handleImageChange("image1", e)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

BcfpStandard23.displayName = "BcfpStandard23";

export default BcfpStandard23;
