import { House, Pencil, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
// Feature Sheet Service
import { featureSheetService } from "../file-manager";
import type { FeatureSheetPayload, FeatureSheetResponse } from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";

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

  // Initial sync from context on mount
  useEffect(() => {
    if (formData) {
      if (formData.title) setTitle(formData.title);
      if (formData.subtitle) setSubtitle(formData.subtitle);
      if (formData.fullName) setFullName(formData.fullName);
      if (formData.email) setEmail(formData.email);
      if (formData.phone) setPhone(formData.phone);
      if (formData.linkedin) setLinkedin(formData.linkedin);
      if (formData.propertyName) setPropertyName(formData.propertyName);
      if (formData.description) setDescription(formData.description);
      if (formData.amount) setAmount(formData.amount);
      if (formData.mlsNumber) setMlsNumber(formData.mlsNumber);
      if (formData.siteInfluences) setSiteInfluences(formData.siteInfluences);
      if (formData.grossTaxes) setGrossTaxes(formData.grossTaxes);
      if (formData.featuresIncluded) setFeaturesIncluded(formData.featuresIncluded);

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
      images,
      imageScales: scale,
      imagePositions: position
    });
  }, [
    title, subtitle, fullName, email, phone, linkedin, propertyName,
    description, amount, mlsNumber, siteInfluences, grossTaxes,
    featuresIncluded, images, scale, position, updateFormData
  ]);

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
    setShowImageSourceModal(true);
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    exportToPayload: async () => {
      // Build and return the payload
      const payload = await featureSheetService.buildPayload({
        // Metadata (now at root level)
        orderUuid: orderData?.uuid || "",
        templateKey: "BCFPStandard2",
        uploadedBy: "admin",
        type: "template",

        // Theme
        primaryColor: "#9A1F2F", // Burgundy color from the template

        // Content - Text Fields
        offeredAtPrice: title,
        realtorTitle: subtitle,
        realtorName: fullName,
        emailLink: email,
        propertyNotesTitle: propertyName,
        propertyNotesDescription: description,
        expandedDetail1Title: "Site Influences",
        expandedDetail1Description: siteInfluences,
        expandedDetail2Title: "Gross Taxes",
        expandedDetail2Description: grossTaxes,
        keyHighlightLabel: "Features Included",
        keyHighlights: featuresIncluded ? featuresIncluded.split("\n").filter(Boolean) : [],
        contactInfo: `${amount} | MLS: ${mlsNumber}`,
        images: images,
        imageScales: scale,
        imagePositions: position,
      });

      return payload;
    },

    importFromPayload: (payload: FeatureSheetResponse) => {
      const state = featureSheetService.parsePayloadToState(payload);

      if (state.offeredAtPrice) setTitle(state.offeredAtPrice as string);
      if (state.realtorTitle) setSubtitle(state.realtorTitle as string);
      if (state.realtorName) setFullName(state.realtorName as string);
      if (state.emailLink) setEmail(state.emailLink as string);
      if (state.propertyNotesTitle) setPropertyName(state.propertyNotesTitle as string);
      if (state.propertyNotesDescription) setDescription(state.propertyNotesDescription as string);
      if (state.expandedDetail1Description) setSiteInfluences(state.expandedDetail1Description as string);
      if (state.expandedDetail2Description) setGrossTaxes(state.expandedDetail2Description as string);
      if (state.keyHighlights) setFeaturesIncluded(state.keyHighlights.join("\n"));

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
      <div className="w-full items-center justify-center font-alexandria">
        <div className="relative">
          <div className="bg-[#9A1F2F] group relative h-[100px] md:h-[100px] justify-center w-full flex flex-col md:flex-row items-center px-5 py-5 md:py-0 overflow-hidden">
            <div
              className="w-[200px] h-full relative overflow-hidden flex items-center justify-center"
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
                    alt="selected"
                    width={200}
                    height={300}
                    className="w-full h-full object-cover rounded transition-transform duration-150"
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
                  <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => handleZoom("image1", "in")}
                      className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3 h-3 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZoom("image1", "out")}
                      className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3 h-3 text-gray-700" />
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
                    <Trash2 className="w-4 h-4 text-red-500" />
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

          <div className="flex items-stretch min-h-[400px]">
            <div className="w-1/2 relative overflow-hidden flex items-center justify-center group">
              <div
                className="w-full h-full relative overflow-hidden flex items-center justify-center"
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
                      <Trash2 className="w-4 h-4 text-red-500" />
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
            <div className="w-1/2 relative overflow-hidden flex items-center justify-center group">
              <div
                className="w-full h-full relative overflow-hidden flex items-center justify-center"
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

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image3")}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete("image3", fileInputRef3)}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
          <div className="bg-[#851A2F] h-[200px] justify-center w-full flex md:flex-row items-center py-5 md:py-0">
            <div className="flex gap-5 w-1/2 px-14 h-[160px] ">
              <div className="w-full h-full relative overflow-hidden flex items-center justify-center group">
                <div
                  className="w-full h-full relative overflow-hidden flex items-center justify-center"
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
                        alt="Image 4"
                        width={500}
                        height={500}
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

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image4")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete("image4", fileInputRef4)}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
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

              <div className="w-full h-full relative overflow-hidden flex items-center justify-center group">
                <div
                  className="w-full h-full relative overflow-hidden flex items-center justify-center"
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
                        alt="Image 5"
                        width={500}
                        height={500}
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

                      {/* Zoom Controls */}
                      <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openImageSourceModal("image5")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete("image5", fileInputRef5)}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
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

              <div className="w-full h-full relative overflow-hidden flex items-center justify-center group">
                <div
                  className="w-full h-full relative overflow-hidden flex items-center justify-center"
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
                        alt="Image 6"
                        width={500}
                        height={500}
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
                      <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete("image6", fileInputRef6)}
                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Delete image"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
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
                className="font-semibold text-[48px] h-[55px] bg-transparent text-center w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="Enter Title"
              />
              <StyledInput
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="font-semibold text-[28px] h-[55px] bg-transparent text-center w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                placeholder="Enter Subtitle"
              />
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
                    placeholder="Enter full name"
                  />
                  <StyledInput
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className=" text-[16px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                    placeholder="RE/MAX City Realty"
                  />
                </div>
                <div className="font-semibold text-[20px] flex gap-1">
                  <StyledInput
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="font-semibold text-[16px] h-[30px] bg-transparent text-right w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                    placeholder="Enter amount"
                  />
                  <StyledInput
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-thin text-[16px] h-[30px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                    placeholder="Enter email here"
                  />
                </div>
              </div>
              <div className="text-center mt-3  font-thin flex">
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
          {/* <div className="absolute bottom-0 left-0 w-[340px] h-[362px] bg-[#ffffff] opacity-[.2]"></div> */}
          <div className="absolute bottom-0 right-0 w-[180px] h-[200px] bg-[#ffffff] "></div>
        </div>

        <div className="relative">
          <div className="bg-[#9A1F2F] justify-center w-full flex gap-7 items-center px-7 py-5 h-[550px]">
            <div className="flex w-1/2 h-full group">
              <div
                className="w-full h-full relative overflow-hidden flex items-center justify-center"
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
                      <Trash2 className="w-4 h-4 text-red-500" />
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

            <div className="w-1/2 grid grid-cols-2 gap-2 h-full">
              <div
                className="w-full h-full relative overflow-hidden flex items-center justify-center group"
                onMouseDown={(e) => handleMouseDown("image8", e)}
                onMouseMove={(e) => handleMouseMove("image8", e)}
                onMouseUp={() => handleMouseUp("image8")}
                onMouseLeave={() => handleMouseLeave("image8")}
              >
                {images.image8 ? (
                  <>
                    <Image
                      unoptimized
                      src={images.image8}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-150"
                      style={{
                        transform: `scale(${scale.image8}) translate(${position.image8.x}px, ${position.image8.y}px)`,
                        cursor: dragging.image8
                          ? "grabbing"
                          : scale.image8 > 1
                            ? "grab"
                            : "default",
                      }}
                    />

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image8", "in")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3 h-3 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image8", "out")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3 h-3 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image8")}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete("image8", fileInputRef8)}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
              <div
                className="w-full h-full relative overflow-hidden flex items-center justify-center group"
                onMouseDown={(e) => handleMouseDown("image9", e)}
                onMouseMove={(e) => handleMouseMove("image9", e)}
                onMouseUp={() => handleMouseUp("image9")}
                onMouseLeave={() => handleMouseLeave("image9")}
              >
                {images.image9 ? (
                  <>
                    <Image
                      unoptimized
                      src={images.image9}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-150"
                      style={{
                        transform: `scale(${scale.image9}) translate(${position.image9.x}px, ${position.image9.y}px)`,
                        cursor: dragging.image9
                          ? "grabbing"
                          : scale.image9 > 1
                            ? "grab"
                            : "default",
                      }}
                    />

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image9", "in")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3 h-3 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image9", "out")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3 h-3 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image9")}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete("image9", fileInputRef9)}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
              <div
                className="w-full h-full relative overflow-hidden flex items-center justify-center group"
                onMouseDown={(e) => handleMouseDown("image10", e)}
                onMouseMove={(e) => handleMouseMove("image10", e)}
                onMouseUp={() => handleMouseUp("image10")}
                onMouseLeave={() => handleMouseLeave("image10")}
              >
                {images.image10 ? (
                  <>
                    <Image
                      unoptimized
                      src={images.image10}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-150"
                      style={{
                        transform: `scale(${scale.image10}) translate(${position.image10.x}px, ${position.image10.y}px)`,
                        cursor: dragging.image10
                          ? "grabbing"
                          : scale.image10 > 1
                            ? "grab"
                            : "default",
                      }}
                    />

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image10", "in")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3 h-3 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image10", "out")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3 h-3 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image10")}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete("image10", fileInputRef10)}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
              <div
                className="w-full h-full relative overflow-hidden flex items-center justify-center group"
                onMouseDown={(e) => handleMouseDown("image11", e)}
                onMouseMove={(e) => handleMouseMove("image11", e)}
                onMouseUp={() => handleMouseUp("image11")}
                onMouseLeave={() => handleMouseLeave("image11")}
              >
                {images.image11 ? (
                  <>
                    <Image
                      unoptimized
                      src={images.image11}
                      alt="uploaded"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-150"
                      style={{
                        transform: `scale(${scale.image11}) translate(${position.image11.x}px, ${position.image11.y}px)`,
                        cursor: dragging.image11
                          ? "grabbing"
                          : scale.image11 > 1
                            ? "grab"
                            : "default",
                      }}
                    />

                    {/* Zoom Controls */}
                    <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleZoom("image11", "in")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3 h-3 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleZoom("image11", "out")}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3 h-3 text-gray-700" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image11")}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete("image11", fileInputRef11)}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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

          <hr className="border-0 bg-[#fff] h-3 m-0" />
          <div className="bg-[#601730]  w-full flex gap-7 px-7 py-5">
            {/* Left Text Section */}
            <div className="flex flex-col gap-3 w-1/2 text-white">
              {/* Description */}

              <textarea
                className={`text-white rounded-[8px] p-2 placeholder-white font-thin leading-none text-left w-full h-48 resize-none outline-none transition-colors duration-200
              ${isFocused || !description
                    ? "bg-gray-100 bg-opacity-20"
                    : "bg-transparent"
                  }`}
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
                  <div className="font-bold text-[14px]">
                    FEATURES INCLUDED:
                  </div>
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
              <div
                className="w-full h-full relative overflow-hidden flex items-center justify-center"
                onMouseDown={(e) => handleMouseDown("image12", e)}
                onMouseMove={(e) => handleMouseMove("image12", e)}
                onMouseUp={() => handleMouseUp("image12")}
                onMouseLeave={() => handleMouseLeave("image12")}
              >
                {images.image12 ? (
                  <>
                    <Image
                      unoptimized
                      src={images.image12}
                      alt="featured"
                      width={200}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-150"
                      style={{
                        transform: `scale(${scale.image12}) translate(${position.image12.x}px, ${position.image12.y}px)`,
                        cursor: dragging.image12
                          ? "grabbing"
                          : scale.image12 > 1
                            ? "grab"
                            : "default",
                      }}
                    />

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

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openImageSourceModal("image12")}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete("image12", fileInputRef12)}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                ) : (
                  <div
                    onClick={() => openImageSourceModal("image12")}
                    className="w-full h-full bg-white rounded-md cursor-pointer flex items-center justify-center text-gray-400"
                  >
                    Click to upload image
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
    </>
  );
});

BcfpStandard2.displayName = "BcfpStandard2";

export default BcfpStandard2;


