import { House, Pencil, Trash, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import FileManagerGallery from "./fileManagerGallery";
import ImageSourceModal from "./ImageSourceModal";
import { featureSheetService } from "../file-manager";
import type {
  FeatureSheetPayload,
  FeatureSheetResponse,
  TextStyle,
} from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";

export interface BcfpStandard14Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard14Props {
  orderData: Order | null;
}

const BcfpStandard14 = forwardRef<BcfpStandard14Ref, BcfpStandard14Props>(
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
    const fileInputRef14 = useRef<HTMLInputElement | null>(null);
    const fileInputRef15 = useRef<HTMLInputElement | null>(null);
    const fileInputRef16 = useRef<HTMLInputElement | null>(null);

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
          if (prop.mls_number) setMlsNumber(prop.mls_number);

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
          templateKey: "BCFPStandard14",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#3A8D3D",
          offeredAtPrice: {
            value: amount,
            style: fieldStyles.amount || ({} as TextStyle),
          },
          realtorName: {
            value: fullName,
            style: fieldStyles.fullName || ({} as TextStyle),
          },
          emailLink: email,
          companyName: propertyName,
          propertyNotesTitle: roadName,
          propertyNotesDescription: {
            value: description,
            style: fieldStyles.description || ({} as TextStyle),
          },
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
        if (state.companyName) setPropertyName(s(state.companyName));
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
          setSiteInfluences(state.keyHighlights.join("\n"));

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

    const openImageSourceModal = (imageSlot: string) => {
      setCurrentImageSlot(imageSlot);
      setShowImageSourceModal(true);
    };

    // Helper renderer for image slot to keep code clean while using 3-layer pattern
    const renderImageSlot = (
      slotKey: keyof typeof images,
      ref: React.RefObject<HTMLInputElement | null>,
      containerClass: string,
      zoomClass = "bottom-3 right-3",
      editClass = "top-2 right-10",
      deleteClass = "top-2 right-2",
      rotateClass = "top-2 right-[72px]",
    ) => (
      <div
        className={`${containerClass} relative overflow-hidden group select-none`}
      >
        <div
          className="w-full h-full relative overflow-hidden flex items-center justify-center"
          onMouseMove={(e) => handleMouseMove(slotKey, e)}
          onMouseUp={() => handleMouseUp(slotKey)}
          onMouseLeave={() => handleMouseLeave(slotKey)}
        >
          {images[slotKey] ? (
            <>
              <div
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => handleMouseDown(slotKey, e)}
              >
                <ImageEditor
                  src={images[slotKey]!}
                  scale={scale[slotKey]}
                  position={position[slotKey]}
                  rotation={rotation[slotKey]}
                />
              </div>

              {/* Zoom Controls */}
              <div
                className={`absolute ${zoomClass} flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-20`}
              >
                <button
                  type="button"
                  onClick={() => handleZoom(slotKey, "in")}
                  className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={() => handleZoom(slotKey, "out")}
                  className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              {/* Rotate */}
              <button
                type="button"
                onClick={() => handleRotate(slotKey)}
                className={`absolute ${rotateClass} z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden`}
                title="Rotate image"
              >
                <RotateCw className="w-4 h-4 text-gray-700" />
              </button>

              {/* Edit & Delete */}
              <button
                type="button"
                onClick={() => openImageSourceModal(slotKey)}
                className={`absolute ${editClass} z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto`}
                title="Edit image"
              >
                <Pencil className="w-4 h-4 text-gray-700" />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(slotKey, ref)}
                className={`absolute ${deleteClass} z-20 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto`}
                title="Delete image"
              >
                <Trash className="w-4 h-4 text-red-500" />
              </button>
            </>
          ) : (
            <div
              onClick={() => openImageSourceModal(slotKey)}
              className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
            >
              Select Image
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            ref={ref}
            onChange={(e) => handleImageChange(slotKey, e)}
            className="hidden"
          />
        </div>
      </div>
    );

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

        {/* PAGE 1 Sheet Container */}
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
          <div className="flex w-full">
            <div className="w-full flex flex-col bg-[#ffffff] justify-center font-alexandria relative">
              <div className="absolute top-0 left-0 z-10 bg-black w-full h-[700px]">
                {renderImageSlot("image1", fileInputRef1, "w-full h-full")}
              </div>

              <div className="flex flex-col gap-1 absolute top-0 left-[50px] w-[170px] z-20">
                <div
                  className="p-3 pt-[70px]"
                  style={{
                    background:
                      "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                  }}
                >
                  <div className="font-bold text-[11px] text-[#B3B394] flex flex-col">
                    <span className="font-normal">CONTACT:</span>
                    <StyledInput
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      rows={1}
                      inputStyle={fieldStyles["fullName"]}
                      onChangeStyle={(s) => updateFieldStyle("fullName", s)}
                      className=" text-[11px] text-[#B3B394] h-[18px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[500]"
                      placeholder="FIRSTNAME LASTNAME"
                    />
                  </div>
                  <StyledInput
                    value={propertyName}
                    rows={1}
                    onChange={(e) => setPropertyName(e.target.value)}
                    inputStyle={fieldStyles["propertyName"]}
                    onChangeStyle={(s) => updateFieldStyle("propertyName", s)}
                    className=" text-[11px] font-bold h-[18px] font- bg-transparent text-left text-white w-full focus:outline-none border-none placeholder-white placeholder:font-[200]"
                    placeholder="Macdonald Realty"
                  />
                  <hr className="border-t-2 my-2 border-dotted border-white w-full" />
                  <div className="flex flex-col ">
                    <div className="flex gap-2 text-white text-[9px]">
                      PHONE:
                      <StyledInput
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        rows={1}
                        inputStyle={fieldStyles["number"]}
                        onChangeStyle={(s) => updateFieldStyle("number", s)}
                        className="font-thin inline text-[9px] h-[16px] bg-transparent text-left w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
                        placeholder="604.000.0000"
                      />
                    </div>
                    <div className="flex gap-2 text-white text-[9px]">
                      EMAIL:
                      <StyledInput
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        rows={1}
                        inputStyle={fieldStyles["email"]}
                        onChangeStyle={(s) => updateFieldStyle("email", s)}
                        className="font-thin inline text-[9px] h-[16px] bg-transparent text-left w-[180px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                        placeholder="FIRST@LAST.COM"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* page 4 */}
              <div className="absolute bottom-0 w-full">
                <div className="flex gap-2 absolute bottom-[70px] right-0 h-[30px]">
                  <div
                    className="opacity-[25%] w-[35px]"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  ></div>
                  <div
                    className="opacity-[50%] w-[35px]"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  ></div>
                  <div
                    className="opacity-[75%] w-[35px]"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  ></div>
                  <div
                    className="flex w-[350px]"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  ></div>
                </div>
                <div className="absolute bottom-0 right-0 px-6 py-2 z-2 w-[68%] gap-2 flex justify-self-center text-[#B3B394]">
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
                        d="M7.07922 6.6356C7.03422 6.6356 6.99122 6.6546 6.96222 6.6886C6.92922 6.7186 6.91022 6.7646 6.91022 6.8076C6.91022 6.8516 6.92722 6.8956 6.96222 6.9276C6.99122 6.9776 7.03422 6.9776 7.07922 6.9776C7.12522 6.9776 7.16922 6.9616 7.20322 6.9276C7.23322 6.8956 7.25122 6.8546 7.25122 6.8076C7.25122 6.7626 7.23322 6.7186 7.20322 6.6886C7.16922 6.6546 7.12722 6.6356 7.07922 6.6356ZM7.23322 6.8076C7.23322 6.8516 7.21822 6.8856 7.19022 6.9156C7.15922 6.9436 7.11922 6.9586 7.07922 6.9586C7.03922 6.9586 7.00322 6.9436 6.97422 6.9156C6.94422 6.8856 6.92922 6.8466 6.92922 6.8076C6.92922 6.7696 6.94422 6.7286 6.97422 6.6976C7.00322 6.6706 7.03822 6.6546 7.07922 6.6546C7.12122 6.6546 7.15922 6.6706 7.19022 6.7016C7.21622 6.7286 7.23322 6.7656 7.23322 6.8076ZM7.08722 6.7066H7.01222V6.9016H7.04322V6.8156H7.08822L7.13122 6.9016H7.16522L7.11922 6.8106C7.15022 6.8076 7.16722 6.7896 7.16722 6.7626C7.16722 6.7236 7.14122 6.7066 7.08722 6.7066ZM7.07922 6.7256C7.11822 6.7256 7.13822 6.7366 7.13822 6.7646C7.13822 6.7896 7.11822 6.7976 7.07922 6.7976H7.04322V6.7256H7.07922Z"
                        fill="#B3B394"
                      />
                    </svg>
                  </span>
                  <p className="text-[10px] leading-tight">
                    All information deemed reliable but not guaranteed and
                    should be independently verified. All properties are subject
                    to prior sale, change or withdrawal. Neither listing
                    broker(s) nor BC Floor Plans shall be responsible for any
                    typographical errors, misinformation, misprints and shall be
                    held totally harmless.
                  </p>
                </div>
                <div className="absolute left-[50px] bottom-[18px] group z-20">
                  {renderImageSlot(
                    "image2",
                    fileInputRef2,
                    "w-[180px] h-[105px] bg-white shadow-md",
                    "bottom-2 right-2",
                  )}
                </div>
              </div>
            </div>
            <div
              className="w-full flex flex-col pt-[70px] justify-center gap-3 font-alexandria relative"
              style={{
                background:
                  "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
              }}
            >
              <div className="relative">
                {renderImageSlot(
                  "image3",
                  fileInputRef3,
                  "w-full h-[500px] place-self-center]",
                )}

                <div className="flex gap-2 absolute bottom-[64px] right-0 z-20">
                  <div
                    className="opacity-[25%] w-[35px]"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  ></div>
                  <div
                    className="opacity-[50%] w-[35px]"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  ></div>
                  <div
                    className="opacity-[75%] w-[35px]"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  ></div>
                  <div
                    className="flex px-5 pr-[10px] py-1"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  >
                    <div className="font-bold items-center text-[14px] text-[#B3B394] flex flex-wrap gap-2">
                      <div className="inline">
                        <StyledInput
                          value={bedroom}
                          onChange={(e) => setBedroom(e.target.value)}
                          inputStyle={fieldStyles["bedroom"]}
                          onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
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
                          onChangeStyle={(s) => updateFieldStyle("bathroom", s)}
                          className="font-semibold text-[13px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="0"
                        />
                      </div>
                      BATHROOM |
                      <div className="inline">
                        <StyledInput
                          value={sqft}
                          onChange={(e) => setSqft(e.target.value)}
                          inputStyle={fieldStyles["sqft"]}
                          onChangeStyle={(s) => updateFieldStyle("sqft", s)}
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
                          onChangeStyle={(s) =>
                            updateFieldStyle("builtYear", s)
                          }
                          className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[45px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="0000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 absolute top-[2px] left-[50px] w-[150px] z-20">
                  <div
                    className="p-3"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                    }}
                  >
                    <div className="tracking-wide text-white mt-0 flex">
                      #
                      <StyledInput
                        value={addressCode}
                        onChange={(e) => setAddressCode(e.target.value)}
                        inputStyle={fieldStyles["addressCode"]}
                        onChangeStyle={(s) =>
                          updateFieldStyle("addressCode", s)
                        }
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
                        onChangeStyle={(s) => updateFieldStyle("roadName", s)}
                        className="font-light text-[13px] h-[24px] leading-none mt-0 bg-transparent text-[#ffffff] text-center w-[22px] focus:outline-none border-none placeholder-[#ffffff] placeholder:font-[200]"
                        placeholder="0"
                      />
                      Road
                    </div>
                    <hr className="border-t-2 mt-2 border-dotted border-white w-full" />
                    <div className="uppercase mt-2 flex justify-center">
                      <StyledInput
                        value={cityLine}
                        rows={2}
                        onChange={(e) => setCityLine(e.target.value)}
                        inputStyle={fieldStyles["cityLine"]}
                        onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                        className="text-[#B3B394] text-[13px] h-[40px] bg-transparent text-center focus:outline-none border-none placeholder-[#B3B394] placeholder:font-[200]"
                        placeholder="BRIGHOUSE SOUTH, RICHMOND"
                      />
                    </div>
                  </div>
                  <div
                    className="flex items-center justify-center text-[30px] font-light mt-0 px-2"
                    style={{
                      background:
                        "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
                      opacity: 0.7,
                    }}
                  >
                    <Input
                      value={amount}
                      type="text"
                      onChange={(e) => setAmount(e.target.value)}
                      className="font-semibold text-center text-[#ffffff] !text-[36px] !h-[40px] bg-transparent w-full focus:outline-none border-none shadow-none placeholder-[#ffffff] placeholder:font-[500] focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="000,000"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pl-[100px] pr-[20px] pb-[50px]">
                <div className="w-[100%]">
                  <div className="relative top-[-60px]">
                    <div className="flex flex-col relative justify-center items-center">
                      <div className="grid grid-cols-2 gap-3 w-full">
                        {renderImageSlot(
                          "image4",
                          fileInputRef4,
                          "w-full h-[175px] border-[2px] border-white shadow-sm place-self-center",
                          "bottom-3 right-3",
                          "top-4 right-10",
                          "top-4 right-2",
                          "top-4 right-[72px]",
                        )}
                        {renderImageSlot(
                          "image5",
                          fileInputRef5,
                          "w-full h-[175px] border-[2px] border-white shadow-sm place-self-center",
                          "bottom-3 right-3",
                          "top-4 right-10",
                          "top-4 right-2",
                          "top-4 right-[72px]",
                        )}
                        {renderImageSlot(
                          "image6",
                          fileInputRef6,
                          "w-full h-[175px] border-[2px] border-white shadow-sm place-self-center",
                          "bottom-3 right-3",
                          "top-4 left-2",
                          "top-4 left-10",
                          "top-4 left-[72px]",
                        )}
                        {renderImageSlot(
                          "image7",
                          fileInputRef7,
                          "w-full h-[175px] border-[2px] border-white shadow-sm place-self-center",
                          "bottom-3 right-3",
                          "top-4 right-10",
                          "top-4 right-2",
                          "top-4 right-[72px]",
                        )}
                      </div>
                      <div className="absolute group z-20">
                        {renderImageSlot(
                          "image8",
                          fileInputRef8,
                          "w-[200px] h-[130px] bg-white shadow-md",
                          "bottom-2 right-2",
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

        {/* PAGE 2 Sheet Container */}
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
          <div
            className="flex gap-8 p-[40px] relative w-full h-full"
            style={{
              background:
                "linear-gradient(to right, #3A8D3D 0%, #368038 20%, #337434 38%, #2F6A30 54%, #274C23 100%)",
            }}
          >
            <div className="w-1/2 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-6/12">
                  <h2 className="text-[22px] px-5 text-center tracking-[-1px] font-bold text-[#B3B394]">
                    ON TOP OF IT ALL!
                  </h2>
                  <h2 className="text-[16px] px-5 text-center tracking-[-1px] font-bold text-[#B3B394]">
                    BEAUTIFUL SUB-PENTHOUSE IN THE WELL APPOINTED CENTRO
                    BUILDING.
                  </h2>
                  <StyledInput
                    value={description}
                    rows={8}
                    onChange={(e) => setDescription(e.target.value)}
                    inputStyle={fieldStyles["description"]}
                    onChangeStyle={(s) => updateFieldStyle("description", s)}
                    className="font-normal text-[10px] max-h-[300px] z-20 text-white leading-[1.6] italic bg-transparent text-left focus:outline-none border-none placeholder-white placeholder:font-[500]"
                    placeholder="This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring, S/S appliances, Gas range and a large open ‘den/nook’ area perfect for the home office. Huge private balcony, great building amenities including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage locker and balance of the the 5-10 warranty, this home provides nothing but exceptional value. Call today to set up your viewing. MLS # 000000"
                  />
                  <div className="grid grid-cols-2 text-white">
                    <div>
                      <div>
                        <span className="font-bold text-[#B3B394] text-[12px]">
                          BY-LAW RESTRICTIONS:
                        </span>
                        <StyledInput
                          value={byLawRestrictions}
                          rows={1}
                          onChange={(e) => setByLawRestrictions(e.target.value)}
                          inputStyle={fieldStyles["byLawRestrictions"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("byLawRestrictions", s)
                          }
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
                          inputStyle={fieldStyles["maintFees"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("maintFees", s)
                          }
                          className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                          placeholder="$000.00"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-[#B3B394] text-[12px]">
                          MAINT. FEES INCLUDE:
                        </span>
                        <StyledInput
                          value={maintFeesInclude}
                          onChange={(e) => setMaintFeesInclude(e.target.value)}
                          inputStyle={fieldStyles["maintFeesInclude"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("maintFeesInclude", s)
                          }
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
                          inputStyle={fieldStyles["featuresIncluded"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("featuresIncluded", s)
                          }
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
                          inputStyle={fieldStyles["siteInfluences"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("siteInfluences", s)
                          }
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
                          inputStyle={fieldStyles["amenities"]}
                          onChangeStyle={(s) =>
                            updateFieldStyle("amenities", s)
                          }
                          className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                          placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
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
                          inputStyle={fieldStyles["view"]}
                          onChangeStyle={(s) => updateFieldStyle("view", s)}
                          className="font-semibold text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-[#FFFFFF] placeholder:font-[500]"
                          placeholder="South & SW - Van Isl."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 w-6/12">
                  {renderImageSlot(
                    "image9",
                    fileInputRef9,
                    "h-[200px] border-[2px] border-white shadow-sm z-10",
                    "bottom-2 right-2",
                  )}
                  {renderImageSlot(
                    "image10",
                    fileInputRef10,
                    "h-[200px] border-[2px] border-white shadow-sm z-10",
                    "bottom-2 right-2",
                  )}
                </div>
              </div>
              {renderImageSlot(
                "image11",
                fileInputRef11,
                "w-full h-[420px] border-[2px] border-white shadow-sm place-self-center z-10",
                "bottom-2 right-2",
                "top-24 right-10",
                "top-24 right-2",
                "top-24 right-[72px]",
              )}
            </div>
            <div className="w-1/2 flex gap-4">
              <div className="w-full flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  {renderImageSlot(
                    "image12",
                    fileInputRef12,
                    "h-[200px] z-10 border-[2px] border-white shadow-sm",
                    "bottom-2 right-2",
                  )}
                  {renderImageSlot(
                    "image13",
                    fileInputRef13,
                    "h-[200px] z-10 border-[2px] border-white shadow-sm",
                    "bottom-2 right-2",
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {renderImageSlot(
                    "image14",
                    fileInputRef14,
                    "h-[200px] z-10 border-[2px] border-white shadow-sm",
                    "bottom-2 right-2",
                  )}
                  {renderImageSlot(
                    "image15",
                    fileInputRef15,
                    "h-[200px] z-10 border-[2px] border-white shadow-sm",
                    "bottom-2 right-2",
                  )}
                </div>
                {renderImageSlot(
                  "image16",
                  fileInputRef16,
                  "h-[420px] z-10 border-[2px] border-white shadow-sm",
                  "bottom-2 right-2",
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

BcfpStandard14.displayName = "BcfpStandard14";

export default BcfpStandard14;
