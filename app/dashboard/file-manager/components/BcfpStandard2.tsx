import { House, Pencil, Trash, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import ImageEditor from "./ImageEditor";
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";

// Feature Sheet Service
import { featureSheetService } from "../file-manager";
import type { FeatureSheetPayload, FeatureSheetResponse, TextStyle, StyledTextField } from "../types/featureSheetTypes";

// Interface for methods exposed to parent component
export interface BcfpStandard2Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard2Props {
  orderData: Order | null;
}

const BcfpStandard2 = forwardRef<BcfpStandard2Ref, BcfpStandard2Props>(({ orderData }, ref) => {
  const { formData, updateFormData } = useFileManagerContext();
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
  const [phone, setPhone] = useState(formData.phone || "");
  const [linkedin, setLinkedin] = useState(formData.linkedin || "");
  // Per-field style state — tracks user-chosen typography for each StyledInput
  const [fieldStyles, setFieldStyles] = useState<Record<string, TextStyle>>({});
  const updateFieldStyle = (field: string, style: TextStyle) =>
    setFieldStyles((prev) => ({ ...prev, [field]: style }));

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
    image1: 1, image2: 1, image3: 1, image4: 1, image5: 1, image6: 1,
    image7: 1, image8: 1, image9: 1, image10: 1, image11: 1, image12: 1,
    image13: 1, image14: 1, image15: 1, image16: 1, image17: 1, image18: 1,
  });

  const [position, setPosition] = useState({
    image1: { x: 0, y: 0 }, image2: { x: 0, y: 0 }, image3: { x: 0, y: 0 },
    image4: { x: 0, y: 0 }, image5: { x: 0, y: 0 }, image6: { x: 0, y: 0 },
    image7: { x: 0, y: 0 }, image8: { x: 0, y: 0 }, image9: { x: 0, y: 0 },
    image10: { x: 0, y: 0 }, image11: { x: 0, y: 0 }, image12: { x: 0, y: 0 },
    image13: { x: 0, y: 0 }, image14: { x: 0, y: 0 }, image15: { x: 0, y: 0 },
    image16: { x: 0, y: 0 }, image17: { x: 0, y: 0 }, image18: { x: 0, y: 0 },
  });

  const [rotation, setRotation] = useState({
    image1: 0, image2: 0, image3: 0, image4: 0, image5: 0, image6: 0,
    image7: 0, image8: 0, image9: 0, image10: 0, image11: 0, image12: 0,
    image13: 0, image14: 0, image15: 0, image16: 0, image17: 0, image18: 0,
  });

  const [dragging, setDragging] = useState({
    image1: false, image2: false, image3: false, image4: false, image5: false, image6: false,
    image7: false, image8: false, image9: false, image10: false, image11: false, image12: false,
    image13: false, image14: false, image15: false, image16: false, image17: false, image18: false,
  });

  const lastPosition = useRef({
    image1: { x: 0, y: 0 }, image2: { x: 0, y: 0 }, image3: { x: 0, y: 0 },
    image4: { x: 0, y: 0 }, image5: { x: 0, y: 0 }, image6: { x: 0, y: 0 },
    image7: { x: 0, y: 0 }, image8: { x: 0, y: 0 }, image9: { x: 0, y: 0 },
    image10: { x: 0, y: 0 }, image11: { x: 0, y: 0 }, image12: { x: 0, y: 0 },
    image13: { x: 0, y: 0 }, image14: { x: 0, y: 0 }, image15: { x: 0, y: 0 },
    image16: { x: 0, y: 0 }, image17: { x: 0, y: 0 }, image18: { x: 0, y: 0 },
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

  // Auto-populate from orderData and context
  useEffect(() => {
    if (orderData) {
      const prop = orderData.property;
      const agent = orderData.agent;

      if (prop) {
        if (prop.listing_price) setAmount(prop.listing_price.toString());
        if (prop.description) setDescription(prop.description);
        if (prop.mls_number) setMlsNumber(prop.mls_number);

        const fullAddress = prop.suite ? `${prop.suite} - ${prop.address}` : prop.address;
        if (fullAddress) setTitle(fullAddress);

        let city = "";
        if (prop.city) city += prop.city;
        if (prop.province) city += (city ? ", " : "") + prop.province;
        if (prop.postal_code) city += (city ? " " : "") + prop.postal_code;
        if (city) setSubtitle(city);
      }

      if (agent) {
        if (agent.first_name || agent.last_name)
          setFullName(`${agent.first_name || ""} ${agent.last_name || ""}`.trim());
        if (agent.email) setEmail(agent.email);
        if (agent.company_name) setPropertyName(agent.company_name);
      }
    }

    if (formData) {
      const s = (val: any) => (typeof val === "string" ? val : val?.value || "");

      if (formData.title) setTitle(s(formData.title));
      if (formData.subtitle) setSubtitle(s(formData.subtitle));
      if (formData.fullName) setFullName(s(formData.fullName));
      if (formData.email) setEmail(s(formData.email));
      if (formData.phone) setPhone(s(formData.phone));
      if (formData.linkedin) setLinkedin(s(formData.linkedin));
      if (formData.propertyName) setPropertyName(s(formData.propertyName));
      if (formData.description) setDescription(s(formData.description));
      if (formData.amount) setAmount(s(formData.amount));
      if (formData.mlsNumber) setMlsNumber(s(formData.mlsNumber));
      if (formData.siteInfluences) setSiteInfluences(s(formData.siteInfluences));
      if (formData.grossTaxes) setGrossTaxes(s(formData.grossTaxes));
      if (formData.featuresIncluded) setFeaturesIncluded(s(formData.featuresIncluded));
      if (formData.outdoorAreas) setOutdoorAreas(s(formData.outdoorAreas));

      if (formData.images) {
        setImages((prev) => ({ ...prev, ...(formData.images as typeof images) }));
      }
      if (formData.imageScales) {
        setScale((prev) => ({ ...prev, ...(formData.imageScales as typeof scale) }));
      }
      if (formData.imagePositions) {
        setPosition((prev) => ({ ...prev, ...(formData.imagePositions as typeof position) }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData]);

  // Update context when local state changes
  useEffect(() => {
    updateFormData({
      title,
      subtitle,
      fullName,
      email,
      phone,
      linkedin,
      propertyName,
      description,
      amount,
      mlsNumber,
      siteInfluences,
      grossTaxes,
      featuresIncluded,
      outdoorAreas,
      images,
      imageScales: scale,
      imagePositions: position,
    });
  }, [
    title, subtitle, fullName, email, phone, linkedin, propertyName,
    description, amount, mlsNumber, siteInfluences, grossTaxes,
    featuresIncluded, outdoorAreas, images, scale, position, updateFormData
  ]);

  // --- Handlers ---
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

  const handleMouseUp = (key: keyof typeof images) => setDragging((prev) => ({ ...prev, [key]: false }));
  const handleMouseLeave = (key: keyof typeof images) => setDragging((prev) => ({ ...prev, [key]: false }));

  const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
    setScale((prev) => {
      const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
      return { ...prev, [key]: Math.min(Math.max(newScale, 0.1), 5) };
    });
  };

  const handleRotate = (key: keyof typeof images) => {
    setRotation((prev) => ({ ...prev, [key]: (prev[key] + 90) % 360 }));
  };

  const handleDelete = (key: keyof typeof images, ref: React.RefObject<HTMLInputElement | null>) => {
    setImages((prev) => ({ ...prev, [key]: null }));
    setScale((prev) => ({ ...prev, [key]: 1 }));
    setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
    if (ref.current) ref.current.value = "";
  };

  const handleImageChange = (key: keyof typeof images, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImages((prev) => ({ ...prev, [key]: URL.createObjectURL(e.target.files![0]) }));
    }
  };

  const handleImageSourceSelect = (source: "local" | "gallery") => {
    setShowImageSourceModal(false);

    if (source === "local") {
      switch (currentImageSlot) {
        case "image1": fileInputRef1.current?.click(); break;
        case "image2": fileInputRef2.current?.click(); break;
        case "image3": fileInputRef3.current?.click(); break;
        case "image4": fileInputRef4.current?.click(); break;
        case "image5": fileInputRef5.current?.click(); break;
        case "image6": fileInputRef6.current?.click(); break;
        case "image7": fileInputRef7.current?.click(); break;
        case "image8": fileInputRef8.current?.click(); break;
        case "image9": fileInputRef9.current?.click(); break;
        case "image10": fileInputRef10.current?.click(); break;
        case "image11": fileInputRef11.current?.click(); break;
        case "image12": fileInputRef12.current?.click(); break;
        case "image13": fileInputRef13.current?.click(); break;
        case "image14": fileInputRef14.current?.click(); break;
        case "image15": fileInputRef15.current?.click(); break;
        case "image16": fileInputRef16.current?.click(); break;
        case "image17": fileInputRef17.current?.click(); break;
        case "image18": fileInputRef18.current?.click(); break;
        default: break;
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
    setShowGallery(true);
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    exportToPayload: async () => {
      const payload = await featureSheetService.buildPayload({
        orderUuid: orderData?.uuid || "",
        templateKey: "BCFPStandard2",
        uploadedBy: "admin",
        type: "template",
        primaryColor: "#9A1F2F",

        offeredAtPrice: { value: title, style: fieldStyles.title || ({} as TextStyle) },
        realtorTitle: { value: subtitle, style: fieldStyles.subtitle || ({} as TextStyle) },
        realtorName: { value: fullName, style: fieldStyles.fullName || ({} as TextStyle) },
        emailLink: { value: email, style: fieldStyles.email || ({} as TextStyle) },
        propertyNotesTitle: { value: propertyName, style: fieldStyles.propertyName || ({} as TextStyle) },
        propertyNotesDescription: { value: description, style: fieldStyles.description || ({} as TextStyle) },
        expandedDetail1Title: "Site Influences",
        expandedDetail1Description: { value: siteInfluences, style: fieldStyles.siteInfluences || ({} as TextStyle) },
        expandedDetail2Title: "Gross Taxes",
        expandedDetail2Description: { value: grossTaxes, style: fieldStyles.grossTaxes || ({} as TextStyle) },
        keyHighlightLabel: "Features Included",
        keyHighlights: featuresIncluded ? featuresIncluded.split("\n").filter(Boolean) : [],
        otherDetails: {
          amount: { value: amount, style: fieldStyles.amount || ({} as TextStyle) },
          mlsNumber: { value: mlsNumber, style: fieldStyles.mlsNumber || ({} as TextStyle) },
          outdoorAreas: { value: outdoorAreas, style: fieldStyles.outdoorAreas || ({} as TextStyle) },
          featuresIncluded: { value: featuresIncluded, style: fieldStyles.featuresIncluded || ({} as TextStyle) },
        },
        images: images,
        imageScales: scale,
        imagePositions: position,
      });

      return payload;
    },

    importFromPayload: (payload: FeatureSheetResponse) => {
      const state = featureSheetService.parsePayloadToState(payload);

      if (state.offeredAtPrice) setTitle(state.offeredAtPrice);
      if (state.realtorTitle) setSubtitle(state.realtorTitle);
      if (state.realtorName) setFullName(state.realtorName);
      if (state.emailLink) setEmail(state.emailLink);
      if (state.propertyNotesTitle) setPropertyName(state.propertyNotesTitle);
      if (state.propertyNotesDescription) setDescription(state.propertyNotesDescription);
      if (state.expandedDetail1Description) setSiteInfluences(state.expandedDetail1Description);
      if (state.expandedDetail2Description) setGrossTaxes(state.expandedDetail2Description);
      if (state.keyHighlights) setFeaturesIncluded(state.keyHighlights.join("\n"));
      if (state.amount) setAmount(state.amount);
      if (state.mlsNumber) setMlsNumber(state.mlsNumber);

      const styles: Record<string, TextStyle> = {};
      const c = payload.content;
      if ((c.offeredAtPrice as StyledTextField)?.style) styles.title = (c.offeredAtPrice as StyledTextField).style;
      if ((c.realtorTitle as StyledTextField)?.style) styles.subtitle = (c.realtorTitle as StyledTextField).style;
      if ((c.realtorName as StyledTextField)?.style) styles.fullName = (c.realtorName as StyledTextField).style;
      if ((c.emailLink as StyledTextField)?.style) styles.email = (c.emailLink as StyledTextField).style;
      if ((c.propertyNotesTitle as StyledTextField)?.style) styles.propertyName = (c.propertyNotesTitle as StyledTextField).style;
      if ((c.propertyNotesDescription as StyledTextField)?.style) styles.description = (c.propertyNotesDescription as StyledTextField).style;
      if ((c.expandedDetail1Description as StyledTextField)?.style) styles.siteInfluences = (c.expandedDetail1Description as StyledTextField).style;
      if ((c.expandedDetail2Description as StyledTextField)?.style) styles.grossTaxes = (c.expandedDetail2Description as StyledTextField).style;

      const od = c.otherDetails as Record<string, any>;
      if (od?.amount?.style) styles.amount = od.amount.style;
      if (od?.mlsNumber?.style) styles.mlsNumber = od.mlsNumber.style;
      if (od?.outdoorAreas?.style) styles.outdoorAreas = od.outdoorAreas.style;
      if (od?.featuresIncluded?.style) styles.featuresIncluded = od.featuresIncluded.style;

      setFieldStyles(styles);

      if (state.images) setImages((prev) => ({ ...prev, ...(state.images as typeof images) }));
      if (state.imageScales) setScale((prev) => ({ ...prev, ...(state.imageScales as typeof scale) }));
      if (state.imagePositions) setPosition((prev) => ({ ...prev, ...(state.imagePositions as typeof position) }));
    },
  }));

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

      <div className="w-full flex flex-col items-center justify-center font-alexandria py-8 gap-0">
        {/* PAGE 1 banner */}
        <div
          className="w-full flex items-center justify-center my-8"
          data-html2canvas-ignore="true"
        >
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4 select-none">
            PAGE 1
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* pdf-page 1 */}
        <div
          className="flex flex-col pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
          style={{ width: "17in", height: "11in", zoom: 0.55, margin: "0 auto", marginBottom: "40px" }}
        >
          <div className="relative flex flex-col h-full w-full">
            {/* Top Bar with Header Image */}
            <div className="bg-[#9A1F2F] group relative h-[100px] md:h-[100px] justify-center w-full flex flex-col md:flex-row items-center px-5 py-5 md:py-0 overflow-hidden">
              <div className="w-[200px] h-full relative overflow-hidden group">
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

                      {/* Rotate */}
                      <button
                        type="button"
                        onClick={() => handleRotate("image1")}
                        className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                        title="Rotate image"
                      >
                        <RotateCw className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image1")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete */}
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

            {/* Top 2 Photos Section */}
            <div className="flex items-stretch min-h-[400px] flex-1">
              {/* image2 */}
              <div className="w-1/2 relative overflow-hidden group">
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

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                      {/* Rotate */}
                      <button
                        type="button"
                        onClick={() => handleRotate("image2")}
                        className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                        title="Rotate image"
                      >
                        <RotateCw className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image2")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete */}
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

              {/* image3 */}
              <div className="w-1/2 relative overflow-hidden group">
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

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                      {/* Rotate */}
                      <button
                        type="button"
                        onClick={() => handleRotate("image3")}
                        className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                        title="Rotate image"
                      >
                        <RotateCw className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image3")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete */}
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
              </div>
            </div>

            <hr className="border-0 bg-[#a05067] h-3 m-0" />

            {/* Middle Section: 3 Thumbnails Left + Title/Subtitle Right */}
            <div className="bg-[#851A2F] h-[200px] justify-center w-full flex md:flex-row items-center py-5 md:py-0">
              <div className="flex gap-5 w-1/2 px-14 h-[160px]">
                {/* image4 */}
                <div className="w-full h-full relative overflow-hidden group">
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

                        {/* Zoom Controls */}
                        <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => handleZoom("image4", "in")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-3 h-3 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoom("image4", "out")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-3 h-3 text-gray-700" />
                          </button>
                        </div>

                        {/* Rotate */}
                        <button
                          type="button"
                          onClick={() => handleRotate("image4")}
                          className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-3 h-3 text-gray-700" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image4")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete */}
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
                </div>

                {/* image5 */}
                <div className="w-full h-full relative overflow-hidden group">
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

                        {/* Zoom Controls */}
                        <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => handleZoom("image5", "in")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-3 h-3 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleZoom("image5", "out")}
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-3 h-3 text-gray-700" />
                          </button>
                        </div>

                        {/* Rotate */}
                        <button
                          type="button"
                          onClick={() => handleRotate("image5")}
                          className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-3 h-3 text-gray-700" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image5")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete */}
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
                </div>

                {/* image6 */}
                <div className="w-full h-full relative overflow-hidden group">
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

                        {/* Zoom Controls */}
                        <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                        {/* Rotate */}
                        <button
                          type="button"
                          onClick={() => handleRotate("image6")}
                          className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-3 h-3 text-gray-700" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image6")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete */}
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
                </div>
              </div>

              <div className="w-1/2 text-white leading-none text-center">
                <StyledInput
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onChangeStyle={(s) => updateFieldStyle("title", s)}
                  inputStyle={fieldStyles.title}
                  className="font-semibold text-[48px] h-[55px] bg-transparent text-center w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                  placeholder="Enter Title"
                />
                <StyledInput
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  onChangeStyle={(s) => updateFieldStyle("subtitle", s)}
                  inputStyle={fieldStyles.subtitle}
                  className="font-semibold text-[28px] h-[55px] bg-transparent text-center w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                  placeholder="Enter Subtitle"
                />
              </div>
            </div>

            <hr className="border-0 bg-[#fff] h-3 m-0" />

            {/* Bottom Footer Section */}
            <div className="bg-[#601730] h-[150px] justify-center w-full flex md:flex-row items-center py-2 md:py-0">
              <div className="w-1/2 text-white leading-none text-center px-12">
                <div>
                  <div className="font-semibold text-[20px] flex gap-3">
                    <StyledInput
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onChangeStyle={(s) => updateFieldStyle("fullName", s)}
                      inputStyle={fieldStyles.fullName}
                      className=" text-[28px] h-[30px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Enter full name"
                    />
                    <StyledInput
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      onChangeStyle={(s) => updateFieldStyle("propertyName", s)}
                      inputStyle={fieldStyles.propertyName}
                      className=" text-[16px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                      placeholder="RE/MAX City Realty"
                    />
                  </div>
                  <div className="font-semibold text-[20px] flex gap-1">
                    <StyledInput
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onChangeStyle={(s) => updateFieldStyle("amount", s)}
                      inputStyle={fieldStyles.amount}
                      className="font-semibold text-[16px] h-[30px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Enter amount"
                    />
                    <StyledInput
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onChangeStyle={(s) => updateFieldStyle("email", s)}
                      inputStyle={fieldStyles.email}
                      className="font-thin text-[16px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                      placeholder="Enter email here"
                    />
                  </div>
                </div>
                <div className="text-center mt-3 font-thin flex">
                  <span className="text-[8px]">
                    All information deemed reliable but not guaranteed and should
                    be independently verified. All properties are subject to prior
                    sale, change or withdrawal. Neither listing broker(s) nor BC
                    Floorplans shall be responsible for any typographical errors,
                    misinformation, misprints and shall be held totally harmless.{" "}
                  </span>
                  <span className="flex">
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
              <div className="flex gap-5 w-1/2 px-14"></div>
            </div>
          </div>
        </div>

        {/* PAGE 2 banner */}
        <div
          className="w-full flex items-center justify-center my-8"
          data-html2canvas-ignore="true"
        >
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4 select-none">
            PAGE 2
          </span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* pdf-page 2 */}
        <div
          className="flex flex-col pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
          style={{ width: "17in", height: "11in", zoom: 0.55, margin: "0 auto", marginBottom: "40px" }}
        >
          <div className="relative flex flex-col h-full w-full">
            {/* Top Photo Gallery Section */}
            <div className="bg-[#9A1F2F] justify-center w-full flex gap-7 items-center px-7 py-5 h-[550px]">
              {/* image7: Large Left Photo */}
              <div className="flex w-1/2 h-full relative overflow-hidden group">
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

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                      {/* Rotate */}
                      <button
                        type="button"
                        onClick={() => handleRotate("image7")}
                        className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                        title="Rotate image"
                      >
                        <RotateCw className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image7")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete */}
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

              {/* Right Side: 2x2 Grid of Photos (image8, image9, image10, image11) */}
              <div className="w-1/2 grid grid-cols-2 gap-2 h-full">
                {/* image8 */}
                <div className="w-full h-full relative overflow-hidden group">
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

                        {/* Zoom Controls */}
                        <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                        {/* Rotate */}
                        <button
                          type="button"
                          onClick={() => handleRotate("image8")}
                          className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image8")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete("image8", fileInputRef8)}
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                {/* image9 */}
                <div className="w-full h-full relative overflow-hidden group">
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

                        {/* Zoom Controls */}
                        <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                        {/* Rotate */}
                        <button
                          type="button"
                          onClick={() => handleRotate("image9")}
                          className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image9")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete("image9", fileInputRef9)}
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                <div className="w-full h-full relative overflow-hidden group">
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

                        {/* Zoom Controls */}
                        <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                        {/* Rotate */}
                        <button
                          type="button"
                          onClick={() => handleRotate("image10")}
                          className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image10")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete("image10", fileInputRef10)}
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                {/* image11 */}
                <div className="w-full h-full relative overflow-hidden group">
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

                        {/* Zoom Controls */}
                        <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                        {/* Rotate */}
                        <button
                          type="button"
                          onClick={() => handleRotate("image11")}
                          className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                          title="Rotate image"
                        >
                          <RotateCw className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openImageSourceModal("image11")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete("image11", fileInputRef11)}
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
            </div>

            <hr className="border-0 bg-[#fff] h-3 m-0" />

            {/* Bottom Content Section: Details Left + Featured Image Right */}
            <div className="bg-[#601730] flex-1 w-full flex gap-7 px-7 py-5">
              {/* Left Text Section */}
              <div className="flex flex-col gap-3 w-1/2 text-white">
                <StyledInput
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onChangeStyle={(s) => updateFieldStyle("description", s)}
                  inputStyle={fieldStyles.description}
                  className={`text-white rounded-[8px] p-2 placeholder-white font-thin leading-none text-left w-full h-48 resize-none outline-none transition-colors duration-200
                ${isFocused || !description
                      ? "bg-gray-100 bg-opacity-20"
                      : "bg-transparent"
                    }`}
                  placeholder="Enter details here"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />

                <div className="flex">
                  <div className="w-1/2 text-left">
                    <div className="font-bold text-[14px]">SITE INFLUENCES:</div>
                    <StyledInput
                      value={siteInfluences}
                      onChange={(e) => setSiteInfluences(e.target.value)}
                      onChangeStyle={(s) => updateFieldStyle("siteInfluences", s)}
                      inputStyle={fieldStyles.siteInfluences}
                      className="font-semibold text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Enter Site Influences Here"
                    />
                  </div>
                  <div className="w-1/2 text-right">
                    <div className="font-bold text-[14px]">GROSS TAXES:</div>
                    <StyledInput
                      value={grossTaxes}
                      onChange={(e) => setGrossTaxes(e.target.value)}
                      onChangeStyle={(s) => updateFieldStyle("grossTaxes", s)}
                      inputStyle={fieldStyles.grossTaxes}
                      className="font-semibold text-[12px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Enter Gross Taxes Here"
                    />
                  </div>
                </div>

                <div className="flex">
                  <div className="w-1/2 text-left">
                    <div className="font-bold text-[14px]">
                      FEATURES INCLUDED:
                    </div>
                    <StyledInput
                      value={featuresIncluded}
                      onChange={(e) => setFeaturesIncluded(e.target.value)}
                      onChangeStyle={(s) => updateFieldStyle("featuresIncluded", s)}
                      inputStyle={fieldStyles.featuresIncluded}
                      className="font-semibold text-[12px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Enter Features Here"
                    />
                  </div>
                  <div className="w-1/2 text-right">
                    <div className="font-bold text-[14px]">OUTDOOR AREAS:</div>
                    <StyledInput
                      value={outdoorAreas}
                      onChange={(e) => setOutdoorAreas(e.target.value)}
                      onChangeStyle={(s) => updateFieldStyle("outdoorAreas", s)}
                      inputStyle={fieldStyles.outdoorAreas}
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
                      onChangeStyle={(s) => updateFieldStyle("mlsNumber", s)}
                      inputStyle={fieldStyles.mlsNumber}
                      className="font-semibold text-[14px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                      placeholder="Enter MLS number"
                    />
                  </div>
                </div>
              </div>

              {/* image12: Right Featured Photo */}
              <div className="relative flex w-1/2 group">
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

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                      {/* Rotate */}
                      <button
                        type="button"
                        onClick={() => handleRotate("image12")}
                        className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                        title="Rotate image"
                      >
                        <RotateCw className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image12")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete("image12", fileInputRef12)}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

BcfpStandard2.displayName = "BcfpStandard2";

export default BcfpStandard2;
