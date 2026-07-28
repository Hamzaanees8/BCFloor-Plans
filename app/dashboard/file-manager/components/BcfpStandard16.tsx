import { House, Pencil, RotateCw, Trash, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import FileManagerGallery from "./fileManagerGallery";
import ImageSourceModal from "./ImageSourceModal";
import { featureSheetService } from "../file-manager";
import {
  FeatureSheetPayload,
  FeatureSheetResponse,
} from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";

const ImageEditor = ({
  src,
  scale,
  position,
  rotation = 0,
  className = "",
}: {
  src: string;
  scale: number;
  position: { x: number; y: number };
  rotation?: number;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(1);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!containerRef.current) return;
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const { clientWidth, clientHeight } = containerRef.current;
    if (!naturalWidth || !naturalHeight || !clientWidth || !clientHeight)
      return;
    const containerAR = clientWidth / clientHeight;
    const imageAR = naturalWidth / naturalHeight;
    let drawnWidth, drawnHeight;
    if (imageAR > containerAR) {
      drawnWidth = clientWidth;
      drawnHeight = clientWidth / imageAR;
    } else {
      drawnHeight = clientHeight;
      drawnWidth = clientHeight * imageAR;
    }
    setBaseScale(
      Math.max(clientWidth / drawnWidth, clientHeight / drawnHeight),
    );
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative flex items-center justify-center ${className}`}
    >
      <Image
        src={src}
        onLoad={handleLoad}
        alt="uploaded"
        fill
        unoptimized
        className="object-contain pointer-events-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale * baseScale})`,
          transition: "transform 0.1s ease-out",
        }}
      />
    </div>
  );
};

export interface BcfpStandard16Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard16Props {
  orderData: Order | null;
}

const BcfpStandard16 = forwardRef<BcfpStandard16Ref, BcfpStandard16Props>(
  ({ orderData }, ref) => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [number, setNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [byLawRestrictions, setByLawRestrictions] = useState("");
    const [maintFees, setMaintFees] = useState("");
    const [maintFeesInclude, setMaintFeesInclude] = useState("");
    const [featuresIncluded, setFeaturesIncluded] = useState("");
    const [siteInfluences, setSiteInfluences] = useState("");
    const [amenities, setAmenities] = useState("");
    const [view, setView] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");
    const [description, setDescription] = useState("");
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");
    const [image1Rotation, setImage1Rotation] = useState(0);
    const [image2Rotation, setImage2Rotation] = useState(0);
    const [image3Rotation, setImage3Rotation] = useState(0);
    const [image4Rotation, setImage4Rotation] = useState(0);
    const [image5Rotation, setImage5Rotation] = useState(0);
    const [image6Rotation, setImage6Rotation] = useState(0);
    const [image7Rotation, setImage7Rotation] = useState(0);
    const [image8Rotation, setImage8Rotation] = useState(0);
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
    const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(
      null,
    );
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
          templateKey: "BCFPStandard16",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#00AEEF",
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
          keyHighlights: siteInfluences
            ? siteInfluences.split("\n").filter(Boolean)
            : [],
          otherDetails: {
            maintFees,
            maintFeesInclude,
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
        if (state.propertyNotesTitle)
          setRoadName(state.propertyNotesTitle as string);
        if (state.propertyNotesDescription)
          setDescription(state.propertyNotesDescription as string);

        if (state.expandedDetail1Description)
          setByLawRestrictions(state.expandedDetail1Description as string);
        if (state.expandedDetail2Description)
          setMaintFees(state.expandedDetail2Description as string);
        if (state.expandedDetail3Description)
          setMaintFeesInclude(state.expandedDetail3Description as string);
        if (state.expandedDetail4Description)
          setFeaturesIncluded(state.expandedDetail4Description as string);

        if (state.keyHighlights)
          setSiteInfluences(state.keyHighlights.join("\n"));

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
          if (details.maintFees) setMaintFees(details.maintFees as string);
          if (details.maintFeesInclude)
            setMaintFeesInclude(details.maintFeesInclude as string);
          if (details.amenities) setAmenities(details.amenities as string);
          if (details.view) setView(details.view as string);
          if (details.bedroom) setBedroom(details.bedroom as string);
          if (details.bathroom) setBathroom(details.bathroom as string);
          if (details.sqft) setSqft(details.sqft as string);
          if (details.builtYear) setBuiltYear(details.builtYear as string);
          if (details.number) setNumber(details.number as string);
          if (details.addressCode)
            setAddressCode(details.addressCode as string);
          if (details.cityLine) setCityLine(details.cityLine as string);
        }

        if (state.images) {
          setImages((prev) => ({
            ...prev,
            ...(state.images as unknown as typeof prev),
          }));
        }
        if (state.imageScales) {
          setScale((prev) => ({
            ...prev,
            ...(state.imageScales as unknown as typeof prev),
          }));
        }
        if (state.imagePositions) {
          setPosition((prev) => ({
            ...prev,
            ...(state.imagePositions as unknown as typeof prev),
          }));
        }
        if (state.fieldStyles) {
          setFieldStyles(state.fieldStyles as Record<string, any>);
        }
      },
    }));

    console.log("orderData", orderData);

    const { formData, updateFormData } = useFileManagerContext();

    // Initial sync from context on mount
    useEffect(() => {
      if (orderData) {
        if (orderData.property) {
          if (orderData.property.listing_price)
            setAmount(orderData.property.listing_price.toString());
          if (orderData.property.bedrooms)
            setBedroom(orderData.property.bedrooms.toString());
          if (orderData.property.bathrooms)
            setBathroom(orderData.property.bathrooms.toString());
          if (orderData.property.square_footage)
            setSqft(orderData.property.square_footage.toString());
          if (orderData.property.year_constructed)
            setBuiltYear(orderData.property.year_constructed.toString());
          if (orderData.property.description)
            setDescription(orderData.property.description);
          if (orderData.property.mls_number)
            setAddressCode(orderData.property.mls_number);
          if (orderData.property.suite) setRoadName(orderData.property.suite);
          let cityString = "";
          if (orderData.property.city) cityString += orderData.property.city;
          if (orderData.property.province)
            cityString +=
              (cityString ? ", " : "") + orderData.property.province;
          if (orderData.property.postal_code)
            cityString +=
              (cityString ? " " : "") + orderData.property.postal_code;
          if (cityString) setCityLine(cityString);
        }
        if (orderData.agent) {
          const agent = orderData.agent;
          if (agent.first_name || agent.last_name)
            setFullName(
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim(),
            );
          if (agent.email) setEmail(agent.email);
          if (agent.primary_phone) setNumber(agent.primary_phone);
          if (agent.company_name) setPropertyName(agent.company_name);
        }
      }
      if (formData) {
        if (formData.byLawRestrictions)
          setByLawRestrictions(formData.byLawRestrictions);
        if (formData.maintenanceFees) setMaintFees(formData.maintenanceFees);
        if (formData.maintenanceFeesInclude)
          setMaintFeesInclude(formData.maintenanceFeesInclude);
        if (formData.featuresIncluded)
          setFeaturesIncluded(formData.featuresIncluded);
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
        if (formData.images)
          setImages((prev) => ({
            ...prev,
            ...(formData.images as typeof images),
          }));
        if (formData.imageScales)
          setScale((prev) => ({
            ...prev,
            ...(formData.imageScales as typeof scale),
          }));
        if (formData.imagePositions)
          setPosition((prev) => ({
            ...prev,
            ...(formData.imagePositions as typeof position),
          }));
      }
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
        builtYear,
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
      updateFormData,
    ]);

    // --- Handlers ---
    const handleImageChange = (
      key: keyof typeof images,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setImages((prev) => ({ ...prev, [key]: url }));
      }
    };

    const handleDelete = (
      key: keyof typeof images,
      ref: React.RefObject<HTMLInputElement | null>,
    ) => {
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      if (ref.current) ref.current.value = "";
    };

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        const bounded = Math.min(Math.max(newScale, 0.1), 5);
        return { ...prev, [key]: bounded };
      });
    };

    const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
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

        {/* Page 1 Divider - screen only */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 1
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        <div className="pdf-page w-[8.5in] h-[11in] relative overflow-hidden flex flex-col bg-white">
          <div className="relative w-full flex flex-col">
            <svg
              viewBox="0 0 631.26 828.16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              className="w-full h-full"
            >
              <g clipPath="url(#clip0_0_1)">
                <path
                  d="M0 105.16L631.263 91.0749L630 398.2C630 398.2 586.956 68.8079 0 161.32V105.16Z"
                  fill="#00AEEF"
                />
              </g>
              <mask
                id="mask0_0_1"
                style={{
                  maskType: "luminance",
                }}
                maskUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={630}
                height={390}
              >
                <path
                  d="M0 0L0.796 141.262C589.63 61.577 630 389.2 630 389.2V0H0Z"
                  fill="white"
                />
              </mask>
              <g mask="url(#mask0_0_1)">
                <rect width={630} height={390} fill="url(#pattern0_0_1)" />
              </g>
              <path
                d="M630 796.04L4.403 809.819L0 485C0 485 43.044 816.552 630 724.04V796.04Z"
                fill="#00AEEF"
              />
              <mask
                id="mask1_0_1"
                style={{
                  maskType: "luminance",
                }}
                maskUnits="userSpaceOnUse"
                x={0}
                y={491}
                width={630}
                height={338}
              >
                <path
                  d="M0 828.16H630V742.76C41.165 822.446 0.796 491.856 0.796 491.856L0 828.16Z"
                  fill="white"
                />
              </mask>
              <g mask="url(#mask1_0_1)">
                <rect
                  y={491.16}
                  width={630}
                  height={337}
                  fill="url(#pattern1_0_1)"
                />
              </g>
              <defs>
                <pattern
                  id="pattern0_0_1"
                  patternContentUnits="objectBoundingBox"
                  width={1}
                  height={1}
                >
                  <use
                    xlinkHref="#image0_0_1"
                    transform="scale(0.0015873 0.0025641)"
                  />
                </pattern>
                <pattern
                  id="pattern1_0_1"
                  patternContentUnits="objectBoundingBox"
                  width={1}
                  height={1}
                >
                  <use
                    xlinkHref="#image1_0_1"
                    transform="scale(0.0015873 0.00296736)"
                  />
                </pattern>
                <clipPath id="clip0_0_1">
                  <rect
                    width={630}
                    height={307.13}
                    fill="white"
                    transform="translate(0 91.0699)"
                  />
                </clipPath>
                <image
                  id="image0_0_1"
                  width={630}
                  height={390}
                  preserveAspectRatio="none"
                  xlinkHref="data:image/png;base64,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"
                />
                <image
                  id="image1_0_1"
                  width={630}
                  height={337}
                  preserveAspectRatio="none"
                  xlinkHref="data:image/png;base64,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"
                />
              </defs>
            </svg>
            <div className="absolute bottom-0 left-0 flex flex-col z-10 px-[40px] pb-[40px]">
              <span className="text-[14px] font-[300] text-[#ffff]">
                CONTACT:
              </span>
              <StyledInput
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                inputStyle={fieldStyles["fullName"]}
                onChangeStyle={(s) => updateFieldStyle("fullName", s)}
                className=" text-[16px] w-[170px] font-normal text-[#fff] h-[22px] bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                placeholder="FIRSTNAME LASTNAME"
              />
              <StyledInput
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                inputStyle={fieldStyles["propertyName"]}
                onChangeStyle={(s) => updateFieldStyle("propertyName", s)}
                className=" text-[16px] font-normal h-[22px] font- bg-transparent text-left text-white w-[170px] focus:outline-none border-none placeholder-white placeholder:font-[200]"
                placeholder="MACDONALD  Realty"
              />
              <div className="flex gap-2 font-normal text-[16px] text-white">
                Phone:
                <StyledInput
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  inputStyle={fieldStyles["number"]}
                  onChangeStyle={(s) => updateFieldStyle("number", s)}
                  className="font-normal w-[180px] text-[16px] h-[22px] bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                  placeholder="604.000.0000"
                />
              </div>
              <div className="flex gap-2 font-normal text-[16px] text-white">
                Email:
                <StyledInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  inputStyle={fieldStyles["email"]}
                  onChangeStyle={(s) => updateFieldStyle("email", s)}
                  className="font-normal w-[250px] text-[16px] h-[22px] bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[200]"
                  placeholder="Enter email here"
                />
              </div>
              <div className="flex gap-2 font-normal text-nowrap text-[16px] text-white">
                MLS #
                <StyledInput
                  value={addressCode}
                  onChange={(e) => setAddressCode(e.target.value)}
                  inputStyle={fieldStyles["addressCode"]}
                  onChangeStyle={(s) => updateFieldStyle("addressCode", s)}
                  className="font-thin w-[200px] text-[16px]  h-[22px] bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                  placeholder="V981073"
                />
              </div>
              <div className="relative justify-self-center flex gap-2  py-2 z-2 text-[#ffffff]">
                <p className="text-[8px] font-[400] leading-tight">
                  All information deemed reliable but not guaranteed and should
                  be independently veriﬁed. All properties are subject to prior
                  sale, change or withdrawal. Neither listing broker(s) nor BC
                  Floorplans shall be responsible for any typographical errors,
                  misinformation, misprints and shall be held totally harmless.
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
            <div className=""> </div>
          </div>
          <div className="flex flex-col absolute top-0 py-[40px] px-[40px] w-full gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex flex-col items-center">
                  <div className="text-[28px] font-light leading-none mt-0 text-white flex justify-center">
                    <span className="text-[16px]">#</span>
                    <span className="inline">
                      <StyledInput
                        value={addressCode}
                        onChange={(e) => setAddressCode(e.target.value)}
                        inputStyle={fieldStyles["addressCode"]}
                        onChangeStyle={(s) =>
                          updateFieldStyle("addressCode", s)
                        }
                        className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                        placeholder="0000-0000"
                      />
                    </span>
                    <span className="text-white flex uppercase">
                      Number
                      <StyledInput
                        value={roadName}
                        onChange={(e) => setRoadName(e.target.value)}
                        inputStyle={fieldStyles["roadName"]}
                        onChangeStyle={(s) => updateFieldStyle("roadName", s)}
                        className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-white text-center w-[65px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                        placeholder="0"
                      />
                      Road
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="w-[290px] text-white text-[10px] justify-self-center">
                    <StyledInput
                      value={cityLine}
                      onChange={(e) => setCityLine(e.target.value)}
                      inputStyle={fieldStyles["cityLine"]}
                      onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                      className="text-white text-[20px] h-[20px] bg-transparent text-left w-[300px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                      placeholder="BRIGHOUSE SOUTH, RICHMOND"
                    />
                  </div>
                  <div className="text-center">
                    <StyledInput
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      inputStyle={fieldStyles["amount"]}
                      onChangeStyle={(s) => updateFieldStyle("amount", s)}
                      className="font-light text-[16px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-right focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                      placeholder="$000,000"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="my-0 w-[200px] h-full relative overflow-hidden group">
                  {/* logo */}
                  <div
                    onMouseDown={(e) => handleMouseDown("image1", e)}
                    onMouseMove={(e) => handleMouseMove("image1", e)}
                    onMouseUp={() => handleMouseUp("image1")}
                    onMouseLeave={() => handleMouseLeave("image1")}
                  >
                    {images.image1 ? (
                      <>
                        <ImageEditor
                          src={images.image1}
                          scale={scale.image1}
                          position={position.image1}
                          rotation={image1Rotation}
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
                          <button
                            type="button"
                            onClick={() =>
                              setImage1Rotation((r) => (r + 90) % 360)
                            }
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Rotate"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
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
            <div className="flex gap-4 ">
              <div className="w-[65%] flex flex-col gap-4">
                <div
                  className="h-[300px] w-full group relative overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image2", e)}
                  onMouseMove={(e) => handleMouseMove("image2", e)}
                  onMouseUp={() => handleMouseUp("image2")}
                  onMouseLeave={() => handleMouseLeave("image2")}
                >
                  {images.image2 ? (
                    <>
                      <ImageEditor
                        src={images.image2}
                        scale={scale.image2}
                        position={position.image2}
                        rotation={image2Rotation}
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
                        <button
                          type="button"
                          onClick={() =>
                            setImage2Rotation((r) => (r + 90) % 360)
                          }
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                          title="Rotate"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
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
                  <div className="font-bold text-[12px] text-[#2B648E] flex flex-wrap gap-1">
                    <div className="inline">
                      <StyledInput
                        value={bedroom}
                        onChange={(e) => setBedroom(e.target.value)}
                        inputStyle={fieldStyles["bedroom"]}
                        onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
                        className="font-semibold text-[12px] bg-transparent text-left w-[30px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
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
                        className="font-semibold text-[12px] bg-transparent text-left w-[30px] h-[20px]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
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
                        className="font-semibold text-[12px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
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
                        className="font-semibold text-[12px] bg-transparent text-lefts w-[65px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                        placeholder="0000"
                      />
                    </div>
                  </div>
                </div>
                <div className="">
                  <StyledInput
                    value={description}
                    rows={7}
                    onChange={(e) => setDescription(e.target.value)}
                    inputStyle={fieldStyles["description"]}
                    onChangeStyle={(s) => updateFieldStyle("description", s)}
                    className="w-full font-normal text-[12px] z-20 text-[#231F20] leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-grey placeholder:font-[500]"
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
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="text-[#2B648E] text-[12px] flex">
                    <span className="text-nowrap font-bold">
                      BY-LAW RESTRICTIONS:{" "}
                    </span>
                    <StyledInput
                      value={byLawRestrictions}
                      rows={1}
                      onChange={(e) => setByLawRestrictions(e.target.value)}
                      inputStyle={fieldStyles["byLawRestrictions"]}
                      onChangeStyle={(s) =>
                        updateFieldStyle("byLawRestrictions", s)
                      }
                      className="font-semibold text-[12px] text-left bg-transparent text-[#2B648E]  focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Pets Allowed w/Rest., Rentals Allowed"
                    />
                  </div>

                  <div className="text-[#2B648E] text-[12px] pl-2 w-fit flex">
                    <div className="text-nowrap font-bold">MAINT.FEES: </div>
                    <StyledInput
                      value={maintFees}
                      rows={1}
                      onChange={(e) => setMaintFees(e.target.value)}
                      inputStyle={fieldStyles["maintFees"]}
                      onChangeStyle={(s) => updateFieldStyle("maintFees", s)}
                      className="font-semibold text-[12px] text-left text-[#2B648E] bg-transparent focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="$000.00"
                    />
                  </div>

                  <div className="text-[#2B648E] text-[12px] flex">
                    <div className="text-nowrap font-bold pl-6 text-[12px]">
                      MAINTENANCE FEES INCLUDE:{" "}
                    </div>
                    <StyledInput
                      value={maintFeesInclude}
                      rows={2}
                      onChange={(e) => setMaintFeesInclude(e.target.value)}
                      inputStyle={fieldStyles["maintFeesInclude"]}
                      onChangeStyle={(s) =>
                        updateFieldStyle("maintFeesInclude", s)
                      }
                      className="font-semibold text-[12px] text-left text-[#2B648E] bg-transparent focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Gardening, Garbage  Pickup, Gas, Hot Water, Management, Recreation Facility, Other"
                    />
                  </div>

                  <div className="text-[#2B648E] text-[12px] pl-[65px] flex">
                    <div className="text-nowrap font-bold">
                      FEATURES INCLUDED:{" "}
                    </div>
                    <StyledInput
                      value={featuresIncluded}
                      rows={1}
                      onChange={(e) => setFeaturesIncluded(e.target.value)}
                      inputStyle={fieldStyles["featuresIncluded"]}
                      onChangeStyle={(s) =>
                        updateFieldStyle("featuresIncluded", s)
                      }
                      className="font-semibold text-[12px] text-left text-[#2B648E] bg-transparent focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Clothes Washer/Dryer/Fridge/Stove/DW, Drapes/Window Coverings"
                    />
                  </div>

                  <div className="text-[#2B648E] text-[12px] pl-[100px] flex gap-1">
                    <div className="text-nowrap font-bold">
                      SITE INFLUENCES:{" "}
                    </div>
                    <StyledInput
                      value={siteInfluences}
                      rows={1}
                      onChange={(e) => setSiteInfluences(e.target.value)}
                      inputStyle={fieldStyles["siteInfluences"]}
                      onChangeStyle={(s) =>
                        updateFieldStyle("siteInfluences", s)
                      }
                      className="font-semibold text-[12px] text-left text-[#2B648E] bg-transparent focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Central Location, Golf Course Nearby"
                    />
                  </div>

                  <div className="text-[#2B648E] text-[12px] pl-[135px] flex gap-1">
                    <div className="text-nowrap font-bold">AMENITIES: </div>
                    <StyledInput
                      value={amenities}
                      rows={1}
                      onChange={(e) => setAmenities(e.target.value)}
                      inputStyle={fieldStyles["amenities"]}
                      onChangeStyle={(s) => updateFieldStyle("amenities", s)}
                      className="font-semibold text-[12px] text-left text-[#2B648E] bg-transparent focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Exercise Centre, Garden, In Suite Laundry"
                    />
                  </div>

                  <div className="text-[#2B648E] text-[12px] pl-[220px] flex gap-1">
                    <div className="text-nowrap font-bold">VIEW: </div>
                    <StyledInput
                      value={view}
                      rows={1}
                      onChange={(e) => setView(e.target.value)}
                      inputStyle={fieldStyles["view"]}
                      onChangeStyle={(s) => updateFieldStyle("view", s)}
                      className="font-semibold text-[12px] text-left text-[#2B648E] bg-transparent focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Soutn & SW - van island"
                    />
                  </div>
                </div>
              </div>
              <div className="w-[35%]">
                <div className="grid grid-cols-1 gap-4">
                  <div
                    className="w-full h-[150px] relative border-2 border-[#fff] bg-white shadow-md group overflow-hidden"
                    onMouseDown={(e) => handleMouseDown("image3", e)}
                    onMouseMove={(e) => handleMouseMove("image3", e)}
                    onMouseUp={() => handleMouseUp("image3")}
                    onMouseLeave={() => handleMouseLeave("image3")}
                  >
                    {images.image3 ? (
                      <>
                        <ImageEditor
                          src={images.image3}
                          scale={scale.image3}
                          position={position.image3}
                          rotation={image3Rotation}
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
                          <button
                            type="button"
                            onClick={() =>
                              setImage3Rotation((r) => (r + 90) % 360)
                            }
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Rotate"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
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
                  <div
                    className="w-full h-[150px] relative border-2 border-[#fff] bg-white shadow-md group overflow-hidden"
                    onMouseDown={(e) => handleMouseDown("image4", e)}
                    onMouseMove={(e) => handleMouseMove("image4", e)}
                    onMouseUp={() => handleMouseUp("image4")}
                    onMouseLeave={() => handleMouseLeave("image4")}
                  >
                    {images.image4 ? (
                      <>
                        <ImageEditor
                          src={images.image4}
                          scale={scale.image4}
                          position={position.image4}
                          rotation={image4Rotation}
                        />

                        {/* Zoom Controls */}
                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                          <button
                            type="button"
                            onClick={() =>
                              setImage4Rotation((r) => (r + 90) % 360)
                            }
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Rotate"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image4")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete("image4", fileInputRef4)}
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                    className="w-full h-[150px] relative border-2 border-[#fff] bg-white shadow-md group overflow-hidden"
                    onMouseDown={(e) => handleMouseDown("image5", e)}
                    onMouseMove={(e) => handleMouseMove("image5", e)}
                    onMouseUp={() => handleMouseUp("image5")}
                    onMouseLeave={() => handleMouseLeave("image5")}
                  >
                    {images.image5 ? (
                      <>
                        <ImageEditor
                          src={images.image5}
                          scale={scale.image5}
                          position={position.image5}
                          rotation={image5Rotation}
                        />

                        {/* Zoom Controls */}
                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                          <button
                            type="button"
                            onClick={() =>
                              setImage5Rotation((r) => (r + 90) % 360)
                            }
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Rotate"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image5")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete("image5", fileInputRef5)}
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                    className="w-full h-[150px] relative border-2 border-[#fff] bg-white shadow-md group overflow-hidden"
                    onMouseDown={(e) => handleMouseDown("image6", e)}
                    onMouseMove={(e) => handleMouseMove("image6", e)}
                    onMouseUp={() => handleMouseUp("image6")}
                    onMouseLeave={() => handleMouseLeave("image6")}
                  >
                    {images.image6 ? (
                      <>
                        <ImageEditor
                          src={images.image6}
                          scale={scale.image6}
                          position={position.image6}
                          rotation={image6Rotation}
                        />

                        {/* Zoom Controls */}
                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                          <button
                            type="button"
                            onClick={() =>
                              setImage6Rotation((r) => (r + 90) % 360)
                            }
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Rotate"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image6")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete("image6", fileInputRef6)}
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                    className="w-full h-[150px] relative border-2 border-[#fff] bg-white shadow-md group overflow-hidden"
                    onMouseDown={(e) => handleMouseDown("image7", e)}
                    onMouseMove={(e) => handleMouseMove("image7", e)}
                    onMouseUp={() => handleMouseUp("image7")}
                    onMouseLeave={() => handleMouseLeave("image7")}
                  >
                    {images.image7 ? (
                      <>
                        <ImageEditor
                          src={images.image7}
                          scale={scale.image7}
                          position={position.image7}
                          rotation={image7Rotation}
                        />

                        {/* Zoom Controls */}
                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                          <button
                            type="button"
                            onClick={() =>
                              setImage7Rotation((r) => (r + 90) % 360)
                            }
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Rotate"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image7")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>
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
        </div>

        {/* Page 2 Divider - screen only */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 2
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        <div className="pdf-page w-[8.5in] h-[11in] relative overflow-hidden flex flex-col bg-white">
          <div className="relative w-full flex flex-col group">
            <div className="absolute top-10 right-[70px] z-20">
              <div className="flex flex-col items-center">
                <div className="text-[28px] font-light leading-none mt-0 text-white flex justify-center">
                  <span className="text-[16px]">#</span>
                  <span className="inline">
                    <StyledInput
                      value={addressCode}
                      onChange={(e) => setAddressCode(e.target.value)}
                      inputStyle={fieldStyles["addressCode"]}
                      onChangeStyle={(s) => updateFieldStyle("addressCode", s)}
                      className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                      placeholder="0000-0000"
                    />
                  </span>
                  <span className="text-white flex uppercase">
                    Number
                    <StyledInput
                      value={roadName}
                      onChange={(e) => setRoadName(e.target.value)}
                      inputStyle={fieldStyles["roadName"]}
                      onChangeStyle={(s) => updateFieldStyle("roadName", s)}
                      className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-white text-center w-[65px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                      placeholder="0"
                    />
                    Road
                  </span>
                </div>
              </div>
              <div className="flex justify-end ">
                <div className="text-white text-[10px] justify-self-center">
                  <StyledInput
                    value={cityLine}
                    onChange={(e) => setCityLine(e.target.value)}
                    inputStyle={fieldStyles["cityLine"]}
                    onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                    className="text-white text-[16px]  bg-transparent text-right w-[350px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                    placeholder="BRIGHOUSE SOUTH, RICHMOND"
                  />
                </div>
              </div>
            </div>
            <svg
              viewBox="0 0 634 819"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              className="w-full h-full z-10"
            >
              <g clipPath="url(#clip0_490_7741)">
                <path
                  d="M631 772.5L3.40317 786.148L1.96216 597.068C1.96216 597.068 43.3123 789.714 631 730.5V772.5Z"
                  fill="#00AEEF"
                />
                <path
                  d="M1.08723 32.053L634 18L632.254 303C632.254 303 589.614 -2.59341 1 84.1671L1.08723 32.053Z"
                  fill="#00AEEF"
                />
              </g>
              <mask
                id="mask0_490_7741"
                style={{
                  maskType: "luminance",
                }}
                maskUnits="userSpaceOnUse"
                x={1}
                y={604}
                width={630}
                height={200}
              >
                <path
                  d="M1 811H631V757.613C42.165 806.399 1.796 604 1.796 604L1 811Z"
                  fill="white"
                />
              </mask>
              <g mask="url(#mask0_490_7741)">
                <rect
                  x={1}
                  y={604}
                  width={630}
                  height={207}
                  fill="url(#pattern0_490_7741)"
                />
              </g>
              <mask
                id="mask1_490_7741"
                style={{
                  maskType: "luminance",
                }}
                maskUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={631}
                height={294}
              >
                <path
                  d="M0 0L0.797263 65.958C590.566 -7.14 631 293.4 631 293.4V0H0Z"
                  fill="white"
                />
              </mask>
              <g mask="url(#mask1_490_7741)">
                <rect
                  y={-8}
                  width={631}
                  height={302}
                  fill="url(#pattern1_490_7741)"
                />
              </g>
              <defs>
                <pattern
                  id="pattern0_490_7741"
                  patternContentUnits="objectBoundingBox"
                  width={1}
                  height={1}
                >
                  <use
                    xlinkHref="#image0_490_7741"
                    transform="scale(0.0015873 0.00483092)"
                  />
                </pattern>
                <pattern
                  id="pattern1_490_7741"
                  patternContentUnits="objectBoundingBox"
                  width={1}
                  height={1}
                >
                  <use
                    xlinkHref="#image1_490_7741"
                    transform="scale(0.0015873 0.00331126)"
                  />
                </pattern>
                <clipPath id="clip0_490_7741">
                  <rect
                    width={631}
                    height={768}
                    fill="white"
                    transform="translate(0 18)"
                  />
                </clipPath>
                <image
                  id="image0_490_7741"
                  width={630}
                  height={207}
                  preserveAspectRatio="none"
                  xlinkHref="data:image/png;base64,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"
                />
                <image
                  id="image1_490_7741"
                  width={630}
                  height={302}
                  preserveAspectRatio="none"
                  xlinkHref="data:image/png;base64,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"
                />
              </defs>
            </svg>
            <div
              className="w-full h-full overflow-hidden justify-center content-center absolute transition-all duration-200 group"
              onMouseMove={(e) => handleMouseMove("image8", e)}
              onMouseUp={() => handleMouseUp("image8")}
              onMouseLeave={() => handleMouseLeave("image8")}
              style={{
                alignSelf: "anchor-center",
                justifySelf: "anchor-center",
              }}
            >
              {images.image8 ? (
                <>
                  <div
                    className="w-full h-full relative overflow-hidden"
                    onMouseDown={(e) => handleMouseDown("image8", e)}
                  >
                    <ImageEditor
                      src={images.image8}
                      scale={scale.image8}
                      position={position.image8}
                      rotation={image8Rotation}
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
                    <button
                      type="button"
                      onClick={() => setImage8Rotation((r) => (r + 90) % 360)}
                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                      title="Rotate"
                    >
                      <RotateCw className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>

                  {/* Edit/Delete Buttons */}
                  <button
                    type="button"
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
      </div>
    );
  },
);

BcfpStandard16.displayName = "BcfpStandard16";

export default BcfpStandard16;
