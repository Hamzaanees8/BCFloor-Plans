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
import { featureSheetService } from "../file-manager";
import {
  FeatureSheetResponse,
  FeatureSheetPayload,
  TextStyle,
  StyledTextField,
} from "../types/featureSheetTypes";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import { useFileManagerContext } from "../FileManagerContext";
import SafeZoneWrapper from "./SafeZoneWrapper";

export interface BcfpStandard6Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard6Props {
  orderData: Order | null;
  showBleed?: boolean;
  showGuide?: boolean;
}

const BcfpStandard6 = forwardRef<BcfpStandard6Ref, BcfpStandard6Props>(
  (
    {
      orderData,
      showBleed: propShowBleed,
      showGuide: propShowGuide,
    },
    ref,
  ) => {
    const { formData, updateFormData } = useFileManagerContext();

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
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [propertyName, setPropertyName] = useState("");
    const [amount, setAmount] = useState("");
    const [number, setNumber] = useState("");
    const [addressCode, setAddressCode] = useState("");
    const [roadName, setRoadName] = useState("");
    const [cityLine, setCityLine] = useState("");
    const [showBleedState] = useState(true);
    const [showGuideState] = useState(true);

    const showBleed = propShowBleed !== undefined ? propShowBleed : showBleedState;
    const showGuide = propShowGuide !== undefined ? propShowGuide : showGuideState;
    const [fieldStyles, setFieldStyles] = useState<Record<string, TextStyle>>(
      {},
    );

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
          if (prop.bedrooms) setBedroom(prop.bedrooms.toString());
          if (prop.bathrooms) setBathroom(prop.bathrooms.toString());
          if (prop.square_footage) setSqft(prop.square_footage.toString());
          if (prop.year_constructed)
            setBuiltYear(prop.year_constructed.toString());
          if (prop.description) setDescription(prop.description);

          if (prop.suite) setNumber(prop.suite.toString());
          if (prop.address) setRoadName(prop.suite ?? "");

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
        if (formData.bedroom) setBedroom(s(formData.bedroom));
        if (formData.bathroom) setBathroom(s(formData.bathroom));
        if (formData.sqft) setSqft(s(formData.sqft));
        if (formData.builtYear) setBuiltYear(s(formData.builtYear));
        if (formData.description) setDescription(s(formData.description));
        if (formData.fullName) setFullName(s(formData.fullName));
        if (formData.email) setEmail(s(formData.email));
        if (formData.propertyName) setPropertyName(s(formData.propertyName));
        if (formData.amount) setAmount(s(formData.amount));
        if (formData.number) setNumber(s(formData.number));
        if (formData.addressCode) setAddressCode(s(formData.addressCode));
        if (formData.roadName) setRoadName(s(formData.roadName));
        if (formData.cityLine) setCityLine(s(formData.cityLine));

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
        if (formData.imageRotations) {
          setRotation((prev) => ({
            ...prev,
            ...(formData.imageRotations as unknown as typeof rotation),
          }));
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
        bedroom,
        bathroom,
        sqft,
        builtYear,
        description,
        fullName,
        email,
        propertyName,
        amount,
        number,
        addressCode,
        roadName,
        cityLine,
        images,
        imageScales: scale,
        imagePositions: position,
        imageRotations: rotation,
      });
    }, [
      byLawRestrictions,
      maintFees,
      maintFeesInclude,
      featuresIncluded,
      siteInfluences,
      amenities,
      view,
      bedroom,
      bathroom,
      sqft,
      builtYear,
      description,
      fullName,
      email,
      propertyName,
      amount,
      number,
      addressCode,
      roadName,
      cityLine,
      images,
      scale,
      position,
      rotation,
      updateFormData,
    ]);

    // --- Handlers ---
    const handleMouseDown = (key: keyof typeof images, e: React.MouseEvent) => {
      if (e.altKey) return;
      setDragging((prev) => ({ ...prev, [key]: true }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (key: keyof typeof images, e: React.MouseEvent) => {
      if (!dragging[key]) return;
      const dx = (e.clientX - lastPosition.current[key].x) / 0.55;
      const dy = (e.clientY - lastPosition.current[key].y) / 0.55;
      setPosition((prev) => ({
        ...prev,
        [key]: { x: prev[key].x + dx, y: prev[key].y + dy },
      }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (key: keyof typeof images) =>
      setDragging((prev) => ({ ...prev, [key]: false }));
    const handleMouseLeave = (key: keyof typeof images) =>
      setDragging((prev) => ({ ...prev, [key]: false }));

    const handleZoom = (key: keyof typeof images, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        return { ...prev, [key]: Math.min(Math.max(newScale, 0.1), 5) };
      });
    };

    const handleRotate = (key: keyof typeof images) => {
      setRotation((prev) => ({ ...prev, [key]: (prev[key] + 90) % 360 }));
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

    const handleImageChange = (
      key: keyof typeof images,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (e.target.files && e.target.files[0]) {
        setImages((prev) => ({
          ...prev,
          [key]: URL.createObjectURL(e.target.files![0]),
        }));
      }
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

    const openImageSourceModal = (imageSlot: string) => {
      setCurrentImageSlot(imageSlot);
      setShowImageSourceModal(true);
    };

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard6",
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
          companyName: {
            value: propertyName,
            style: fieldStyles.propertyName || ({} as TextStyle),
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
          },
          images,
          imageScales: scale,
          imagePositions: position,
          imageRotations: rotation,
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

        if (state.keyHighlights) {
          setSiteInfluences(
            Array.isArray(state.keyHighlights)
              ? state.keyHighlights.map((h) => s(h)).join("\n")
              : s(state.keyHighlights),
          );
        }

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, any>;
          if (details.amenities) setAmenities(s(details.amenities));
          if (details.view) setView(s(details.view));
          if (details.bedroom) setBedroom(s(details.bedroom));
          if (details.bathroom) setBathroom(s(details.bathroom));
          if (details.sqft) setSqft(s(details.sqft));
          if (details.builtYear) setBuiltYear(s(details.builtYear));
          if (details.number) setNumber(s(details.number));
          if (details.addressCode) setAddressCode(s(details.addressCode));
          if (details.cityLine) setCityLine(s(details.cityLine));
        }

        const styles: Record<string, TextStyle> = {};
        const c = payload.content;
        const st = (f: any) => (f as StyledTextField)?.style;

        if (st(c.offeredAtPrice)) styles.amount = st(c.offeredAtPrice);
        if (st(c.realtorName)) styles.fullName = st(c.realtorName);
        if (st(c.emailLink)) styles.email = st(c.emailLink);
        if (st(c.companyName)) styles.propertyName = st(c.companyName);
        if (st(c.propertyNotesTitle))
          styles.roadName = st(c.propertyNotesTitle);
        if (st(c.propertyNotesDescription))
          styles.description = st(c.propertyNotesDescription);
        if (st(c.expandedDetail1Description))
          styles.byLawRestrictions = st(c.expandedDetail1Description);
        if (st(c.expandedDetail2Description))
          styles.maintFees = st(c.expandedDetail2Description);
        if (st(c.expandedDetail3Description))
          styles.maintFeesInclude = st(c.expandedDetail3Description);
        if (st(c.expandedDetail4Description))
          styles.featuresIncluded = st(c.expandedDetail4Description);

        const od = c.otherDetails as Record<string, any>;
        if (od) {
          if (st(od.amenities)) styles.amenities = st(od.amenities);
          if (st(od.view)) styles.view = st(od.view);
          if (st(od.bedroom)) styles.bedroom = st(od.bedroom);
          if (st(od.bathroom)) styles.bathroom = st(od.bathroom);
          if (st(od.sqft)) styles.sqft = st(od.sqft);
          if (st(od.builtYear)) styles.builtYear = st(od.builtYear);
          if (st(od.number)) styles.number = st(od.number);
          if (st(od.addressCode)) styles.addressCode = st(od.addressCode);
          if (st(od.cityLine)) styles.cityLine = st(od.cityLine);
        }

        setFieldStyles(styles);

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

          {/* pdf-page 1 */}
          <div
            className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
            style={{
              width: showBleed ? "17.25in" : "17in",
              height: showBleed ? "11.25in" : "11in",
              zoom: 0.55,
              margin: "0 auto",
              marginBottom: "40px",
            }}
          >
            {/* Page 1 Footer Background Gradient in parent bleed container for edge-to-edge coverage */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[180px] pointer-events-none z-0"
              style={{
                background:
                  "linear-gradient(90deg, #00B9F2 0%, #0097C9 39%, #028DBD 52%, #186C9B 89%, #226392 100%)",
              }}
            />

            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              <div className="w-full h-full flex flex-col justify-between font-alexandria">
                <div className="w-full flex flex-1 min-h-0 justify-center font-alexandria">
                  {/* Page 1 Left Column */}
                  <div className="w-1/2 bg-white flex flex-col relative h-full">
                    {/* image1 */}
                    <div className="w-full h-full bg-white place-self-center relative overflow-hidden group">
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
                              className="absolute top-24 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image1")}
                              className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image1", fileInputRef1)
                              }
                              className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                  {/* Page 1 Right Column — Expanded to outer right edge of bleed container */}
                  <div
                    className="bg-[#376173] flex flex-col relative shrink-0"
                    style={{
                      width: showBleed
                        ? "calc(50% + 0.375in)"
                        : "calc(50% + 0.25in)",
                      marginRight: showBleed ? "-0.375in" : "-0.25in",
                    }}
                  >
                    <div className="flex w-full flex-col justify-center relative z-[19] items-center pt-[50px]">
                      <div className="text-[28px] font-light leading-none mt-0 text-[#00B9F2] flex">
                        <span className="inline">
                          <StyledInput
                            value={addressCode}
                            onChange={(e) => setAddressCode(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("addressCode", s)
                            }
                            inputStyle={fieldStyles.addressCode}
                            className="font-light text-[28px] h-[30px] w-[150px] leading-none mt-0 bg-transparent text-[#00B9F2] text-left focus:outline-none border-none placeholder-[#00B9F2] placeholder:font-[200]"
                            placeholder="0000-0000"
                          />
                        </span>
                        <span className="text-[#226292] flex">
                          Number
                          <StyledInput
                            value={roadName}
                            onChange={(e) => setRoadName(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("roadName", s)
                            }
                            inputStyle={fieldStyles.roadName}
                            className="font-light text-[28px] h-[30px] leading-none mt-0 bg-transparent text-[#226292] text-center w-[65px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                            placeholder="0"
                          />
                          Road
                        </span>
                      </div>
                      <div className="text-[#2C2E35] text-[10px]">
                        <StyledInput
                          value={cityLine}
                          onChange={(e) => setCityLine(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("cityLine", s)}
                          inputStyle={fieldStyles.cityLine}
                          className="text-[#2C2E35] text-[10px] bg-transparent text-center w-[250px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                          placeholder="BRIGHOUSE SOUTH, RICHMOND"
                        />
                      </div>

                      {/* image7 */}
                      <div className="absolute bottom-[-145px] left-[50px] group z-10">
                        <div className="w-[200px] h-[110px] relative bg-white shadow-md group overflow-hidden">
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
                                  onMouseDown={(e) =>
                                    handleMouseDown("image7", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image7}
                                    scale={scale.image7}
                                    position={position.image7}
                                    rotation={rotation.image7}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image7", "in")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image7", "out")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
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

                                {/* Edit Button */}
                                <button
                                  type="button"
                                  onClick={() => openImageSourceModal("image7")}
                                  className="absolute top-2 right-10 z-8 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image7", fileInputRef7)
                                  }
                                  className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Delete image"
                                >
                                  <Trash className="w-4 h-4 text-red-500" />
                                </button>
                              </>
                            ) : (
                              <div
                                onClick={() => openImageSourceModal("image7")}
                                className="w-[200px] h-full bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer border border-dashed border-gray-400"
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

                    <svg
                      className="absolute top-0 left-0 w-full z-[18]"
                      height="193"
                      viewBox="0 0 648 193"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="none"
                    >
                      <mask
                        id="mask0_125_1511"
                        className="absolute top-0 right-0 left-0"
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="70"
                        width="648"
                        height="123"
                      >
                        <path
                          d="M0 128.56V152.86C7.9 161.46 75.7 226.86 284.2 169.96C507.1 109.16 647.2 160.66 647.2 160.66V159.36L648 136.96V88.2596L2 70.5596L0 128.56Z"
                          fill="white"
                        />
                      </mask>
                      <g mask="url(#mask0_125_1511)">
                        <path
                          d="M673.274 40.7318L0.604411 20.1799L-25.274 867.187L647.396 887.739L673.274 40.7318Z"
                          fill="url(#paint0_linear_125_1511)"
                        />
                      </g>
                      <path
                        d="M648 141.354C648 141.354 506.181 93.772 285.49 160.644C64.8 227.517 0 150.356 0 150.356V1.52588e-05H648V140.068"
                        fill="white"
                      />
                      <defs>
                        <linearGradient
                          id="paint0_linear_125_1511"
                          x1="645.986"
                          y1="208.835"
                          x2="-1.93693"
                          y2="189.039"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#00B9F2" />
                          <stop offset="0.391667" stopColor="#0097C9" />
                          <stop offset="0.515476" stopColor="#028DBD" />
                          <stop offset="0.892857" stopColor="#1B6C9B" />
                          <stop offset="1" stopColor="#226392" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* image2 */}
                    <div className="w-full h-[580px] mt-[25px] place-self-center relative overflow-hidden group">
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
                              className="absolute top-24 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image2")}
                              className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                              className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                    {/* 4 Bottom Grid Photos (image3, image4, image5, image6) */}
                    <div className="grid grid-cols-4">
                      {/* image3 */}
                      <div className="h-full relative group overflow-hidden">
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
                                onMouseDown={(e) =>
                                  handleMouseDown("image3", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image3}
                                  scale={scale.image3}
                                  position={position.image3}
                                  rotation={rotation.image3}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image3", "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image3", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image3")}
                                className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openImageSourceModal("image3")}
                                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image3", fileInputRef3)
                                }
                                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                      {/* image4 */}
                      <div className="h-[170px] relative group overflow-hidden">
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
                                onMouseDown={(e) =>
                                  handleMouseDown("image4", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image4}
                                  scale={scale.image4}
                                  position={position.image4}
                                  rotation={rotation.image4}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image4", "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image4", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image4")}
                                className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openImageSourceModal("image4")}
                                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image4", fileInputRef4)
                                }
                                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                      <div className="h-[170px] relative group overflow-hidden">
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
                                onMouseDown={(e) =>
                                  handleMouseDown("image5", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image5}
                                  scale={scale.image5}
                                  position={position.image5}
                                  rotation={rotation.image5}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image5", "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image5", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image5")}
                                className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openImageSourceModal("image5")}
                                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image5", fileInputRef5)
                                }
                                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                      <div className="h-[170px] relative group overflow-hidden">
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
                                onMouseDown={(e) =>
                                  handleMouseDown("image6", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image6}
                                  scale={scale.image6}
                                  position={position.image6}
                                  rotation={rotation.image6}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image6", "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image6", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image6")}
                                className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openImageSourceModal("image6")}
                                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image6", fileInputRef6)
                                }
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
                  </div>
                </div>

                {/* Bottom Contact Footer Bar */}
                <div
                  className="flex h-[180px] px-[40px] shrink-0 relative z-20"
                  style={{
                    marginLeft: showBleed ? "-0.375in" : "-0.25in",
                    marginRight: showBleed ? "-0.375in" : "-0.25in",
                    background:
                      "linear-gradient(90deg, #00B9F2 0%, #0097C9 39%, #028DBD 52%, #186C9B 89%, #226392 100%)",
                  }}
                >
                  <div className="w-1/2 py-[10px] relative flex items-center">
                    <div className="text-white leading-none text-left ">
                      <div>
                        <div className="font-semibold text-[20px] flex gap-3  w-[90%]">
                          <StyledInput
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("fullName", s)
                            }
                            inputStyle={fieldStyles.fullName}
                            className=" text-[20px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                            placeholder="FIRSTNAME LASTNAME"
                          />
                          <StyledInput
                            value={propertyName}
                            onChange={(e) => setPropertyName(e.target.value)}
                            onChangeStyle={(s) =>
                              updateFieldStyle("propertyName", s)
                            }
                            inputStyle={fieldStyles.propertyName}
                            className=" text-[20px] h-[22px] font- bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                            placeholder="MACDONALD  Realty"
                          />
                        </div>
                        <div className="font-semibold text-[20px] flex gap-3 mt-3 w-[90%]">
                          <StyledInput
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            onChangeStyle={(s) => updateFieldStyle("number", s)}
                            inputStyle={fieldStyles.number}
                            className="font-semibold text-[20px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                            placeholder="604.000.0000"
                          />
                          <StyledInput
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onChangeStyle={(s) => updateFieldStyle("email", s)}
                            inputStyle={fieldStyles.email}
                            className="font-thin text-[20px] h-[22px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[200]"
                            placeholder="Enter email here"
                          />
                        </div>
                      </div>
                      <div className="text-start  font-thin flex w-[80%] mt-4">
                        <span className="text-[8px]">
                          All information deemed reliable but not guaranteed and
                          should be independently verified. All properties are
                          subject to prior sale, change or withdrawal. Neither
                          listing broker(s) nor BC Floor Plans shall be
                          responsible for any typographical errors,
                          misinformation, misprints and shall be held totally
                          harmless.
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
                    </div>
                  </div>
                  <div className="w-1/2 text-center text-[30px] text-white content-center">
                    <StyledInput
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onChangeStyle={(s) => updateFieldStyle("amount", s)}
                      inputStyle={fieldStyles.amount}
                      className="font-semibold text-center text-[36px] bg-transparent w-full focus:outline-none border-none placeholder-white placeholder:font-[500]"
                      placeholder="$000,000"
                    />
                  </div>
                </div>
              </div>
            </SafeZoneWrapper>
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

          {/* pdf-page 2 */}
          <div
            className="flex items-stretch pdf-page bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] relative overflow-hidden"
            style={{
              width: showBleed ? "17.25in" : "17in",
              height: showBleed ? "11.25in" : "11in",
              zoom: 0.55,
              margin: "0 auto",
              marginBottom: "40px",
            }}
          >
            {/* Page 2 Background SVGs placed in parent bleed container for edge-to-edge coverage */}
            <div className="absolute top-20 left-0 right-0 h-[123px] pointer-events-none z-0">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 648 123"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <mask
                  id="mask0_146_14"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="648"
                  height="123"
                >
                  <path
                    d="M0 58.5596V82.8596C7.9 91.4596 75.7 156.86 284.2 99.9596C507.1 39.1596 647.2 90.6596 647.2 90.6596V89.3596L648 66.9596V18.2596L2 0.559631L0 58.5596Z"
                    fill="white"
                  />
                </mask>
                <g mask="url(#mask0_146_14)">
                  <path
                    d="M656 95C656 95 540 19.5 291.5 77.5001C43.0002 135.5 1.90296 53.7173 1.90296 53.7173L1.90295 85C1.90295 85 79.2658 175.406 306.5 95C371.5 72 656 95 656 95Z"
                    fill="url(#paint0_linear_146_14)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_146_14"
                    x1="629.705"
                    y1="29.4826"
                    x2="7.43761"
                    y2="10.4706"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00B9F2" />
                    <stop offset="0.391667" stopColor="#0097C9" />
                    <stop offset="0.515476" stopColor="#028DBD" />
                    <stop offset="0.892857" stopColor="#1B6C9B" />
                    <stop offset="1" stopColor="#226392" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="w-full absolute bottom-0 left-0 right-0 z-0 pointer-events-none h-[325px]">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 1242 255"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <mask
                  id="mask0_146_3734"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="1242"
                  height="255"
                >
                  <path
                    d="M694.6 58.8C271.7 203.1 0 100.4 0 100.4V103.2V254.5H1241.6V81C1241.6 81 1181.2 0 1001 0C923 0 822.4 15.2 694.6 58.8Z"
                    fill="white"
                  />
                </mask>
                <g mask="url(#mask0_146_3734)">
                  <path
                    d="M0 254.5H1242V-555.5H0V254.5Z"
                    fill="url(#paint0_linear_146_3734)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_146_3734"
                    x1="0"
                    y1="-0.0199854"
                    x2="1241.58"
                    y2="-0.0199854"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00B9F2" />
                    <stop offset="0.391667" stopColor="#0097C9" />
                    <stop offset="0.515476" stopColor="#028DBD" />
                    <stop offset="0.892857" stopColor="#1B6C9B" />
                    <stop offset="1" stopColor="#226392" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Page 2 background SVGs placed outside SafeZoneWrapper for full edge-to-edge bleed coverage */}
            <div className="absolute top-20 left-0 right-0 h-[123px] pointer-events-none z-0">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 648 123"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <mask
                  id="mask0_146_14"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="648"
                  height="123"
                >
                  <path
                    d="M0 58.5596V82.8596C7.9 91.4596 75.7 156.86 284.2 99.9596C507.1 39.1596 647.2 90.6596 647.2 90.6596V89.3596L648 66.9596V18.2596L2 0.559631L0 58.5596Z"
                    fill="white"
                  />
                </mask>
                <g mask="url(#mask0_146_14)">
                  <path
                    d="M656 95C656 95 540 19.5 291.5 77.5001C43.0002 135.5 1.90296 53.7173 1.90296 53.7173L1.90295 85C1.90295 85 79.2658 175.406 306.5 95C371.5 72 656 95 656 95Z"
                    fill="url(#paint0_linear_146_14)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_146_14"
                    x1="629.705"
                    y1="29.4826"
                    x2="7.43761"
                    y2="10.4706"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00B9F2" />
                    <stop offset="0.391667" stopColor="#0097C9" />
                    <stop offset="0.515476" stopColor="#028DBD" />
                    <stop offset="0.892857" stopColor="#1B6C9B" />
                    <stop offset="1" stopColor="#226392" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="w-full absolute bottom-0 left-0 right-0 z-0 pointer-events-none h-[325px]">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 1242 255"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <mask
                  id="mask0_146_3734"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="1242"
                  height="255"
                >
                  <path
                    d="M694.6 58.8C271.7 203.1 0 100.4 0 100.4V103.2V254.5H1241.6V81C1241.6 81 1181.2 0 1001 0C923 0 822.4 15.2 694.6 58.8Z"
                    fill="white"
                  />
                </mask>
                <g mask="url(#mask0_146_3734)">
                  <path
                    d="M0 254.5H1242V-555.5H0V254.5Z"
                    fill="url(#paint0_linear_146_3734)"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_146_3734"
                    x1="0"
                    y1="-0.0199854"
                    x2="1241.58"
                    y2="-0.0199854"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00B9F2" />
                    <stop offset="0.391667" stopColor="#0097C9" />
                    <stop offset="0.515476" stopColor="#028DBD" />
                    <stop offset="0.892857" stopColor="#1B6C9B" />
                    <stop offset="1" stopColor="#226392" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <SafeZoneWrapper showBleed={showBleed} showGuide={showGuide}>
              <div className="w-full flex flex-col justify-center h-full font-alexandria relative">
                <div className="flex gap-4 relative h-full z-10">
                  {/* Page 2 Left Column */}
                  <div className="w-1/2 flex flex-col gap-4">
                    {/* image8 */}
                    <div className="w-full h-[500px] flex-1 place-self-center z-10 relative overflow-hidden group">
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
                              className="absolute top-24 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                              title="Rotate image"
                            >
                              <RotateCw className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openImageSourceModal("image8")}
                              className="absolute top-24 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete("image8", fileInputRef8)
                              }
                              className="absolute top-24 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                    <div className="max-h-[170px] overflow-hidden px-4 py-1">
                      <StyledInput
                        value={description}
                        rows={6}
                        onChange={(e) => setDescription(e.target.value)}
                        onChangeStyle={(s) =>
                          updateFieldStyle("description", s)
                        }
                        inputStyle={fieldStyles.description}
                        className="font-normal text-[10px] h-auto z-20 text-black leading-[1.8] italic bg-transparent text-left focus:outline-none border-none placeholder-black placeholder:font-[500]"
                        placeholder="Enter property description here..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* image9 */}
                      <div className="h-[220px] relative z-10 group overflow-hidden">
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
                                onMouseDown={(e) =>
                                  handleMouseDown("image9", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image9}
                                  scale={scale.image9}
                                  position={position.image9}
                                  rotation={rotation.image9}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image9", "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image9", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image9")}
                                className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openImageSourceModal("image9")}
                                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image9", fileInputRef9)
                                }
                                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                      <div className="h-[220px] relative z-10 group overflow-hidden">
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
                                onMouseDown={(e) =>
                                  handleMouseDown("image10", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image10}
                                  scale={scale.image10}
                                  position={position.image10}
                                  rotation={rotation.image10}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image10", "in")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-4 h-4 text-gray-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleZoom("image10", "out")}
                                  className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image10")}
                                className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openImageSourceModal("image10")}
                                className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image10", fileInputRef10)
                                }
                                className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                    <div className=" w-full font-bold text-white text-[18px] mt-[10px] flex flex-wrap gap-2 px-1">
                      <div className="inline">
                        <StyledInput
                          value={bedroom}
                          onChange={(e) => setBedroom(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("bedroom", s)}
                          inputStyle={fieldStyles.bedroom}
                          className="font-semibold text-[13px] bg-transparent text-left w-[40px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="0"
                        />
                      </div>
                      BEDROOM •
                      <div className="inline">
                        <StyledInput
                          value={bathroom}
                          onChange={(e) => setBathroom(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("bathroom", s)}
                          inputStyle={fieldStyles.bathroom}
                          className="font-semibold text-[13px] bg-transparent text-left w-[40px] h-[20px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="0"
                        />
                      </div>
                      BATHROOM •
                      <div className="inline">
                        <StyledInput
                          value={sqft}
                          onChange={(e) => setSqft(e.target.value)}
                          onChangeStyle={(s) => updateFieldStyle("sqft", s)}
                          inputStyle={fieldStyles.sqft}
                          className="font-semibold text-[13px] bg-transparent text-left h-[20px] w-[80px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="000"
                        />
                      </div>
                      SQ FT • BUILT IN
                      <div className="inline">
                        <StyledInput
                          value={builtYear}
                          onChange={(e) => setBuiltYear(e.target.value)}
                          onChangeStyle={(s) =>
                            updateFieldStyle("builtYear", s)
                          }
                          inputStyle={fieldStyles.builtYear}
                          className="font-semibold text-[13px] bg-transparent text-left h-[30px] w-[80px] focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                          placeholder="0000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Page 2 Right Column */}
                  <div className="w-1/2 flex gap-4 h-full">
                    <div className="w-[50%] h-full">
                      <div className="flex flex-col gap-3 h-full w-full pb-3">
                        {/* image11 */}
                        <div className="flex-1 min-h-0 w-full relative z-10 group overflow-hidden">
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
                                  onMouseDown={(e) =>
                                    handleMouseDown("image11", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image11}
                                    scale={scale.image11}
                                    position={position.image11}
                                    rotation={rotation.image11}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image11", "in")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image11", "out")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>

                                {/* Rotate */}
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image11")}
                                  className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Edit Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openImageSourceModal("image11")
                                  }
                                  className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image11", fileInputRef11)
                                  }
                                  className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                        {/* image12 */}
                        <div className="flex-1 min-h-0 w-full relative z-10 group overflow-hidden">
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
                                  onMouseDown={(e) =>
                                    handleMouseDown("image12", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image12}
                                    scale={scale.image12}
                                    position={position.image12}
                                    rotation={rotation.image12}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image12", "in")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image12", "out")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>

                                {/* Rotate */}
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image12")}
                                  className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Edit Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openImageSourceModal("image12")
                                  }
                                  className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image12", fileInputRef12)
                                  }
                                  className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                        <div className="flex-1 min-h-0 w-full relative z-10 group overflow-hidden">
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
                                  onMouseDown={(e) =>
                                    handleMouseDown("image13", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image13}
                                    scale={scale.image13}
                                    position={position.image13}
                                    rotation={rotation.image13}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image13", "in")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image13", "out")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>

                                {/* Rotate */}
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image13")}
                                  className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Edit Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openImageSourceModal("image13")
                                  }
                                  className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete("image13", fileInputRef13)
                                  }
                                  className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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
                        <div className="flex-1 min-h-0 w-full relative z-10 group overflow-hidden">
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
                                  onMouseDown={(e) =>
                                    handleMouseDown("image14", e)
                                  }
                                >
                                  <ImageEditor
                                    src={images.image14}
                                    scale={scale.image14}
                                    position={position.image14}
                                    rotation={rotation.image14}
                                  />
                                </div>

                                {/* Zoom Controls */}
                                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image14", "in")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom In"
                                  >
                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleZoom("image14", "out")}
                                    className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                  </button>
                                </div>

                                {/* Rotate */}
                                <button
                                  type="button"
                                  onClick={() => handleRotate("image14")}
                                  className="absolute top-2 right-[72px] z-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                  title="Rotate image"
                                >
                                  <RotateCw className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Edit Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openImageSourceModal("image14")
                                  }
                                  className="absolute top-2 right-10 z-10 bg-white p-1 rounded-full hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                  title="Edit image"
                                >
                                  <Pencil className="w-4 h-4 text-gray-700" />
                                </button>

                                {/* Delete Button */}
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
                      </div>
                    </div>

                    <div className="w-[50%] flex flex-col justify-between gap-[100px]">
                      {/* image15 */}
                      <div className="w-full h-[590px] mb-4 place-self-center border-2 z-10 border-[#fff] relative overflow-hidden group">
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
                                onMouseDown={(e) =>
                                  handleMouseDown("image15", e)
                                }
                              >
                                <ImageEditor
                                  src={images.image15}
                                  scale={scale.image15}
                                  position={position.image15}
                                  rotation={rotation.image15}
                                />
                              </div>

                              {/* Zoom Controls */}
                              <div className="absolute bottom-1 left-1 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

                              {/* Rotate */}
                              <button
                                type="button"
                                onClick={() => handleRotate("image15")}
                                className="absolute top-2 right-[72px] bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto print:hidden"
                                title="Rotate image"
                              >
                                <RotateCw className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openImageSourceModal("image15")}
                                className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                                title="Edit image"
                              >
                                <Pencil className="w-4 h-4 text-gray-700" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete("image15", fileInputRef15)
                                }
                                className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
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

                      <div className="relative z-10 flex gap-4 pb-[5px] text-white text-[12px] leading-relaxed pt-[0px] h-[250px] overflow-hidden">
                        <div className="space-y-2 text-[8px] w-1/2 overflow-hidden">
                          <div>
                            <span className="font-bold text-[#00B9F2]">
                              BY-LAW RESTRICTIONS:
                            </span>
                            <StyledInput
                              value={byLawRestrictions}
                              onChange={(e) =>
                                setByLawRestrictions(e.target.value)
                              }
                              onChangeStyle={(s) =>
                                updateFieldStyle("byLawRestrictions", s)
                              }
                              inputStyle={fieldStyles.byLawRestrictions}
                              className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                              placeholder="Enter details here"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-[#00B9F2]">
                              MAINT. FEES:
                            </span>
                            <StyledInput
                              value={maintFees}
                              onChange={(e) => setMaintFees(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFees", s)
                              }
                              inputStyle={fieldStyles.maintFees}
                              className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                              placeholder="Enter fees here"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-[#00B9F2]">
                              MAINT. FEES INCLUDE:
                            </span>
                            <StyledInput
                              value={maintFeesInclude}
                              onChange={(e) =>
                                setMaintFeesInclude(e.target.value)
                              }
                              onChangeStyle={(s) =>
                                updateFieldStyle("maintFeesInclude", s)
                              }
                              inputStyle={fieldStyles.maintFeesInclude}
                              className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                              placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-[#00B9F2]">
                              FEATURES INCLUDED:
                            </span>
                            <StyledInput
                              value={featuresIncluded}
                              onChange={(e) =>
                                setFeaturesIncluded(e.target.value)
                              }
                              onChangeStyle={(s) =>
                                updateFieldStyle("featuresIncluded", s)
                              }
                              inputStyle={fieldStyles.featuresIncluded}
                              className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                              placeholder="Clothes Washer/Dryer/ Fridge/Stove/DW, Drapes/ Window Coverings"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 text-[8px] w-1/2 overflow-hidden mt-5">
                          <div>
                            <span className="font-bold text-[#00B9F2]">
                              SITE INFLUENCES:
                            </span>
                            <StyledInput
                              value={siteInfluences}
                              onChange={(e) =>
                                setSiteInfluences(e.target.value)
                              }
                              onChangeStyle={(s) =>
                                updateFieldStyle("siteInfluences", s)
                              }
                              inputStyle={fieldStyles.siteInfluences}
                              className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                              placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-[#00B9F2]">
                              AMENITIES:
                            </span>
                            <StyledInput
                              value={amenities}
                              onChange={(e) => setAmenities(e.target.value)}
                              onChangeStyle={(s) =>
                                updateFieldStyle("amenities", s)
                              }
                              inputStyle={fieldStyles.amenities}
                              className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                              placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-[#00B9F2]">
                              VIEW:
                            </span>
                            <StyledInput
                              value={view}
                              onChange={(e) => setView(e.target.value)}
                              onChangeStyle={(s) => updateFieldStyle("view", s)}
                              inputStyle={fieldStyles.view}
                              className="font-semibold text-[10px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
                              placeholder="South & SW - Van Isl."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SafeZoneWrapper>
          </div>
        </div>
      </>
    );
  },
);

BcfpStandard6.displayName = "BcfpStandard6";

export default BcfpStandard6;
