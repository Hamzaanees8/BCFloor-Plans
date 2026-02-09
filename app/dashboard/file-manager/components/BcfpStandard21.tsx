import { House, Pencil, Trash, ZoomIn, ZoomOut } from "lucide-react";
import NextImage from "next/image";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import ImageSourceModal from "./ImageSourceModal";
import { featureSheetService } from "../file-manager";
import { FeatureSheetPayload, FeatureSheetResponse } from "../types/featureSheetTypes";

export interface BcfpStandard21Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard21Props {
  orderData: Order | null;
}

const BcfpStandard21 = forwardRef<BcfpStandard21Ref, BcfpStandard21Props>(
  ({ orderData }, ref) => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [number, setNumber] = useState("");
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
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");

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
          templateKey: "BCFPStandard21",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#B3B394",
          offeredAtPrice: amount,
          realtorName: fullName,
          emailLink: email,
          companyName: propertyName,
          propertyNotesTitle: roadName,
          propertyNotesDescription: description,
          expandedDetail1Title: "By-law Restrictions",
          expandedDetail1Description: byLawRestrictions,
          expandedDetail2Title: "Maint. Fees",
          expandedDetail2Description: maintenanceFees,
          expandedDetail3Title: "Maint. Fees Include",
          expandedDetail3Description: maintenanceFeesInclude,
          expandedDetail4Title: "Features Included",
          expandedDetail4Description: featuresIncluded,
          keyHighlightLabel: "Site Influences",
          keyHighlights: siteInfluences ? siteInfluences.split("\n").filter(Boolean) : [],
          otherDetails: {
            maintenanceFees,
            maintenanceFeesInclude,
            amenities,
            view,
            bedroom,
            bathroom,
            sqft,
            builtYear,
            number,
            addressCode,
            cityLine,
            mlsNumber,
          },
          images,
          imageScales: scale,
          imagePositions: position,
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
        if (state.expandedDetail2Description) setMaintenanceFees(state.expandedDetail2Description as string);
        if (state.expandedDetail3Description) setMaintenanceFeesInclude(state.expandedDetail3Description as string);
        if (state.expandedDetail4Description) setFeaturesIncluded(state.expandedDetail4Description as string);

        if (state.keyHighlights) setSiteInfluences(state.keyHighlights.join("\n"));

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
          if (details.maintenanceFees) setMaintenanceFees(details.maintenanceFees as string);
          if (details.maintenanceFeesInclude) setMaintenanceFeesInclude(details.maintenanceFeesInclude as string);
          if (details.amenities) setAmenities(details.amenities as string);
          if (details.view) setView(details.view as string);
          if (details.bedroom) setBedroom(details.bedroom as string);
          if (details.bathroom) setBathroom(details.bathroom as string);
          if (details.sqft) setSqft(details.sqft as string);
          if (details.builtYear) setBuiltYear(details.builtYear as string);
          if (details.number) setNumber(details.number as string);
          if (details.addressCode) setAddressCode(details.addressCode as string);
          if (details.cityLine) setCityLine(details.cityLine as string);
          if (details.mlsNumber) setMlsNumber(details.mlsNumber as string);
        }

        if (state.images) setImages(state.images as unknown as typeof images);
        if (state.imageScales) setScale(state.imageScales as unknown as typeof scale);
        if (state.imagePositions) setPosition(state.imagePositions as unknown as typeof position);
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
      <div className="w-full items-center justify-center relative font-alexandria">
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
        {/* className="w-full h-full transform scale-x-[-1]" */}
        <div className="relative w-full flex flex-col bg-[#B3B394] ">
          <svg
            viewBox="0 0 652.08 828.3"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path
              opacity="{0.5}"
              d="M0.0751953 786.5L652.075 801V476C652.075 476 606.589 807.438 0.0751953 714.5V786.5Z"
              fill="white"
            ></path>
            <path
              d="M0 828.304H652.075V483C652.075 483 612.277 822.318 0.0751953 740.5L0 828.304Z"
              fill="#184260"
            ></path>
            <path
              opacity="{0.5}"
              d="M652.075 115.5L0.0751953 101V408C0.0751953 408 46.6632 79.085 652.075 172V115.5Z"
              fill="white"
            ></path>
            <path
              d="M652.075 0.000183105H0.0751953V398.2C0.0751953 398.2 46.4162 62.972 652.075 144.5V0.000183105Z"
              fill="#184260"
            ></path>
          </svg>
          <div className="absolute bottom-0 right-0 flex flex-col z-10 px-[70px] pb-[70px]">
            <div className="flex justify-end gap-1 mb-4">
              <div className="w-[26%]">
                <span className="text-[20px] text-[#ffffff]">CONTACT:</span>
                <StyledInput
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className=" text-[20px] text-[#ffffff] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
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
                <div className="flex gap-2 font-normal text-nowrap text-[20px] text-white">
                  MLS #
                  <StyledInput
                    value={mlsNumber}
                    onChange={(e) => setMlsNumber(e.target.value)}
                    className="font-thin text-[20px]  h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
                    placeholder="V981073"
                  />
                </div>
              </div>
            </div>
            <div className="relative justify-self-center flex gap-2  py-2 z-2 text-[#ffffff]">
              <p className="text-[12px] font-thin leading-tight">
                All information deemed reliable but not guaranteed and should be
                independently veriﬁed. All properties are subject to prior sale,
                change or withdrawal. Neither listing broker(s) nor BC Floorplans
                shall be responsible for any typographical errors, misinformation,
                misprints and shall be held totally harmless.
              </p>
              <span className="flex flex-col">
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
                    fill="#ffffff"
                  />
                  <path
                    d="M1.93073 6.81015V7.75415H2.41973V7.66515H2.02373V7.32915H2.41973V7.23415H2.02373V6.90415H2.41973V6.81015H1.93073Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M3.04311 6.81015L2.67511 7.75415H2.77411L2.88611 7.45715H3.30711L3.42011 7.75415H3.51911L3.15411 6.81015H3.04311ZM3.09611 6.89915L3.27511 7.37315H2.92011L3.09611 6.89915Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M3.7901 6.81015V7.75415H4.2151V7.66515H3.8821V6.81015H3.7901Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M4.39758 6.81015V6.90415H4.58758V7.75415H4.67958V6.90415H4.86958V6.81015H4.39758Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M5.06702 7.27662C5.06702 7.56062 5.27402 7.77362 5.54502 7.77362C5.68702 7.77362 5.80902 7.71862 5.90602 7.61262C5.99002 7.52262 6.03102 7.41062 6.03102 7.27662C6.03102 7.14462 5.98202 7.02362 5.88502 6.93162C5.79302 6.83962 5.68002 6.79162 5.54802 6.79162C5.41702 6.79162 5.30602 6.83962 5.21402 6.92862C5.11902 7.02362 5.06702 7.14462 5.06702 7.27662ZM5.16202 7.27662C5.16202 7.16162 5.22002 7.04762 5.30702 6.97162C5.37602 6.91262 5.45902 6.88262 5.54502 6.88262C5.76502 6.88262 5.93702 7.06462 5.93702 7.27662C5.93702 7.50762 5.76502 7.68462 5.55402 7.68462C5.33602 7.68462 5.16202 7.51362 5.16202 7.27662Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M6.43873 6.90507H6.57373C6.66173 6.90507 6.72973 6.90507 6.77973 6.95207C6.82773 6.99307 6.84873 7.04807 6.84873 7.11207C6.84873 7.22007 6.76873 7.30107 6.64773 7.30107H6.55773L6.83973 7.75507H6.94873L6.71973 7.38907C6.85373 7.37607 6.94873 7.25507 6.94873 7.11207C6.94873 7.01407 6.90173 6.91807 6.82773 6.86707C6.75973 6.81707 6.68873 6.81007 6.60073 6.81007H6.34473V7.75507H6.43873V6.90507Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M0.880005 6.474H6.89398V0.460997H0.880005V6.474ZM4.07703 1.183H4.74799C5.36499 1.245 5.81501 1.728 5.80701 2.328C5.80201 2.92 5.35999 3.386 4.74799 3.449H4.07703V1.183ZM3.42798 5.714H1.73199V1.178H3.42798V5.714ZM4.07703 5.724V3.467L6.427 5.724H4.07703Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M7.07922 6.6356C7.03422 6.6356 6.99122 6.6546 6.96222 6.6886C6.92922 6.7186 6.91022 6.7646 6.91022 6.8076C6.91022 6.8516 6.92722 6.8956 6.96222 6.9276C6.99122 6.9616 7.03422 6.9776 7.07922 6.9776C7.12522 6.9776 7.16922 6.9616 7.20322 6.9276C7.23322 6.8956 7.25122 6.8546 7.25122 6.8076C7.25122 6.7626 7.23322 6.7186 7.20322 6.6886C7.16922 6.6546 7.12722 6.6356 7.07922 6.6356ZM7.23322 6.8076C7.23322 6.8516 7.21822 6.8856 7.19022 6.9156C7.15922 6.9436 7.11922 6.9586 7.07922 6.9586C7.03922 6.9586 7.00322 6.9436 6.97422 6.9156C6.94422 6.8856 6.92922 6.8466 6.92922 6.8076C6.92922 6.7696 6.94422 6.7286 6.97422 6.6976C7.00322 6.6706 7.03822 6.6546 7.07922 6.6546C7.12122 6.6546 7.15922 6.6706 7.19022 6.7016C7.21622 6.7286 7.23322 6.7656 7.23322 6.8076ZM7.08722 6.7066H7.01222V6.9016H7.04322V6.8156H7.08822L7.13122 6.9016H7.16522L7.11922 6.8106C7.15022 6.8076 7.16722 6.7896 7.16722 6.7626C7.16722 6.7236 7.14122 6.7066 7.08722 6.7066ZM7.07922 6.7256C7.11822 6.7256 7.13822 6.7366 7.13822 6.7646C7.13822 6.7896 7.11822 6.7976 7.07922 6.7976H7.04322V6.7256H7.07922Z"
                    fill="#ffffff"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col absolute top-0 py-[50px] px-[70px] w-full gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex flex-col items-center">
                <div className="text-[28px] font-light leading-none mt-0 text-white flex justify-center">
                  <span className="text-[16px]">#</span>
                  <span className="inline">
                    <StyledInput
                      value={addressCode}
                      onChange={(e) => setAddressCode(e.target.value)}
                      className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                      placeholder="0000-0000"
                    />
                  </span>
                  <span className="text-white flex uppercase">
                    Number
                    <StyledInput
                      value={roadName}
                      onChange={(e) => setRoadName(e.target.value)}
                      className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-white text-center w-[65px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                      placeholder="0"
                    />
                    Road
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <div className="text-white text-[10px] justify-self-center">
                  <StyledInput
                    value={cityLine}
                    onChange={(e) => setCityLine(e.target.value)}
                    className="text-white text-[12px] h-[20px] bg-transparent text-left w-[170px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                    placeholder="BRIGHOUSE SOUTH, RICHMOND"
                  />
                </div>
                <div className="text-center">
                  <StyledInput
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="font-light text-[16px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-right focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                    placeholder="$000,000"
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="my-3 w-[200px] h-[110] relative overflow-hidden group">
                {/* logo */}
                <div
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
                        alt="selected"
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
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                        // onClick={() => fileInputRef4.current?.click()}
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
                      // onClick={() => fileInputRef4.current?.click()}
                      onClick={() => openImageSourceModal("image1")}
                      className="w-[200px] h-[100px] bg-gray-200  text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                    >
                      Select Image
                    </div>
                  )}
                </div>

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
          <div className="flex gap-10 ">
            <div className="w-[35%] flex flex-col gap-5 bg-gradient-to-b from-white to-[#B3B394]">
              <div
                className="w-full h-[270px] relative border-2 border-[#fff] bg-white shadow-md group overflow-hidden"
                onMouseDown={(e) => handleMouseDown("image3", e)}
                onMouseMove={(e) => handleMouseMove("image3", e)}
                onMouseUp={() => handleMouseUp("image3")}
                onMouseLeave={() => handleMouseLeave("image3")}
              >
                {images.image3 ? (
                  <>
                    <NextImage
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

                    {/* Zoom Controls */}
                    <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete("image3", fileInputRef3)}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
              <div className="flex flex-col gap-5 px-2">
                <StyledInput
                  value={description}
                  rows={13}
                  onChange={(e) => setDescription(e.target.value)}
                  className="font-normal text-[16px] z-20 text-[#2C2E35] leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-[#2C2E35] placeholder:font-[500]"
                  placeholder="On top of it all! Beautiful sub-penthouse in the well appointed CENTRO building.
                This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally
                unobstructed VIEWS overlooking Brighouse Park & to the South and South
                Westproviding unhindered privacy. The perfect floorplan with open concept
                living and cross unit bedrooms. Dark laminate ﬂooring, S/S appliances, Gas range
                and a large open ‘den/nook’ area perfect for the home ofﬁce. Huge private
                balcony, great building amenities including exercise room, sauna, roof top
                courtyard and outdoor kids playground. With parking, and storage locker and
                balance of the the 5-10 warranty, this home provides nothing but exceptional
                value. Call today to set up your viewing."
                />
                <div className="text-[#2F2641] text-[20px] flex-col flex">
                  <span className="text-nowrap font-bold">
                    BY-LAW RESTRICTIONS:{" "}
                  </span>
                  <StyledInput
                    value={byLawRestrictions}
                    rows={1}
                    onChange={(e) => setByLawRestrictions(e.target.value)}
                    className="font-semibold text-[16px] text-left bg-transparent text-[#2C2E35]  focus:outline-none border-none placeholder-[#2C2E35] placeholder:font-[500]"
                    placeholder="Pets Allowed w/Rest., Rentals Allowed"
                  />
                </div>

                <div className="text-[#2F2641] text-[20px] flex-col w-fit flex">
                  <div className="text-nowrap font-bold">MAINT.FEES: </div>
                  <StyledInput
                    value={maintenanceFees}
                    rows={1}
                    onChange={(e) => setMaintenanceFees(e.target.value)}
                    className="font-semibold text-[16px] text-left text-[#2C2E35] bg-transparent focus:outline-none border-none placeholder-[#2C2E35] placeholder:font-[500]"
                    placeholder="$000.00"
                  />
                </div>

                <div className="text-[#2F2641] text-[20px] flex-col flex">
                  <div className="text-nowrap font-bold">
                    MAINTENANCE FEES INCLUDE:{" "}
                  </div>
                  <StyledInput
                    value={maintenanceFeesInclude}
                    rows={2}
                    onChange={(e) => setMaintenanceFeesInclude(e.target.value)}
                    className="font-semibold text-[16px] text-left text-[#2C2E35] bg-transparent focus:outline-none border-none placeholder-[#2C2E35] placeholder:font-[500]"
                    placeholder="Gardening, Garbage  Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"
                  />
                </div>

                <div className="text-[#2F2641] text-[20px] flex-col flex">
                  <div className="text-nowrap font-bold">FEATURES INCLUDED: </div>
                  <StyledInput
                    value={featuresIncluded}
                    rows={1}
                    onChange={(e) => setFeaturesIncluded(e.target.value)}
                    className="font-semibold text-[16px] text-left text-[#2C2E35] bg-transparent focus:outline-none border-none placeholder-[#2C2E35] placeholder:font-[500]"
                    placeholder="Clothes Washer/Dryer/Fridge/Stove/DW, Drapes/Window Coverings"
                  />
                </div>

                <div className="text-[#2F2641] text-[20px] flex-col flex ">
                  <div className="text-nowrap font-bold">SITE INFLUENCES: </div>
                  <StyledInput
                    value={siteInfluences}
                    rows={1}
                    onChange={(e) => setSiteInfluences(e.target.value)}
                    className="font-semibold text-[16px] text-left text-[#2C2E35] bg-transparent focus:outline-none border-none placeholder-[#2C2E35] placeholder:font-[500]"
                    placeholder="Central Location, Golf Course Nearby"
                  />
                </div>

                <div className="text-[#2F2641] text-[20px] flex-col flex ">
                  <div className="text-nowrap font-bold">AMENITIES: </div>
                  <StyledInput
                    value={amenities}
                    rows={1}
                    onChange={(e) => setAmenities(e.target.value)}
                    className="font-semibold text-[16px] text-left text-[#2C2E35] bg-transparent focus:outline-none border-none placeholder-[#2C2E35] placeholder:font-[500]"
                    placeholder="Exercise Centre, Garden, In Suite Laundry"
                  />
                </div>

                <div className="text-[#2F2641] text-[20px] flex-col flex ">
                  <div className="text-nowrap font-bold">VIEW: </div>
                  <StyledInput
                    value={view}
                    rows={1}
                    onChange={(e) => setView(e.target.value)}
                    className="font-semibold text-[16px] text-left text-[#2C2E35] bg-transparent focus:outline-none border-none placeholder-[#2C2E35] placeholder:font-[500]"
                    placeholder="Soutn & SW - van island"
                  />
                </div>
              </div>
            </div>
            <div className="w-[65%] flex flex-col gap-4">
              <div
                className="h-[500px] w-full group border-2 border-[#fff] relative overflow-hidden"
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

                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image2")}
                      className="absolute top-[110px] right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete("image2", fileInputRef2)}
                      className="absolute top-[110px] right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
              <div className="mt-2">
                <div className="font-bold text-center leading-[24px] text-[24px] text-[#2F2641] mb-2">
                  ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO BUILDING.
                </div>
                <div className="font-bold text-[24px] text-[#2F2641] flex flex-wrap gap-2 justify-center">
                  <div className="inline">
                    <StyledInput
                      value={bedroom}
                      onChange={(e) => setBedroom(e.target.value)}
                      className="font-semibold text-[24px] bg-transparent text-left w-[30px] h-[20px] focus:outline-none border-none placeholder-[#2F2641] placeholder:font-[500]"
                      placeholder="0"
                    />
                  </div>
                  BEDROOM |
                  <div className="inline">
                    <StyledInput
                      value={bathroom}
                      onChange={(e) => setBathroom(e.target.value)}
                      className="font-semibold text-[24px] bg-transparent text-left w-[30px] h-[20px]  focus:outline-none border-none placeholder-[#2F2641] placeholder:font-[500]"
                      placeholder="0"
                    />
                  </div>
                  BATHROOM |
                  <div className="inline">
                    <StyledInput
                      value={sqft}
                      onChange={(e) => setSqft(e.target.value)}
                      className="font-semibold text-[24px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-[#2F2641] placeholder:font-[500]"
                      placeholder="000"
                    />
                  </div>
                  SQ FT | BUILT IN
                  <div className="inline">
                    <StyledInput
                      value={builtYear}
                      onChange={(e) => setBuiltYear(e.target.value)}
                      className="font-semibold text-[24px] bg-transparent text-left h-[30px] w-[65px] focus:outline-none border-none placeholder-[#2F2641] placeholder:font-[500]"
                      placeholder="0000"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full justify-self-center mt-4">
                <div
                  className="w-full h-[270px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group select-none bg-black/10"
                  onMouseMove={(e) => handleMouseMove("image4", e)}
                  onMouseUp={() => handleMouseUp("image4")}
                  onMouseLeave={() => handleMouseLeave("image4")}
                >
                  {images.image4 ? (
                    <>
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown("image4", e)}
                        style={{
                          transform: `scale(${scale.image4}) translate(${position.image4.x / scale.image4
                            }px, ${position.image4.y / scale.image4}px)`,
                          transition: dragging.image4
                            ? "none"
                            : "transform 0.2s ease-out",
                        }}
                      >
                        <NextImage
                          unoptimized
                          src={images.image4}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                      {/* Edit & Delete */}
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
                <div
                  className="w-full h-[270px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group select-none bg-black/10"
                  onMouseMove={(e) => handleMouseMove("image5", e)}
                  onMouseUp={() => handleMouseUp("image5")}
                  onMouseLeave={() => handleMouseLeave("image5")}
                >
                  {images.image5 ? (
                    <>
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown("image5", e)}
                        style={{
                          transform: `scale(${scale.image5}) translate(${position.image5.x / scale.image5
                            }px, ${position.image5.y / scale.image5}px)`,
                          transition: dragging.image5
                            ? "none"
                            : "transform 0.2s ease-out",
                        }}
                      >
                        <NextImage
                          unoptimized
                          src={images.image5}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                      {/* Edit & Delete */}
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
                <div
                  className="w-full h-[270px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group select-none bg-black/10"
                  onMouseMove={(e) => handleMouseMove("image6", e)}
                  onMouseUp={() => handleMouseUp("image6")}
                  onMouseLeave={() => handleMouseLeave("image6")}
                >
                  {images.image6 ? (
                    <>
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown("image6", e)}
                        style={{
                          transform: `scale(${scale.image6}) translate(${position.image6.x / scale.image6
                            }px, ${position.image6.y / scale.image6}px)`,
                          transition: dragging.image6
                            ? "none"
                            : "transform 0.2s ease-out",
                        }}
                      >
                        <NextImage
                          unoptimized
                          src={images.image6}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleZoom("image6", "in")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleZoom("image6", "out")}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>

                      {/* Edit & Delete */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image6")}
                        className="absolute top-4 left-2 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete("image6", fileInputRef6)}
                        className="absolute top-4 left-10 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                <div
                  className="w-full h-[270px] border-[2px] border-white shadow-sm place-self-center relative overflow-hidden flex items-center justify-center group select-none bg-black/10"
                  onMouseMove={(e) => handleMouseMove("image7", e)}
                  onMouseUp={() => handleMouseUp("image7")}
                  onMouseLeave={() => handleMouseLeave("image7")}
                >
                  {images.image7 ? (
                    <>
                      <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown("image7", e)}
                        style={{
                          transform: `scale(${scale.image7}) translate(${position.image7.x / scale.image7
                            }px, ${position.image7.y / scale.image7}px)`,
                          transition: dragging.image7
                            ? "none"
                            : "transform 0.2s ease-out",
                        }}
                      >
                        <NextImage
                          unoptimized
                          src={images.image7}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      </div>

                      {/* Zoom Controls */}
                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                      {/* Edit & Delete */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image7")}
                        className="absolute top-4 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete("image7", fileInputRef7)}
                        className="absolute top-4 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  ) : (
                    <div
                      onClick={() => openImageSourceModal("image7")}
                      className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
              </div>


            </div>
          </div>
        </div>

        <div className="relative w-full flex flex-col group">

          <svg
            viewBox="0 0 648 828.12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full z-10"
          >
            <path
              d="M648 785L2.94103 799.196L1 583C1 583 41.8396 803.647 648 737.355V761V785Z"
              fill="#B3B394"
            ></path>
            <path
              d="M648 828.123H0L0.817993 583C0.817993 583 42.341 822.675 648 764.904V828.123Z"
              fill="#184260"
            ></path>
            <path
              d="M0 37.5L648 23.0004V154V284.239C648 284.239 605.672 4.22839 0 85.2574V62V37.5Z"
              fill="#B3B394"
            ></path>
            <path
              d="M0 -9.15527e-05H648V284.4C648 284.4 605.659 -6.856 0 64V-9.15527e-05Z"
              fill="#184260"
            ></path>
          </svg>
          <div
            className="w-[80%] h-[80%] overflow-hidden justify-center content-center absolute transition-all duration-200 group"
            onMouseMove={(e) => handleMouseMove("image8", e)}
            onMouseUp={() => handleMouseUp("image8")}
            onMouseLeave={() => handleMouseLeave("image8")}
            style={{ alignSelf: "anchor-center", justifySelf: "anchor-center" }}
          >
            {images.image8 ? (
              <>
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-100 cursor-grab active:cursor-grabbing relative group-hover:z-10 group-hover:opacity-75"
                  onMouseDown={(e) => handleMouseDown("image8", e)}
                  style={{
                    transform: `scale(${scale.image8}) translate(${position.image8.x / scale.image8
                      }px, ${position.image8.y / scale.image8}px)`,
                    transition: dragging.image8
                      ? "none"
                      : "transform 0.3s ease-out",
                  }}
                >
                  <NextImage
                    unoptimized
                    src={images.image8}
                    alt="uploaded"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Zoom Controls */}
                <div className="absolute z-[22] bottom-[100px] right-8 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => handleZoom("image8", "in")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom("image8", "out")}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                {/* Edit/Delete Buttons */}
                <button
                  type="button"
                  // onClick={() => fileInputRef3.current?.click()}
                  onClick={() => openImageSourceModal("image8")}
                  className="absolute z-[22] top-[100px] right-20 bg-white p-1 rounded-full shadow opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Edit image"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete("image8", fileInputRef8)}
                  className="absolute z-[22] top-[100px] right-10 bg-white p-1 rounded-full shadow opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                  title="Delete image"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </>
            ) : (
              <div
                // onClick={() => fileInputRef3.current?.click()}
                onClick={() => openImageSourceModal("image8")}
                className="w-full relative z-10 h-[800px] text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
              >
                Select Image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef8}
              onChange={(e) => handleImageChange("image8", e)}
              className="hidden"
            />
          </div>
        </div>
      </div>
    );
  }
);

BcfpStandard21.displayName = "BcfpStandard21";

export default BcfpStandard21;
