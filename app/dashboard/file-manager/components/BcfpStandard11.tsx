import { Pencil, Trash, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import ImageEditor from "./ImageEditor";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import { featureSheetService } from "../file-manager";
import type {
  FeatureSheetResponse,
  FeatureSheetPayload,
  TextStyle,
} from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";

export interface BcfpStandard11Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard11Props {
  orderData: Order | null;
}

const BcfpStandard11 = forwardRef<BcfpStandard11Ref, BcfpStandard11Props>(
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
    const [mlsNumber, setMlsNumber] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");
    const [fieldStyles, setFieldStyles] = useState<Record<string, TextStyle>>(
      {},
    );

    const updateFieldStyle = (fieldName: string, style: TextStyle) => {
      setFieldStyles((prev) => ({
        ...prev,
        [fieldName]: style,
      }));
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

    const [rotation, setRotation] = useState({
      image1: 0,
      image2: 0,
      image3: 0,
      image4: 0,
      image5: 0,
      image6: 0,
      image7: 0,
      image8: 0,
      image9: 0,
      image10: 0,
      image11: 0,
      image12: 0,
      image13: 0,
      image14: 0,
      image15: 0,
      image16: 0,
      image17: 0,
      image18: 0,
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
    const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(
      null,
    );
    const [showGallery, setShowGallery] = useState(false);

    const openImageSourceModal = (slot: string | null) => {
      setCurrentImageSlot(slot);
      setShowImageSourceModal(true);
    };

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

    const { formData, updateFormData } = useFileManagerContext();

    // Auto-populate from orderData and context formData
    useEffect(() => {
      if (orderData) {
        const prop = orderData.property;
        const agent = orderData.agent;

        if (prop) {
          if (prop.listing_price) setAmount(prop.listing_price.toString());
          if (prop.bedrooms) setBedroom(prop.bedrooms.toString());
          if (prop.bathrooms) setBathroom(prop.bathrooms.toString());
          if (prop.square_footage) setSqft(prop.square_footage.toString());
          if (prop.year_constructed)
            setBuiltYear(prop.year_constructed.toString());
          if (prop.description) setDescription(prop.description);

          const fullAddress = prop.suite
            ? `${prop.suite} - ${prop.address}`
            : prop.address;
          if (fullAddress) setRoadName(prop.suite ?? "");

          let city = "";
          if (prop.city) city += prop.city;
          if (prop.province) city += (city ? ", " : "") + prop.province;
          if (prop.postal_code) city += (city ? " " : "") + prop.postal_code;
          if (city) setCityLine(prop.address || city);
        }

        if (agent) {
          if (agent.first_name || agent.last_name)
            setFullName(
              `${agent.first_name || ""} ${agent.last_name || ""}`.trim(),
            );
          if (agent.email) setEmail(agent.email);
          if (agent.company_name) setPropertyName(agent.company_name);
          if (agent.primary_phone) setNumber(agent.primary_phone);
        }
      }

      if (formData) {
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";
        if (formData.byLawRestrictions)
          setByLawRestrictions(s(formData.byLawRestrictions));
        if (formData.maintenanceFees) setMaintFees(s(formData.maintenanceFees));
        if (formData.maintenanceFeesInclude)
          setMaintFeesInclude(s(formData.maintenanceFeesInclude));
        if (formData.featuresIncluded)
          setFeaturesIncluded(s(formData.featuresIncluded));
        if (formData.siteInfluences)
          setSiteInfluences(s(formData.siteInfluences));
        if (formData.amenities) setAmenities(s(formData.amenities));
        if (formData.view) setView(s(formData.view));
        if (formData.description) setDescription(s(formData.description));
        if (formData.fullName) setFullName(s(formData.fullName));
        if (formData.email) setEmail(s(formData.email));
        if (formData.propertyName) setPropertyName(s(formData.propertyName));
        if (formData.amount) setAmount(s(formData.amount));
        if (formData.number) setNumber(s(formData.number));
        if (formData.addressCode) setAddressCode(s(formData.addressCode));
        if (formData.roadName) setRoadName(s(formData.roadName));
        if (formData.cityLine) setCityLine(s(formData.cityLine));
        if (formData.mlsNumber) setMlsNumber(s(formData.mlsNumber));
        if (formData.bedroom) setBedroom(s(formData.bedroom));
        if (formData.bathroom) setBathroom(s(formData.bathroom));
        if (formData.sqft) setSqft(s(formData.sqft));
        if (formData.builtYear) setBuiltYear(s(formData.builtYear));

        if (formData.images) {
          setImages((prev) => ({
            ...prev,
            ...(formData.images as typeof images),
          }));
        }
        if (formData.imageScales) {
          setScale((prev) => ({
            ...prev,
            ...(formData.imageScales as typeof scale),
          }));
        }
        if (formData.imagePositions) {
          setPosition((prev) => ({
            ...prev,
            ...(formData.imagePositions as typeof position),
          }));
        }
        if (formData.fieldStyles) {
          setFieldStyles(formData.fieldStyles as Record<string, TextStyle>);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData]);

    // Update context when local state changes
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
        mlsNumber,
        bedroom,
        bathroom,
        sqft,
        builtYear,
        images,
        imageScales: scale,
        imagePositions: position,
        fieldStyles,
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
      mlsNumber,
      bedroom,
      bathroom,
      sqft,
      builtYear,
      images,
      scale,
      position,
      fieldStyles,
      updateFormData,
    ]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard11",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#376173",
          offeredAtPrice: {
            value: amount,
            style: fieldStyles.amount || ({} as TextStyle),
          },
          realtorName: {
            value: fullName,
            style: fieldStyles.fullName || ({} as TextStyle),
          },
          emailLink: {
            value: email,
            style: fieldStyles.email || ({} as TextStyle),
          },
          propertyNotesTitle: {
            value: roadName,
            style: fieldStyles.roadName || ({} as TextStyle),
          },
          propertyNotesDescription: {
            value: description,
            style: fieldStyles.description || ({} as TextStyle),
          },
          expandedDetail1Title: "By-law Restrictions",
          expandedDetail1Description: {
            value: byLawRestrictions,
            style: fieldStyles.byLawRestrictions || ({} as TextStyle),
          },
          expandedDetail2Title: "Maint. Fees",
          expandedDetail2Description: {
            value: maintFees,
            style: fieldStyles.maintFees || ({} as TextStyle),
          },
          expandedDetail3Title: "Maint. Fees Include",
          expandedDetail3Description: {
            value: maintFeesInclude,
            style: fieldStyles.maintFeesInclude || ({} as TextStyle),
          },
          expandedDetail4Title: "Features Included",
          expandedDetail4Description: {
            value: featuresIncluded,
            style: fieldStyles.featuresIncluded || ({} as TextStyle),
          },
          keyHighlightLabel: "Site Influences",
          keyHighlights: siteInfluences
            ? siteInfluences.split("\n").filter(Boolean)
            : [],
          otherDetails: {
            amenities: {
              value: amenities,
              style: fieldStyles.amenities || ({} as TextStyle),
            },
            view: { value: view, style: fieldStyles.view || ({} as TextStyle) },
            bedroom: {
              value: bedroom,
              style: fieldStyles.bedroom || ({} as TextStyle),
            },
            bathroom: {
              value: bathroom,
              style: fieldStyles.bathroom || ({} as TextStyle),
            },
            sqft: { value: sqft, style: fieldStyles.sqft || ({} as TextStyle) },
            builtYear: {
              value: builtYear,
              style: fieldStyles.builtYear || ({} as TextStyle),
            },
            number: {
              value: number,
              style: fieldStyles.number || ({} as TextStyle),
            },
            addressCode: {
              value: addressCode,
              style: fieldStyles.addressCode || ({} as TextStyle),
            },
            cityLine: {
              value: cityLine,
              style: fieldStyles.cityLine || ({} as TextStyle),
            },
            mlsNumber: {
              value: mlsNumber,
              style: fieldStyles.mlsNumber || ({} as TextStyle),
            },
            propertyName: {
              value: propertyName,
              style: fieldStyles.propertyName || ({} as TextStyle),
            },
          },
          images,
          imageScales: scale,
          imagePositions: position,
        });
        return payload;
      },

      importFromPayload: (payload: FeatureSheetResponse) => {
        const state = featureSheetService.parsePayloadToState(payload);
        const s = (val: any) =>
          typeof val === "string" ? val : val?.value || "";

        if (state.offeredAtPrice) setAmount(s(state.offeredAtPrice));
        if (state.realtorName) setFullName(s(state.realtorName));
        if (state.emailLink) setEmail(s(state.emailLink));
        if (state.propertyNotesTitle) setRoadName(s(state.propertyNotesTitle));
        if (state.propertyNotesDescription)
          setDescription(s(state.propertyNotesDescription));

        if (state.expandedDetail1Description)
          setByLawRestrictions(s(state.expandedDetail1Description));
        if (state.expandedDetail2Description)
          setMaintFees(s(state.expandedDetail2Description));
        if (state.expandedDetail3Description)
          setMaintFeesInclude(s(state.expandedDetail3Description));
        if (state.expandedDetail4Description)
          setFeaturesIncluded(s(state.expandedDetail4Description));

        if (state.keyHighlights)
          setSiteInfluences(
            Array.isArray(state.keyHighlights)
              ? state.keyHighlights.map((h) => s(h)).join("\n")
              : s(state.keyHighlights),
          );

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
          if (details.amenities) setAmenities(s(details.amenities));
          if (details.view) setView(s(details.view));
          if (details.bedroom) setBedroom(s(details.bedroom));
          if (details.bathroom) setBathroom(s(details.bathroom));
          if (details.sqft) setSqft(s(details.sqft));
          if (details.builtYear) setBuiltYear(s(details.builtYear));
          if (details.number) setNumber(s(details.number));
          if (details.addressCode) setAddressCode(s(details.addressCode));
          if (details.cityLine) setCityLine(s(details.cityLine));
          if (details.mlsNumber) setMlsNumber(s(details.mlsNumber));
          if (details.propertyName) setPropertyName(s(details.propertyName));
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
      },
    }));

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
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      if (ref.current) ref.current.value = "";
    };

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        return { ...prev, [key]: Math.min(Math.max(newScale, 0.1), 5) };
      });
    };

    const handleRotate = (key: keyof typeof images) => {
      setRotation((prev) => ({ ...prev, [key]: (prev[key] + 90) % 360 }));
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

      setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    return (
      <div className="w-full flex flex-col items-center justify-center font-alexandria py-8 gap-0">
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

        {/* TOP SHEET BANNERS (PAGE 4 | PAGE 1) */}
        <div
          data-html2canvas-ignore="true"
          className="w-[17in] flex items-center justify-between gap-6 select-none"
          style={{ zoom: 0.55, margin: "0 auto 32px auto" }}
        >
          <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
            PAGE 4
          </div>
          <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
            PAGE 1
          </div>
        </div>

        {/* PAGE 1 Sheet */}
        <div
          className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
          style={{
            width: "17in",
            height: "11in",
            zoom: 0.55,
            margin: "0 auto",
            marginBottom: "40px",
          }}
        >
          <div className="w-full flex justify-center font-alexandria h-full">
            {/* Page 1 Left Half */}
            <div className="w-1/2 flex flex-col bg-[#43454B]">
              <div className="relative z-10">
                <svg
                  viewBox="163 83 631 114"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className=""
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

                {/* image1 logo */}
                <div className="absolute top-[18px] right-[68px] group z-20">
                  <div className="w-[200px] h-[94px] relative overflow-hidden group">
                    <div
                      className="w-full h-full relative overflow-hidden flex items-center justify-center"
                      onMouseMove={(e) => handleMouseMove("image1", e)}
                      onMouseUp={() => handleMouseUp("image1")}
                      onMouseLeave={() => handleMouseLeave("image1")}
                    >
                      {images.image1 ? (
                        <>
                          <div
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleMouseDown("image1", e)}
                          >
                            <ImageEditor
                              src={images.image1}
                              scale={scale.image1}
                              position={position.image1}
                              rotation={rotation.image1}
                            />
                          </div>

                          <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                            onClick={() => handleRotate("image1")}
                            className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openImageSourceModal("image1")}
                            className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image1", fileInputRef1)
                            }
                            className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Delete image"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          onClick={() => openImageSourceModal("image1")}
                          className="w-[200px] h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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

                <div className="absolute top-[15px] left-[35px] z-20 text-black">
                  <div className="font-bold text-[11px] flex gap-2">
                    <span className="font-normal">CONTACT:</span>
                    <StyledInput
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      inputStyle={fieldStyles.fullName}
                      onChangeStyle={(style) =>
                        updateFieldStyle("fullName", style)
                      }
                      rows={1}
                      className="text-[11px] text-[#B3B394] h-[18px] bg-transparent text-left w-full focus:outline-none border-none placeholder-black placeholder:font-[500]"
                      placeholder="FIRSTNAME LASTNAME"
                    />
                  </div>
                  <StyledInput
                    value={propertyName}
                    rows={1}
                    onChange={(e) => setPropertyName(e.target.value)}
                    inputStyle={fieldStyles.propertyName}
                    onChangeStyle={(style) =>
                      updateFieldStyle("propertyName", style)
                    }
                    className="text-[11px] font-thin h-[18px] bg-transparent text-left text-black w-full focus:outline-none border-none placeholder-black placeholder:font-[200]"
                    placeholder="MACDONALD Realty"
                  />
                  <div className="flex gap-2">
                    <div className="flex gap-2 text-black text-[11px]">
                      PHONE:
                      <StyledInput
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        inputStyle={fieldStyles.number}
                        onChangeStyle={(style) =>
                          updateFieldStyle("number", style)
                        }
                        rows={1}
                        className="font-thin inline text-[11px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-black placeholder:font-[500]"
                        placeholder="604.000.0000"
                      />
                    </div>
                    <div className="flex gap-2 text-black text-[11px]">
                      EMAIL:
                      <StyledInput
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        inputStyle={fieldStyles.email}
                        onChangeStyle={(style) =>
                          updateFieldStyle("email", style)
                        }
                        rows={1}
                        className="font-thin inline text-[11px] h-[22px] bg-transparent text-left w-[180px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                        placeholder="FIRST@LAST.COM"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* image2 */}
              <div className="px-[50px] pt-[50px]">
                <div className="w-[658px] h-[700px] place-self-center border-2 border-[#fff] relative overflow-hidden group">
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center"
                    onMouseMove={(e) => handleMouseMove("image2", e)}
                    onMouseUp={() => handleMouseUp("image2")}
                    onMouseLeave={() => handleMouseLeave("image2")}
                  >
                    {images.image2 ? (
                      <>
                        <div
                          className="w-full h-full cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handleMouseDown("image2", e)}
                        >
                          <ImageEditor
                            src={images.image2}
                            scale={scale.image2}
                            position={position.image2}
                            rotation={rotation.image2}
                          />
                        </div>

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                          onClick={() => handleRotate("image2")}
                          className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image2")}
                          className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image2", fileInputRef2)}
                          className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
              </div>

              <div className="relative px-[30px] py-[10px]">
                <div className="relative px-6 py-2 z-20 text-white">
                  <p className="text-[6px] w-[67%] leading-tight">
                    All information deemed reliable but not guaranteed and
                    should be independently verified. All properties are subject
                    to prior sale, change or withdrawal. Neither listing
                    broker(s) nor BC Floor Plans shall be responsible for any
                    typographical errors, misinformation, misprints and shall be
                    held totally harmless.
                  </p>
                  <p className="font-bold text-[10px]">
                    DESIGNED AND PRINTED BY BC FLOOR PLANS
                  </p>
                </div>
              </div>
            </div>

            {/* Page 1 Right Half */}
            <div className="w-1/2 bg-[#43454B] flex flex-col relative">
              {/* image3 */}
              <div className="absolute top-[115px] z-10 flex justify-center self-center">
                <div className="w-[200px] h-[94px] relative overflow-hidden group">
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center"
                    onMouseMove={(e) => handleMouseMove("image3", e)}
                    onMouseUp={() => handleMouseUp("image3")}
                    onMouseLeave={() => handleMouseLeave("image3")}
                  >
                    {images.image3 ? (
                      <>
                        <div
                          className="w-full h-full cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handleMouseDown("image3", e)}
                        >
                          <ImageEditor
                            src={images.image3}
                            scale={scale.image3}
                            position={position.image3}
                            rotation={rotation.image3}
                          />
                        </div>

                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                          onClick={() => handleRotate("image3")}
                          className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image3")}
                          className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image3", fileInputRef3)}
                          className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        onClick={() => openImageSourceModal("image3")}
                        className="w-[200px] h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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
                </div>
              </div>

              <div className="grid grid-cols-4 mt-[35px]">
                {/* image4 */}
                <div className="h-[116px] relative group border-2 border-[#ffffff] overflow-hidden">
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center"
                    onMouseMove={(e) => handleMouseMove("image4", e)}
                    onMouseUp={() => handleMouseUp("image4")}
                    onMouseLeave={() => handleMouseLeave("image4")}
                  >
                    {images.image4 ? (
                      <>
                        <div
                          className="w-full h-full cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handleMouseDown("image4", e)}
                        >
                          <ImageEditor
                            src={images.image4}
                            scale={scale.image4}
                            position={position.image4}
                            rotation={rotation.image4}
                          />
                        </div>

                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                          onClick={() => handleRotate("image4")}
                          className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image4")}
                          className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image4", fileInputRef4)}
                          className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                </div>

                {/* image5 */}
                <div className="h-[116px] relative group border-2 border-[#ffffff] overflow-hidden">
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center"
                    onMouseMove={(e) => handleMouseMove("image5", e)}
                    onMouseUp={() => handleMouseUp("image5")}
                    onMouseLeave={() => handleMouseLeave("image5")}
                  >
                    {images.image5 ? (
                      <>
                        <div
                          className="w-full h-full cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handleMouseDown("image5", e)}
                        >
                          <ImageEditor
                            src={images.image5}
                            scale={scale.image5}
                            position={position.image5}
                            rotation={rotation.image5}
                          />
                        </div>

                        <div className="absolute bottom-2 left-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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
                          onClick={() => handleRotate("image5")}
                          className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image5")}
                          className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image5", fileInputRef5)}
                          className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                {/* image6 */}
                <div className="h-[116px] relative group border-2 border-[#ffffff] overflow-hidden">
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center"
                    onMouseMove={(e) => handleMouseMove("image6", e)}
                    onMouseUp={() => handleMouseUp("image6")}
                    onMouseLeave={() => handleMouseLeave("image6")}
                  >
                    {images.image6 ? (
                      <>
                        <div
                          className="w-full h-full cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handleMouseDown("image6", e)}
                        >
                          <ImageEditor
                            src={images.image6}
                            scale={scale.image6}
                            position={position.image6}
                            rotation={rotation.image6}
                          />
                        </div>

                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                        <button
                          type="button"
                          onClick={() => handleRotate("image6")}
                          className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image6")}
                          className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image6", fileInputRef6)}
                          className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                {/* image7 */}
                <div className="h-[116px] relative group border-2 border-[#ffffff] overflow-hidden">
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center"
                    onMouseMove={(e) => handleMouseMove("image7", e)}
                    onMouseUp={() => handleMouseUp("image7")}
                    onMouseLeave={() => handleMouseLeave("image7")}
                  >
                    {images.image7 ? (
                      <>
                        <div
                          className="w-full h-full cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handleMouseDown("image7", e)}
                        >
                          <ImageEditor
                            src={images.image7}
                            scale={scale.image7}
                            position={position.image7}
                            rotation={rotation.image7}
                          />
                        </div>

                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                        <button
                          type="button"
                          onClick={() => handleRotate("image7")}
                          className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image7")}
                          className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image7", fileInputRef7)}
                          className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

              {/* image8 */}
              <div className="relative">
                <div className="w-full h-[420px] place-self-center border-2 border-[#ffffff] relative overflow-hidden group">
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center"
                    onMouseMove={(e) => handleMouseMove("image8", e)}
                    onMouseUp={() => handleMouseUp("image8")}
                    onMouseLeave={() => handleMouseLeave("image8")}
                  >
                    {images.image8 ? (
                      <>
                        <div
                          className="w-full h-full cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handleMouseDown("image8", e)}
                        >
                          <ImageEditor
                            src={images.image8}
                            scale={scale.image8}
                            position={position.image8}
                            rotation={rotation.image8}
                          />
                        </div>

                        <div className="absolute bottom-14 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
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

                        <button
                          type="button"
                          onClick={() => handleRotate("image8")}
                          className="absolute top-12 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image8")}
                          className="absolute top-12 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image8", fileInputRef8)}
                          className="absolute top-12 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        onClick={() => openImageSourceModal("image8")}
                        className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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

                {/* Overlay Inputs */}
                <div className="absolute bottom-0 right-0 left-0 w-full py-2 place-items-center place-self-center bg-white/75 z-20">
                  <div className="font-bold text-[14px] text-[#2C2E35] flex flex-wrap items-center gap-2 justify-center">
                    <div className="inline">
                      <StyledInput
                        value={bedroom}
                        onChange={(e) => setBedroom(e.target.value)}
                        inputStyle={fieldStyles.bedroom}
                        onChangeStyle={(style) =>
                          updateFieldStyle("bedroom", style)
                        }
                        className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                        placeholder="0"
                      />
                    </div>
                    BEDROOM •
                    <div className="inline">
                      <StyledInput
                        value={bathroom}
                        onChange={(e) => setBathroom(e.target.value)}
                        inputStyle={fieldStyles.bathroom}
                        onChangeStyle={(style) =>
                          updateFieldStyle("bathroom", style)
                        }
                        className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                        placeholder="0"
                      />
                    </div>
                    BATHROOM •
                    <div className="inline">
                      <StyledInput
                        value={sqft}
                        onChange={(e) => setSqft(e.target.value)}
                        inputStyle={fieldStyles.sqft}
                        onChangeStyle={(style) =>
                          updateFieldStyle("sqft", style)
                        }
                        className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                        placeholder="000"
                      />
                    </div>
                    SQ FT • BUILT IN
                    <div className="inline">
                      <StyledInput
                        value={builtYear}
                        onChange={(e) => setBuiltYear(e.target.value)}
                        inputStyle={fieldStyles.builtYear}
                        onChangeStyle={(style) =>
                          updateFieldStyle("builtYear", style)
                        }
                        className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                        placeholder="0000"
                      />
                    </div>
                    •
                    <div className="inline">
                      <StyledInput
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        inputStyle={fieldStyles.amount}
                        onChangeStyle={(style) =>
                          updateFieldStyle("amount", style)
                        }
                        className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[80px] focus:outline-none border-none placeholder-black placeholder:font-[500]"
                        placeholder="$000,000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-white flex flex-col items-center justify-center py-10 space-y-2">
                <div className="tracking-wide mt-0 flex">
                  #
                  <StyledInput
                    value={addressCode}
                    onChange={(e) => setAddressCode(e.target.value)}
                    inputStyle={fieldStyles.addressCode}
                    onChangeStyle={(style) =>
                      updateFieldStyle("addressCode", style)
                    }
                    className="font-light text-[30px] h-[30px] w-[250px] leading-none mt-0 bg-transparent text-[#FFF] text-left focus:outline-none border-none placeholder-[#FFF] placeholder:font-[200]"
                    placeholder="0000-0000"
                  />
                </div>
                <div className="text-[60px] font-light leading-none mt-0 flex">
                  Number
                  <StyledInput
                    value={roadName}
                    onChange={(e) => setRoadName(e.target.value)}
                    inputStyle={fieldStyles.roadName}
                    onChangeStyle={(style) =>
                      updateFieldStyle("roadName", style)
                    }
                    className="font-light text-[30px] h-[30px] leading-none mt-0 bg-transparent text-[#fff] text-center w-[65px] focus:outline-none border-none placeholder-[#fff] placeholder:font-[200]"
                    placeholder="0"
                  />
                  Road
                </div>
                <div className="tracking-[2px] uppercase mt-0 flex justify-center">
                  <StyledInput
                    value={cityLine}
                    onChange={(e) => setCityLine(e.target.value)}
                    inputStyle={fieldStyles.cityLine}
                    onChangeStyle={(style) =>
                      updateFieldStyle("cityLine", style)
                    }
                    className="text-white text-[13px] h-[20px] bg-transparent text-center w-[300px] focus:outline-none border-none placeholder-[#FFF] placeholder:font-[200]"
                    placeholder="BRIGHOUSE SOUTH, RICHMOND"
                  />
                </div>
                <div className="text-[30px] font-light mt-0">
                  <StyledInput
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputStyle={fieldStyles.amount}
                    onChangeStyle={(style) => updateFieldStyle("amount", style)}
                    className="font-semibold text-center text-[#fff] text-[30px] h-[40px] bg-transparent w-[200px] focus:outline-none border-none placeholder-[#fff] placeholder:font-[500]"
                    placeholder="$000,000"
                  />
                </div>
              </div>

              <svg
                viewBox="163 79 631 114"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className=""
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
            </div>
          </div>
        </div>

        {/* BOTTOM SHEET BANNERS (PAGE 2 | PAGE 3) */}
        <div
          data-html2canvas-ignore="true"
          className="w-[17in] flex items-center justify-between gap-6 select-none"
          style={{ zoom: 0.55, margin: "48px auto 32px auto" }}
        >
          <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
            PAGE 2
          </div>
          <div className="w-1/2 text-center text-gray-500 font-semibold text-[20px] tracking-widest uppercase">
            PAGE 3
          </div>
        </div>

        {/* PAGE 2 Sheet */}
        <div
          className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
          style={{
            width: "17in",
            height: "11in",
            zoom: 0.55,
            margin: "0 auto",
            marginBottom: "40px",
          }}
        >
          <div className="w-full flex flex-col bg-[#43454B] justify-center font-alexandria relative h-full">
            <div className="flex gap-4 relative z-[1] h-full">
              {/* Page 2 Left Half */}
              <div className="w-1/2 flex flex-col gap-4 pl-[50px] py-[50px]">
                <div className="flex gap-4">
                  <div className="grid grid-cols-1 gap-4 w-[50%]">
                    {/* image9 */}
                    <div className="h-[200px] relative group border-2 border-[#ffffff] overflow-hidden">
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image9", e)}
                        onMouseUp={() => handleMouseUp("image9")}
                        onMouseLeave={() => handleMouseLeave("image9")}
                      >
                        {images.image9 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image9", e)}
                            >
                              <ImageEditor
                                src={images.image9}
                                scale={scale.image9}
                                position={position.image9}
                                rotation={rotation.image9}
                              />
                            </div>

                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image9", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image9", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRotate("image9")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image9")}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image9", fileInputRef9)
                              }
                              className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image9")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef9}
                          onChange={(e) => handleImageChange("image9", e)}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* image10 */}
                    <div className="h-[200px] relative group border-2 border-[#ffffff] overflow-hidden">
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image10", e)}
                        onMouseUp={() => handleMouseUp("image10")}
                        onMouseLeave={() => handleMouseLeave("image10")}
                      >
                        {images.image10 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image10", e)}
                            >
                              <ImageEditor
                                src={images.image10}
                                scale={scale.image10}
                                position={position.image10}
                                rotation={rotation.image10}
                              />
                            </div>

                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image10", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image10", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRotate("image10")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image10")}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image10", fileInputRef10)
                              }
                              className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image10")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef10}
                          onChange={(e) => handleImageChange("image10", e)}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] w-[50%] flex flex-col font-normal text-white italic relative z-10 leading-[1.6]">
                    <h2 className="text-[22px] tracking-[-1px] font-bold mb-4">
                      ON TOP OF IT ALL! BEAUTIFUL SUB-PENTHOUSE IN THE WELL
                      APPOINTED CENTRO BUILDING.
                    </h2>
                    <StyledInput
                      value={description}
                      rows={10}
                      onChange={(e) => setDescription(e.target.value)}
                      inputStyle={fieldStyles.description}
                      onChangeStyle={(style) =>
                        updateFieldStyle("description", style)
                      }
                      className="font-normal text-[10px] h-[200px] z-20 text-white leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                      placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS..."
                    />
                  </div>
                </div>

                {/* image11 */}
                <div className="w-full h-[420px] place-self-center z-10 relative border-2 border-[#ffffff] overflow-hidden group">
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center"
                    onMouseMove={(e) => handleMouseMove("image11", e)}
                    onMouseUp={() => handleMouseUp("image11")}
                    onMouseLeave={() => handleMouseLeave("image11")}
                  >
                    {images.image11 ? (
                      <>
                        <div
                          className="w-full h-full cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => handleMouseDown("image11", e)}
                        >
                          <ImageEditor
                            src={images.image11}
                            scale={scale.image11}
                            position={position.image11}
                            rotation={rotation.image11}
                          />
                        </div>

                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                          <button
                            type="button"
                            onClick={() => handleZoom("image11", "in")}
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoom("image11", "out")}
                            className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRotate("image11")}
                          className="absolute top-10 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image11")}
                          className="absolute top-10 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete("image11", fileInputRef11)
                          }
                          className="absolute top-10 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        onClick={() => openImageSourceModal("image11")}
                        className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                      >
                        Select Image
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef11}
                      onChange={(e) => handleImageChange("image11", e)}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Page 2 Right Half */}
              <div className="w-1/2 flex gap-4">
                <div className="w-[45%] py-[50px]">
                  <div className="grid grid-cols-1 gap-4">
                    {/* image12 */}
                    <div className="h-[200px] relative z-10 group border-2 border-[#ffffff] overflow-hidden">
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image12", e)}
                        onMouseUp={() => handleMouseUp("image12")}
                        onMouseLeave={() => handleMouseLeave("image12")}
                      >
                        {images.image12 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image12", e)}
                            >
                              <ImageEditor
                                src={images.image12}
                                scale={scale.image12}
                                position={position.image12}
                                rotation={rotation.image12}
                              />
                            </div>
                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image12", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image12", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRotate("image12")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image12")}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image12", fileInputRef12)
                              }
                              className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image12")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef12}
                          onChange={(e) => handleImageChange("image12", e)}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* image13 */}
                    <div className="h-[200px] relative z-10 group border-2 border-[#ffffff] overflow-hidden">
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image13", e)}
                        onMouseUp={() => handleMouseUp("image13")}
                        onMouseLeave={() => handleMouseLeave("image13")}
                      >
                        {images.image13 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image13", e)}
                            >
                              <ImageEditor
                                src={images.image13}
                                scale={scale.image13}
                                position={position.image13}
                                rotation={rotation.image13}
                              />
                            </div>
                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image13", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image13", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRotate("image13")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image13")}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image13", fileInputRef13)
                              }
                              className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image13")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef13}
                          onChange={(e) => handleImageChange("image13", e)}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* image14 */}
                    <div className="h-[200px] relative z-10 group border-2 border-[#ffffff] overflow-hidden">
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image14", e)}
                        onMouseUp={() => handleMouseUp("image14")}
                        onMouseLeave={() => handleMouseLeave("image14")}
                      >
                        {images.image14 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image14", e)}
                            >
                              <ImageEditor
                                src={images.image14}
                                scale={scale.image14}
                                position={position.image14}
                                rotation={rotation.image14}
                              />
                            </div>
                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image14", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image14", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRotate("image14")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image14")}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image14", fileInputRef14)
                              }
                              className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image14")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef14}
                          onChange={(e) => handleImageChange("image14", e)}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* image15 */}
                    <div className="h-[200px] relative z-10 group border-2 border-[#ffffff] overflow-hidden">
                      <div
                        className="w-full h-full relative overflow-hidden flex items-center justify-center"
                        onMouseMove={(e) => handleMouseMove("image15", e)}
                        onMouseUp={() => handleMouseUp("image15")}
                        onMouseLeave={() => handleMouseLeave("image15")}
                      >
                        {images.image15 ? (
                          <>
                            <div
                              className="w-full h-full cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => handleMouseDown("image15", e)}
                            >
                              <ImageEditor
                                src={images.image15}
                                scale={scale.image15}
                                position={position.image15}
                                rotation={rotation.image15}
                              />
                            </div>
                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                              <button
                                type="button"
                                onClick={() => handleZoom("image15", "in")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleZoom("image15", "out")}
                                className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRotate("image15")}
                              className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image15")}
                              className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image15", fileInputRef15)
                              }
                              className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <div
                            onClick={() => openImageSourceModal("image15")}
                            className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                          >
                            Select Image
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef15}
                          onChange={(e) => handleImageChange("image15", e)}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-[55%] flex flex-col gap-4 bg-white/50 pr-[50px] py-[50px] pl-[20px]">
                  {/* image17 */}
                  <div className="h-[200px] relative z-10 group border-2 border-[#ffffff] overflow-hidden">
                    <div
                      className="w-full h-full relative overflow-hidden flex items-center justify-center"
                      onMouseMove={(e) => handleMouseMove("image17", e)}
                      onMouseUp={() => handleMouseUp("image17")}
                      onMouseLeave={() => handleMouseLeave("image17")}
                    >
                      {images.image17 ? (
                        <>
                          <div
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleMouseDown("image17", e)}
                          >
                            <ImageEditor
                              src={images.image17}
                              scale={scale.image17}
                              position={position.image17}
                              rotation={rotation.image17}
                            />
                          </div>

                          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                            <button
                              type="button"
                              onClick={() => handleZoom("image17", "in")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom("image17", "out")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRotate("image17")}
                            className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openImageSourceModal("image17")}
                            className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image17", fileInputRef17)
                            }
                            className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Delete image"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          onClick={() => openImageSourceModal("image17")}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                        >
                          Select Image
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef17}
                        onChange={(e) => handleImageChange("image17", e)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 text-[#595B61] text-[12px] leading-relaxed">
                    <div className="w-1/2 space-y-2 text-[8px]">
                      <div>
                        <span className="font-bold">BY-LAW RESTRICTIONS:</span>{" "}
                        <StyledInput
                          value={byLawRestrictions}
                          rows={1}
                          onChange={(e) => setByLawRestrictions(e.target.value)}
                          inputStyle={fieldStyles.byLawRestrictions}
                          onChangeStyle={(style) =>
                            updateFieldStyle("byLawRestrictions", style)
                          }
                          className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                          placeholder="Pets Allowed w/Rest., Rentals Allowed"
                        />
                      </div>
                      <div>
                        <span className="font-bold">MAINT. FEES:</span>{" "}
                        <StyledInput
                          value={maintFees}
                          rows={1}
                          onChange={(e) => setMaintFees(e.target.value)}
                          inputStyle={fieldStyles.maintFees}
                          onChangeStyle={(style) =>
                            updateFieldStyle("maintFees", style)
                          }
                          className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                          placeholder="$000.00"
                        />
                      </div>
                      <div>
                        <span className="font-bold">MAINT. FEES INCLUDE:</span>
                        <StyledInput
                          value={maintFeesInclude}
                          onChange={(e) => setMaintFeesInclude(e.target.value)}
                          inputStyle={fieldStyles.maintFeesInclude}
                          onChangeStyle={(style) =>
                            updateFieldStyle("maintFeesInclude", style)
                          }
                          className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                          placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"
                        />
                      </div>
                      <div>
                        <span className="font-bold">FEATURES INCLUDED:</span>
                        <StyledInput
                          value={featuresIncluded}
                          onChange={(e) => setFeaturesIncluded(e.target.value)}
                          inputStyle={fieldStyles.featuresIncluded}
                          onChangeStyle={(style) =>
                            updateFieldStyle("featuresIncluded", style)
                          }
                          className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                          placeholder="Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings"
                        />
                      </div>
                    </div>
                    <div className="w-1/2 space-y-2 text-[8px]">
                      <div>
                        <span className="font-bold">SITE INFLUENCES:</span>
                        <StyledInput
                          value={siteInfluences}
                          onChange={(e) => setSiteInfluences(e.target.value)}
                          inputStyle={fieldStyles.siteInfluences}
                          onChangeStyle={(style) =>
                            updateFieldStyle("siteInfluences", style)
                          }
                          className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                          placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                        />
                      </div>
                      <div>
                        <span className="font-bold">AMENITIES:</span>
                        <StyledInput
                          value={amenities}
                          onChange={(e) => setAmenities(e.target.value)}
                          inputStyle={fieldStyles.amenities}
                          onChangeStyle={(style) =>
                            updateFieldStyle("amenities", style)
                          }
                          className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                          placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                        />
                      </div>
                      <div>
                        <span className="font-bold">VIEW:</span>{" "}
                        <StyledInput
                          value={view}
                          rows={1}
                          onChange={(e) => setView(e.target.value)}
                          inputStyle={fieldStyles.view}
                          onChangeStyle={(style) =>
                            updateFieldStyle("view", style)
                          }
                          className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                          placeholder="South & SW - Van Isl."
                        />
                      </div>
                      <div className="mt-0">
                        <StyledInput
                          value={mlsNumber}
                          onChange={(e) => setMlsNumber(e.target.value)}
                          inputStyle={fieldStyles.mlsNumber}
                          onChangeStyle={(style) =>
                            updateFieldStyle("mlsNumber", style)
                          }
                          className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#595B61] placeholder:font-[500]"
                          placeholder="Enter MLS here"
                        />
                      </div>
                    </div>
                  </div>

                  {/* image18 */}
                  <div className="w-full h-[430px] place-self-center border-2 z-10 border-[#fff] relative overflow-hidden group">
                    <div
                      className="w-full h-full relative overflow-hidden flex items-center justify-center"
                      onMouseMove={(e) => handleMouseMove("image18", e)}
                      onMouseUp={() => handleMouseUp("image18")}
                      onMouseLeave={() => handleMouseLeave("image18")}
                    >
                      {images.image18 ? (
                        <>
                          <div
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => handleMouseDown("image18", e)}
                          >
                            <ImageEditor
                              src={images.image18}
                              scale={scale.image18}
                              position={position.image18}
                              rotation={rotation.image18}
                            />
                          </div>

                          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20">
                            <button
                              type="button"
                              onClick={() => handleZoom("image18", "in")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom In"
                            >
                              <ZoomIn className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleZoom("image18", "out")}
                              className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                              title="Zoom Out"
                            >
                              <ZoomOut className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRotate("image18")}
                            className="absolute top-2 right-[72px] z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                            title="Rotate image"
                          >
                            <RotateCw className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openImageSourceModal("image18")}
                            className="absolute top-2 right-10 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4 text-gray-700" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete("image18", fileInputRef18)
                            }
                            className="absolute top-2 right-2 z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                            title="Delete image"
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      ) : (
                        <div
                          onClick={() => openImageSourceModal("image18")}
                          className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
                        >
                          Select Image
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef18}
                        onChange={(e) => handleImageChange("image18", e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <svg
              viewBox="164 80 628 81.73"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute bottom-25 left-0 right-0 pointer-events-none"
            >
              <path
                opacity="0.350006"
                d="M792 116.5C792 116.5 654.323 174.19 439.12 105.904C223.916 37.6178 164 125.936 164 125.936C164 125.936 210.5 45.0673 441.5 123.5C656.5 196.5 792 142.5 792 142.5V118.5"
                fill="white"
              ></path>
              <g opacity="0.350006" filter="url(#filter0_d_36_1418)">
                <path
                  d="M792 136.347C792 136.347 677.111 184.924 461.737 122.645C221.546 32.1944 164 126 164 126V128C164 128 218.35 46.7071 461.737 129C652.5 193.5 792 142.5 792 142.5V136.347Z"
                  fill="black"
                ></path>
              </g>
              <defs>
                <filter
                  id="filter0_d_36_1418"
                  x="0"
                  y="0.296387"
                  width="952"
                  height="402.344"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood
                    floodOpacity="0"
                    result="BackgroundImageFix"
                  ></feFlood>
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  ></feColorMatrix>
                  <feOffset dx="-2" dy="79"></feOffset>
                  <feGaussianBlur stdDeviation="81"></feGaussianBlur>
                  <feComposite in2="hardAlpha" operator="out"></feComposite>
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                  ></feColorMatrix>
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_36_1418"
                  ></feBlend>
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_36_1418"
                    result="shape"
                  ></feBlend>
                </filter>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    );
  },
);

BcfpStandard11.displayName = "BcfpStandard11";

export default BcfpStandard11;
