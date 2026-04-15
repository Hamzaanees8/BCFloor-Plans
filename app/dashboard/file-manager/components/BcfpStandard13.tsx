import { Pencil, Trash, ZoomIn, ZoomOut, House } from "lucide-react";
import Image from "next/image";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import { featureSheetService } from "../file-manager";
import { FeatureSheetPayload, FeatureSheetResponse } from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";

export interface BcfpStandard13Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard13Props {
  orderData: Order | null;
}

const BcfpStandard13 = forwardRef<BcfpStandard13Ref, BcfpStandard13Props>(
  ({ orderData }, ref) => {
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
    // const [mlsNumber, setMlsNumber] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");

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
    });

    const [fieldStyles, setFieldStyles] = useState<Record<string, any>>({});

    const updateFieldStyle = (fieldName: string, style: any) => {
      setFieldStyles((prev) => ({
        ...prev,
        [fieldName]: style,
      }));
    };

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

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard13",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#3A8D3D",
          offeredAtPrice: amount,
          realtorName: fullName,
          emailLink: email,
          companyName: propertyName,
          propertyNotesTitle: roadName,
          propertyNotesDescription: description,
          expandedDetail1Title: "By-law Restrictions",
          expandedDetail1Description: byLawRestrictions,
          expandedDetail2Title: "Maint. Fees",
          expandedDetail2Description: maintFees,
          expandedDetail3Title: "Maint. Fees Include",
          expandedDetail3Description: maintFeesInclude,
          expandedDetail4Title: "Features Included",
          expandedDetail4Description: featuresIncluded,
          keyHighlightLabel: "Site Influences",
          keyHighlights: siteInfluences ? siteInfluences.split("\n").filter(Boolean) : [],
          otherDetails: {
            amenities,
            view,
            bedroom,
            bathroom,
            sqft,
            builtYear,
            number,
            addressCode,
            cityLine,
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
        if (state.propertyNotesTitle) setRoadName(state.propertyNotesTitle as string);
        if (state.propertyNotesDescription) setDescription(state.propertyNotesDescription as string);

        if (state.expandedDetail1Description) setByLawRestrictions(state.expandedDetail1Description as string);
        if (state.expandedDetail2Description) setMaintFees(state.expandedDetail2Description as string);
        if (state.expandedDetail3Description) setMaintFeesInclude(state.expandedDetail3Description as string);
        if (state.expandedDetail4Description) setFeaturesIncluded(state.expandedDetail4Description as string);

        if (state.keyHighlights) setSiteInfluences(state.keyHighlights.join("\n"));

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
          if (details.amenities) setAmenities(details.amenities as string);
          if (details.view) setView(details.view as string);
          if (details.bedroom) setBedroom(details.bedroom as string);
          if (details.bathroom) setBathroom(details.bathroom as string);
          if (details.sqft) setSqft(details.sqft as string);
          if (details.builtYear) setBuiltYear(details.builtYear as string);
          if (details.number) setNumber(details.number as string);
          if (details.addressCode) setAddressCode(details.addressCode as string);
          if (details.cityLine) setCityLine(details.cityLine as string);
        }

        if (state.images) setImages((prev) => ({ ...prev, ...(state.images as unknown as typeof images) }));
        if (state.imageScales) setScale((prev) => ({ ...prev, ...(state.imageScales as unknown as typeof scale) }));
        if (state.imagePositions) setPosition((prev) => ({ ...prev, ...(state.imagePositions as unknown as typeof position) }));
        if (state.fieldStyles) setFieldStyles(state.fieldStyles as Record<string, any>);
      },
    }));

    console.log("orderData", orderData);

    const { formData, updateFormData } = useFileManagerContext();

    // Initial sync from context on mount
    useEffect(() => {
      if (formData) {
        if (formData.byLawRestrictions) setByLawRestrictions(formData.byLawRestrictions);
        if (formData.maintenanceFees) setMaintFees(formData.maintenanceFees);
        if (formData.maintenanceFeesInclude) setMaintFeesInclude(formData.maintenanceFeesInclude);
        if (formData.featuresIncluded) setFeaturesIncluded(formData.featuresIncluded);
        if (formData.siteInfluences) setSiteInfluences(formData.siteInfluences);
        if (formData.amenities) setAmenities(formData.amenities);
        if (formData.view) setView(formData.view);
        if (formData.description) setDescription(formData.description);
        if (formData.fullName) setFullName(formData.fullName);
        if (formData.email) setEmail(formData.email);
        if (formData.propertyName) setPropertyName(formData.propertyName);
        if (formData.amount) setAmount(formData.amount);
        if (formData.number) setNumber(formData.number);
        if (formData.addressCode) setAddressCode(formData.addressCode);
        if (formData.roadName) setRoadName(formData.roadName);
        if (formData.cityLine) setCityLine(formData.cityLine);
        if (formData.bedroom) setBedroom(formData.bedroom);
        if (formData.bathroom) setBathroom(formData.bathroom);
        if (formData.sqft) setSqft(formData.sqft);
        if (formData.builtYear) setBuiltYear(formData.builtYear);

        if (formData.images) {
          setImages(prev => ({ ...prev, ...(formData.images as typeof images) }));
        }
        if (formData.imageScales) {
          setScale(prev => ({ ...prev, ...(formData.imageScales as typeof scale) }));
        }
        if (formData.imagePositions) {
          setPosition(prev => ({ ...prev, ...(formData.imagePositions as typeof position) }));
        }
      }
      // Only run on mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      updateFormData({
        byLawRestrictions,
        maintenanceFees: maintFees,
        maintenanceFeesInclude: maintFeesInclude,
        featuresIncluded,
        siteInfluences,
        amenities,
        view,
        description,
        fullName,
        email,
        propertyName,
        amount,
        number,
        addressCode,
        roadName,
        cityLine,
        bedroom,
        bathroom,
        sqft,
        builtYear
      });
    }, [
      byLawRestrictions,
      maintFees,
      maintFeesInclude,
      featuresIncluded,
      siteInfluences,
      amenities,
      view,
      description,
      fullName,
      email,
      propertyName,
      amount,
      number,
      addressCode,
      roadName,
      cityLine,
      bedroom,
      bathroom,
      sqft,
      builtYear,
      updateFormData
    ]);


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
        default:
          break;
      }
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    const openImageSourceModal = (imageSlot: string) => {
      setCurrentImageSlot(imageSlot);
      setShowImageSourceModal(true);
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

        <div className="pdf-page">
          <div className="w-full flex flex-col  justify-center gap-3 font-alexandria relative "
            style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)" }}
          >
            <div className="relative">
              <div
                className="w-full h-[700px] place-self-center border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group"
                onMouseDown={(e) => handleMouseDown("image1", e)}
                onMouseMove={(e) => handleMouseMove("image1", e)}
                onMouseUp={() => handleMouseUp("image1")}
                onMouseLeave={() => handleMouseLeave("image1")}
              >
                {images.image1 ? (
                  <>
                    <Image
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
                    <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                      className="absolute top-[10px] right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete("image1", fileInputRef1)}
                      className="absolute top-[10px] right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

              <div className="flex gap-2 absolute bottom-[64px] right-[20px]">
                <div className="opacity-[25%] w-[35px]" style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)" }}></div>
                <div className="opacity-[50%] w-[35px]" style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)" }}></div>
                <div className="opacity-[75%] w-[35px]" style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)" }}></div>
                <div className="flex px-5 pr-[64px] py-1" style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)" }}>
                  <div className="font-bold items-center text-[14px] text-[#B3B394] flex flex-wrap gap-2">
                    <div className="inline">
                      <StyledInput
                        value={bedroom}
                        onChange={(e) => setBedroom(e.target.value)}
                        inputStyle={fieldStyles["bedroom"]}
                        onChangeStyle={(style) => updateFieldStyle("bedroom", style)}
                        className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="0"
                      />
                    </div>
                    BEDROOM |
                    <div className="inline">
                      <StyledInput
                        value={bathroom}
                        onChange={(e) => setBathroom(e.target.value)}
                        inputStyle={fieldStyles["bathroom"]}
                        onChangeStyle={(style) => updateFieldStyle("bathroom", style)}
                        className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="0"
                      />
                    </div>
                    BATHROOM |
                    <div className="inline">
                      <StyledInput
                        value={sqft}
                        onChange={(e) => setSqft(e.target.value)}
                        inputStyle={fieldStyles["sqft"]}
                        onChangeStyle={(style) => updateFieldStyle("sqft", style)}
                        className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="000"
                      />
                    </div>
                    SQ FT | BUILT IN
                    <div className="inline">
                      <StyledInput
                        value={builtYear}
                        onChange={(e) => setBuiltYear(e.target.value)}
                        inputStyle={fieldStyles["builtYear"]}
                        onChangeStyle={(style) => updateFieldStyle("builtYear", style)}
                        className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="0000"
                      />
                    </div>

                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 absolute top-[40px] left-[50px] w-[150px]">
                <div className="p-3" style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)" }}>
                  <div className="tracking-wide text-white mt-0 flex">#
                    <StyledInput
                      value={addressCode}
                      onChange={(e) => setAddressCode(e.target.value)}
                      inputStyle={fieldStyles["addressCode"]}
                      onChangeStyle={(style) => updateFieldStyle("addressCode", style)}
                      className="font-light text-[21px] h-[24px] w-[150px] leading-none mt-0 bg-transparent text-[#ffffff] text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                      placeholder="0000-0000"
                    />
                  </div>
                  <div className="text-[13px] text-white font-bold leading-none mt-0 flex">
                    Number
                    <StyledInput
                      value={roadName}
                      onChange={(e) => setRoadName(e.target.value)}
                      inputStyle={fieldStyles["roadName"]}
                      onChangeStyle={(style) => updateFieldStyle("roadName", style)}
                      className="font-light text-[13px] h-[24px] leading-none mt-0 bg-transparent text-[#ffffff] text-center w-[22px] focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                      placeholder="0"
                    />
                    Road
                  </div>
                  <hr className="border-t-2 border-dotted border-white w-full" />
                  <div className="uppercase mt-2 flex justify-center">
                    <StyledInput
                      value={cityLine}
                      rows={2}
                      onChange={(e) => setCityLine(e.target.value)}
                      inputStyle={fieldStyles["cityLine"]}
                      onChangeStyle={(style) => updateFieldStyle("cityLine", style)}
                      className="text-[#B3B394] text-[13px] h-[40px] bg-transparent text-center focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[200]"
                      placeholder="BRIGHOUSE SOUTH, RICHMOND"
                    />
                  </div>
                </div>
                <div className="text-[30px] font-light mt-0" style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)", opacity: 0.7 }}>
                  <StyledInput
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputStyle={fieldStyles["amount"]}
                    onChangeStyle={(style) => updateFieldStyle("amount", style)}
                    className="font-semibold content-center text-center text-[#ffffff] text-[30px] h-[40px] bg-transparent w-full focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
                    placeholder="$000,000"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 px-[80px] pb-[50px]">
              <div className="w-[15%]">
                <div className="space-y-2 text-[8px]">
                  <div>
                    <span className="font-bold text-[#B3B394] text-[16px]">BY-LAW RESTRICTIONS:</span>
                    <StyledInput
                      value={byLawRestrictions}
                      onChange={(e) => setByLawRestrictions(e.target.value)}
                      inputStyle={fieldStyles["byLawRestrictions"]}
                      onChangeStyle={(style) => updateFieldStyle("byLawRestrictions", style)}
                      className="font-normal text-[12px] bg-transparent text-left w-full h-[20px] focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="Pets Allowed w/Rest., Rentals Allowed"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[#B3B394] text-[16px]">MAINT. FEES:</span>
                    <StyledInput
                      value={maintFees}
                      onChange={(e) => setMaintFees(e.target.value)}
                      inputStyle={fieldStyles["maintFees"]}
                      onChangeStyle={(style) => updateFieldStyle("maintFees", style)}
                      className="font-normal text-[12px] bg-transparent text-left w-full h-[20px] focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="$000.00"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[#B3B394] text-[16px]">MAINT. FEES INCLUDE:</span>
                    <StyledInput
                      value={maintFeesInclude}
                      onChange={(e) => setMaintFeesInclude(e.target.value)}
                      inputStyle={fieldStyles["maintFeesInclude"]}
                      onChangeStyle={(style) => updateFieldStyle("maintFeesInclude", style)}
                      className="font-normal text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[#B3B394] text-[16px]">FEATURES INCLUDED:</span>
                    <StyledInput
                      value={featuresIncluded}
                      onChange={(e) => setFeaturesIncluded(e.target.value)}
                      inputStyle={fieldStyles["featuresIncluded"]}
                      onChangeStyle={(style) => updateFieldStyle("featuresIncluded", style)}
                      className="font-normal text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings"
                    />
                  </div>
                </div>
                <div className="space-y-2 text-[8px]">
                  <div>
                    <span className="font-bold text-[#B3B394] text-[16px]">SITE INFLUENCES:</span>
                    <StyledInput
                      value={siteInfluences}
                      onChange={(e) => setSiteInfluences(e.target.value)}
                      inputStyle={fieldStyles["siteInfluences"]}
                      onChangeStyle={(style) => updateFieldStyle("siteInfluences", style)}
                      className="font-normal text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[#B3B394] text-[16px]">AMENITIES:</span>
                    <StyledInput
                      value={amenities}
                      onChange={(e) => setAmenities(e.target.value)}
                      inputStyle={fieldStyles["amenities"]}
                      onChangeStyle={(style) => updateFieldStyle("amenities", style)}
                      className="font-normal text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[#B3B394] text-[16px]">VIEW:</span>
                    <StyledInput
                      value={view}
                      onChange={(e) => setView(e.target.value)}
                      inputStyle={fieldStyles["view"]}
                      onChangeStyle={(style) => updateFieldStyle("view", style)}
                      className="font-normal text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                      placeholder="South & SW - Van Isl."
                    />
                  </div>
                </div>
                <div className="text-[#B3B394] ">
                  <div className="font-bold text-[16px] flex flex-col gap-1">
                    <span className="font-normal">CONTACT:</span>
                    <StyledInput
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      rows={1}
                      inputStyle={fieldStyles["fullName"]}
                      onChangeStyle={(style) => updateFieldStyle("fullName", style)}
                      className=" text-[16px] text-[#B3B394] h-[18px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[500]"
                      placeholder="FIRSTNAME LASTNAME"
                    />
                  </div>
                  <StyledInput
                    value={propertyName}
                    rows={1}
                    onChange={(e) => setPropertyName(e.target.value)}
                    inputStyle={fieldStyles["propertyName"]}
                    onChangeStyle={(style) => updateFieldStyle("propertyName", style)}
                    className=" text-[12px] font-thin h-[18px] font- bg-transparent text-left text-white w-full focus:outline-none border-none placeholder-white placeholder:font-[200]"
                    placeholder="MACDONALD  Realty"
                  />
                  <div className="">
                    <div className="flex gap-2 text-white text-[12px]">
                      PHONE:
                      <StyledInput
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        rows={1}
                        inputStyle={fieldStyles["number"]}
                        onChangeStyle={(style) => updateFieldStyle("number", style)}
                        className="font-thin inline text-[12px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
                        placeholder="604.000.0000"
                      />
                    </div>
                    <div className="flex gap-2 text-white text-[11px]">
                      EMAIL:
                      <StyledInput
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        rows={1}
                        inputStyle={fieldStyles["email"]}
                        onChangeStyle={(style) => updateFieldStyle("email", style)}
                        className="font-thin inline text-[11px] h-[22px] bg-transparent text-left w-[180px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                        placeholder="FIRST@LAST.COM"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-[85%]">
                <div className="relative top-[-60px]">
                  <div className="flex flex-col relative justify-center items-center">
                    <div className="grid grid-cols-2 gap-3 w-[80%]">
                      {/* Image 2 */}
                      <div
                        className="w-full h-[270px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group"
                        onMouseDown={(e) => handleMouseDown("image2", e)}
                        onMouseMove={(e) => handleMouseMove("image2", e)}
                        onMouseUp={() => handleMouseUp("image2")}
                        onMouseLeave={() => handleMouseLeave("image2")}
                      >
                        {images.image2 ? (
                          <>
                            <Image
                              unoptimized
                              src={images.image2}
                              alt="uploaded"
                              width={200}
                              height={300}
                              className="w-full h-full object-cover transition-transform duration-150"
                              style={{
                                transform: `scale(${scale.image2}) translate(${position.image2.x}px, ${position.image2.y}px)`,
                                cursor: dragging.image2
                                  ? "grabbing"
                                  : scale.image2 > 1
                                    ? "grab"
                                    : "default",
                              }}
                            />

                            {/* Zoom Buttons */}
                            <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => handleZoom("image2", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image2", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            {/* Edit/Delete */}
                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image2")}
                              className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete("image2", fileInputRef2)}
                              className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                      {/* Image 3 */}
                      <div
                        className="w-full h-[270px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group"
                        onMouseDown={(e) => handleMouseDown("image3", e)}
                        onMouseMove={(e) => handleMouseMove("image3", e)}
                        onMouseUp={() => handleMouseUp("image3")}
                        onMouseLeave={() => handleMouseLeave("image3")}
                      >
                        {images.image3 ? (
                          <>
                            <Image
                              unoptimized
                              src={images.image3}
                              alt="uploaded"
                              width={200}
                              height={300}
                              className="w-full h-full object-cover transition-transform duration-150"
                              style={{
                                transform: `scale(${scale.image3}) translate(${position.image3.x}px, ${position.image3.y}px)`,
                                cursor: dragging.image3
                                  ? "grabbing"
                                  : scale.image3 > 1
                                    ? "grab"
                                    : "default",
                              }}
                            />

                            {/* Zoom Buttons */}
                            <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => handleZoom("image3", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image3", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image3")}
                              className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete("image3", fileInputRef3)}
                              className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image3")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef3}
                          onChange={(e) => handleImageChange("image3", e)}
                          className="hidden"
                        />
                      </div>

                      {/* Image 4 */}
                      <div
                        className="w-full h-[270px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group"
                        onMouseDown={(e) => handleMouseDown("image4", e)}
                        onMouseMove={(e) => handleMouseMove("image4", e)}
                        onMouseUp={() => handleMouseUp("image4")}
                        onMouseLeave={() => handleMouseLeave("image4")}
                      >
                        {images.image4 ? (
                          <>
                            <Image
                              unoptimized
                              src={images.image4}
                              alt="uploaded"
                              width={200}
                              height={300}
                              className="w-full h-full object-cover transition-transform duration-150"
                              style={{
                                transform: `scale(${scale.image4}) translate(${position.image4.x}px, ${position.image4.y}px)`,
                                cursor: dragging.image4
                                  ? "grabbing"
                                  : scale.image4 > 1
                                    ? "grab"
                                    : "default",
                              }}
                            />

                            {/* Zoom Buttons */}
                            <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => handleZoom("image4", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image4", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image4")}
                              className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete("image4", fileInputRef4)}
                              className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image4")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef4}
                          onChange={(e) => handleImageChange("image4", e)}
                          className="hidden"
                        />
                      </div>

                      {/* Image 5 */}
                      <div
                        className="w-full h-[270px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group"
                        onMouseDown={(e) => handleMouseDown("image5", e)}
                        onMouseMove={(e) => handleMouseMove("image5", e)}
                        onMouseUp={() => handleMouseUp("image5")}
                        onMouseLeave={() => handleMouseLeave("image5")}
                      >
                        {images.image5 ? (
                          <>
                            <Image
                              unoptimized
                              src={images.image5}
                              alt="uploaded"
                              width={200}
                              height={300}
                              className="w-full h-full object-cover transition-transform duration-150"
                              style={{
                                transform: `scale(${scale.image5}) translate(${position.image5.x}px, ${position.image5.y}px)`,
                                cursor: dragging.image5
                                  ? "grabbing"
                                  : scale.image5 > 1
                                    ? "grab"
                                    : "default",
                              }}
                            />

                            {/* Zoom Buttons */}
                            <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => handleZoom("image5", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image5", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image5")}
                              className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete("image5", fileInputRef5)}
                              className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image5")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef5}
                          onChange={(e) => handleImageChange("image5", e)}
                          className="hidden"
                        />
                      </div>

                    </div>
                    <div className="absolute  group z-10">
                      <div
                        className="w-[200px] h-[130px] relative bg-white shadow-md overflow-hidden group"
                        onMouseDown={(e) => handleMouseDown("image6", e)}
                        onMouseMove={(e) => handleMouseMove("image6", e)}
                        onMouseUp={() => handleMouseUp("image6")}
                        onMouseLeave={() => handleMouseLeave("image6")}
                      >
                        {images.image6 ? (
                          <>
                            <Image
                              unoptimized
                              src={images.image6}
                              alt="selected"
                              width={200}
                              height={130}
                              className="w-full h-full object-cover transition-transform duration-150"
                              style={{
                                transform: `scale(${scale.image6}) translate(${position.image6.x}px, ${position.image6.y}px)`,
                                cursor: dragging.image6
                                  ? "grabbing"
                                  : scale.image6 > 1
                                    ? "grab"
                                    : "default",
                              }}
                            />

                            {/* Zoom Controls */}
                            <div className="absolute bottom-2 left-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => handleZoom("image6", "in")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-3 h-3 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image6", "out")}
                                className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-3 h-3 text-gray-700" />
                              </button>
                            </div>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image6")}
                              className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDelete("image6", fileInputRef6)}
                              className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image6")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef6}
                          onChange={(e) => handleImageChange("image6", e)}
                          className="hidden"
                        />
                      </div>

                    </div>
                  </div>
                  <div className="text-[10px] justify-self-center mt-4 w-[70%] font-normal text-[#ffffff] italic relative z-10 leading-[1.6]">
                    <h2 className="text-[22px] px-5 text-center tracking-[-1px] font-bold text-[#B3B394]">ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING.</h2>
                    <StyledInput
                      value={description}
                      rows={7}
                      onChange={(e) => setDescription(e.target.value)}
                      inputStyle={fieldStyles["description"]}
                      onChangeStyle={(style) => updateFieldStyle("description", style)}
                      className="font-normal text-[16px] max-h-[300px] z-20 text-[#ffffff] leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
                      placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS
                  overlooking Brighouse Park & to the South and South Westproviding unhindered privacy. The perfect
                  floorplan with open concept living and cross unit bedrooms. Dark laminate flooring, S/S appliances,
                  Gas range and a large open ‘den/nook’ area perfect for the home office. Huge private balcony, great
                  building amenities including exercise room, sauna, roof top courtyard and outdoor kids playground.
                  With parking, and storage locker and balance of the the 5-10 warranty, this home provides nothing
                  but exceptional value. Call today to set up your viewing. MLS # 000000"
                    />
                  </div>
                  <div className="relative px-6 py-2 z-2 w-[60%]  gap-2 flex justify-self-center text-[#B3B394]">
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
                          fill="#B3B394"
                        />
                        <path
                          d="M1.93073 6.81015V7.75415H2.41973V7.66515H2.02373V7.32915H2.41973V7.23415H2.02373V6.90415H2.41973V6.81015H1.93073Z"
                          fill="#B3B394"
                        />
                        <path
                          d="M3.04311 6.81015L2.67511 7.75415H2.77411L2.88611 7.45715H3.30711L3.42011 7.75415H3.51911L3.15411 6.81015H3.04311ZM3.09611 6.89915L3.27511 7.37315H2.92011L3.09611 6.89915Z"
                          fill="#B3B394"
                        />
                        <path
                          d="M3.7901 6.81015V7.75415H4.2151V7.66515H3.8821V6.81015H3.7901Z"
                          fill="#B3B394"
                        />
                        <path
                          d="M4.39758 6.81015V6.90415H4.58758V7.75415H4.67958V6.90415H4.86958V6.81015H4.39758Z"
                          fill="#B3B394"
                        />
                        <path
                          d="M5.06702 7.27662C5.06702 7.56062 5.27402 7.77362 5.54502 7.77362C5.68702 7.77362 5.80902 7.71862 5.90602 7.61262C5.99002 7.52262 6.03102 7.41062 6.03102 7.27662C6.03102 7.14462 5.98202 7.02362 5.88502 6.93162C5.79302 6.83962 5.68002 6.79162 5.54802 6.79162C5.41702 6.79162 5.30602 6.83962 5.21402 6.92862C5.11902 7.02362 5.06702 7.14462 5.06702 7.27662ZM5.16202 7.27662C5.16202 7.16162 5.22002 7.04762 5.30702 6.97162C5.37602 6.91262 5.45902 6.88262 5.54502 6.88262C5.76502 6.88262 5.93702 7.06462 5.93702 7.27662C5.93702 7.50762 5.76502 7.68462 5.55402 7.68462C5.33602 7.68462 5.16202 7.51362 5.16202 7.27662Z"
                          fill="#B3B394"
                        />
                        <path
                          d="M6.43873 6.90507H6.57373C6.66173 6.90507 6.72973 6.90507 6.77973 6.95207C6.82773 6.99307 6.84873 7.04807 6.84873 7.11207C6.84873 7.22007 6.76873 7.30107 6.64773 7.30107H6.55773L6.83973 7.75507H6.94873L6.71973 7.38907C6.85373 7.37607 6.94873 7.25507 6.94873 7.11207C6.94873 7.01407 6.90173 6.91807 6.82773 6.86707C6.75973 6.81707 6.68873 6.81007 6.60073 6.81007H6.34473V7.75507H6.43873V6.90507Z"
                          fill="#B3B394"
                        />
                        <path
                          d="M0.880005 6.474H6.89398V0.460997H0.880005V6.474ZM4.07703 1.183H4.74799C5.36499 1.245 5.81501 1.728 5.80701 2.328C5.80201 2.92 5.35999 3.386 4.74799 3.449H4.07703V1.183ZM3.42798 5.714H1.73199V1.178H3.42798V5.714ZM4.07703 5.724V3.467L6.427 5.724H4.07703Z"
                          fill="#B3B394"
                        />
                        <path
                          d="M7.07922 6.6356C7.03422 6.6356 6.99122 6.6546 6.96222 6.6886C6.92922 6.7186 6.91022 6.7646 6.91022 6.8076C6.91022 6.8516 6.92722 6.8956 6.96222 6.9276C6.99122 6.9616 7.03422 6.9776 7.07922 6.9776C7.12522 6.9776 7.16922 6.9616 7.20322 6.9276C7.23322 6.8956 7.25122 6.8546 7.25122 6.8076C7.25122 6.7626 7.23322 6.7186 7.20322 6.6886C7.16922 6.6546 7.12722 6.6356 7.07922 6.6356ZM7.23322 6.8076C7.23322 6.8516 7.21822 6.8856 7.19022 6.9156C7.15922 6.9436 7.11922 6.9586 7.07922 6.9586C7.03922 6.9586 7.00322 6.9436 6.97422 6.9156C6.94422 6.8856 6.92922 6.8466 6.92922 6.8076C6.92922 6.7696 6.94422 6.7286 6.97422 6.6976C7.00322 6.6706 7.03822 6.6546 7.07922 6.6546C7.12122 6.6546 7.15922 6.6706 7.19022 6.7016C7.21622 6.7286 7.23322 6.7656 7.23322 6.8076ZM7.08722 6.7066H7.01222V6.9016H7.04322V6.8156H7.08822L7.13122 6.9016H7.16522L7.11922 6.8106C7.15022 6.8076 7.16722 6.7896 7.16722 6.7626C7.16722 6.7236 7.14122 6.7066 7.08722 6.7066ZM7.07922 6.7256C7.11822 6.7256 7.13822 6.7366 7.13822 6.7646C7.13822 6.7896 7.11822 6.7976 7.07922 6.7976H7.04322V6.7256H7.07922Z"
                          fill="#B3B394"
                        />
                      </svg>
                    </span>
                    <p className="text-[10px] leading-tight">
                      All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal.
                      Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pdf-page">
          <div className="w-full flex flex-col bg-[#ffffff] justify-center font-alexandria relative">
            <div
              className="w-full h-auto px-[135px] pt-[115px] place-self-center border-2 border-[#fff] relative overflow-hidden flex items-center justify-center group"
              onMouseDown={(e) => handleMouseDown("image7", e)}
              onMouseMove={(e) => handleMouseMove("image7", e)}
              onMouseUp={() => handleMouseUp("image7")}
              onMouseLeave={() => handleMouseLeave("image7")}
            >
              {images.image7 ? (
                <>
                  <Image
                    unoptimized
                    src={images.image7}
                    alt="uploaded"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-150"
                    style={{
                      transform: `scale(${scale.image7}) translate(${position.image7.x}px, ${position.image7.y}px)`,
                      cursor: dragging.image7
                        ? "grabbing"
                        : scale.image7 > 1
                          ? "grab"
                          : "default",
                    }}
                  />

                  {/* Zoom Controls */}
                  <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => handleZoom("image7", "in")}
                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZoom("image7", "out")}
                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => openImageSourceModal("image7")}
                    className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Edit image"
                  >
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete("image7", fileInputRef7)}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    title="Delete image"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => openImageSourceModal("image7")}
                  className="w-full h-[700px] bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                >
                  Select Image
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef7}
                onChange={(e) => handleImageChange("image7", e)}
                className="hidden"
              />
            </div>

            <div className="flex flex-col gap-1 absolute top-0 left-[50px] w-[150px]">
              <div className="p-3 pt-[80px]" style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)" }}>
                <div className="tracking-wide text-white mt-0 flex">#
                  <StyledInput
                    value={addressCode}
                    onChange={(e) => setAddressCode(e.target.value)}
                    inputStyle={fieldStyles["addressCode"]}
                    onChangeStyle={(style) => updateFieldStyle("addressCode", style)}
                    className="font-light text-[21px] h-[24px] w-[150px] leading-none mt-0 bg-transparent text-[#ffffff] text-left focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                    placeholder="0000-0000"
                  />
                </div>
                <div className="text-[13px] text-white font-bold leading-none mt-0 flex">
                  Number
                  <StyledInput
                    value={roadName}
                    onChange={(e) => setRoadName(e.target.value)}
                    inputStyle={fieldStyles["roadName"]}
                    onChangeStyle={(style) => updateFieldStyle("roadName", style)}
                    className="font-light text-[13px] h-[24px] leading-none mt-0 bg-transparent text-[#ffffff] text-center w-[22px] focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                    placeholder="0"
                  />
                  Road
                </div>
                <hr className="border-t-2 border-dotted border-white w-full" />
                <div className="uppercase mt-2 flex justify-center">
                  <StyledInput
                    value={cityLine}
                    rows={2}
                    onChange={(e) => setCityLine(e.target.value)}
                    inputStyle={fieldStyles["cityLine"]}
                    onChangeStyle={(style) => updateFieldStyle("cityLine", style)}
                    className="text-[#B3B394] text-[13px] h-[40px] bg-transparent text-center focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[200]"
                    placeholder="BRIGHOUSE SOUTH, RICHMOND"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 absolute bottom-[60px] right-0 h-[30px]">
              <div className="opacity-[25%] w-[35px]" style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)" }}></div>
              <div className="opacity-[50%] w-[35px]" style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)" }}></div>
              <div className="opacity-[75%] w-[35px]" style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)" }}></div>
              <div className="flex w-[500px]" style={{ background: "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)" }}></div>
            </div>
          </div>
        </div>
      </>
    );
  });

BcfpStandard13.displayName = "BcfpStandard13";
export default BcfpStandard13;
