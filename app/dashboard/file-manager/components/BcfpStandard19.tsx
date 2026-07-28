import { House, Pencil, RotateCw, Trash, ZoomIn, ZoomOut } from "lucide-react";
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
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import ImageEditor from "./ImageEditor";
import { featureSheetService } from "../file-manager";
import {
  FeatureSheetPayload,
  FeatureSheetResponse,
} from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";

export interface BcfpStandard19Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard19Props {
  orderData: Order | null;
}

const BcfpStandard19 = forwardRef<BcfpStandard19Ref, BcfpStandard19Props>(
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
    const [addressCode, setAddressCode] = useState("4152 HASTING");
    const [roadName, setRoadName] = useState("4150 HASTINGS STREET");
    const [cityLine, setCityLine] = useState("BURNABY, BC V5C 2J4");
    const [bedroom, setBedroom] = useState("0");
    const [bathroom, setBathroom] = useState("0");
    const [sqft, setSqft] = useState("3000");
    const [builtYear, setBuiltYear] = useState("0000");
    const [fieldStyles, setFieldStyles] = useState<Record<string, any>>({});

    const updateFieldStyle = (fieldName: string, style: any) => {
      setFieldStyles((prev) => ({ ...prev, [fieldName]: style }));
    };

    // --- Images States ---
    const [images, setImages] = useState({
      image1: null as string | null,
      image2: null as string | null,
      image3: null as string | null,
      image4: null as string | null,
      image5: null as string | null,
      image6: null as string | null,
      image7: null as string | null,
    });

    const [scale, setScale] = useState({
      image1: 1,
      image2: 1,
      image3: 1,
      image4: 1,
      image5: 1,
      image6: 1,
      image7: 1,
    });

    const [position, setPosition] = useState({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image3: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
    });

    const [rotation, setRotation] = useState({
      image1: 0,
      image2: 0,
      image3: 0,
      image4: 0,
      image5: 0,
      image6: 0,
      image7: 0,
    });

    const [dragging, setDragging] = useState({
      image1: false,
      image2: false,
      image3: false,
      image4: false,
      image5: false,
      image6: false,
      image7: false,
    });

    const [showImageSourceModal, setShowImageSourceModal] = useState(false);
    const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(
      null,
    );
    const [showGallery, setShowGallery] = useState(false);

    // --- File Input Refs ---
    const fileInputRef1 = useRef<HTMLInputElement | null>(null);
    const fileInputRef2 = useRef<HTMLInputElement | null>(null);
    const fileInputRef3 = useRef<HTMLInputElement | null>(null);
    const fileInputRef4 = useRef<HTMLInputElement | null>(null);
    const fileInputRef5 = useRef<HTMLInputElement | null>(null);
    const fileInputRef6 = useRef<HTMLInputElement | null>(null);
    const fileInputRef7 = useRef<HTMLInputElement | null>(null);

    const lastPosition = useRef({
      image1: { x: 0, y: 0 },
      image2: { x: 0, y: 0 },
      image3: { x: 0, y: 0 },
      image4: { x: 0, y: 0 },
      image5: { x: 0, y: 0 },
      image6: { x: 0, y: 0 },
      image7: { x: 0, y: 0 },
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard19",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#798897",
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
            maintenanceFees: maintFees,
            maintenanceFeesInclude: maintFeesInclude,
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
          imageRotations: rotation,
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
          if (details.maintenanceFees)
            setMaintFees(details.maintenanceFees as string);
          if (details.maintenanceFeesInclude)
            setMaintFeesInclude(details.maintenanceFeesInclude as string);
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

        if (state.images)
          setImages((prev) => ({
            ...prev,
            ...(state.images as unknown as typeof images),
          }));
        if (state.imageScales)
          setScale((prev) => ({
            ...prev,
            ...(state.imageScales as unknown as typeof scale),
          }));
        if (state.imagePositions)
          setPosition((prev) => ({
            ...prev,
            ...(state.imagePositions as unknown as typeof position),
          }));
        if (state.imageRotations)
          setRotation((prev) => ({
            ...prev,
            ...(state.imageRotations as unknown as typeof rotation),
          }));
        if (state.fieldStyles) {
          setFieldStyles(state.fieldStyles as Record<string, any>);
        }
      },
    }));

    // Context integration
    const { formData, updateFormData } = useFileManagerContext();

    // Initial sync from orderData & context
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
          if (orderData.property.suite)
            setAddressCode(orderData.property.suite);
          if (orderData.property.address)
            setRoadName(orderData.property.suite ?? "");

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
            ...(formData.images as unknown as typeof images),
          }));
        if (formData.imageScales)
          setScale((prev) => ({
            ...prev,
            ...(formData.imageScales as unknown as typeof scale),
          }));
        if (formData.imagePositions)
          setPosition((prev) => ({
            ...prev,
            ...(formData.imagePositions as unknown as typeof position),
          }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData]);

    // Sync to context
    useEffect(() => {
      if (updateFormData) {
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
          images,
          imageScales: scale,
          imagePositions: position,
        });
      }
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
      images,
      scale,
      position,
      updateFormData,
    ]);

    // --- Image Handlers ---
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
      fileRef: React.RefObject<HTMLInputElement | null>,
    ) => {
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      if (fileRef.current) fileRef.current.value = "";
    };

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        const bounded = Math.min(Math.max(newScale, 0.1), 5);
        return { ...prev, [key]: bounded };
      });
    };

    const handleRotate = (key: keyof typeof images) => {
      setRotation((prev) => ({
        ...prev,
        [key]: ((prev[key] || 0) + 90) % 360,
      }));
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

    const openModalForSlot = (slotKey: keyof typeof images) => {
      setCurrentImageSlot(slotKey);
      setShowImageSourceModal(true);
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
        }
      } else if (source === "gallery") {
        setShowGallery(true);
      }
    };

    const handleGallerySelect = (url: string) => {
      if (currentImageSlot) {
        setImages((prev) => ({ ...prev, [currentImageSlot]: url }));
      }
      setShowGallery(false);
    };

    const renderImageSlot = (
      slotKey: keyof typeof images,
      fileRef: React.RefObject<HTMLInputElement | null>,
      label: string = "Click to upload image",
      containerClass: string = "w-full h-full",
    ) => (
      <div
        className={`relative group overflow-hidden select-none ${containerClass}`}
        onMouseDown={(e) => handleMouseDown(slotKey, e)}
        onMouseMove={(e) => handleMouseMove(slotKey, e)}
        onMouseUp={() => handleMouseUp(slotKey)}
        onMouseLeave={() => handleMouseLeave(slotKey)}
      >
        {images[slotKey] ? (
          <ImageEditor
            src={images[slotKey]!}
            scale={scale[slotKey]}
            position={position[slotKey]}
            rotation={rotation[slotKey]}
          />
        ) : (
          <div
            onClick={() => openModalForSlot(slotKey)}
            className="w-full h-full flex flex-col items-center justify-center bg-gray-100/70 border-2 border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-200/70 transition-all cursor-pointer p-3 text-center"
          >
            <span className="text-[11px] font-medium">{label}</span>
          </div>
        )}

        {/* Hover Controls */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleZoom(slotKey, "in");
            }}
            className="p-1 hover:bg-white/20 rounded text-white"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleZoom(slotKey, "out");
            }}
            className="p-1 hover:bg-white/20 rounded text-white"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRotate(slotKey);
            }}
            className="p-1 hover:bg-white/20 rounded text-white"
            title="Rotate"
          >
            <RotateCw size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModalForSlot(slotKey);
            }}
            className="p-1 hover:bg-white/20 rounded text-white"
            title="Edit Photo"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(slotKey, fileRef);
            }}
            className="p-1 hover:bg-red-500/80 rounded text-white"
            title="Delete Photo"
          >
            <Trash size={13} />
          </button>
        </div>

        <input
          type="file"
          ref={fileRef}
          onChange={(e) => handleImageChange(slotKey, e)}
          accept="image/*"
          className="hidden"
        />
      </div>
    );

    const renderFloralSVG = () => (
      <div className="absolute bottom-0 right-[-240px] z-[15]">
        <svg
          width="770"
          height="749"
          viewBox="0 0 770 749"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M764.289 4.73102C763.605 4.96702 762.858 4.60302 762.623 3.91902C762.387 3.23502 762.751 2.48902 763.436 2.25302C764.12 2.01702 764.866 2.38102 765.101 3.06502C765.337 3.74902 764.973 4.49502 764.289 4.73102ZM763.056 1.54802C762.672 1.68002 762.254 1.47502 762.122 1.09202C761.99 0.708021 762.194 0.290021 762.578 0.158021C762.961 0.026021 763.379 0.230021 763.511 0.613021C763.643 0.997021 763.439 1.41602 763.056 1.54802ZM768.113 2.37202C767.729 2.50502 767.311 2.30002 767.179 1.91702C767.046 1.53302 767.251 1.11502 767.634 0.983021C768.018 0.851021 768.436 1.05402 768.568 1.43902C768.7 1.82202 768.496 2.24002 768.113 2.37202ZM769.263 8.48702C768.879 8.61902 768.46 8.41502 768.328 8.03102C768.196 7.64802 768.4 7.23002 768.784 7.09702C769.168 6.96502 769.586 7.16902 769.718 7.55302C769.85 7.93602 769.646 8.35502 769.263 8.48702ZM767.013 6.53302C766.629 6.66502 766.21 6.46202 766.078 6.07802C765.946 5.69402 766.15 5.27602 766.534 5.14302C766.917 5.01102 767.336 5.21602 767.468 5.59902C767.6 5.98302 767.396 6.40102 767.013 6.53302ZM761.277 6.25802C760.894 6.39002 760.476 6.18602 760.343 5.80202C760.211 5.41802 760.415 5.00102 760.799 4.86802C761.182 4.73602 761.601 4.94002 761.733 5.32402C761.865 5.70702 761.661 6.12602 761.277 6.25802ZM764.799 9.82202C764.114 10.057 763.369 9.69302 763.133 9.00902C762.897 8.32502 763.261 7.57902 763.945 7.34402C764.63 7.10802 765.376 7.47102 765.612 8.15602C765.847 8.84002 765.483 9.58602 764.799 9.82202Z"
            fill="#A39885"
          />
          <path
            d="M642.198 202.015C641.868 202.129 641.508 201.953 641.394 201.622C641.281 201.292 641.456 200.932 641.786 200.819C642.117 200.705 642.477 200.88 642.59 201.211C642.704 201.541 642.529 201.901 642.198 202.015ZM639.854 199.973C639.605 200.059 639.335 199.927 639.25 199.679C639.164 199.431 639.296 199.161 639.545 199.076C639.792 198.99 640.062 199.122 640.148 199.37C640.233 199.618 640.101 199.888 639.854 199.973ZM644.983 200.505C644.736 200.59 644.465 200.458 644.38 200.21C644.295 199.963 644.427 199.692 644.674 199.607C644.922 199.522 645.193 199.653 645.278 199.901C645.363 200.149 645.231 200.419 644.983 200.505ZM642.521 198.768C642.273 198.853 642.004 198.721 641.918 198.473C641.833 198.225 641.964 197.955 642.212 197.87C642.461 197.784 642.73 197.916 642.815 198.164C642.901 198.412 642.77 198.682 642.521 198.768ZM640.473 201.842C640.225 201.928 639.955 201.796 639.87 201.548C639.785 201.3 639.916 201.03 640.164 200.945C640.412 200.859 640.682 200.991 640.767 201.239C640.852 201.487 640.721 201.757 640.473 201.842ZM643.679 202.199C643.431 202.284 643.161 202.152 643.076 201.905C642.99 201.656 643.122 201.386 643.37 201.301C643.618 201.216 643.888 201.347 643.974 201.595C644.059 201.843 643.927 202.113 643.679 202.199ZM643.554 200.398C643.223 200.512 642.864 200.336 642.75 200.006C642.636 199.675 642.811 199.316 643.142 199.202C643.472 199.088 643.833 199.263 643.946 199.594C644.06 199.924 643.884 200.285 643.554 200.398ZM641.45 200.118C641.12 200.231 640.759 200.056 640.645 199.725C640.532 199.395 640.708 199.035 641.038 198.921C641.368 198.807 641.728 198.983 641.842 199.313C641.956 199.644 641.78 200.004 641.45 200.118Z"
            fill="#A39885"
          />
          <path
            d="M589.798 27.6188C589.255 27.8058 588.663 27.5168 588.476 26.9738C588.289 26.4308 588.577 25.8378 589.12 25.6508C589.663 25.4638 590.256 25.7538 590.443 26.2968C590.63 26.8398 590.341 27.4318 589.798 27.6188ZM592.834 27.4098C592.561 27.5038 592.263 27.3588 592.169 27.0848C592.075 26.8118 592.22 26.5138 592.493 26.4198C592.766 26.3258 593.064 26.4718 593.158 26.7448C593.252 27.0178 593.107 27.3158 592.834 27.4098ZM587.837 29.5818C587.564 29.6758 587.267 29.5308 587.173 29.2578C587.079 28.9848 587.224 28.6868 587.497 28.5928C587.77 28.4988 588.067 28.6448 588.161 28.9178C588.255 29.1898 588.11 29.4878 587.837 29.5818ZM586.779 26.5088C586.306 26.6718 585.789 26.4208 585.626 25.9468C585.463 25.4728 585.715 24.9558 586.188 24.7928C586.662 24.6298 587.178 24.8828 587.341 25.3558C587.505 25.8298 587.252 26.3458 586.779 26.5088ZM592.271 25.4108C591.601 25.6418 590.871 25.2858 590.64 24.6148C590.409 23.9458 590.766 23.2148 591.436 22.9848C592.105 22.7538 592.835 23.1098 593.066 23.7798C593.297 24.4498 592.941 25.1798 592.271 25.4108Z"
            fill="#A39885"
          />
          <path
            opacity="0.199997"
            d="M396.216 396.287C388.434 399.12 390.069 410.568 389.312 417.31C389.293 417.465 389.344 417.605 389.454 417.723C389.568 417.831 389.72 417.884 389.878 417.859C391.242 417.669 394.567 417.119 397.86 415.92C401.282 414.675 404.671 412.727 405.785 409.751C407.66 404.766 405.665 395.29 399.38 395.666C398.181 395.739 397.133 395.953 396.216 396.287ZM226.09 466.151C222.973 467.286 220.937 470.439 221.618 474.656C222.585 480.693 228.982 483.591 230.173 484.079C230.251 484.111 230.335 484.112 230.41 484.084C230.449 484.07 230.486 484.049 230.517 484.02L235.033 480.059C239.529 474.609 238.258 468.741 232.238 466.379C230.038 465.513 227.885 465.498 226.09 466.151ZM386.187 415.214C386.151 415.227 386.117 415.245 386.085 415.268C385.908 415.399 385.865 415.648 385.996 415.824C386.103 415.969 386.292 416.017 386.454 415.958C386.49 415.945 386.525 415.926 386.557 415.903C386.734 415.772 386.769 415.527 386.645 415.347C386.532 415.205 386.347 415.156 386.187 415.214ZM383.856 416.581C383.794 416.603 383.735 416.635 383.681 416.675C383.373 416.903 383.306 417.335 383.534 417.643C383.722 417.895 384.046 417.986 384.326 417.884C384.387 417.861 384.446 417.83 384.502 417.789C384.809 417.561 384.876 417.129 384.648 416.822C384.461 416.569 384.136 416.479 383.856 416.581ZM386.108 417.156C386.04 417.181 385.974 417.215 385.912 417.259C385.559 417.521 385.483 418.021 385.745 418.375C385.958 418.659 386.333 418.761 386.653 418.645C386.722 418.619 386.789 418.584 386.851 418.537C387.207 418.283 387.282 417.782 387.021 417.429C386.805 417.137 386.432 417.038 386.108 417.156ZM388.379 418.737C388.344 418.749 388.311 418.767 388.28 418.79C388.104 418.921 388.063 419.176 388.194 419.353C388.301 419.497 388.49 419.545 388.652 419.487C388.688 419.473 388.722 419.455 388.755 419.431C388.932 419.3 388.967 419.055 388.836 418.878C388.734 418.73 388.543 418.677 388.379 418.737ZM386.493 419.549C386.409 419.58 386.328 419.623 386.252 419.678C385.814 420.003 385.73 420.615 386.045 421.049C386.312 421.405 386.772 421.531 387.173 421.385C387.258 421.354 387.34 421.311 387.417 421.256C387.847 420.933 387.939 420.318 387.624 419.885C387.357 419.529 386.892 419.404 386.493 419.549ZM389.208 420.672C389.092 420.714 388.997 420.797 388.936 420.911C388.849 421.083 388.859 421.271 388.967 421.431C391.443 424.991 393.578 426.931 398.34 428.853C400.983 429.922 403.416 429.855 405.375 429.142C409.193 427.752 411.207 423.911 409.451 421.261C407.165 417.809 405.717 415.388 401.661 416.864C401.007 417.102 400.283 417.442 399.478 417.896C398.379 418.517 397.298 419 396.269 419.374C393.271 420.466 390.707 420.64 389.378 420.642C389.318 420.643 389.261 420.653 389.208 420.672ZM243.365 475.867C238.399 477.675 232.755 483.143 234.184 488.501C234.211 488.599 234.28 488.674 234.377 488.713C234.458 488.751 234.536 488.752 234.611 488.725C234.628 488.718 234.646 488.71 234.664 488.701C234.864 488.589 235.061 488.5 235.259 488.428C237.952 487.448 240.778 489.759 251.758 487.48C253.49 487.121 255.01 486.693 256.333 486.211C264.371 483.285 265.04 478.41 260.966 475.256C256.24 471.584 252.644 472.727 243.648 475.768C243.554 475.8 243.46 475.833 243.365 475.867ZM467.58 395.258C463.219 396.846 464.082 402.853 465.13 408.772C466.733 417.875 473.185 424.235 476.974 422.855C476.977 422.854 476.981 422.853 476.984 422.852C476.988 422.85 476.992 422.849 476.996 422.847C480.365 421.621 489.949 421.623 492.123 421.645C492.163 421.646 492.202 421.639 492.237 421.626C492.296 421.605 492.348 421.566 492.39 421.515C492.453 421.434 492.474 421.334 492.445 421.229C490.928 415.259 497.287 404.038 480.017 397.264C473.817 394.832 469.936 394.401 467.58 395.258ZM229.233 485.734C229.137 485.769 229.049 485.831 228.981 485.917C228.79 486.169 228.835 486.519 229.079 486.712C229.241 486.834 229.442 486.86 229.616 486.797C229.714 486.761 229.803 486.697 229.872 486.606C230.065 486.361 230.021 486.012 229.776 485.819C229.613 485.695 229.409 485.67 229.233 485.734ZM231.636 484.918C231.54 484.953 231.452 485.014 231.384 485.101C231.194 485.353 231.238 485.702 231.483 485.895C231.644 486.018 231.845 486.043 232.019 485.98C232.117 485.944 232.206 485.881 232.275 485.79C232.468 485.545 232.424 485.195 232.179 485.002C232.016 484.879 231.812 484.854 231.636 484.918ZM231.292 486.503C231.163 486.551 231.045 486.634 230.955 486.752C230.707 487.075 230.762 487.545 231.088 487.801C231.304 487.965 231.579 487.999 231.815 487.913C231.942 487.867 232.057 487.786 232.146 487.673C232.399 487.34 232.337 486.872 232.011 486.617C231.801 486.452 231.528 486.418 231.292 486.503ZM228.955 487.41C228.828 487.456 228.713 487.537 228.624 487.651C228.371 487.984 228.426 488.454 228.759 488.706C228.969 488.871 229.239 488.907 229.472 488.822C229.601 488.775 229.718 488.692 229.807 488.574C230.062 488.248 230.005 487.771 229.682 487.523C229.465 487.359 229.19 487.324 228.955 487.41ZM228.409 489.474C228.313 489.509 228.226 489.57 228.157 489.656C227.964 489.901 228.011 490.258 228.256 490.451C228.416 490.57 228.619 490.593 228.794 490.529C228.891 490.494 228.979 490.433 229.048 490.346C229.241 490.101 229.197 489.751 228.952 489.558C228.789 489.435 228.585 489.41 228.409 489.474ZM230.806 488.977C230.676 489.024 230.557 489.107 230.467 489.223C230.211 489.548 230.274 490.016 230.599 490.271C230.816 490.435 231.091 490.47 231.326 490.384C231.453 490.338 231.569 490.257 231.658 490.144C231.911 489.811 231.848 489.343 231.523 489.088C231.313 488.923 231.041 488.891 230.806 488.977ZM232.645 488.347C232.548 488.382 232.46 488.444 232.392 488.53C232.208 488.78 232.252 489.13 232.497 489.323C232.654 489.447 232.856 489.472 233.03 489.409C233.128 489.373 233.216 489.31 233.282 489.22C233.476 488.975 233.431 488.626 233.187 488.432C233.028 488.307 232.823 488.282 232.645 488.347ZM230.27 490.886C230.174 490.921 230.086 490.983 230.019 491.072C229.832 491.315 229.877 491.664 230.122 491.857C230.28 491.983 230.482 492.008 230.658 491.945C230.754 491.91 230.841 491.848 230.909 491.762C231.102 491.517 231.056 491.16 230.811 490.967C230.65 490.848 230.446 490.822 230.27 490.886ZM343.388 457.878C339.36 459.345 339.167 462.263 337.037 467.366C334.468 473.501 332.695 481.137 337.396 479.426C338.501 479.024 339.964 478.105 341.859 476.528C347.446 471.877 349.091 470.101 350.565 469.565C351.715 469.147 352.761 469.483 355.493 469.796C357.124 469.982 358.887 469.632 360.715 468.967C365.678 467.161 371.113 463.029 375.629 461.022C375.75 460.969 375.824 460.85 375.825 460.717C375.824 460.576 375.742 460.465 375.614 460.412C373.024 459.436 364.018 456.399 352.64 456.686C348.209 456.796 345.346 457.166 343.388 457.878ZM378.525 459.706C378.306 459.785 378.106 459.926 377.953 460.126C377.516 460.684 377.62 461.493 378.177 461.93C378.541 462.209 379.004 462.267 379.402 462.122C379.623 462.041 379.824 461.899 379.979 461.698C380.415 461.14 380.312 460.33 379.754 459.894C379.391 459.618 378.926 459.56 378.525 459.706ZM473.115 425.569C472.356 425.846 471.595 426.181 470.84 426.583C460.684 431.983 462.582 446.579 474.241 448.732C477.706 449.369 480.389 449.197 482.517 448.422C487.557 446.588 489.483 441.374 491.265 435.516L491.948 428.015C491.957 427.878 491.89 427.762 491.774 427.696C490.418 426.929 481.779 422.416 473.115 425.569ZM495.031 418.633C494.883 418.687 494.748 418.782 494.644 418.916C494.343 419.3 494.417 419.846 494.791 420.142C495.037 420.332 495.354 420.371 495.628 420.271C495.778 420.217 495.915 420.121 496.021 419.985C496.314 419.605 496.241 419.058 495.86 418.765C495.618 418.573 495.303 418.534 495.031 418.633ZM383.547 460.216C383.327 460.296 383.127 460.436 382.972 460.633C382.539 461.198 382.64 462 383.204 462.435C383.566 462.717 384.028 462.775 384.429 462.629C384.648 462.549 384.847 462.409 385.001 462.213C385.436 461.648 385.335 460.845 384.776 460.409C384.416 460.126 383.95 460.069 383.547 460.216ZM377.583 463.801C377.218 463.934 376.884 464.168 376.627 464.496C375.904 465.432 376.07 466.776 377.006 467.499C377.611 467.97 378.383 468.065 379.05 467.823C379.417 467.689 379.752 467.453 380.008 467.121C380.734 466.192 380.566 464.841 379.63 464.118C379.025 463.651 378.251 463.558 377.583 463.801ZM492.123 422.914C491.858 423.011 491.616 423.18 491.43 423.418C490.905 424.099 491.028 425.076 491.71 425.601C492.146 425.942 492.71 426.011 493.198 425.833C493.464 425.737 493.707 425.567 493.895 425.329C494.419 424.647 494.297 423.67 493.616 423.145C493.175 422.806 492.609 422.737 492.123 422.914ZM496.365 421.906C496.216 421.96 496.08 422.055 495.975 422.187C495.675 422.57 495.749 423.117 496.13 423.41C496.372 423.606 496.684 423.644 496.956 423.545C497.107 423.49 497.246 423.393 497.353 423.256C497.649 422.882 497.572 422.329 497.198 422.033C496.952 421.843 496.637 421.807 496.365 421.906ZM383.07 464.01C382.703 464.144 382.369 464.378 382.114 464.709C381.391 465.645 381.563 466.987 382.492 467.712C383.096 468.179 383.872 468.275 384.54 468.032C384.906 467.899 385.239 467.665 385.495 467.334C386.224 466.395 386.052 465.054 385.116 464.331C384.516 463.862 383.739 463.766 383.07 464.01ZM501.457 422.263C501.307 422.317 501.17 422.412 501.065 422.544C500.772 422.925 500.838 423.474 501.22 423.767C501.466 423.961 501.78 423.999 502.051 423.901C502.201 423.846 502.338 423.749 502.443 423.613C502.743 423.23 502.672 422.691 502.288 422.39C502.047 422.199 501.73 422.163 501.457 422.263ZM375.94 468.342C375.931 468.346 375.922 468.349 375.913 468.354C374.029 469.12 364.443 473.006 356.645 475.844C355.665 476.2 354.713 476.541 353.809 476.856C353.763 476.872 353.718 476.888 353.672 476.904C344.84 480.12 340.055 494.705 347.353 507.918C351.57 515.564 359.759 518.105 366.332 515.712C371.173 513.951 375.138 509.511 375.99 502.463C377.328 491.417 379.708 479.351 376.353 468.559C376.329 468.468 376.27 468.398 376.18 468.356C376.098 468.319 376.022 468.312 375.94 468.342ZM497.655 425.431C497.389 425.528 497.146 425.699 496.959 425.941C496.425 426.618 496.555 427.592 497.229 428.119C497.67 428.46 498.237 428.531 498.724 428.353C498.989 428.257 499.23 428.087 499.415 427.847C499.939 427.166 499.816 426.189 499.135 425.665C498.701 425.324 498.14 425.255 497.655 425.431ZM387.212 466.843C386.991 466.924 386.789 467.067 386.634 467.268C386.197 467.826 386.3 468.635 386.866 469.07C387.225 469.347 387.691 469.405 388.091 469.259C388.31 469.18 388.509 469.039 388.66 468.84C389.096 468.283 388.993 467.473 388.435 467.036C388.076 466.755 387.613 466.698 387.212 466.843ZM494.477 428.455C494.329 428.509 494.194 428.604 494.09 428.739C493.796 429.12 493.864 429.668 494.244 429.962C494.49 430.152 494.807 430.191 495.08 430.092C495.228 430.038 495.364 429.942 495.467 429.808C495.761 429.427 495.694 428.878 495.312 428.584C495.067 428.395 494.75 428.356 494.477 428.455ZM381.652 470.52C381.432 470.601 381.23 470.743 381.076 470.944C380.639 471.502 380.743 472.311 381.3 472.748C381.664 473.024 382.128 473.079 382.528 472.934C382.747 472.854 382.947 472.714 383.102 472.516C383.539 471.959 383.435 471.149 382.878 470.712C382.514 470.433 382.051 470.375 381.652 470.52ZM500.449 428.259C500.299 428.313 500.163 428.409 500.058 428.544C499.765 428.925 499.832 429.473 500.213 429.767C500.459 429.957 500.776 429.995 501.048 429.896C501.197 429.842 501.333 429.747 501.436 429.612C501.737 429.229 501.663 428.682 501.282 428.389C501.04 428.198 500.723 428.159 500.449 428.259ZM390.134 473.213C390.063 473.239 390.008 473.287 389.971 473.356C380.946 488.804 373.663 494.471 388.322 509.614C393.574 515.039 397.309 516.586 399.813 515.675C403.458 514.348 404.49 507.807 403.784 500.44C402.375 485.59 392.363 475.136 390.485 473.285C390.409 473.213 390.315 473.181 390.211 473.194C390.184 473.198 390.157 473.204 390.134 473.213ZM271.65 523.786C267.681 525.23 268.47 530.693 269.42 536.075C270.883 544.362 276.748 550.149 280.201 548.892C280.203 548.892 280.205 548.891 280.207 548.89C280.211 548.889 280.215 548.887 280.219 548.886C283.286 547.77 291.999 547.772 293.98 547.79C294.018 547.789 294.053 547.783 294.085 547.771C294.136 547.753 294.181 547.719 294.219 547.67C294.276 547.599 294.301 547.507 294.273 547.409C292.888 541.981 298.674 531.767 282.967 525.612C277.325 523.4 273.793 523.007 271.65 523.786ZM305.253 512.27C293.254 516.638 293.992 527.968 296.806 534.623C299.201 540.29 299.568 545.59 299.624 547.181C299.629 547.288 299.679 547.378 299.771 547.427C299.849 547.473 299.93 547.485 300.008 547.456C300.026 547.45 300.045 547.44 300.063 547.429L313.086 540.479C330.174 531.8 318.682 507.852 305.954 512.028C305.715 512.106 305.482 512.187 305.253 512.27ZM296.619 545.048C296.484 545.097 296.361 545.183 296.266 545.305C296.001 545.65 296.059 546.153 296.405 546.418C296.63 546.593 296.917 546.628 297.164 546.538C297.3 546.488 297.423 546.401 297.517 546.279C297.789 545.93 297.726 545.438 297.378 545.166C297.154 544.994 296.867 544.958 296.619 545.048ZM293.981 548.943C293.739 549.031 293.517 549.188 293.347 549.408C292.873 550.021 292.981 550.912 293.604 551.392C294.001 551.699 294.516 551.762 294.959 551.601C295.201 551.513 295.421 551.359 295.59 551.142C296.063 550.521 295.954 549.63 295.334 549.159C294.936 548.847 294.423 548.782 293.981 548.943ZM297.833 548.029C297.698 548.078 297.576 548.163 297.483 548.285C297.211 548.633 297.277 549.133 297.622 549.397C297.847 549.573 298.134 549.608 298.381 549.518C298.517 549.468 298.641 549.381 298.735 549.258C298.999 548.912 298.941 548.411 298.595 548.145C298.371 547.974 298.082 547.938 297.833 548.029ZM302.474 548.348C302.338 548.398 302.214 548.485 302.12 548.608C301.848 548.955 301.914 549.455 302.259 549.72C302.484 549.895 302.768 549.931 303.015 549.842C303.151 549.792 303.275 549.704 303.372 549.581C303.637 549.236 303.578 548.733 303.233 548.469C303.008 548.293 302.721 548.258 302.474 548.348ZM299.012 551.236C298.769 551.325 298.548 551.48 298.377 551.698C297.895 552.314 298.01 553.202 298.626 553.684C299.023 553.992 299.538 554.055 299.981 553.893C300.223 553.806 300.443 553.652 300.612 553.435C301.092 552.811 300.976 551.923 300.363 551.448C299.965 551.137 299.454 551.075 299.012 551.236ZM313.175 546.967C309.737 548.219 306.576 550.006 302.611 552.193C302.528 552.239 302.476 552.325 302.461 552.421C302.447 552.518 302.482 552.613 302.555 552.678C306.791 556.578 312.525 565.806 318.093 566.173C319.697 566.277 321.494 565.931 323.277 565.282C327.112 563.886 330.878 561.088 332.487 558.358C335.627 553.036 336.526 544.734 324.895 544.963C320.079 545.049 316.498 545.758 313.175 546.967ZM296.121 553.985C295.987 554.034 295.864 554.12 295.771 554.241C295.499 554.59 295.565 555.089 295.91 555.354C296.13 555.531 296.416 555.567 296.665 555.477C296.801 555.427 296.926 555.339 297.023 555.214C297.288 554.869 297.222 554.369 296.877 554.105C296.657 553.931 296.368 553.895 296.121 553.985ZM301.559 553.806C301.422 553.856 301.297 553.944 301.2 554.068C300.933 554.406 300.991 554.909 301.339 555.181C301.563 555.352 301.852 555.385 302.102 555.294C302.238 555.245 302.362 555.159 302.459 555.039C302.724 554.694 302.658 554.194 302.31 553.922C302.087 553.752 301.805 553.717 301.559 553.806ZM299.662 556.683C299.626 556.696 299.593 556.715 299.564 556.741C297.956 558.165 284.881 570.269 294.879 578.725C298.799 582.039 302.309 582.41 305.14 581.379C309.997 579.612 312.857 573.714 312.354 571.452C310.567 563.462 306.523 560.34 299.906 556.699C299.829 556.659 299.74 556.654 299.662 556.683ZM255.914 618.258C252.531 619.489 249.043 623.069 240.628 629.651C225.338 641.623 239.336 652.304 255.548 656.215C261.437 657.636 265.874 657.382 269.385 656.104C275.539 653.864 278.845 648.478 282.119 643.462C285.018 639.033 290.729 635.16 295.171 632.621C303.381 627.922 301.115 627.243 295.08 625.842C285.566 623.647 275.959 622.724 266.641 619.585C261.377 617.813 258.681 617.251 255.914 618.258ZM376.898 589.645C370.326 592.038 364.426 597.422 366.687 603.909C372.529 620.641 391.72 611.762 403.359 609.844C403.412 609.835 403.462 609.822 403.511 609.805C403.685 609.741 403.826 609.62 403.914 609.451C404.034 609.232 404.047 608.995 403.947 608.765C402.188 604.754 394.748 589.175 385.072 588.36C382.609 588.151 379.693 588.628 376.898 589.645ZM311.173 614.824C310.643 615.017 310.16 615.357 309.79 615.835C308.738 617.191 308.992 619.142 310.344 620.187C311.215 620.868 312.338 621.004 313.306 620.651C313.836 620.458 314.32 620.119 314.691 619.643C315.742 618.288 315.489 616.337 314.144 615.289C313.268 614.609 312.143 614.472 311.173 614.824ZM302.95 620.61C302.539 620.76 302.164 621.022 301.876 621.391C301.062 622.443 301.255 623.952 302.307 624.766C302.982 625.293 303.852 625.4 304.603 625.126C305.013 624.977 305.388 624.714 305.676 624.345C306.49 623.293 306.298 621.784 305.253 620.968C304.573 620.442 303.702 620.337 302.95 620.61ZM309.467 624.152C308.937 624.345 308.454 624.685 308.084 625.163C307.032 626.518 307.276 628.465 308.631 629.517C309.504 630.192 310.626 630.33 311.594 629.977C312.125 629.784 312.61 629.444 312.982 628.964C314.037 627.616 313.784 625.665 312.431 624.62C311.56 623.938 310.436 623.799 309.467 624.152ZM304.131 630.653C303.72 630.802 303.345 631.066 303.057 631.438C302.244 632.49 302.436 633.999 303.48 634.815C304.159 635.339 305.027 635.446 305.777 635.173C306.189 635.023 306.566 634.758 306.855 634.384C307.671 633.339 307.476 631.823 306.431 631.007C305.753 630.486 304.882 630.379 304.131 630.653ZM318.175 628.103C317.645 628.296 317.161 628.635 316.792 629.114C315.74 630.469 315.983 632.416 317.338 633.468C318.212 634.147 319.33 634.283 320.297 633.931C320.829 633.738 321.316 633.396 321.689 632.914C322.742 631.56 322.491 629.615 321.146 628.568C320.27 627.888 319.144 627.75 318.175 628.103ZM310.113 635.169C309.943 635.231 309.783 635.327 309.638 635.456C302.757 641.616 295.318 648.545 291.489 657.017C287.762 665.243 286.313 675.732 287.187 684.711C288.403 697.203 305.553 702.8 314.152 700.817C314.567 700.721 314.989 700.594 315.42 700.437C323.925 697.342 335.153 682.945 333.778 678.819C332.326 674.487 336.722 656.413 324.869 649.777C316.46 645.069 313.155 639.095 311.947 636.003C311.767 635.554 311.412 635.242 310.93 635.128C310.646 635.06 310.368 635.076 310.113 635.169ZM320.693 636.768C320.281 636.918 319.904 637.184 319.616 637.557C318.8 638.602 318.992 640.111 320.044 640.924C320.719 641.452 321.59 641.561 322.342 641.288C322.751 641.139 323.126 640.875 323.413 640.504C324.226 639.452 324.034 637.943 322.99 637.127C322.311 636.602 321.443 636.496 320.693 636.768ZM406.185 609.688C406.08 609.726 405.983 609.793 405.909 609.888C405.699 610.155 405.742 610.547 406.019 610.761C406.193 610.898 406.417 610.924 406.61 610.854C406.715 610.815 406.812 610.748 406.886 610.653C407.101 610.376 407.05 609.988 406.776 609.78C406.603 609.644 406.378 609.617 406.185 609.688ZM408.618 610.789C408.358 610.884 408.121 611.05 407.938 611.285C407.422 611.946 407.54 612.908 408.209 613.421C408.635 613.753 409.187 613.819 409.663 613.646C409.924 613.551 410.163 613.384 410.345 613.15C410.861 612.489 410.735 611.529 410.074 611.014C409.643 610.682 409.092 610.616 408.618 610.789ZM405.068 612.813C404.856 612.89 404.662 613.027 404.513 613.221C404.093 613.756 404.194 614.533 404.729 614.953C405.08 615.223 405.526 615.278 405.912 615.138C406.121 615.061 406.313 614.927 406.462 614.738C406.879 614.195 406.779 613.417 406.243 612.998C405.895 612.729 405.451 612.674 405.068 612.813ZM401.831 614.471C401.724 614.51 401.627 614.578 401.552 614.671C401.342 614.939 401.395 615.335 401.67 615.543C401.842 615.678 402.063 615.705 402.254 615.636C402.362 615.597 402.459 615.527 402.534 615.428C402.744 615.16 402.694 614.772 402.426 614.562C402.253 614.425 402.026 614.4 401.831 614.471ZM405.083 616.682C404.899 616.749 404.733 616.867 404.605 617.034C404.238 617.508 404.326 618.182 404.79 618.545C405.095 618.781 405.483 618.829 405.819 618.707C406.005 618.639 406.175 618.52 406.306 618.35C406.669 617.886 406.581 617.212 406.114 616.842C405.809 616.609 405.419 616.56 405.083 616.682ZM545.377 345.269C545.553 344.474 545.801 343.329 546.501 342.102C546.844 341.495 547.333 341.01 547.939 340.69C547.341 342.245 546.433 343.788 545.377 345.269ZM577.029 318.537C576.909 318.572 576.786 318.601 576.661 318.621C577.076 318.462 577.347 318.222 577.52 317.943C578.247 317.728 578.973 317.555 579.701 317.432C578.97 317.706 578.272 318.093 577.624 318.345C577.504 318.367 577.385 318.399 577.268 318.442C577.21 318.463 577.152 318.487 577.095 318.513L577.029 318.537ZM352.019 310.375C351.909 309.842 351.79 309.312 351.67 308.775C352.014 309.38 352.068 309.917 352.019 310.375ZM0.136719 353.958C12.0027 387.565 44.4957 411.919 76.2667 425.529C80.5947 427.376 84.9367 429.194 89.2807 430.995C125.334 445.912 163.171 459.889 193.898 484.621C199.422 488.816 204.748 493.225 209.926 497.796C209.429 498.483 208.999 499.221 208.662 499.984C205.846 501.218 202.941 502.398 199.975 503.477C192.119 506.336 183.831 508.497 175.596 509.136C175.779 508.521 174.542 507.268 175.858 505.543C176.123 505.197 176.518 504.912 177.038 504.698L177.066 504.547L176.887 504.421C176.431 504.373 175.813 504.367 175.278 504.562C174.73 504.762 174.27 505.172 174.168 505.967C174.165 505.843 174.159 505.713 174.163 505.587L174.173 505.525C174.205 505.339 174.213 505.153 174.198 504.976C174.432 503.038 175.608 500.45 172.432 498.914C171.289 498.36 170.325 498.293 169.603 498.556C168.606 498.919 168.07 499.911 168.158 501.118C167.85 501.172 167.554 501.246 167.293 501.341C167.032 501.436 166.804 501.552 166.63 501.69C165.498 502.576 164.469 505.318 165.919 506.743C166.971 507.764 168.44 508.65 169.861 509.014C170.403 509.157 170.97 509.208 171.535 509.21L171.452 509.323C167.186 509.381 162.954 508.985 158.833 508.026C149.636 505.857 140.25 509.605 128.301 505.513C124.101 504.085 119.73 502.485 115.423 501.403C117.457 505.074 124.192 506.436 127.965 506.965C131.024 507.38 134.068 507.984 137.09 508.662C142.926 509.928 151.561 513.472 157.566 511.71C157.847 511.708 158.2 511.696 158.518 511.68C174.751 510.764 192.39 511.68 207.982 506.197C208.209 507.094 208.594 507.993 209.157 508.876C211.988 513.293 217.447 513.745 221.603 512.232C222.499 511.906 223.334 511.489 224.07 511C233.836 520.597 243.143 530.669 252.332 540.874C258.04 547.221 263.45 553.752 268.729 560.337C267.939 565.585 271.091 571.208 277.709 572.43C277.947 572.468 278.177 572.509 278.398 572.545C281.829 576.904 285.252 581.241 288.718 585.537C287.816 585.592 286.952 585.591 286.159 585.489C285.104 585.359 284.039 585.526 282.984 585.91C278.626 587.495 274.434 592.797 271.824 596.323C268.592 600.705 265.414 614.092 280.292 617.625C286.907 619.198 289.729 619.127 291.452 618.5C292.249 618.21 292.811 617.801 293.404 617.379C293.997 616.957 294.624 616.522 295.553 616.184C296.194 615.951 296.978 615.764 297.995 615.659L310.191 613.513C310.219 613.509 310.246 613.503 310.271 613.494C310.367 613.459 310.44 613.385 310.484 613.29C310.538 613.163 310.531 613.032 310.459 612.925C309.959 612.144 309.005 610.481 308.295 608.122C313.03 613.095 317.984 617.872 323.242 622.388C323.097 622.881 323.23 623.406 323.601 623.786C326.248 626.494 330.991 632.038 333.252 638.957C336.496 648.851 333.922 667.161 354.072 665.734C356.979 665.53 359.555 664.984 361.798 664.168C368.599 661.692 372.341 656.735 372.999 651.334C390.911 657.816 409.841 661.412 428.893 663.15C459.567 666.692 487.403 679.897 509.996 700.86C526.797 716.594 540.249 735.36 551.835 755.187L567.703 749.411C555.148 727.038 539.735 706.237 520.284 689.364C510.454 680.937 499.792 673.876 488.471 668.243C460.483 643.187 456.043 634.319 457.643 625.728C458.491 626.324 459.51 627.116 460.469 628.288C461.144 629.114 461.541 630.091 461.587 631.154C461.595 631.268 461.713 631.341 461.886 631.337C461.946 631.335 462.005 631.324 462.059 631.304C462.153 631.27 462.231 631.211 462.263 631.141C462.898 629.78 463.014 628.707 462.845 627.855C463.852 628.385 464.896 628.811 465.98 629.073C468.819 629.751 472.227 629.575 475.026 628.747C475.116 628.72 475.206 628.691 475.293 628.659C478.951 627.328 479.619 621.753 478.489 619.203C478.129 618.396 477.32 617.543 476.343 616.778C478.541 613.252 476.89 609.126 470.862 608.91C469.518 608.862 468.417 609.032 467.508 609.363C463.684 610.754 463.236 615.002 462.107 617.93C461.925 618.228 461.763 618.561 461.645 618.92L461.607 619.042C461.482 619.271 461.362 619.489 461.232 619.702C461.771 618.284 461.42 617.182 460.712 616.335C463.129 609.598 465.558 600.614 463.052 584.919C462.198 579.489 461.122 573.542 459.132 568.417C458.494 573.833 459.806 580.177 461.616 585.284C471.752 614.003 431.538 617.94 475.991 662.716C460.099 656.512 438.701 635.064 433.914 616.527C439.428 612.617 438.487 603.181 432.476 600.135C432.44 596.75 432.531 593.369 432.732 589.997C435.69 583.537 438.395 576.978 441.593 570.63C444.022 565.8 449.596 554.748 454.752 552.481C458.154 550.985 461.532 549.424 464.926 547.881C474.469 543.494 482.198 536.103 490.549 529.898C494.293 527.106 498.221 523.566 500.62 519.519C496.973 522.6 493.51 526.004 490.03 529.272C483.764 535.134 476.056 538.953 468.685 543.239C468.577 543.146 468.466 543.07 468.351 543.003C468.835 542.67 469.272 542.294 469.653 541.857C470.659 540.693 471.414 539.047 471.711 537.535C472.125 535.432 469.59 533.671 468.086 533.579C467.732 533.554 467.307 533.643 466.863 533.805C466.323 534.001 465.756 534.305 465.257 534.642C464.133 533.875 463.072 533.727 462.276 534.016C461.288 534.376 460.706 535.411 460.91 536.781C461.305 539.487 460.997 539.234 460.762 540.116C460.647 540.532 461.019 540.846 461.529 541.108C461.08 541.288 460.678 541.576 460.381 541.833C460.323 541.879 460.289 541.967 460.3 542.046L460.417 542.161C461.002 542.031 461.513 542.045 461.949 542.194C464.175 542.92 463.775 544.836 464.368 545.184C464.451 545.24 464.563 545.23 464.706 545.178C464.899 545.107 465.148 544.961 465.463 544.794C465.78 544.627 466.166 544.435 466.623 544.269C466.831 544.193 467.054 544.123 467.29 544.063C466.166 544.738 465.058 545.416 463.963 546.129C460.87 548.128 457.641 549.918 454.281 551.439C447.215 554.667 436.96 574.061 433.618 580.719C434.531 573.757 435.995 566.844 438.073 560.022C443.936 541.231 453.857 524.161 464.668 507.823C465.926 507.405 467.179 506.969 468.426 506.515C476.909 503.428 485.124 499.506 492.854 494.896C499.34 491.008 505.798 486.496 511.108 480.975C511.949 481.732 513.191 482.817 514.226 484.542C514.767 485.458 515.022 486.479 514.918 487.539C514.909 487.65 515.017 487.743 515.19 487.763C515.275 487.772 515.361 487.761 515.432 487.735C515.501 487.71 515.557 487.671 515.587 487.619C516.419 486.37 516.685 485.317 516.636 484.454C517.554 485.125 518.528 485.701 519.564 486.106C522.275 487.187 525.68 487.502 528.567 487.082C528.884 487.037 529.186 486.961 529.471 486.857C532.811 485.641 534.07 480.67 533.364 478.141C533.119 477.283 532.445 476.324 531.586 475.424C534.273 472.261 533.224 467.94 527.297 466.857C525.554 466.541 524.178 466.658 523.063 467.063C519.768 468.263 518.761 471.991 517.34 474.519C517.109 474.794 516.905 475.101 516.731 475.447L516.672 475.56C516.522 475.764 516.37 475.961 516.21 476.16C516.617 475.43 516.742 474.745 516.676 474.13C516.951 473.722 517.217 473.31 517.474 472.9C518.887 470.849 520.357 468.835 521.878 466.853L530.104 455.626C532.953 451.738 538.645 443.401 543.478 441.642C543.588 441.602 543.698 441.565 543.809 441.532C543.813 441.53 543.817 441.529 543.821 441.527C545.559 440.895 551.575 435.305 553.007 433.913C555.981 431.011 560.752 427.049 561.772 422.797C559.036 426.601 555.658 429.941 552.316 433.201C551.277 434.227 544.608 440.51 543.631 440.998C543.385 441.056 543.144 441.129 542.906 441.216C542.035 441.533 541.22 442.024 540.462 442.542C539.136 443.44 537.915 444.466 536.736 445.543C528.083 453.337 522.077 462.219 516.362 472.217C516.281 472.362 516.199 472.5 516.116 472.639C515.492 471.678 514.47 470.945 513.666 470.473C513.561 470.413 513.406 470.399 513.272 470.447C513.258 470.452 513.244 470.458 513.231 470.465C513.09 470.533 513.039 470.643 513.101 470.745C513.697 471.699 513.991 472.622 514.008 473.489C514.102 477.924 510.435 478.395 510.171 479.679C510.148 479.82 510.191 479.962 510.299 480.122C499.778 490.852 482.74 498.069 469.387 502.929C468.737 503.166 468.098 503.396 467.467 503.621C477.396 488.809 487.795 473.783 496.865 458.094C499.674 459.393 502.218 459.357 504.397 458.564C509.734 456.621 512.875 450.141 512.324 447.657C511.348 443.286 509.758 440.242 507.513 437.794C507.937 436.884 508.353 435.968 508.764 435.046C511.909 438.528 515.299 441.631 518.633 441.847C520.395 441.962 522.372 441.582 524.332 440.869C528.547 439.335 532.684 436.261 534.452 433.264C537.905 427.413 538.889 418.29 526.107 418.531C521.504 418.62 517.927 419.224 514.67 420.251C515.797 417 516.835 413.714 517.749 410.382C522.989 405.376 523.559 398.381 521.451 392.568C521.543 391.953 521.625 391.334 521.702 390.724C522.244 386.439 522.548 382.208 522.649 378.009C527.675 369.907 532.281 361.127 539.041 354.388C542.925 350.54 548.307 344.693 549.694 338.962C551.7 330.663 548.559 332.281 556.018 329.084C561.711 326.646 567.525 322.303 573.245 319.599C573.29 320.064 573.31 320.622 573.214 321.247C573.139 321.772 572.915 322.253 572.528 322.626L572.567 322.803L572.767 322.871C572.841 322.849 572.911 322.825 572.98 322.8C573.573 322.584 573.948 322.291 574.18 321.984C574.32 322.531 574.522 323.063 574.793 323.555C575.5 324.835 576.72 326.044 577.972 326.809C578.691 327.244 579.522 327.211 580.291 326.931C581.383 326.534 582.346 325.637 582.682 324.871C582.864 324.456 582.907 323.867 582.863 323.243C583.055 323.208 583.238 323.158 583.41 323.096C585.076 322.489 585.708 320.645 583.93 318.551C583.299 317.8 582.664 317.4 582.041 317.22C582.463 317.216 582.876 317.231 583.29 317.272C587.181 317.636 589.686 316.999 591.996 316.158C592.52 315.967 593.034 315.766 593.552 315.564C594.086 315.355 594.623 315.145 595.18 314.942C596.538 314.448 598.006 314.004 599.815 313.758C602.625 313.375 605.571 312.909 608.318 312.241C605.694 311.352 602.183 312.115 599.626 312.963C594.856 314.558 589.859 315.005 584.853 315.108C583.034 315.13 580.566 315.746 577.752 316.687C577.716 316.293 577.602 315.911 577.49 315.603L577.323 315.464L577.182 315.532C577.111 316.09 576.926 316.539 576.66 316.885C576.579 316.981 576.503 317.067 576.426 317.153C576.234 317.221 576.041 317.29 575.847 317.361C575.315 317.554 574.774 317.759 574.23 317.969C573.85 317.957 573.533 317.917 573.322 317.993C573.276 318.01 573.236 318.032 573.2 318.061C573.116 318.125 573.095 318.249 573.096 318.415C565.883 321.29 557.7 325.285 552.603 327.14C552.446 327.197 552.291 327.252 552.139 327.305C554.286 320.193 556.355 313.002 559.13 306.109C559.899 304.409 570.572 292.648 569.823 288.193C569.105 290.806 565.873 295.305 564.29 297.576C563.462 298.767 559.057 304.998 558.604 305.852C555.193 313.416 550.934 320.616 549.556 328.927C549.13 331.591 548.793 334.272 548.738 336.976C548.714 338.048 548.486 339.136 548.111 340.228L547.956 340.144C547.245 340.086 546.675 340.161 546.214 340.312C546.306 339.515 546.317 338.721 546.206 337.939C545.92 335.85 544.902 333.579 543.604 331.907C542.345 330.274 539.952 330.292 538.132 330.955C537.355 331.237 536.683 331.637 536.247 332.076C535.487 332.843 534.983 334.472 534.787 335.964C534.55 336.025 534.324 336.095 534.112 336.173C530.694 337.417 530.358 340.629 533.075 342.378C536.226 344.413 535.685 344.502 536.387 345.542C536.699 346.01 537.296 345.936 537.981 345.686C538.021 345.672 538.061 345.657 538.102 345.641C537.881 346.269 537.821 346.948 537.816 347.481C537.811 347.583 537.871 347.702 537.966 347.759C538.025 347.802 538.083 347.814 538.127 347.798C538.151 347.789 538.172 347.771 538.186 347.745C538.579 347.021 539.059 346.514 539.598 346.193C539.886 346.022 540.163 345.892 540.425 345.796C542.387 345.082 543.678 346.249 544.511 346.407C542.425 349.052 539.932 351.422 537.909 353.147C531.793 358.372 526.976 365.201 522.678 372.133C522.336 350.033 517.007 328.885 512.874 307.144C513.047 306.615 513.271 306.044 513.581 305.457C513.997 304.683 514.613 304.068 515.397 303.691C515.482 303.652 515.504 303.528 515.444 303.408C515.388 303.279 515.272 303.188 515.171 303.184C514.361 303.146 513.712 303.246 513.195 303.435C512.924 303.533 512.689 303.656 512.486 303.795C512.569 302.86 512.56 301.924 512.405 301.017C512.187 299.709 511.717 298.351 511.08 297.079C510.609 294.21 510.175 291.327 509.784 288.429C505.905 255.72 526.679 231.035 525.008 200.946C521.817 221.922 511.808 241.126 508.854 262.09C507.645 270.888 507.271 279.764 508.05 288.619C508.234 290.289 508.428 291.963 508.619 293.63C507.143 292.501 504.96 292.607 503.204 293.246C502.238 293.598 501.4 294.111 500.88 294.669C500.376 295.201 499.986 296.091 499.717 297.086C498.84 296.943 498.016 297.01 497.306 297.269C495.27 298.009 494.179 300.322 495.496 303.773C497.55 309.19 501.957 307.644 505.16 307.542C505.449 307.586 505.754 307.6 506.076 307.574L506.19 307.566C506.396 307.582 506.596 307.609 506.797 307.635C506.433 307.65 506.113 307.712 505.832 307.814C504.109 308.442 503.854 310.551 503.875 311.865C503.875 311.981 503.945 312.105 504.053 312.173C504.118 312.222 504.182 312.236 504.231 312.218C504.261 312.207 504.286 312.184 504.302 312.149C504.724 311.323 505.254 310.723 505.861 310.336C506.228 310.104 506.578 309.933 506.914 309.811C508.495 309.235 509.712 309.765 510.617 310.142C513.633 334.84 516.525 359.401 515.691 384.413C512.709 382.108 509.046 381.107 505.292 382.34C505.028 382.427 504.768 382.517 504.514 382.609C491.329 387.408 492.137 399.861 495.232 407.179C497.864 413.407 498.27 419.225 498.326 420.974C498.334 421.088 498.388 421.193 498.491 421.246C498.581 421.299 498.674 421.308 498.765 421.275C498.78 421.269 498.795 421.263 498.81 421.255L511.943 414.24C511.273 416.943 510.521 419.601 509.681 422.225C507.154 423.41 504.586 424.844 501.613 426.491C501.515 426.543 501.463 426.628 501.444 426.735C501.435 426.847 501.469 426.942 501.548 427.021C502.947 428.306 504.495 430.119 506.14 432.038C505.694 433.139 505.242 434.225 504.773 435.31C503.014 433.948 500.972 432.722 498.639 431.445C498.551 431.395 498.455 431.39 498.367 431.422C498.33 431.435 498.295 431.455 498.262 431.482C496.49 433.05 482.123 446.354 493.116 455.646C493.414 455.894 493.707 456.128 493.994 456.348C484.4 472.626 472.71 487.963 461.333 503.428C439.126 533.676 423.425 561.208 423.393 599.445C421.145 588.474 421.078 577.15 423.353 565.895C427.178 549.058 428.525 531.578 424.804 514.597C422.23 502.889 417.436 492.595 411.713 482.806C415.705 476.335 414.21 468.621 402.536 457.933C397.737 453.539 394.209 451.924 391.618 451.721C389.935 449.06 388.283 446.371 386.701 443.624C385.734 441.948 384.777 440.278 383.825 438.598C385.182 438.989 386.673 438.967 387.999 438.485C389.685 437.871 391.103 436.512 391.636 434.309C393.227 427.748 388.125 423.956 386.655 423.02C386.519 422.937 386.357 422.924 386.216 422.976C386.135 423.005 386.062 423.055 386.003 423.124C384.078 425.437 380.824 428.366 379.82 431.382C378.904 429.688 378.003 427.989 377.117 426.284C379.87 424.717 382.677 422 384.479 420.58C384.598 420.495 384.661 420.373 384.667 420.23C384.68 420.083 384.635 419.959 384.538 419.853C383.124 418.34 377.939 413.249 373.294 414.524C373.941 413.815 374.561 413.074 375.15 412.32C377.626 413.828 380.55 414.624 383.315 415.67C383.43 415.709 383.547 415.709 383.658 415.669C383.683 415.66 383.709 415.648 383.734 415.634C383.872 415.559 383.956 415.445 383.984 415.294C384.384 413.221 385.508 406.082 382.817 401.977C382.498 401.487 382.124 401.008 381.702 400.555C383.83 395.494 385.523 390.192 387.447 385.23C387.517 385.055 387.588 384.863 387.638 384.704C389.742 381.628 389.325 376.097 389.682 372.561C389.857 370.736 390.071 368.905 390.402 367.098C390.796 364.869 391.263 360.811 389.568 358.985C389.38 361.621 389.48 364.384 389.518 367.021C389.632 374.523 385.79 379.145 385.325 384.739C384.889 389.841 383.043 394.767 380.454 399.365C377.757 397.105 374.114 395.706 371.734 396.572C370.654 396.965 369.835 397.823 369.481 399.279C368.33 404.06 369.606 407.176 372.603 410.298C371.921 411.094 371.231 411.869 370.532 412.621C361.952 393.088 358.836 377.906 357.005 360.71L357.049 360.694C357.053 360.692 357.056 360.692 357.06 360.69C357.627 360.484 357.434 358.59 358.675 356.397C359.062 355.724 359.611 355.2 360.321 354.892C360.391 354.858 360.411 354.751 360.364 354.644C360.321 354.526 360.218 354.448 360.131 354.438C359.423 354.388 358.852 354.463 358.392 354.613C358.484 353.816 358.491 353.016 358.384 352.241C358.101 350.142 357.079 347.88 355.781 346.209L355.702 346.105C355.337 341.428 354.985 336.513 354.573 331.271C354.354 328.476 354.129 325.692 353.88 322.907C353.569 319.473 353.093 315.974 352.432 312.468C352.985 312.55 353.776 312.668 354.644 313.092C355.127 313.323 355.515 313.68 355.763 314.155C355.785 314.197 355.84 314.214 355.903 314.191C355.913 314.187 355.925 314.182 355.936 314.175C356.014 314.139 356.064 314.07 356.067 314.011C356.067 313.255 355.887 312.739 355.628 312.393C356.202 312.417 356.771 312.384 357.321 312.276C357.674 312.202 358.031 312.099 358.387 311.969C359.475 311.573 360.541 310.937 361.369 310.204C362.889 308.853 361.998 306.062 360.918 305.126C360.579 304.834 360.027 304.62 359.418 304.476C359.66 302.484 358.161 300.994 355.563 301.94C355.462 301.976 355.361 302.016 355.257 302.06C352.01 303.433 353.048 306.08 353.182 308.024C353.165 308.205 353.165 308.388 353.185 308.58L353.192 308.644C353.188 308.77 353.177 308.899 353.163 309.02C353.076 307.847 352.181 307.466 351.347 307.363C347.591 291.682 340.049 276.391 327.428 266.711C335.072 275.843 341.048 285.872 344.977 297.145C348.363 306.904 351.039 320.876 352.512 331.473C353.066 335.94 353.424 340.437 353.692 344.943C352.589 344.709 351.349 344.876 350.301 345.257C349.526 345.539 348.857 345.938 348.424 346.378C347.662 347.138 347.161 348.773 346.962 350.258C346.729 350.319 346.508 350.388 346.299 350.464C342.873 351.711 342.533 354.929 345.252 356.679C348.4 358.707 347.866 358.794 348.565 359.844C348.876 360.311 349.473 360.238 350.158 359.988C350.198 359.974 350.238 359.958 350.279 359.943C350.059 360.571 349.999 361.25 349.99 361.776C349.988 361.884 350.046 361.996 350.144 362.06C350.201 362.098 350.257 362.109 350.3 362.093C350.325 362.084 350.347 362.066 350.361 362.04C350.757 361.323 351.234 360.808 351.773 360.487C352.06 360.316 352.334 360.187 352.597 360.091C353.254 359.852 353.838 359.826 354.353 359.905C354.906 374.185 355.573 388.457 359.424 402.233C362.807 414.702 367.919 426.533 374.644 437.478C370.028 437.28 364.309 439.578 357.615 440.428C355.843 440.65 354.257 441.043 352.856 441.553C345.233 444.327 343.092 450.572 346.467 451.821C350.469 453.297 364.313 449.953 371.563 451.244C377.001 452.214 379.671 455.67 380.673 457.349C380.742 457.474 380.88 457.532 381.02 457.506C381.038 457.502 381.056 457.497 381.072 457.491C381.185 457.45 381.263 457.35 381.277 457.229C381.633 454.74 382.318 451.849 382.601 449.046C383.865 450.712 385.133 452.37 386.413 454.039C385.409 455.343 385.073 456.703 385.076 456.711C388.513 464.008 389.759 463.048 396.531 468.302C402.395 472.853 400.522 490.648 405.882 488.697C406.469 488.483 407.144 488.032 407.924 487.301C408.396 486.863 408.836 486.429 409.261 485.975C414.574 495.05 418.77 504.705 420.774 515.416C423.758 531.785 421.519 548.484 417.158 564.395C415.759 569.931 414.871 575.504 414.499 581.081C411.616 576.839 406.781 575.001 403.254 576.285C402.843 576.434 402.45 576.626 402.08 576.861C400.16 574.669 398.246 572.49 396.404 570.303C391.67 564.716 384.847 561.882 379.137 557.513C376.579 555.553 373.242 553.644 370.061 553.007C372.592 555.077 375.755 556.783 378.668 558.257C383.395 560.674 386.974 564.621 390.786 568.269C390.285 568.011 389.255 567.738 388.205 566.883C387.767 566.526 387.458 566.065 387.318 565.519C387.304 565.457 387.229 565.435 387.146 565.457C387.131 565.459 387.116 565.463 387.102 565.469C387.035 565.493 386.98 565.543 386.971 565.594C386.85 566.105 386.826 566.52 386.878 566.867C386.313 566.707 385.752 566.603 385.181 566.587C384.071 566.55 382.855 566.778 381.754 567.179C381.321 567.337 380.905 567.521 380.519 567.727C378.626 568.732 378.873 571.807 379.754 573.041C380.211 573.68 381.32 574.24 382.366 574.557C382.572 576.918 384.103 577.943 385.569 577.409C385.987 577.257 386.401 576.977 386.778 576.566C388.031 575.193 388.429 574.946 388.823 574.803C388.882 574.781 388.942 574.762 389.004 574.741C389.057 574.725 389.112 574.708 389.171 574.687C389.254 574.656 389.345 574.619 389.449 574.571C389.85 574.392 389.849 573.911 389.727 573.348C390.154 573.583 390.639 573.706 391.023 573.783L391.236 573.705L391.251 573.542C390.787 573.179 390.472 572.77 390.307 572.339C389.462 570.155 391.204 569.255 391.096 568.572L391.093 568.565C392.313 569.724 393.568 570.845 394.891 571.876C396.253 572.926 397.546 574.059 398.786 575.252C399.585 576.033 400.351 576.834 401.094 577.644C400.978 577.76 400.87 577.875 400.761 578.006C395.88 583.679 392.609 587.063 399.953 594.368C405.396 599.781 407.57 605.661 408.334 608.332C408.414 608.619 408.629 608.823 408.924 608.882C409.071 608.912 409.214 608.902 409.345 608.854C409.472 608.808 409.588 608.726 409.683 608.614C412.13 605.638 413.83 603.05 415.001 599.899L415.273 600.506C415.516 602.112 415.792 603.715 416.122 605.307C414.292 607.742 413.393 610.246 413.041 611.404C412.931 611.785 413.117 612.182 413.474 612.344C415.029 613.031 416.768 613.953 418.608 614.852C419.414 617.384 420.334 619.891 421.362 622.374C421.713 623.202 422.077 624.017 422.452 624.819C418.97 621.143 413.335 617.894 410.309 615.697C410.127 615.564 409.918 615.515 409.702 615.561C409.658 615.569 409.615 615.58 409.575 615.594C409.411 615.654 409.283 615.767 409.185 615.923C407.328 618.991 400.761 631.011 407.734 637.113C410.865 639.854 414.963 640.03 418.438 638.765C421.786 637.546 424.556 634.991 425.328 632.106C425.462 631.608 425.521 631.104 425.497 630.606C430.604 639.365 437.328 646.929 444.562 654.158C439.67 653.363 434.719 652.797 429.714 652.466C415.555 651.797 401.358 650.135 387.563 646.906C388.782 646.715 389.9 646.432 390.932 646.056C394.902 644.611 397.602 641.81 399.956 637.768C403.167 632.278 402.903 625.778 403.441 619.518C403.454 619.28 403.377 619.068 403.216 618.901C403.047 618.731 402.834 618.65 402.593 618.671C400.607 618.841 395.731 619.398 391.082 621.091C388.053 622.193 385.121 623.777 383.145 626.049C378.744 631.099 376.648 640.519 379.683 644.863C376.821 644.053 373.989 643.164 371.179 642.202C370.063 640.116 368.455 638.141 366.353 636.406C354.251 626.372 356.38 626.103 353.779 621.193C352.585 618.951 350.148 619.169 347.37 620.18C345.993 620.682 344.532 621.378 343.096 622.065C341.661 622.749 340.249 623.429 338.974 623.893C338.475 624.074 337.997 624.223 337.547 624.326C337.135 624.426 336.724 624.484 336.322 624.522C332.482 621.8 328.807 618.892 325.281 615.847C325.981 616.082 326.736 616.397 327.547 616.8C330.784 618.397 333.299 618.578 335.484 617.783C339.214 616.425 341.984 612.225 345.747 607.367C351.726 599.667 346.61 601.313 343.65 585.716C340.682 570.122 328.118 575.592 322.245 576.966C321.952 577.034 321.663 577.121 321.379 577.224C315.987 579.186 312.426 587.118 312.638 590.174C312.862 593.391 311.173 600.735 316.373 606.211C317.324 607.203 317.892 608.259 318.175 609.311C314.519 605.749 311.014 602.031 307.629 598.187C308.316 591.881 309.924 585.571 305.29 584.159C302.726 583.371 299.525 583.773 296.288 584.353C293.036 580.119 289.875 575.795 286.765 571.427C290.242 569.339 291.766 565.104 293.191 560.414L293.813 553.584C293.827 553.463 293.769 553.35 293.666 553.296C292.426 552.594 284.567 548.488 276.684 551.357C275.992 551.609 275.3 551.914 274.612 552.281C274.346 552.419 274.094 552.569 273.843 552.726C269.562 546.442 265.291 540.162 260.934 534.013C255.798 526.794 250.28 519.921 244.385 513.401C245.609 513.489 246.678 513.347 247.574 513.021C250.292 512.032 251.419 509.349 250.473 506.251C248.786 500.75 250.006 498.304 249.25 495.953C248.735 494.354 246.838 494.347 244.546 494.259C240.655 494.114 237.073 492.651 233.391 491.482C233.318 491.462 233.242 491.465 233.173 491.49C233.155 491.496 233.137 491.504 233.12 491.514C233.033 491.57 232.986 491.646 232.964 491.745C232.755 492.976 232.159 497.114 232.674 501.38C231.312 500.081 229.931 498.797 228.53 497.529C228.651 495.326 228.693 493.25 228.863 491.618C228.873 491.531 228.848 491.44 228.789 491.37C228.731 491.3 228.651 491.263 228.557 491.256C227.671 491.196 225.119 491.103 221.611 491.507C220.954 490.957 220.297 490.407 219.628 489.87C222.922 488.671 226.063 487.76 227.195 487.448C227.204 487.445 227.213 487.442 227.221 487.439C227.314 487.405 227.386 487.337 227.42 487.241C227.449 487.139 227.444 487.033 227.377 486.941L223.061 480.653C218.483 473.986 214.062 474.623 207.132 475.351C206.285 475.439 205.461 475.638 204.675 475.924C203.864 476.22 203.091 476.607 202.37 477.059C201.688 476.601 200.999 476.146 200.31 475.69C190.065 468.951 191.381 469.029 180.202 464.133L171.297 454.298C169.066 452.368 166.949 450.455 164.91 448.506C165.715 448.012 166.765 447.364 168.132 446.866C168.462 446.746 168.81 446.635 169.178 446.536C170.255 446.253 171.35 446.295 172.371 446.704C172.408 446.717 172.448 446.715 172.487 446.701C172.559 446.674 172.631 446.604 172.679 446.5C172.744 446.335 172.734 446.148 172.65 446.054C171.987 445.282 171.343 444.768 170.729 444.452C171.633 443.74 172.459 442.95 173.144 442.069C174.999 439.658 176.294 436.345 176.703 433.338C177.276 429.158 172.112 425.995 169.138 425.973C168.587 425.972 167.956 426.113 167.294 426.354C166.099 426.789 164.804 427.549 163.701 428.383C161.523 427.078 159.523 426.86 158.016 427.408C155.972 428.151 154.839 430.307 155.407 433.08C156.23 437.051 156.074 437.764 155.791 438.631C154.823 437.43 153.875 436.197 152.941 434.908C150.243 432.243 147.964 429.109 146.32 425.687C143.198 419.279 136.468 415.465 133.832 408.748C132.73 405.926 130.856 402.354 128.527 400.36C128.622 403.449 130.651 407.131 132.551 409.497C137.044 415.106 137.978 422.924 143.389 427.884C146.22 430.459 148.754 433.333 151.225 436.264C152.595 438.499 153.834 440.739 155.079 442.928L154.949 443.051C154.846 443.154 154.786 443.334 154.818 443.489C154.842 443.646 154.94 443.735 155.051 443.695C155.195 443.659 155.323 443.62 155.463 443.595C158.588 449.054 161.85 454.18 167.444 458.184C142.265 447.21 115.49 439.409 90.6957 427.805C74.4967 419.934 53.5417 408.378 39.6837 397.878C23.6887 385.729 10.7557 370.945 0.136719 353.958Z"
            fill="white"
          />
          <path
            d="M490.992 629.204C485.885 619.238 480.088 609.826 471.47 602.405C466.531 598.205 461.177 594.689 455.499 591.89C449.12 586.222 443.322 579.849 439.486 572.154C438.845 570.854 438.267 569.523 437.775 568.159C435.742 562.577 432.002 557.583 431.03 551.635C430.592 548.919 430.042 545.943 429.035 543.378C428.726 546.094 429.396 549.265 430.31 551.821C432.349 557.527 432.862 563.731 436.125 568.967C440.335 575.682 444.233 582.979 449.238 589.145C441.892 586.308 434.1 584.603 426.042 584.099C412.155 583.498 398.177 580.992 385.814 574.382C365.563 563.432 354.212 543.185 341.283 525.101C333.011 513.555 322.726 503.743 310.813 496.008C294.04 484.952 273.895 480.613 255.823 472.238C247.697 468.327 237.178 462.58 230.217 457.349C222.185 451.295 215.681 443.917 210.327 435.43C216.335 452.239 232.653 464.372 248.594 471.126C250.765 472.044 252.942 472.945 255.123 473.839C280.124 484.08 295.799 489.466 316.281 507.599C308.32 511.279 298.755 514.263 290.101 512.284C285.492 511.214 280.798 513.107 274.807 511.085C272.7 510.375 270.506 509.583 268.349 509.051C269.375 510.886 272.749 511.555 274.638 511.81C276.175 512.014 277.698 512.311 279.212 512.643C282.14 513.264 286.469 515.023 289.476 514.131C289.615 514.131 289.794 514.123 289.95 514.114C299.427 513.543 309.868 514.217 318.505 509.603C325.002 515.563 331.047 522.003 336.992 528.555C352.463 545.62 363.58 565.454 384.115 577.405C396.78 584.768 411.15 588.188 425.647 589.452C435.264 590.526 444.331 593.496 452.552 598.129C421.864 588.303 395.74 593.809 365.745 603.835C332.48 614.995 299.295 627.487 263.825 618.808C262.859 618.566 261.895 618.319 260.934 618.061C232.938 610.794 207.604 597.779 181.374 585.985C174.472 583.079 167.254 581.093 159.885 579.799C142.307 576.767 124.317 579.853 106.667 577.009C130.376 586.099 155.533 575.791 180.775 587.329C202.677 597.72 221.956 611.566 244.61 619.235C237.941 620.895 231.22 623.002 225.454 626.558C221.414 629.061 214.519 632.524 209.689 631.086C207.509 630.436 205.268 630.013 203.02 629.669C195.999 628.632 189.127 630.197 182.18 630.986C181.379 631.129 175.242 633.054 174.074 633.413C171.843 634.096 167.399 635.533 165.121 635.432C168.504 637.186 180.691 631.651 182.251 631.474C188.491 631.02 194.796 631.215 201.055 631.322C196.611 637.196 184.756 648.715 182.845 654.427C181.474 658.415 179.825 662.308 177.319 665.73C175.98 667.563 174.465 670.179 174.497 672.516C175.745 670.48 176.877 668.238 177.906 666.081C180.262 661.147 183.534 660.261 184.984 653.73C186.614 646.444 196.036 641.167 201.484 634.897C205.974 629.73 203.861 631.837 211.042 632.363C215.994 632.725 222.071 629.913 226.159 627.79C233.308 624.102 241.538 622.667 249.331 620.726C252.725 621.72 256.199 622.568 259.775 623.236C295.352 629.947 330.62 618.489 364.322 608.809C355.306 620.567 341.539 636.834 326.535 639.947C317.038 641.953 308.367 644.487 299.884 649.417C298.72 650.087 297.576 650.805 296.521 651.638C295.744 652.242 294.974 652.926 294.462 653.778C293.818 654.442 287.058 658.171 285.971 658.745C282.492 660.58 278.942 662.431 275.19 663.648C278.864 663.923 283.266 661.119 286.359 659.48C287.851 658.688 293.91 655.284 294.846 654.062C297.3 650.51 305.741 648.009 309.68 646.697L320.812 642.987C322.788 642.281 324.782 641.617 326.793 641.015C335.87 638.714 343.841 633.017 350.781 626.929C357.313 621.173 363.272 614.681 368.417 607.641C384.307 603.174 400.556 599.612 417.145 599.747C423.152 599.84 429.076 600.445 434.896 601.509C428.696 602.476 410.495 605.708 406.081 610.547C403.995 612.844 401.728 614.976 399.327 616.941C392.588 622.461 386.779 629.232 379.092 633.514C375.573 635.466 371.948 637.366 368.536 639.497C372.404 638.619 376.254 636.376 379.458 634.092C386.59 628.992 394.506 624.693 400.487 618.165C402.598 615.845 404.721 613.536 406.797 611.187C409.942 607.639 420.246 606.013 424.747 605.311C430.664 604.377 436.626 603.897 442.568 603.188C448.415 604.679 454.146 606.624 459.74 608.967C474.948 615.334 488.799 640.953 489.766 656.627C465.294 609.426 451.778 640.676 431.348 625.142C427.712 622.378 422.967 619.694 418.452 618.81C422.055 621.726 426.55 624.122 430.684 626.206C467.113 644.658 465.21 610.264 490.99 668.063C492.593 678.592 495.509 688.969 499.738 699.024C509.421 721.67 524.492 741.449 541.77 758.852L556.065 753.649C538.569 735.884 522.337 716.394 511.609 693.732C500.613 670.204 497.188 644.474 502.247 618.945C507.585 595.051 509.402 570.265 504.03 546.209C495.295 507.2 469.134 479.29 449.624 445.803C442.138 432.939 434.879 419.971 428.621 406.521C440.411 395.013 444.635 377.923 450.367 363.013C450.461 362.767 450.563 362.485 450.635 362.261C453.594 357.893 452.974 350.055 453.464 345.043C453.701 342.446 453.999 339.852 454.454 337.284C455.004 334.124 455.646 328.373 453.223 325.794C452.981 329.523 453.136 333.446 453.204 337.186C453.402 347.824 447.98 354.389 447.355 362.325C446.132 377.212 436.485 391.036 426.537 401.935C423.992 396.203 421.641 390.375 419.543 384.426C407.615 353.405 406.151 319.45 403.467 286.687C403.142 282.735 402.804 278.785 402.434 274.838C399.702 245.837 388.533 213.498 364.625 195.32C375.516 208.22 384.047 222.401 389.675 238.361C394.527 252.184 398.4 271.975 400.543 286.996C403.468 309.881 402.827 333.37 405.148 356.395C402.596 348.447 396.946 343.796 391.74 337.733C390.026 335.004 388.371 332.23 387.038 329.291C384.447 323.674 378.418 320.912 375.076 315.858C373.668 313.73 371.233 311.15 368.784 310.281C369.779 312.664 372.162 315.085 374.146 316.699C378.854 320.539 380.18 326.923 384.518 331.078C386.836 333.279 388.765 335.912 390.207 338.764C394.829 345.077 397.975 351.309 401.037 358.491L406.633 368.168C407.686 378.392 407.957 377.316 410.725 387.275C417.125 410.3 427.588 431.796 441.904 450.93C464.34 480.858 491.045 509.352 498.316 547.397C502.638 570.586 499.555 594.277 493.46 616.858C492.439 620.958 491.617 625.078 490.992 629.204Z"
            fill="#765E44"
          />
          <path
            d="M493.112 517.177C490.693 517.545 487.356 517.321 485.547 514.013C482.494 508.429 476.17 507.893 473.645 506.883C471.121 505.872 463.185 506.831 460.572 511.187C457.958 515.543 450.335 524.22 462.081 530.612C473.827 537.005 471.196 540.687 478.912 537.879C486.629 535.07 492.375 533.841 491.164 525.702C490.469 521.036 491.869 518.881 493.358 517.765C493.481 517.673 493.523 517.515 493.464 517.374C493.405 517.234 493.262 517.154 493.112 517.177ZM497.862 501.701L493 510.936C492.947 511.037 492.855 511.099 492.743 511.11C492.63 511.122 492.528 511.079 492.456 510.992C491.577 509.929 488.811 506.987 484.068 505.586C478.219 503.856 470.638 504.232 470.71 499.439C470.781 494.647 475.854 488.942 476.71 484.431C477.565 479.92 484.743 477.194 489.09 475.725C493.435 474.257 504.998 475.156 503.999 488.004C503.001 500.852 500.275 496.168 497.862 501.701ZM512.198 503.801C515.38 500.891 519.957 497.308 524.257 496.126C531.902 494.025 540.296 492.107 541.332 478.092C542.368 464.076 537.409 450.091 523.867 459.278C510.324 468.465 508.938 467.152 509.087 477.554C509.206 485.835 507.469 493.786 506.786 501.984C506.353 507.188 506.317 509.179 512.198 503.801ZM510.593 518.133C512.755 519.898 516.706 524.089 518.313 532.046C520.579 543.268 536.218 544.395 539.321 546.675C542.424 548.955 558.207 542.984 562.019 536.596C565.831 530.208 565.753 515.006 556.044 510.812C549.067 507.798 540.277 506.264 532.716 507.131C524.935 508.024 517.463 512.205 510.749 516.14C510.393 516.347 510.182 516.686 510.15 517.096C510.118 517.506 510.275 517.873 510.593 518.133ZM497.79 524.336C499.279 527.154 502.506 532.391 507.475 535.991C514.574 541.135 529.926 543.788 523.597 559.587C517.268 575.386 501.829 574.187 496.898 561.889C491.968 549.59 491.202 551.233 487.935 547.876C484.667 544.519 492.366 539.444 494.627 535.666C496.89 531.888 494.978 527.69 495.515 524.69C495.608 524.17 496.003 523.784 496.525 523.702C497.048 523.62 497.542 523.868 497.79 524.336Z"
            fill="#D6E2ED"
          />
          <path
            d="M502.89 512.24C504.246 511.747 505.745 512.446 506.239 513.802C506.732 515.158 506.033 516.657 504.677 517.151C503.322 517.644 501.822 516.945 501.329 515.589C500.835 514.233 501.534 512.733 502.89 512.24ZM501.463 506.29C502.514 505.908 503.677 506.45 504.06 507.501C504.443 508.553 503.9 509.716 502.849 510.099C501.797 510.481 500.635 509.939 500.252 508.887C499.869 507.836 500.411 506.673 501.463 506.29ZM509.218 509.823C510.269 509.441 511.432 509.983 511.815 511.034C512.198 512.086 511.655 513.249 510.604 513.631C509.552 514.014 508.389 513.472 508.006 512.421C507.623 511.369 508.166 510.206 509.218 509.823ZM509.86 524.684C510.911 524.301 512.074 524.843 512.457 525.896C512.839 526.947 512.297 528.11 511.246 528.493C510.194 528.876 509.031 528.333 508.649 527.282C508.266 526.23 508.808 525.067 509.86 524.684ZM503.818 520.245C505.173 519.751 506.673 520.45 507.166 521.806C507.659 523.162 506.96 524.661 505.605 525.155C504.249 525.648 502.75 524.949 502.256 523.593C501.763 522.237 502.462 520.738 503.818 520.245ZM494.968 511.208C496.323 510.715 497.823 511.414 498.317 512.77C498.81 514.125 498.11 515.625 496.755 516.118C495.399 516.612 493.899 515.913 493.406 514.557C492.913 513.201 493.612 511.702 494.968 511.208Z"
            fill="#A39885"
          />
          <path
            d="M347.909 530.617C347.907 530.617 337.478 529.904 344.393 544.947C351.307 559.991 358.588 561.276 366.568 556.836C374.548 552.396 356.635 549.32 354.26 542.796C351.791 536.01 352.879 535.255 347.909 530.617ZM359.816 539.23C359.776 539.151 359.776 539.066 359.814 538.987C359.852 538.907 359.918 538.854 360.005 538.835C374.723 535.575 381.145 531.195 389.515 546.852C396.882 560.632 387.839 561.048 378.174 556.898C366.625 551.938 360.813 541.216 359.816 539.23ZM359.607 526.268C360.847 524.788 367.769 516.499 372.122 510.727C376.919 504.369 389.941 504.241 398.708 513.543C407.474 522.844 400.804 537.783 386.957 535.116C377.749 533.344 367.452 532.147 359.66 526.675L359.545 526.484C359.534 526.403 359.555 526.33 359.607 526.268ZM353.32 523.983C353.201 521.653 353.084 513.65 356.244 504.591C360.005 493.805 361.935 495.409 368.831 494.821C375.728 494.232 384.152 495.202 374.943 501.052C365.734 506.903 367.058 505.075 366.027 510.255C365.023 515.299 357.598 519.902 353.804 524.153C353.728 524.239 353.613 524.269 353.505 524.231C353.396 524.193 353.325 524.098 353.32 523.983ZM349.557 527.25C349.637 527.34 349.65 527.465 349.591 527.57C349.533 527.675 349.42 527.729 349.302 527.709C344.269 526.845 336.888 526.92 335.163 521.584C333.504 516.456 338.588 511.531 341.915 504.394C346.011 495.611 353.776 494.8 353.932 498.39C354.087 501.98 347.834 512.22 347.004 518.375C346.382 522.986 348.47 526.018 349.557 527.25Z"
            fill="#D6E2ED"
          />
          <path
            d="M356.334 525.85C355.398 526.191 354.915 527.225 355.256 528.161C355.597 529.097 356.631 529.58 357.568 529.239C358.503 528.899 358.986 527.863 358.645 526.927C358.304 525.992 357.27 525.509 356.334 525.85ZM355.089 530.307C354.154 530.648 353.671 531.683 354.011 532.619C354.352 533.554 355.387 534.038 356.323 533.697C357.259 533.356 357.741 532.321 357.401 531.385C357.06 530.449 356.025 529.967 355.089 530.307ZM352.484 525.786C351.922 525.99 351.633 526.611 351.838 527.173C352.042 527.734 352.662 528.024 353.224 527.819C353.785 527.615 354.075 526.994 353.871 526.433C353.666 525.871 353.045 525.581 352.484 525.786ZM360.359 531.077C359.798 531.281 359.508 531.901 359.712 532.463C359.917 533.024 360.538 533.314 361.099 533.11C361.66 532.905 361.95 532.284 361.746 531.723C361.541 531.161 360.92 530.872 360.359 531.077ZM351.599 529.946C351.038 530.15 350.748 530.771 350.953 531.333C351.157 531.895 351.778 532.183 352.339 531.979C352.9 531.775 353.19 531.154 352.986 530.593C352.781 530.031 352.16 529.742 351.599 529.946ZM355.976 534.59C355.415 534.795 355.125 535.416 355.33 535.978C355.534 536.539 356.155 536.828 356.717 536.624C357.278 536.42 357.567 535.799 357.363 535.238C357.158 534.676 356.538 534.386 355.976 534.59Z"
            fill="#A39885"
          />
          <path
            d="M280.347 622.256L290.164 612.738C290.236 612.669 290.264 612.577 290.243 612.48C290.222 612.384 290.159 612.31 290.066 612.278C288.677 611.778 284.113 609.957 279.795 606.24C274.625 601.788 264.562 597.87 257.277 607.91C249.992 617.951 267.855 634.864 280.347 622.256ZM292.2 607.474C292.174 607.559 292.115 607.621 292.031 607.652C291.948 607.683 291.863 607.674 291.787 607.627C287.387 604.866 276.745 607.08 275.761 591.482C274.753 575.513 281.928 578.859 288.826 582.498C295.725 586.137 299.167 592.957 297.07 595.641C295.215 598.015 292.747 605.72 292.2 607.474ZM303.555 610.354C310.889 610.468 317.258 610.016 318.537 600.104C319.815 590.192 308.594 584.915 301.647 591.665C295.229 597.902 296.86 607.351 297.146 608.754C297.168 608.864 297.248 608.945 297.358 608.97L303.555 610.354ZM298.516 614.932C300.229 613.916 314.605 605.815 319.227 617.029C324.146 628.961 310.796 632.093 307.868 630.376C301.326 626.54 299.714 622.089 298.385 615.223C298.363 615.106 298.413 614.993 298.516 614.932ZM294.085 616.42C296.326 621.258 302.839 628.93 301.584 633.945C300.447 638.492 294.811 643.477 290.623 644.425C285.038 645.691 277.464 644.128 280.951 633.935C283.888 625.349 287.645 621.992 293.643 616.335C293.709 616.271 293.795 616.247 293.885 616.264C293.976 616.281 294.046 616.336 294.085 616.42Z"
            fill="#D6E2ED"
          />
          <path
            d="M294.404 612.456C295.084 612.208 295.837 612.559 296.084 613.239C296.332 613.919 295.981 614.671 295.3 614.919C294.621 615.166 293.868 614.815 293.621 614.136C293.373 613.456 293.724 612.703 294.404 612.456ZM295.692 615.617C296.074 615.478 296.496 615.676 296.635 616.057C296.773 616.438 296.576 616.86 296.195 616.998C295.814 617.137 295.392 616.941 295.253 616.559C295.115 616.178 295.311 615.756 295.692 615.617ZM290.622 614.881C291.003 614.742 291.425 614.939 291.564 615.32C291.703 615.702 291.506 616.123 291.125 616.262C290.743 616.401 290.322 616.205 290.183 615.823C290.044 615.442 290.241 615.02 290.622 614.881ZM289.365 608.787C289.747 608.648 290.169 608.845 290.308 609.227C290.447 609.608 290.25 610.029 289.868 610.168C289.487 610.307 289.065 610.111 288.927 609.729C288.788 609.348 288.985 608.926 289.365 608.787ZM291.649 610.702C292.031 610.563 292.453 610.759 292.592 611.141C292.73 611.522 292.534 611.944 292.152 612.083C291.771 612.222 291.349 612.025 291.21 611.643C291.072 611.262 291.269 610.84 291.649 610.702ZM297.389 610.877C297.77 610.738 298.192 610.935 298.33 611.316C298.469 611.698 298.273 612.119 297.891 612.258C297.51 612.396 297.088 612.2 296.95 611.819C296.811 611.438 297.007 611.015 297.389 610.877ZM293.805 607.375C294.486 607.127 295.238 607.478 295.485 608.158C295.733 608.839 295.382 609.59 294.702 609.838C294.022 610.085 293.27 609.735 293.022 609.055C292.774 608.375 293.125 607.623 293.805 607.375Z"
            fill="#A39885"
          />
          <path
            d="M405.288 416.259L409.632 413.656C409.725 413.6 409.776 413.503 409.767 413.395C409.679 412.311 409.001 406.432 404.414 404.102C399.352 401.531 394.684 405.053 395.032 410.492C395.381 415.93 399.758 418.464 405.288 416.259ZM408.852 406.805C404.682 401.414 406.331 398.031 408.694 392.661C411.057 387.29 418.93 385.193 419.663 387.997C420.396 390.801 424.742 398.527 421.154 401.848C418.026 404.742 414.173 410.453 413.235 411.871C413.184 411.949 413.105 411.993 413.013 411.996C412.921 411.999 412.84 411.961 412.783 411.888L408.852 406.805ZM415.94 413.946L415.974 414.161L416.153 414.286C420.61 415.221 428.693 418.474 432.578 415.704C436.045 413.231 438.621 407.215 435.076 402.922C430.444 397.315 421.708 401.262 419.183 405.924C417.072 409.819 416.177 413.005 415.94 413.946ZM415.195 417.608C417.244 417.903 428.611 419.867 429.72 427.23C430.941 435.326 426.311 438.163 422.327 435.391C418.343 432.618 416.071 432.966 414.383 431.757C413.227 430.928 413.713 429.413 414.234 427.546C415.117 424.389 414.87 421.137 414.878 417.882C414.879 417.799 414.911 417.728 414.974 417.673L415.195 417.608ZM412.278 417.751C412.352 417.798 412.396 417.871 412.404 417.96C412.413 418.048 412.382 418.127 412.317 418.188C410.268 420.111 411.932 422.757 406.934 431.589C401.736 440.774 396.482 440.575 394.755 435.83C393.028 431.085 394.868 428.496 399.627 422.062C402.287 418.466 408.272 415.177 412.278 417.751Z"
            fill="#D6E2ED"
          />
          <path
            d="M413.033 413.071C413.361 412.952 413.724 413.121 413.843 413.45C413.963 413.778 413.794 414.14 413.466 414.26C413.137 414.38 412.774 414.21 412.655 413.882C412.535 413.554 412.704 413.191 413.033 413.071ZM415.413 415.072C415.659 414.982 415.932 415.108 416.022 415.355C416.111 415.602 415.984 415.874 415.737 415.964C415.491 416.053 415.219 415.926 415.129 415.68C415.039 415.433 415.167 415.161 415.413 415.072ZM410.275 414.63C410.521 414.54 410.793 414.667 410.883 414.913C410.973 415.16 410.845 415.432 410.599 415.522C410.353 415.611 410.08 415.484 409.991 415.238C409.901 414.992 410.028 414.72 410.275 414.63ZM412.766 416.324C413.013 416.234 413.285 416.361 413.375 416.608C413.464 416.854 413.338 417.126 413.091 417.216C412.844 417.306 412.573 417.178 412.483 416.932C412.393 416.686 412.52 416.413 412.766 416.324ZM414.761 413.213C415.007 413.124 415.279 413.251 415.369 413.497C415.458 413.744 415.332 414.016 415.085 414.106C414.839 414.196 414.567 414.068 414.477 413.822C414.388 413.575 414.514 413.303 414.761 413.213ZM411.549 412.913C411.795 412.824 412.068 412.95 412.157 413.197C412.247 413.444 412.12 413.716 411.874 413.805C411.627 413.895 411.355 413.768 411.265 413.522C411.175 413.275 411.303 413.003 411.549 412.913ZM411.705 414.711C412.034 414.592 412.397 414.761 412.516 415.089C412.636 415.418 412.467 415.78 412.138 415.9C411.81 416.02 411.447 415.851 411.327 415.522C411.208 415.194 411.377 414.831 411.705 414.711ZM413.814 414.955C414.142 414.836 414.506 415.005 414.625 415.333C414.745 415.662 414.575 416.025 414.247 416.144C413.918 416.264 413.556 416.095 413.436 415.766C413.317 415.438 413.486 415.075 413.814 414.955Z"
            fill="#A39885"
          />
          <path
            d="M473.337 586.396C474.402 583.834 478.351 575.223 484.263 572.686C491.238 569.693 503.461 572.07 500.795 579.41C498.587 585.488 494.912 587.966 489.338 589.198C484.105 590.357 478.957 588.473 473.797 587.287C473.601 587.242 473.452 587.125 473.36 586.947C473.268 586.77 473.261 586.581 473.337 586.396ZM465.04 584.926C465.197 585.065 465.39 585.118 465.596 585.079C465.802 585.04 465.963 584.92 466.059 584.734C470.594 575.892 482.662 562.778 470.738 553.783C464.153 548.815 455.095 557.727 453.527 564.529C451.692 572.5 462.278 582.483 465.04 584.926ZM463.563 588.334C463.772 588.472 463.879 588.699 463.852 588.948C463.826 589.198 463.674 589.397 463.441 589.49C458.151 591.586 454.42 592.155 447.814 590.802C437.015 588.59 435.373 576.902 441.181 574.447C446.989 571.991 450.553 570.24 454.517 578.01C457.459 583.779 461.615 587.038 463.563 588.334ZM464.814 592.906C462.531 592.863 454.206 593.301 451.189 601.632C448.033 610.342 460.209 616.314 465.176 609.288C467.95 605.361 465.97 598.235 465.454 593.491C465.419 593.161 465.147 592.912 464.814 592.906ZM469.431 590.973C469.245 591.017 469.103 591.126 469.009 591.291C468.917 591.458 468.9 591.637 468.959 591.818C470.565 596.691 472.618 607.819 478.258 608.094C483.382 608.343 489.542 601.586 486.807 595.265C483.707 588.102 472.376 590.273 469.431 590.973Z"
            fill="#D6E2ED"
          />
          <path
            d="M468.468 586.527C469.008 586.331 469.605 586.609 469.801 587.149C469.998 587.688 469.72 588.286 469.18 588.483C468.64 588.679 468.043 588.4 467.846 587.86C467.65 587.321 467.928 586.723 468.468 586.527ZM465.436 586.789C465.708 586.691 466.007 586.83 466.106 587.102C466.205 587.373 466.066 587.674 465.794 587.773C465.523 587.871 465.223 587.731 465.124 587.459C465.025 587.188 465.165 586.888 465.436 586.789ZM470.394 584.53C470.666 584.431 470.966 584.571 471.064 584.842C471.163 585.113 471.023 585.414 470.752 585.513C470.481 585.612 470.181 585.471 470.082 585.2C469.983 584.929 470.123 584.629 470.394 584.53ZM471.506 587.584C471.976 587.413 472.497 587.655 472.669 588.126C472.84 588.597 472.597 589.118 472.127 589.289C471.656 589.46 471.135 589.217 470.964 588.747C470.792 588.276 471.035 587.755 471.506 587.584ZM466.034 588.778C466.699 588.536 467.436 588.879 467.679 589.545C467.921 590.21 467.577 590.947 466.911 591.189C466.246 591.431 465.51 591.088 465.268 590.423C465.025 589.756 465.368 589.02 466.034 588.778Z"
            fill="#A39885"
          />
          <path
            d="M314.962 519.077C313.193 518.865 307.178 517.927 304.577 514.714C301.509 510.923 300.846 502.95 305.849 503.318C309.994 503.622 312.167 505.462 313.901 508.693C315.531 511.726 315.265 515.239 315.433 518.637C315.438 518.765 315.393 518.879 315.299 518.967C315.205 519.053 315.089 519.092 314.962 519.077ZM315.501 524.464C315.561 524.343 315.559 524.214 315.499 524.093C315.439 523.973 315.337 523.895 315.204 523.868C308.945 522.607 298.729 517.433 295.249 526.377C293.326 531.316 300.418 535.363 304.898 535.143C310.147 534.887 314.473 526.599 315.501 524.464ZM317.866 524.782C317.915 524.629 318.038 524.524 318.196 524.497C318.355 524.47 318.505 524.529 318.604 524.657C320.822 527.561 321.825 529.77 322.141 534.09C322.66 541.155 315.718 544.211 313.186 541.048C310.654 537.883 308.949 535.986 313.062 532.179C316.115 529.352 317.405 526.214 317.866 524.782ZM320.476 523.211C320.848 524.63 322.572 529.702 328.249 530.114C334.187 530.544 335.754 521.972 330.542 520.128C327.63 519.098 323.569 521.566 320.725 522.713C320.528 522.792 320.421 523.004 320.476 523.211ZM318.475 520.694C318.534 520.801 318.626 520.87 318.745 520.899C318.863 520.927 318.977 520.906 319.078 520.837C321.812 518.994 328.334 515.783 327.52 512.247C326.779 509.035 321.526 506.405 318.095 509.2C314.206 512.366 317.527 518.995 318.475 520.694Z"
            fill="#D6E2ED"
          />
          <path
            d="M315.893 522.065C315.677 521.765 315.745 521.347 316.045 521.132C316.344 520.916 316.761 520.985 316.977 521.284C317.193 521.583 317.125 522.001 316.826 522.217C316.527 522.432 316.108 522.365 315.893 522.065ZM316.584 523.894C316.476 523.744 316.511 523.534 316.661 523.426C316.811 523.317 317.022 523.35 317.13 523.501C317.238 523.652 317.204 523.863 317.054 523.971C316.904 524.08 316.693 524.045 316.584 523.894ZM314.321 521.224C314.213 521.073 314.248 520.863 314.399 520.755C314.549 520.646 314.759 520.679 314.868 520.83C314.977 520.98 314.942 521.191 314.791 521.3C314.64 521.408 314.43 521.374 314.321 521.224ZM316.016 520.004C315.828 519.742 315.887 519.377 316.148 519.189C316.41 519 316.775 519.06 316.963 519.321C317.15 519.582 317.091 519.946 316.83 520.135C316.569 520.323 316.204 520.264 316.016 520.004ZM317.71 523.177C317.976 523.547 318.491 523.631 318.861 523.365C319.23 523.099 319.314 522.583 319.047 522.214C318.782 521.845 318.267 521.76 317.896 522.026C317.527 522.293 317.444 522.808 317.71 523.177Z"
            fill="#A39885"
          />
          <path
            d="M397.524 617.52C397.083 617.337 396.231 616.845 395.578 615.62C394.655 613.894 392.039 614.477 391.419 614.256C390.798 614.034 388.507 615.786 388.195 617.019C387.885 618.253 388.643 620.738 390.439 620.949C391.73 621.1 393.245 620.92 394.44 620.408C395.671 619.879 396.69 618.829 397.597 617.854L397.647 617.667L397.524 617.52Z"
            fill="#D6E2ED"
          />
          <path
            d="M397.22 617.183C396.707 616.995 395.706 616.703 394.724 616.846C393.319 617.05 391.341 618.615 390.043 615.728C388.744 612.84 390.549 611.07 392.616 612.086C394.685 613.103 394.561 612.789 395.33 612.826C396.101 612.863 395.91 614.5 396.141 615.283C396.372 616.068 397.102 616.387 397.42 616.852C397.475 616.933 397.48 617.033 397.435 617.109L397.22 617.183Z"
            fill="#D6E2ED"
          />
          <path
            d="M396.804 612.965C396.1 613.401 395.01 614.325 395.747 615.545C396.149 616.211 396.563 617.138 395.818 618.571C395.575 619.038 395.51 619.722 396.151 620.63L396.331 620.69L396.448 620.585C396.389 620.114 396.49 619.658 396.722 619.242C397.485 617.887 398.553 617.39 398.47 617.026C398.34 616.457 396.701 616.29 396.689 614.313C396.687 613.926 396.805 613.511 397.059 613.077L396.999 612.956L396.804 612.965Z"
            fill="#B2CEDE"
          />
          <path
            d="M463.216 632.235C462.525 632.813 460.953 633.81 458.331 633.834C454.633 633.868 453.321 638.759 452.407 639.604C451.494 640.45 452.425 645.82 454.218 647.419C456.012 649.019 460.838 649.924 462.761 647.099C464.145 645.07 465.168 642.376 465.355 639.924C465.546 637.401 464.677 634.776 463.839 632.406C463.794 632.281 463.7 632.192 463.572 632.158C463.444 632.122 463.318 632.15 463.216 632.235Z"
            fill="#D6E2ED"
          />
          <path
            d="M463.564 631.83C462.483 632.472 460.339 633.587 458.052 633.891C454.781 634.326 449.631 632.582 447.921 638.652C446.212 644.721 451.058 646.939 455.308 643.875C459.559 640.808 459.413 641.457 461.143 640.943C462.872 640.431 461.744 637.528 461.93 635.95C462.117 634.373 463.637 633.366 464.158 632.325C464.248 632.144 464.217 631.956 464.084 631.843C463.946 631.728 463.744 631.723 463.564 631.83Z"
            fill="#D6E2ED"
          />
          <path
            d="M455.702 629.675C455.818 631.235 456.411 633.868 459.1 633.702C460.567 633.612 462.483 633.728 464.231 636.23C464.8 637.045 465.889 637.75 467.97 637.474C468.074 637.462 468.181 637.356 468.227 637.223C468.273 637.091 468.243 636.971 468.155 636.937C467.316 636.625 466.638 636.056 466.146 635.302C464.543 632.84 464.646 630.615 463.963 630.436C462.895 630.157 461.183 632.756 457.863 631.047C457.211 630.711 456.62 630.149 456.114 629.345C456.063 629.262 455.958 629.26 455.857 629.341C455.756 629.421 455.694 629.557 455.702 629.675Z"
            fill="#B2CEDE"
          />
          <path
            d="M436.319 563.218C436.741 562.992 437.66 562.644 439.021 562.912C440.942 563.291 442.147 560.896 442.71 560.555C443.274 560.215 443.367 557.332 442.609 556.311C441.851 555.29 439.446 554.305 438.147 555.562C437.213 556.465 436.394 557.753 436.033 559.003C435.665 560.29 435.834 561.744 436.015 563.063L436.127 563.219L436.319 563.218Z"
            fill="#D6E2ED"
          />
          <path
            d="M436.773 563.197C437.242 562.919 438.101 562.329 438.613 561.476C439.343 560.259 439.382 557.737 442.441 558.559C445.499 559.381 445.727 561.899 443.632 562.857C441.537 563.814 441.857 563.917 441.341 564.489C440.826 565.064 439.679 563.88 438.926 563.563C438.172 563.245 437.464 563.609 436.903 563.561C436.805 563.552 436.724 563.493 436.694 563.41C436.663 563.326 436.695 563.242 436.773 563.197Z"
            fill="#D6E2ED"
          />
          <path
            d="M440.302 565.544C440.41 564.723 440.385 563.294 438.973 563.093C438.202 562.983 437.222 562.717 436.585 561.233C436.376 560.75 435.888 560.268 434.78 560.188L434.62 560.29L434.627 560.446C435.028 560.698 435.318 561.065 435.492 561.508C436.059 562.958 435.768 564.099 436.103 564.264C436.626 564.525 437.792 563.36 439.331 564.601C439.632 564.844 439.878 565.2 440.054 565.671L440.187 565.7L440.302 565.544Z"
            fill="#B2CEDE"
          />
          <path
            d="M333.633 638.79C333.032 639.461 331.619 640.673 329.028 641.074C325.373 641.639 324.777 646.668 323.995 647.636C323.213 648.604 324.906 653.785 326.909 655.11C328.915 656.436 333.822 656.637 335.318 653.566C336.396 651.359 337.021 648.545 336.854 646.092C336.681 643.568 335.444 641.095 334.274 638.87C334.212 638.752 334.105 638.678 333.974 638.663C333.842 638.645 333.722 638.691 333.633 638.79Z"
            fill="#D6E2ED"
          />
          <path
            d="M333.919 638.339C332.942 639.13 330.98 640.541 328.76 641.171C325.586 642.071 320.239 641.086 319.419 647.338C318.599 653.589 323.714 655.089 327.48 651.444C331.245 647.8 331.195 648.462 332.833 647.707C334.471 646.95 332.936 644.24 332.894 642.652C332.853 641.064 334.211 639.848 334.578 638.744C334.642 638.552 334.584 638.369 334.434 638.277C334.283 638.182 334.082 638.208 333.919 638.339Z"
            fill="#D6E2ED"
          />
          <path
            d="M325.828 637.336C326.167 638.864 327.133 641.384 329.769 640.833C331.208 640.533 333.121 640.372 335.211 642.597C335.891 643.323 337.07 643.864 339.089 643.292C339.19 643.264 339.281 643.144 339.307 643.006C339.334 642.868 339.287 642.754 339.195 642.734C338.319 642.545 337.567 642.08 336.973 641.405C335.031 639.198 334.815 636.981 334.113 636.903C333.016 636.781 331.694 639.597 328.164 638.384C327.471 638.145 326.804 637.674 326.189 636.95C326.126 636.876 326.022 636.889 325.933 636.983C325.845 637.076 325.803 637.221 325.828 637.336Z"
            fill="#B2CEDE"
          />
          <path
            d="M216.882 629.881C216.673 629.26 216.413 627.936 217.086 626.158C218.036 623.647 215.072 621.473 214.741 620.634C214.408 619.794 210.533 619.009 208.979 619.801C207.426 620.594 205.545 623.62 206.948 625.665C207.957 627.133 209.51 628.534 211.118 629.305C212.776 630.097 214.779 630.201 216.604 630.257C216.701 630.261 216.783 630.219 216.841 630.141C216.898 630.064 216.913 629.971 216.882 629.881Z"
            fill="#B2CEDE"
          />
          <path
            d="M216.956 629.263C216.687 628.565 216.085 627.269 215.051 626.382C213.572 625.117 210.171 624.489 211.978 620.543C213.787 616.596 217.244 616.86 218.061 619.911C218.879 622.964 219.09 622.553 219.747 623.381C220.405 624.21 218.543 625.49 217.942 626.435C217.341 627.382 217.671 628.423 217.478 629.171C217.444 629.301 217.346 629.398 217.226 629.418C217.106 629.44 217 629.379 216.956 629.263Z"
            fill="#B2CEDE"
          />
          <path
            d="M220.934 625.027C219.848 624.695 217.91 624.403 217.317 626.265C216.992 627.281 216.409 628.546 214.258 629.07C213.557 629.241 212.793 629.792 212.432 631.272C212.414 631.345 212.457 631.446 212.534 631.512C212.613 631.579 212.701 631.589 212.747 631.538C213.179 631.053 213.743 630.744 214.381 630.61C216.468 630.174 217.946 630.827 218.245 630.413C218.716 629.766 217.409 627.923 219.437 626.126C219.835 625.774 220.371 625.522 221.049 625.392C221.117 625.379 221.147 625.307 221.119 625.219C221.091 625.13 221.016 625.052 220.934 625.027Z"
            fill="#B2CEDE"
          />
          <path
            d="M188.633 646.724C188.614 647.175 188.452 648.096 187.574 649.077C186.336 650.464 187.709 652.605 187.714 653.231C187.719 653.856 190.029 655.327 191.231 655.201C192.431 655.078 194.401 653.588 194.001 651.921C193.715 650.72 193.06 649.429 192.213 648.529C191.341 647.605 190.072 647.04 188.907 646.55L188.725 646.564L188.633 646.724Z"
            fill="#D6E2ED"
          />
          <path
            d="M188.601 646.456C188.475 647.076 188.163 648.25 187.502 649.202C186.557 650.564 184.167 651.887 185.845 654.574C187.521 657.263 189.982 656.213 190.283 653.598C190.582 650.982 190.772 651.254 191.168 650.439C191.563 649.624 190.103 649.061 189.58 648.458C189.055 647.855 189.196 646.948 188.985 646.403C188.949 646.309 188.87 646.256 188.782 646.269C188.693 646.28 188.622 646.355 188.601 646.456Z"
            fill="#B2CEDE"
          />
          <path
            d="M185.141 648.648C185.759 649.133 186.939 649.804 187.787 648.748C188.249 648.172 188.94 647.501 190.462 647.698C190.956 647.762 191.587 647.595 192.188 646.73L192.182 646.549L192.051 646.48C191.651 646.685 191.211 646.744 190.764 646.672C189.306 646.435 188.516 645.645 188.218 645.837C187.753 646.139 188.139 647.655 186.381 648.31C186.036 648.438 185.629 648.469 185.157 648.383L185.071 648.478L185.141 648.648Z"
            fill="#B2CEDE"
          />
          <path
            d="M196.739 593.516C196.522 592.807 196.268 591.289 197.093 589.288C198.256 586.46 194.955 583.889 194.605 582.922C194.255 581.956 189.868 580.939 188.073 581.791C186.279 582.639 184.038 586.026 185.571 588.393C186.671 590.099 188.393 591.743 190.2 592.674C192.057 593.632 194.335 593.814 196.408 593.935C196.52 593.942 196.617 593.9 196.683 593.814C196.752 593.728 196.771 593.623 196.739 593.516Z"
            fill="#B2CEDE"
          />
          <path
            d="M196.936 593.913C196.792 592.883 196.634 590.893 197.139 589.055C197.858 586.425 200.842 583.067 196.77 579.818C192.699 576.564 189.457 579.539 190.421 583.759C191.388 587.98 190.945 587.659 190.777 589.141C190.611 590.621 193.183 590.697 194.324 591.345C195.467 591.993 195.745 593.477 196.369 594.207C196.476 594.331 196.629 594.37 196.759 594.303C196.89 594.237 196.96 594.083 196.936 593.913Z"
            fill="#B2CEDE"
          />
          <path
            d="M201.103 588.622C199.878 588.208 197.682 587.814 196.944 589.915C196.544 591.061 195.839 592.479 193.371 593.007C192.568 593.178 191.682 593.782 191.224 595.451C191.2 595.534 191.244 595.65 191.332 595.728C191.418 595.805 191.52 595.822 191.572 595.765C192.08 595.227 192.73 594.895 193.464 594.762C195.854 594.332 197.511 595.125 197.869 594.664C198.423 593.943 196.995 591.802 199.364 589.825C199.829 589.437 200.444 589.168 201.222 589.042C201.303 589.029 201.335 588.95 201.305 588.847C201.278 588.742 201.195 588.652 201.103 588.622Z"
            fill="#B2CEDE"
          />
          <path
            d="M276.732 482.875C276.523 482.255 276.262 480.931 276.935 479.152C277.885 476.641 274.922 474.467 274.591 473.628C274.258 472.789 270.383 472.003 268.828 472.796C267.276 473.588 265.395 476.614 266.798 478.659C267.807 480.127 269.36 481.528 270.968 482.3C272.625 483.091 274.629 483.195 276.453 483.251C276.55 483.255 276.633 483.213 276.691 483.135C276.748 483.059 276.763 482.965 276.732 482.875Z"
            fill="#B2CEDE"
          />
          <path
            d="M276.806 482.257C276.537 481.559 275.935 480.262 274.901 479.376C273.422 478.111 270.021 477.483 271.828 473.537C273.637 469.59 277.094 469.854 277.911 472.905C278.729 475.958 278.94 475.547 279.597 476.375C280.254 477.204 278.393 478.484 277.793 479.428C277.191 480.376 277.521 481.417 277.328 482.165C277.294 482.295 277.196 482.392 277.076 482.412C276.956 482.434 276.85 482.373 276.806 482.257Z"
            fill="#D6E2ED"
          />
          <path
            d="M280.785 478.02C279.699 477.689 277.761 477.396 277.168 479.259C276.843 480.275 276.259 481.54 274.109 482.064C273.407 482.235 272.644 482.785 272.283 484.266C272.264 484.339 272.307 484.439 272.385 484.505C272.464 484.572 272.552 484.582 272.598 484.531C273.03 484.046 273.593 483.738 274.231 483.603C276.319 483.167 277.797 483.821 278.096 483.406C278.567 482.759 277.259 480.916 279.288 479.119C279.686 478.768 280.222 478.516 280.899 478.385C280.968 478.373 280.998 478.301 280.969 478.213C280.942 478.123 280.866 478.045 280.785 478.02Z"
            fill="#B2CEDE"
          />
          <path
            d="M443.725 375.114C443.419 374.779 442.704 374.177 441.4 373.99C439.561 373.725 439.236 371.201 438.838 370.719C438.44 370.237 439.264 367.625 440.264 366.949C441.265 366.273 443.729 366.147 444.497 367.682C445.049 368.785 445.378 370.195 445.306 371.429C445.233 372.697 444.623 373.946 444.046 375.071L443.897 375.176L443.725 375.114Z"
            fill="#B2CEDE"
          />
          <path
            d="M443.872 375.339C443.377 374.947 442.384 374.248 441.265 373.943C439.666 373.507 436.985 374.029 436.541 370.893C436.098 367.756 438.659 366.977 440.57 368.788C442.481 370.6 442.451 370.267 443.278 370.638C444.105 371.01 443.347 372.38 443.335 373.178C443.322 373.976 444.01 374.58 444.2 375.133C444.233 375.229 444.206 375.321 444.13 375.368C444.055 375.415 443.953 375.404 443.872 375.339Z"
            fill="#D6E2ED"
          />
          <path
            d="M439.812 375.884C439.976 375.115 440.447 373.844 441.775 374.107C442.498 374.251 443.46 374.321 444.498 373.193C444.837 372.825 445.426 372.548 446.444 372.824L446.555 372.967L446.499 373.104C446.061 373.204 445.686 373.441 445.391 373.783C444.426 374.902 444.329 376.016 443.977 376.06C443.426 376.127 442.748 374.718 440.98 375.346C440.634 375.469 440.301 375.71 439.995 376.076L439.867 376.061L439.812 375.884Z"
            fill="#B2CEDE"
          />
          <path
            d="M239.842 467.194C239.405 467.311 238.478 467.429 237.28 466.882C235.588 466.111 233.952 468.058 233.356 468.249C232.761 468.439 232.042 471.083 232.519 472.192C232.993 473.302 235 474.74 236.474 473.864C237.535 473.234 238.574 472.225 239.181 471.148C239.805 470.041 239.968 468.662 240.089 467.405L240.021 467.234L239.842 467.194Z"
            fill="#B2CEDE"
          />
          <path
            d="M240.088 467.083C239.458 467.146 238.245 467.198 237.139 466.849C235.558 466.351 233.586 464.462 231.518 466.862C229.448 469.261 231.181 471.299 233.767 470.81C236.355 470.318 236.151 470.581 237.046 470.716C237.942 470.852 238.046 469.29 238.466 468.612C238.887 467.932 239.794 467.797 240.253 467.434C240.331 467.372 240.358 467.28 240.32 467.199C240.284 467.119 240.191 467.073 240.088 467.083Z"
            fill="#B2CEDE"
          />
          <path
            d="M236.968 464.43C236.688 465.165 236.398 466.49 237.658 466.987C238.344 467.256 239.192 467.716 239.455 469.228C239.541 469.72 239.887 470.272 240.892 470.589L241.063 470.529L241.09 470.385C240.775 470.064 240.588 469.661 240.524 469.213C240.317 467.75 240.837 466.76 240.565 466.534C240.139 466.18 238.806 466.998 237.658 465.514C237.434 465.222 237.283 464.843 237.226 464.367L237.109 464.312L236.968 464.43Z"
            fill="#B2CEDE"
          />
          <path
            d="M397.124 351.499C396.28 351.091 394.661 350.023 393.518 347.551C391.904 344.057 386.702 344.905 385.51 344.4C384.317 343.896 379.622 347.075 378.871 349.46C378.12 351.847 379.328 356.811 382.827 357.426C385.347 357.871 388.34 357.687 390.747 356.819C393.218 355.921 395.339 353.971 397.229 352.161C397.329 352.064 397.37 351.943 397.346 351.803C397.327 351.667 397.249 351.556 397.124 351.499Z"
            fill="#D6E2ED"
          />
          <path
            d="M396.565 350.801C395.58 350.377 393.649 349.689 391.703 349.859C388.923 350.101 384.863 352.948 382.641 347.136C380.423 341.319 384.165 338.048 388.107 340.276C392.052 342.507 391.843 341.879 393.351 342.038C394.86 342.196 394.299 345.388 394.665 346.953C395.027 348.519 396.425 349.228 396.996 350.174C397.094 350.341 397.095 350.54 396.998 350.682C396.898 350.826 396.729 350.873 396.565 350.801Z"
            fill="#D6E2ED"
          />
          <path
            d="M396.226 342.478C394.797 343.254 392.55 344.943 393.862 347.422C394.573 348.775 395.281 350.643 393.656 353.37C393.126 354.257 392.927 355.592 394.078 357.447C394.133 357.541 394.279 357.599 394.425 357.586C394.571 357.571 394.672 357.491 394.667 357.394C394.603 356.465 394.85 355.578 395.355 354.79C397.006 352.218 399.161 351.361 399.037 350.636C398.845 349.506 395.649 348.992 395.847 345.115C395.889 344.352 396.169 343.549 396.715 342.725C396.772 342.644 396.73 342.539 396.612 342.482C396.493 342.418 396.336 342.418 396.226 342.478Z"
            fill="#B2CEDE"
          />
          <path
            d="M433.659 494.444L442.591 485.785C442.656 485.723 442.682 485.639 442.662 485.551C442.644 485.463 442.586 485.396 442.502 485.365C441.238 484.912 437.086 483.254 433.158 479.873C428.454 475.823 419.299 472.259 412.671 481.393C406.044 490.527 422.295 505.914 433.659 494.444ZM444.444 480.996C444.419 481.073 444.365 481.13 444.29 481.158C444.213 481.186 444.137 481.178 444.067 481.135C440.064 478.623 430.383 480.638 429.487 466.446C428.57 451.918 435.099 454.962 441.374 458.273C447.649 461.584 450.781 467.788 448.873 470.231C447.187 472.39 444.941 479.4 444.444 480.996ZM454.774 483.616C461.446 483.72 467.24 483.309 468.403 474.291C469.567 465.273 459.358 460.472 453.037 466.614C447.199 472.287 448.682 480.884 448.942 482.161C448.962 482.261 449.036 482.334 449.135 482.357L454.774 483.616ZM450.19 487.78C451.748 486.857 464.826 479.486 469.031 489.688C473.507 500.544 461.361 503.393 458.697 501.831C452.745 498.34 451.279 494.292 450.07 488.045C450.05 487.938 450.096 487.836 450.19 487.78ZM446.158 489.135C448.197 493.537 454.122 500.516 452.981 505.078C451.945 509.215 446.819 513.75 443.008 514.613C437.926 515.764 431.037 514.343 434.21 505.07C436.881 497.258 440.299 494.204 445.756 489.057L445.977 488.993C446.059 489.008 446.124 489.059 446.158 489.135Z"
            fill="#D6E2ED"
          />
          <path
            d="M446.448 485.529C447.066 485.304 447.75 485.623 447.976 486.241C448.201 486.861 447.882 487.545 447.264 487.77C446.645 487.995 445.96 487.676 445.735 487.057C445.51 486.438 445.829 485.754 446.448 485.529ZM447.62 488.404C447.967 488.278 448.35 488.459 448.476 488.804C448.602 489.152 448.424 489.535 448.077 489.661C447.73 489.788 447.346 489.609 447.22 489.261C447.094 488.916 447.273 488.531 447.62 488.404ZM443.006 487.735C443.354 487.609 443.738 487.787 443.864 488.134C443.99 488.481 443.811 488.865 443.463 488.992C443.118 489.117 442.734 488.939 442.607 488.592C442.481 488.245 442.661 487.861 443.006 487.735ZM441.864 482.192C442.211 482.065 442.594 482.244 442.72 482.591C442.846 482.938 442.669 483.321 442.321 483.448C441.974 483.574 441.59 483.395 441.464 483.048C441.338 482.701 441.516 482.318 441.864 482.192ZM443.942 483.933C444.289 483.807 444.673 483.985 444.799 484.332C444.925 484.68 444.746 485.063 444.399 485.189C444.053 485.315 443.669 485.137 443.542 484.789C443.416 484.443 443.595 484.059 443.942 483.933ZM449.163 484.093C449.51 483.966 449.894 484.145 450.02 484.492C450.146 484.839 449.968 485.222 449.62 485.349C449.273 485.475 448.89 485.296 448.764 484.949C448.637 484.602 448.816 484.219 449.163 484.093ZM445.903 480.907C446.522 480.682 447.206 481 447.431 481.619C447.656 482.238 447.337 482.923 446.719 483.148C446.1 483.373 445.416 483.053 445.191 482.435C444.966 481.815 445.285 481.132 445.903 480.907Z"
            fill="#A39885"
          />
          <g opacity="0.600006">
            <path
              d="M646.594 358.867C646.327 358.643 646.292 358.244 646.517 357.976C646.741 357.708 647.14 357.674 647.407 357.898C647.675 358.123 647.71 358.521 647.486 358.789C647.261 359.057 646.862 359.092 646.594 358.867ZM647.137 355.806C646.936 355.637 646.909 355.338 647.078 355.137C647.246 354.936 647.546 354.91 647.747 355.079C647.947 355.247 647.974 355.546 647.805 355.747C647.636 355.948 647.337 355.974 647.137 355.806ZM649.323 360.476C649.123 360.308 649.096 360.009 649.264 359.808C649.433 359.607 649.733 359.581 649.933 359.749C650.134 359.918 650.161 360.218 649.992 360.418C649.823 360.619 649.524 360.645 649.323 360.476ZM649.544 357.472C649.343 357.303 649.317 357.004 649.486 356.803C649.654 356.602 649.953 356.575 650.155 356.744C650.356 356.913 650.381 357.212 650.213 357.413C650.044 357.614 649.745 357.64 649.544 357.472ZM645.853 357.3C645.652 357.131 645.627 356.832 645.795 356.631C645.964 356.43 646.263 356.403 646.464 356.572C646.665 356.741 646.691 357.04 646.522 357.241C646.354 357.442 646.055 357.468 645.853 357.3ZM647.199 360.231C646.999 360.062 646.972 359.763 647.141 359.562C647.309 359.361 647.609 359.335 647.809 359.504C648.01 359.672 648.037 359.972 647.868 360.173C647.7 360.374 647.4 360.399 647.199 360.231ZM648.678 359.197C648.41 358.972 648.376 358.573 648.6 358.305C648.825 358.038 649.223 358.003 649.492 358.227C649.759 358.452 649.794 358.851 649.57 359.119C649.345 359.386 648.946 359.421 648.678 359.197ZM647.835 357.248C647.568 357.024 647.532 356.625 647.757 356.357C647.982 356.089 648.381 356.054 648.649 356.279C648.917 356.504 648.951 356.903 648.727 357.17C648.502 357.438 648.103 357.473 647.835 357.248Z"
              fill="#A39885"
            />
          </g>
        </svg>
      </div>
    );

    return (
      <>
        {/* Page 1 Divider - screen only */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">
            PAGE 1
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* Page 1 Canvas */}
        <div className="pdf-page w-[8.5in] h-[11in] relative overflow-hidden bg-[#798897] shadow-xl">
          {/* Right White Sidebar Background */}
          <div className="absolute right-0 top-0 w-[2.7in] h-full bg-white z-[5] shadow-xl border-l border-gray-100"></div>

          {/* Floral Branch Vector Background Overlay */}
          {renderFloralSVG()}

          {/* Foreground content container */}
          <div className="relative w-full h-full flex z-20">
            {/* Left Content Column */}
            <div className="w-[5.8in] h-full p-6 flex flex-col justify-between select-none">
              {/* Top Hero Photo (Image 1) */}
              <div className="w-full h-[300px] bg-white p-[3px] shadow-md relative shrink-0 mt-6">
                {renderImageSlot("image1", fileInputRef1, "Upload Main Photo")}
              </div>

              {/* Address & Specs Banner */}
              <div className="flex items-between gap-3 my-1">
                {/* White flower SVG logo icon */}

                <div className="flex w-full mt-4 flex-col justify-center items-center relative z-[19] ">
                  <div className="text-[28px] w-full font-light leading-none mt-0 text-white flex justify-center gap-2">
                    <span>#</span>
                    <span className="inline">
                      <StyledInput
                        value={roadName}
                        onChange={(e) => setAddressCode(e.target.value)}
                        inputStyle={fieldStyles["addressCode"]}
                        onChangeStyle={(s) =>
                          updateFieldStyle("addressCode", s)
                        }
                        className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                        placeholder="0000-0000"
                      />
                    </span>
                    <span className="text-white flex">
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
                  <div className="text-white text-[10px]">
                    <StyledInput
                      value={cityLine}
                      onChange={(e) => setCityLine(e.target.value)}
                      inputStyle={fieldStyles["cityLine"]}
                      onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                      className="text-white text-[18px] bg-transparent text-center w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                      placeholder="BRIGHOUSE SOUTH, RICHMOND"
                    />
                  </div>
                </div>
              </div>
              <div className="w-full py-2 place-items-center place-self-center z-20">
                <div className="font-normal text-[12px] text-[#f0f0f0] flex flex-wrap items-center gap-2">
                  <div className="inline">
                    <StyledInput
                      value={bedroom}
                      onChange={(e) => setBedroom(e.target.value)}
                      inputStyle={fieldStyles["bedroom"]}
                      onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
                      className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
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
                      className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px]  focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
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
                      className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
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
                      className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[500]"
                      placeholder="0000"
                    />
                  </div>
                </div>
              </div>
              {/* 4-Photo Grid with Center Logo */}
              <div className="relative w-full grid grid-cols-2 gap-2 my-1">
                <div className="w-full h-[135px] bg-white p-[2px] shadow-sm relative">
                  {renderImageSlot("image2", fileInputRef2, "Photo 2")}
                </div>
                <div className="w-full h-[135px] bg-white p-[2px] shadow-sm relative">
                  {renderImageSlot("image3", fileInputRef3, "Photo 3")}
                </div>
                <div className="w-full h-[135px] bg-white p-[2px] shadow-sm relative">
                  {renderImageSlot("image4", fileInputRef4, "Photo 4")}
                </div>
                <div className="w-full h-[135px] bg-white p-[2px] shadow-sm relative">
                  {renderImageSlot("image5", fileInputRef5, "Photo 5")}
                </div>

                {/* Centered Logo Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white p-[2px] rounded shadow-xl border border-gray-200 flex flex-col items-center justify-center w-[160px] h-[75px] pointer-events-auto">
                  {renderImageSlot("image7", fileInputRef7, "Upload Logo")}
                </div>
              </div>

              {/* Headline Sub-header */}
              <div className="my-1">
                <h1 className="text-white font-normal text-[14px] tracking-wide text-center uppercase bg-transparent w-full leading-snug">
                  ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL
                  APPOINTED CENTRO BUILDING.
                </h1>
              </div>

              {/* Description Text */}
              <div className="my-1 flex-1">
                <StyledInput
                  value={description}
                  rows={8}
                  onChange={(e) => setDescription(e.target.value)}
                  inputStyle={fieldStyles["description"]}
                  onChangeStyle={(s) => updateFieldStyle("description", s)}
                  className="font-normal text-[10px] h-[90px] z-20 text-white leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                  placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to
                the South and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark
                laminate flooring, S/S appliances, Gas range and a large open 'den/nook' area perfect for the home office. Huge private balcony,
                great building amenities including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage
                locker and balance of the the 5-10 warranty, this home provides nothing but exceptional value. Call today to set up your viewing.
                MLS # V981073 This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking
                Brighouse Park & to the South and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross
                unit bedrooms. Dark laminate flooring, S/S appliances, Gas range and a large open 'den/nook' area perfect for the home office. Huge
                private balcony, great building amenities including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking,
                and storage locker and balance of the the 5-10 warranty, this home provides nothing but exceptional value. Call today to set up your
                viewing. MLS # 00000"
                />
              </div>

              {/* Disclaimer Footer */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/20 text-[7.5px] text-[#CBD5E1] leading-tight">
                <House className="w-4 h-4 shrink-0 text-white" />
                <span>
                  All information deemed reliable but not guaranteed and should
                  be independently verified. All properties are subject to prior
                  sale, change or withdrawal. Neither listing broker(s) nor BC
                  Floor Plans shall be responsible for any typographical errors,
                  misinformation, misprints and shall be held totally harmless.
                </span>
              </div>
            </div>

            {/* Right White Sidebar Column */}
            <div className="w-[2.7in] h-full p-6 flex flex-col justify-between select-none">
              {/* Price Banner */}
              <div className="mb-2 mt-2">
                <StyledInput
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputStyle={fieldStyles["amount"]}
                  onChangeStyle={(s) => updateFieldStyle("amount", s)}
                  className="font-serif italic font-medium text-[30px] text-[#B39A72] text-left bg-transparent w-full"
                  placeholder="$000,000"
                />
              </div>

              {/* Feature List Sections */}
              <div className="space-y-2.5 flex-1 overflow-hidden my-2">
                <div>
                  <span className="text-[#B39A72] font-semibold tracking-wider text-[9.5px] uppercase block mb-0.5">
                    BY-LAW RESTRICTIONS:
                  </span>
                  <StyledInput
                    value={byLawRestrictions}
                    onChange={(e) => setByLawRestrictions(e.target.value)}
                    inputStyle={fieldStyles["byLawRestrictions"]}
                    onChangeStyle={(s) =>
                      updateFieldStyle("byLawRestrictions", s)
                    }
                    className="text-gray-700 text-left text-[10px] leading-snug bg-transparent w-full"
                    placeholder="Pets Allowed w/Rest., Rentals Allowed"
                  />
                </div>

                <div>
                  <span className="text-[#B39A72] font-semibold tracking-wider text-[9.5px] uppercase block mb-0.5">
                    MAINT. FEES:
                  </span>
                  <StyledInput
                    value={maintFees}
                    onChange={(e) => setMaintFees(e.target.value)}
                    inputStyle={fieldStyles["maintFees"]}
                    onChangeStyle={(s) => updateFieldStyle("maintFees", s)}
                    className="text-gray-700 text-left text-[10px] leading-snug bg-transparent w-full"
                    placeholder="$000.00"
                  />
                </div>

                <div>
                  <span className="text-[#B39A72] font-semibold tracking-wider text-[9.5px] uppercase block mb-0.5">
                    MAINT. FEES INCLUDE:
                  </span>
                  <StyledInput
                    multiline
                    value={maintFeesInclude}
                    onChange={(e) => setMaintFeesInclude(e.target.value)}
                    inputStyle={fieldStyles["maintFeesInclude"]}
                    onChangeStyle={(s) =>
                      updateFieldStyle("maintFeesInclude", s)
                    }
                    className="text-gray-700 text-left text-[10px] leading-snug bg-transparent w-full"
                    placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Caretaker"
                  />
                </div>

                <div>
                  <span className="text-[#B39A72] font-semibold tracking-wider text-[9.5px] uppercase block mb-0.5">
                    FEATURES INCLUDED:
                  </span>
                  <StyledInput
                    multiline
                    value={featuresIncluded}
                    onChange={(e) => setFeaturesIncluded(e.target.value)}
                    inputStyle={fieldStyles["featuresIncluded"]}
                    onChangeStyle={(s) =>
                      updateFieldStyle("featuresIncluded", s)
                    }
                    className="text-gray-700 text-left text-[10px] leading-snug bg-transparent w-full"
                    placeholder="Clothes Washer/Dryer/Fridge/Stove/DW, Drapes/Window Coverings"
                  />
                </div>

                <div>
                  <span className="text-[#B39A72] font-semibold tracking-wider text-[9.5px] uppercase block mb-0.5">
                    SITE INFLUENCES:
                  </span>
                  <StyledInput
                    multiline
                    value={siteInfluences}
                    onChange={(e) => setSiteInfluences(e.target.value)}
                    inputStyle={fieldStyles["siteInfluences"]}
                    onChangeStyle={(s) => updateFieldStyle("siteInfluences", s)}
                    className="text-gray-700 text-left text-[10px] leading-snug bg-transparent w-full"
                    placeholder="Central Location, Golf Course Nearby, Shopping Nearby"
                  />
                </div>

                <div>
                  <span className="text-[#B39A72] font-semibold tracking-wider text-[9.5px] uppercase block mb-0.5">
                    AMENITIES:
                  </span>
                  <StyledInput
                    multiline
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                    inputStyle={fieldStyles["amenities"]}
                    onChangeStyle={(s) => updateFieldStyle("amenities", s)}
                    className="text-gray-700 text-left text-[10px] leading-snug bg-transparent w-full"
                    placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                  />
                </div>

                <div>
                  <span className="text-[#B39A72] font-semibold tracking-wider text-[9.5px] uppercase block mb-0.5">
                    VIEW:
                  </span>
                  <StyledInput
                    value={view}
                    onChange={(e) => setView(e.target.value)}
                    inputStyle={fieldStyles["view"]}
                    onChangeStyle={(s) => updateFieldStyle("view", s)}
                    className="text-gray-700 text-left text-[10px] leading-snug bg-transparent w-full"
                    placeholder="South & SW - Van Isl."
                  />
                </div>
              </div>

              {/* Contact Footer Section */}
              <div className="mt-auto pt-3 border-t border-gray-100 relative z-20">
                <span className="text-[#B39A72] font-semibold tracking-wider text-[9.5px] uppercase block mb-0.5">
                  CONTACT:
                </span>
                <StyledInput
                  value={fullName.toUpperCase()}
                  onChange={(e) => setFullName(e.target.value)}
                  inputStyle={fieldStyles["fullName"]}
                  onChangeStyle={(s) => updateFieldStyle("fullName", s)}
                  className="text-[#B39A72] text-left font-bold text-[12px] uppercase bg-transparent w-full leading-tight"
                  placeholder="FIRSTNAME LASTNAME"
                />
                <StyledInput
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  inputStyle={fieldStyles["propertyNameFooter"]}
                  onChangeStyle={(s) =>
                    updateFieldStyle("propertyNameFooter", s)
                  }
                  className="text-gray-800  text-left font-semibold text-[10.5px] bg-transparent w-full leading-tight mt-0.5"
                  placeholder="Macdonald Realty"
                />
                <div className="flex">
                  <span>Phone: </span>
                  <StyledInput
                    value={number}
                    onChange={(e) =>
                      setNumber(e.target.value.replace(/^Phone:\s*/i, ""))
                    }
                    inputStyle={fieldStyles["number"]}
                    onChangeStyle={(s) => updateFieldStyle("number", s)}
                    className="text-gray-700 text-[12px] bg-transparent w-full leading-tight mt-0.5"
                    placeholder="Phone: 604.000.0000"
                  />
                </div>
                <div className="flex">
                  <span>Email:</span>
                  <StyledInput
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value.replace(/^Email:\s*/i, ""))
                    }
                    inputStyle={fieldStyles["email"]}
                    onChangeStyle={(s) => updateFieldStyle("email", s)}
                    className="text-gray-700 text-[12px] bg-transparent w-full leading-tight mt-0.5"
                    placeholder="first@last.com"
                  />
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

        {/* Page 2 Canvas */}
        <div className="pdf-page w-[8.5in] h-[11in] relative overflow-hidden bg-[#798897] shadow-xl">
          {/* Floral Branch Vector Background Overlay */}
          {renderFloralSVG()}

          {/* Foreground content container */}
          <div className="relative w-full h-full p-8 flex flex-col justify-between z-20">
            {/* Top Address Header */}
            <div className="flex w-full flex-col relative">
              <div className="text-[28px] font-light leading-none mt-0 text-white flex">
                <span className="text-[16px]">#</span>
                <span className="inline">
                  <StyledInput
                    value={roadName}
                    onChange={(e) => setAddressCode(e.target.value)}
                    className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-white text-left focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                    placeholder="0000-0000"
                  />
                </span>
                <span className="text-white flex">
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
              <div className="text-white text-[10px]">
                <StyledInput
                  value={cityLine}
                  onChange={(e) => setCityLine(e.target.value)}
                  className="text-white text-[18px]  bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                  placeholder="BRIGHOUSE SOUTH, RICHMOND"
                />
              </div>
            </div>

            {/* Floor Plan Container Card */}
            <div className="bg-white p-5 shadow-2xl rounded-sm flex-1 my-5 relative group overflow-hidden flex flex-col items-center justify-center">
              {renderImageSlot(
                "image6",
                fileInputRef6,
                "Click to upload Floor Plan",
                "w-full h-full",
              )}
            </div>

            {/* Page 2 Footer */}
            <div className="flex items-center justify-between text-white text-[10.5px] font-bold tracking-wider relative select-none">
              <span>DESIGNED AND PRINTED BY BC FLOOR PLANS</span>
            </div>
          </div>
        </div>

        {/* Image Source Selection Modal */}
        {showImageSourceModal && (
          <ImageSourceModal
            onClose={() => setShowImageSourceModal(false)}
            onSelectSource={handleImageSourceSelect}
          />
        )}

        {/* Gallery Selection Modal */}
        {showGallery && (
          <FileManagerGallery
            onImageSelect={handleGallerySelect}
            isOpen={showGallery}
            onClose={() => setShowGallery(false)}
          />
        )}
      </>
    );
  },
);

BcfpStandard19.displayName = "BcfpStandard19";

export default BcfpStandard19;
