import { Pencil, Trash, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import { featureSheetService } from "../file-manager";
import { FeatureSheetPayload, FeatureSheetResponse } from "../types/featureSheetTypes";
import { useFileManagerContext } from "../FileManagerContext";
import ImageEditor from "./ImageEditor";
import { BackgroundSVG } from "./BackgroundSVG";

export interface BcfpStandard20Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard20Props {
  orderData: Order | null;
}

const BcfpStandard20 = forwardRef<BcfpStandard20Ref, BcfpStandard20Props>(
  ({ orderData }, ref) => {
    const [suite, setSuite] = useState("");
    const [mlsNumber, setMlsNumber] = useState("");
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
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    const [builtYear, setBuiltYear] = useState("");

    const [images, setImages] = useState<Record<string, string | null>>({
      image1: null, image2: null, image3: null, image4: null, image5: null, image6: null, image7: null, image8: null
    });
    const [scale, setScale] = useState<Record<string, number>>({
      image1: 1, image2: 1, image3: 1, image4: 1, image5: 1, image6: 1, image7: 1, image8: 1
    });
    const [position, setPosition] = useState<Record<string, {x: number, y: number}>>({
      image1: {x:0,y:0}, image2: {x:0,y:0}, image3: {x:0,y:0}, image4: {x:0,y:0}, image5: {x:0,y:0}, image6: {x:0,y:0}, image7: {x:0,y:0}, image8: {x:0,y:0}
    });
    const [dragging, setDragging] = useState<Record<string, boolean>>({
      image1: false, image2: false, image3: false, image4: false, image5: false, image6: false, image7: false, image8: false
    });
    const [rotation, setRotation] = useState<Record<string, number>>({
      image1: 0, image2: 0, image3: 0, image4: 0, image5: 0, image6: 0, image7: 0, image8: 0
    });

    const [fieldStyles, setFieldStyles] = useState<Record<string, any>>({});
    const updateFieldStyle = (fieldName: string, style: any) => {
      setFieldStyles((prev) => ({ ...prev, [fieldName]: style }));
    };

    const lastPosition = useRef<Record<string, {x: number, y: number}>>({
      image1: {x:0,y:0}, image2: {x:0,y:0}, image3: {x:0,y:0}, image4: {x:0,y:0}, image5: {x:0,y:0}, image6: {x:0,y:0}, image7: {x:0,y:0}, image8: {x:0,y:0}
    });

    const [showImageSourceModal, setShowImageSourceModal] = useState(false);
    const [currentImageSlot, setCurrentImageSlot] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);

    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard20",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#000000",
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
            amenities, view, bedroom, bathroom, sqft, builtYear, number, addressCode, cityLine, suite, mlsNumber
          },
          images, imageScales: scale, imagePositions: position, fieldStyles, imageRotations: rotation
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
          if (details.suite) setSuite(details.suite as string);
          if (details.mlsNumber) setMlsNumber(details.mlsNumber as string);
        }

        if (state.images) setImages((prev) => ({ ...prev, ...(state.images as any) }));
        if (state.imageScales) setScale((prev) => ({ ...prev, ...(state.imageScales as any) }));
        if (state.imagePositions) setPosition((prev) => ({ ...prev, ...(state.imagePositions as any) }));
        if (state.fieldStyles) setFieldStyles(state.fieldStyles as Record<string, any>);
        if (state.imageRotations) setRotation((prev) => ({ ...prev, ...(state.imageRotations as any) }));
      },
    }));

    const { formData, updateFormData } = useFileManagerContext();

    useEffect(() => {
      if (orderData) {
        if (orderData.property) {
          if (orderData.property.listing_price) setAmount(orderData.property.listing_price.toString());
          if (orderData.property.bedrooms) setBedroom(orderData.property.bedrooms.toString());
          if (orderData.property.bathrooms) setBathroom(orderData.property.bathrooms.toString());
          if (orderData.property.square_footage) setSqft(orderData.property.square_footage.toString());
          if (orderData.property.year_constructed) setBuiltYear(orderData.property.year_constructed.toString());
          if (orderData.property.description) setDescription(orderData.property.description);
          if (orderData.property.mls_number) {
            setMlsNumber(orderData.property.mls_number);
            setAddressCode(orderData.property.mls_number);
          }
          if (orderData.property.suite) {
            setSuite(orderData.property.suite);
            setRoadName(orderData.property.suite);
          }
          
          let cityString = "";
          if (orderData.property.city) cityString += orderData.property.city;
          if (orderData.property.province) cityString += (cityString ? ", " : "") + orderData.property.province;
          if (orderData.property.postal_code) cityString += (cityString ? " " : "") + orderData.property.postal_code;
          if (cityString) setCityLine(cityString);
        }
        if (orderData.agent) {
          const agent = orderData.agent;
          if (agent.first_name || agent.last_name) setFullName(`${agent.first_name || ''} ${agent.last_name || ''}`.trim());
          if (agent.email) setEmail(agent.email);
          if (agent.primary_phone) setNumber(agent.primary_phone);
          if (agent.company_name) setPropertyName(agent.company_name);
        }
      }

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
        if (formData.suite) setSuite(formData.suite);
        if (formData.mlsNumber) setMlsNumber(formData.mlsNumber);
        if (formData.images) setImages(prev => ({ ...prev, ...(formData.images as any) }));
        if (formData.imageScales) setScale(prev => ({ ...prev, ...(formData.imageScales as any) }));
        if (formData.imagePositions) setPosition(prev => ({ ...prev, ...(formData.imagePositions as any) }));
        if (formData.imageRotations) setRotation(prev => ({ ...prev, ...(formData.imageRotations as any) }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      updateFormData({
        byLawRestrictions, maintenanceFees: maintFees, maintenanceFeesInclude: maintFeesInclude, featuresIncluded,
        siteInfluences, amenities, view, description, fullName, email, propertyName, amount, number,
        addressCode, roadName, cityLine, bedroom, bathroom, sqft, builtYear, suite, mlsNumber
      });
    }, [byLawRestrictions, maintFees, maintFeesInclude, featuresIncluded, siteInfluences, amenities, view, description, fullName, email, propertyName, amount, number, addressCode, roadName, cityLine, bedroom, bathroom, sqft, builtYear, suite, mlsNumber, updateFormData]);

    const handleImageChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setImages((prev) => ({ ...prev, [key]: url }));
      }
    };

    const handleDelete = (key: string) => {
      setImages((prev) => ({ ...prev, [key]: null }));
      setScale((prev) => ({ ...prev, [key]: 1 }));
      setPosition((prev) => ({ ...prev, [key]: { x: 0, y: 0 } }));
      setRotation((prev) => ({ ...prev, [key]: 0 }));
      const input = document.getElementById(`fileInput-${key}`) as HTMLInputElement;
      if (input) input.value = "";
    };

    const handleZoom = (key: string, direction: "in" | "out") => {
      setScale((prev) => {
        const newScale = direction === "in" ? prev[key] + 0.1 : prev[key] - 0.1;
        const bounded = Math.min(Math.max(newScale, 0.1), 5);
        return { ...prev, [key]: bounded };
      });
    };

    const handleRotate = (key: string) => {
      setRotation(prev => ({ ...prev, [key]: ((prev[key] || 0) + 90) % 360 }));
    };

    const handleMouseDown = (key: string, e: React.MouseEvent) => {
      setDragging((prev) => ({ ...prev, [key]: true }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (key: string, e: React.MouseEvent) => {
      if (!dragging[key]) return;
      const dx = e.clientX - lastPosition.current[key].x;
      const dy = e.clientY - lastPosition.current[key].y;

      setPosition((prev) => ({
        ...prev,
        [key]: { x: prev[key].x + dx, y: prev[key].y + dy },
      }));
      lastPosition.current[key] = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (key: string) => setDragging((prev) => ({ ...prev, [key]: false }));
    const handleMouseLeave = (key: string) => setDragging((prev) => ({ ...prev, [key]: false }));

    const handleImageSourceSelect = (source: "local" | "gallery") => {
      setShowImageSourceModal(false);
      if (source === "local" && currentImageSlot) {
        const input = document.getElementById(`fileInput-${currentImageSlot}`) as HTMLInputElement;
        if (input) input.click();
      } else if (source === "gallery") {
        setShowGallery(true);
      }
    };

    const handleGalleryImageSelect = (imageUrl: string) => {
      if (currentImageSlot) {
        setImages((prev) => ({ ...prev, [currentImageSlot]: imageUrl }));
      }
      setShowGallery(false);
      setCurrentImageSlot(null);
    };

    const openImageSourceModal = (imageSlot: string) => {
      setCurrentImageSlot(imageSlot);
      setShowImageSourceModal(true);
    };

    const renderImageSlot = (key: string, label: string = "Select Image") => (
      <div
        className="w-full h-full relative overflow-hidden flex items-center justify-center group bg-transparent border-none"
        onMouseDown={(e) => handleMouseDown(key, e)}
        onMouseMove={(e) => handleMouseMove(key, e)}
        onMouseUp={() => handleMouseUp(key)}
        onMouseLeave={() => handleMouseLeave(key)}
        style={{ cursor: dragging[key] ? "grabbing" : "grab" }}
      >
        {images[key] ? (
          <>
            <ImageEditor src={images[key]} scale={scale[key]} position={position[key]} rotation={rotation[key]} />
            <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
              <button type="button" onClick={() => handleZoom(key, "in")} className="bg-white p-2 rounded-full shadow hover:bg-gray-100" title="Zoom In"><ZoomIn className="w-4 h-4 text-gray-700" /></button>
              <button type="button" onClick={() => handleZoom(key, "out")} className="bg-white p-2 rounded-full shadow hover:bg-gray-100" title="Zoom Out"><ZoomOut className="w-4 h-4 text-gray-700" /></button>
              <button type="button" onClick={() => handleRotate(key)} className="bg-white p-2 rounded-full shadow hover:bg-gray-100" title="Rotate"><RotateCw className="w-4 h-4 text-gray-700" /></button>
            </div>
            <button type="button" onClick={() => openImageSourceModal(key)} className="absolute top-[10px] right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto" title="Edit image"><Pencil className="w-4 h-4 text-gray-700" /></button>
            <button type="button" onClick={() => handleDelete(key)} className="absolute top-[10px] right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto" title="Delete image"><Trash className="w-4 h-4 text-red-500" /></button>
          </>
        ) : (
          <div onClick={() => openImageSourceModal(key)} className={`w-full h-full text-gray-500 flex items-center justify-center cursor-pointer border ${key === "image8" ? "border-dashed border-gray-400 bg-white/10 text-gray-300" : "border-none bg-[#e2e8f0]"}`}>{label}</div>
        )}
        <input type="file" accept="image/*" id={`fileInput-${key}`} onChange={(e) => handleImageChange(key, e)} className="hidden" />
      </div>
    );

    const renderHeader = () => (
      <div className="w-full bg-black/85 px-[50px] py-[30px] shadow-sm relative flex items-center justify-between border-y-3 border-white">
        {/* Left Side: Address & Price */}
        <div className="relative z-10 flex flex-col justify-center gap-2 w-full max-w-[60%]">
          {/* Top Line */}
          <div className="flex items-center gap-1 font-light text-[21px] text-[#ffffff] leading-none">
            #
            <StyledInput value={mlsNumber} onChange={(e) => setMlsNumber(e.target.value)} inputStyle={fieldStyles.mlsNumber} onChangeStyle={(s) => updateFieldStyle("mlsNumber", s)} className="w-[140px] ml-1 bg-transparent text-[#ffffff] font-light text-[21px] focus:outline-none placeholder-[#ffffff] placeholder:font-[200]" placeholder="0000-0000" />
            <span className="mx-1">NUMBER</span>
            <StyledInput value={suite} onChange={(e) => setSuite(e.target.value)} inputStyle={fieldStyles.suite} onChangeStyle={(s) => updateFieldStyle("suite", s)} className="w-[60px] text-center bg-transparent text-[#ffffff] font-light text-[21px] focus:outline-none placeholder-[#ffffff] placeholder:font-[200]" placeholder="0" />
            <span className="ml-1">ROAD</span>
          </div>
          
          {/* Bottom Line */}
          <div className="flex items-center justify-between pr-4 mt-2">
            <StyledInput value={cityLine} onChange={(e) => setCityLine(e.target.value)} inputStyle={fieldStyles.cityLine} onChangeStyle={(s) => updateFieldStyle("cityLine", s)} className="w-[350px] bg-transparent text-[#ffffff] text-[15px] tracking-widest uppercase focus:outline-none placeholder-[#ffffff] placeholder:font-[200]" placeholder="BRIGHOUSE SOUTH, RICHMOND" />
            
            <StyledInput value={amount} onChange={(e) => setAmount(e.target.value)} inputStyle={fieldStyles.amount} onChangeStyle={(s) => updateFieldStyle("amount", s)} className="w-[120px] bg-transparent text-[#ffffff] text-[18px] font-semibold text-center focus:outline-none placeholder-[#ffffff] placeholder:font-[500]" placeholder="$000,000" />
          </div>
        </div>

        {/* Right Side: Logo Slot */}
        <div className="relative z-10 w-[220px] h-[80px]">
          {renderImageSlot("image8", "Logo Image")}
        </div>
      </div>
    );

    return (
      <>
        {showImageSourceModal && <ImageSourceModal onClose={() => setShowImageSourceModal(false)} onSelectSource={handleImageSourceSelect} />}
        {showGallery && <FileManagerGallery isOpen={showGallery} onClose={() => { setShowGallery(false); setCurrentImageSlot(null); }} onImageSelect={handleGalleryImageSelect} />}

        {/* Page 1 Divider */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">PAGE 1</span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* Page 1 */}
        <div className="pdf-page w-[8.5in] h-[11in] relative overflow-hidden flex flex-col bg-[#fbfbfb] shadow-xl font-serif">
          <div className="absolute top-0 left-0 w-full h-full z-0"><BackgroundSVG /></div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            {renderHeader()}
            
            <div className="flex w-full px-[35px] py-[25px] gap-[25px] flex-1">
              {/* Left Column */}
              <div className="w-[65%] flex flex-col h-full text-black">
                <div className="w-full min-h-[260px] bg-[#e2e8f0] relative mb-4 shadow-sm border-2 border-white">
                  {renderImageSlot("image1")}
                </div>
                
                {/* Specs Row */}
                <div className="flex flex-nowrap whitespace-nowrap font-semibold text-[13px] items-center mb-3 justify-center uppercase text-black">
                  <div className="w-[15px] flex items-center justify-center">
                    <StyledInput value={bedroom} onChange={(e) => setBedroom(e.target.value)} inputStyle={fieldStyles.bedroom} onChangeStyle={(s) => updateFieldStyle("bedroom", s)} className="w-full bg-transparent text-center focus:outline-none placeholder-gray-600 font-semibold" placeholder="0" />
                  </div>
                  <span className="ml-[3px] text-[10px] tracking-widest">BEDROOM</span> <span className="text-[12px] text-black mx-[6px]">·</span> 
                  <div className="w-[15px] flex items-center justify-center">
                    <StyledInput value={bathroom} onChange={(e) => setBathroom(e.target.value)} inputStyle={fieldStyles.bathroom} onChangeStyle={(s) => updateFieldStyle("bathroom", s)} className="w-full bg-transparent text-center focus:outline-none placeholder-gray-600 font-semibold" placeholder="0" />
                  </div>
                  <span className="ml-[3px] text-[10px] tracking-widest">BATHROOM</span> <span className="text-[12px] text-black mx-[6px]">·</span> 
                  <div className="w-[52px] flex items-center justify-center">
                    <StyledInput value={sqft} onChange={(e) => setSqft(e.target.value)} inputStyle={fieldStyles.sqft} onChangeStyle={(s) => updateFieldStyle("sqft", s)} className="w-full bg-transparent text-center focus:outline-none placeholder-gray-600 font-semibold" placeholder="000" />
                  </div>
                  <span className="ml-[3px] text-[10px] tracking-widest">SQ FT</span> <span className="text-[12px] text-black mx-[6px]">·</span> 
                  <span className="mr-[3px] text-[10px] tracking-widest">BUILT IN</span>
                  <div className="w-[32px] flex items-center justify-center">
                    <StyledInput value={builtYear} onChange={(e) => setBuiltYear(e.target.value)} inputStyle={fieldStyles.builtYear} onChangeStyle={(s) => updateFieldStyle("builtYear", s)} className="w-full bg-transparent text-center focus:outline-none placeholder-gray-600 font-semibold" placeholder="0000" />
                  </div>
                </div>
                
                <div className="mb-4">
                  <StyledInput value={description} onChange={(e) => setDescription(e.target.value)} inputStyle={fieldStyles.description} onChangeStyle={(s) => updateFieldStyle("description", s)} rows={6} className="text-[12px] text-black text-left w-full bg-transparent focus:outline-none resize-none placeholder-gray-600 italic leading-[1.4]" placeholder="On top of it all! Beautiful sub-penthouse in the well appointed CENTRO building. This centrally located 2 bedroom, 2 bathroom home boasts incredible, totally unobstructed VIEWS overlooking Brighouse Park & to the South and South Westproviding unhindered privacy. The perfect floorplan with open concept living and cross unit bedrooms. Dark laminate flooring, S/S appliances, Gas range and a large open 'den/nook' area perfect for the home office. Huge private balcony, great building amenities including exercise room, sauna, roof top courtyard and outdoor kids playground. With parking, and storage locker and balance of the the 5-10 warranty, this home provides nothing but exceptional value. Call today to set up your viewing. MLS#000000" />
                </div>
                
                <div className="flex flex-col gap-1 text-[13px] text-black w-full mb-3">
                  <div className="flex items-start w-full">
                    <span className="font-bold mr-2 shrink-0 uppercase">BY-LAW RESTRICTIONS:</span> 
                    <StyledInput value={byLawRestrictions} onChange={e=>setByLawRestrictions(e.target.value)} inputStyle={fieldStyles.byLawRestrictions} onChangeStyle={(s) => updateFieldStyle("byLawRestrictions", s)} rows={1} className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder-gray-600 text-black leading-tight" placeholder="Pets Allowed w/Rest., Rentals Allowed" />
                  </div>
                  <div className="flex items-start w-full">
                    <span className="font-bold mr-2 shrink-0 uppercase">MAINT. FEES:</span> 
                    <StyledInput value={maintFees} onChange={e=>setMaintFees(e.target.value)} inputStyle={fieldStyles.maintFees} onChangeStyle={(s) => updateFieldStyle("maintFees", s)} rows={1} className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder-gray-600 text-black leading-tight" placeholder="$000.00" />
                  </div>
                  <div className="flex items-start w-full">
                    <span className="font-bold mr-2 shrink-0 uppercase">MAINT. FEES INCLUDE:</span> 
                    <StyledInput value={maintFeesInclude} onChange={e=>setMaintFeesInclude(e.target.value)} inputStyle={fieldStyles.maintFeesInclude} onChangeStyle={(s) => updateFieldStyle("maintFeesInclude", s)} rows={2} className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder-gray-600 text-black leading-tight" placeholder="Gardening, Garbage Pickup, Gas, Hot Water, Management, Recreation Facility, Other, Caretaker" />
                  </div>
                  <div className="flex items-start w-full">
                    <span className="font-bold mr-2 shrink-0 uppercase">FEATURES INCLUDED:</span> 
                    <StyledInput value={featuresIncluded} onChange={e=>setFeaturesIncluded(e.target.value)} inputStyle={fieldStyles.featuresIncluded} onChangeStyle={(s) => updateFieldStyle("featuresIncluded", s)} rows={2} className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder-gray-600 text-black leading-tight" placeholder="Clothes Washer/Dryer/Fridge/Stove/DW, Drapes/Window Coverings" />
                  </div>
                  <div className="flex items-start w-full">
                    <span className="font-bold mr-2 shrink-0 uppercase">SITE INFLUENCES:</span> 
                    <StyledInput value={siteInfluences} onChange={e=>setSiteInfluences(e.target.value)} inputStyle={fieldStyles.siteInfluences} onChangeStyle={(s) => updateFieldStyle("siteInfluences", s)} rows={2} className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder-gray-600 text-black leading-tight" placeholder="Central Location, Golf Course Nearby, Recreation Nearby, Shopping Nearby" />
                  </div>
                  <div className="flex items-start w-full">
                    <span className="font-bold mr-2 shrink-0 uppercase">AMENITIES:</span> 
                    <StyledInput value={amenities} onChange={e=>setAmenities(e.target.value)} inputStyle={fieldStyles.amenities} onChangeStyle={(s) => updateFieldStyle("amenities", s)} rows={2} className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder-gray-600 text-black leading-tight" placeholder="Exercise Centre, Garden, In Suite Laundry, Sauna/Steam Room" />
                  </div>
                  <div className="flex items-start w-full">
                    <span className="font-bold mr-2 shrink-0 uppercase">VIEW:</span> 
                    <StyledInput value={view} onChange={e=>setView(e.target.value)} inputStyle={fieldStyles.view} onChangeStyle={(s) => updateFieldStyle("view", s)} rows={1} className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder-gray-600 text-black leading-tight" placeholder="South & SW - Van Isl." />
                  </div>
                </div>

                {/* Contact & Price Block */}
                <div className="flex flex-row items-end justify-between w-full pb-2 mt-auto">
                  <div className="flex flex-col text-[13px] text-black leading-snug w-[60%]">
                    <div className="flex items-center">
                      <span className="font-bold uppercase mr-1">CONTACT:</span>
                      <StyledInput value={fullName} onChange={e=>setFullName(e.target.value)} inputStyle={fieldStyles.fullName} onChangeStyle={(s) => updateFieldStyle("fullName", s)} className="uppercase font-bold bg-transparent focus:outline-none placeholder-gray-600 w-full" placeholder="FIRSTNAME LASTNAME" />
                    </div>
                    <StyledInput value={propertyName} onChange={e=>setPropertyName(e.target.value)} inputStyle={fieldStyles.propertyName} onChangeStyle={(s) => updateFieldStyle("propertyName", s)} className="bg-transparent focus:outline-none placeholder-gray-600 w-full" placeholder="Macdonald Realty" />
                    <div className="flex items-center mt-1">
                      <span className="font-bold mr-1">Phone:</span>
                      <StyledInput value={number} onChange={e=>setNumber(e.target.value)} inputStyle={fieldStyles.number} onChangeStyle={(s) => updateFieldStyle("number", s)} className="bg-transparent text-[16px] focus:outline-none placeholder-gray-600 w-full" placeholder="604.000.0000" />
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold mr-1">Email:</span>
                      <StyledInput value={email} onChange={e=>setEmail(e.target.value)} inputStyle={fieldStyles.email} onChangeStyle={(s) => updateFieldStyle("email", s)} className="bg-transparent focus:outline-none placeholder-gray-600 w-full" placeholder="email@address.com" />
                    </div>
                  </div>
                  <div className="text-[44px] font-normal text-black leading-none pb-1 w-[40%] flex justify-end">
                    <StyledInput value={amount} onChange={e=>setAmount(e.target.value)} inputStyle={fieldStyles.amount} onChangeStyle={(s) => updateFieldStyle("amount", s)} className="bg-transparent focus:outline-none placeholder-gray-600 w-full text-right" placeholder="$000,000" />
                  </div>
                </div>
                
                {/* Footer Legal Text */}
                <div className="text-[7.5px] font-sans font-bold leading-tight text-black border-t border-gray-300 pt-1 text-justify">
                  All information deemed reliable but not guaranteed and should be independently verified. All properties are subject to prior sale, change or withdrawal. Neither listing broker(s) nor BC Floor Plans shall be responsible for any typographical errors, misinformation, misprints and shall be held totally harmless.
                </div>
              </div>
              
              {/* Right Column */}
              <div className="w-[35%] flex flex-col gap-3 h-full pb-[10px]">
                <div className="w-full h-[145px] bg-[#e2e8f0] relative shadow-md border-[3px] border-white">{renderImageSlot("image2")}</div>
                <div className="w-full h-[145px] bg-[#e2e8f0] relative shadow-md border-[3px] border-white">{renderImageSlot("image3")}</div>
                <div className="w-full h-[145px] bg-[#e2e8f0] relative shadow-md border-[3px] border-white">{renderImageSlot("image4")}</div>
                <div className="w-full h-[145px] bg-[#e2e8f0] relative shadow-md border-[3px] border-white">{renderImageSlot("image5")}</div>
                <div className="w-full h-[145px] bg-[#e2e8f0] relative shadow-md border-[3px] border-white">{renderImageSlot("image6")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 Divider */}
        <div className="w-[8.5in] flex items-center justify-center pb-6 pt-10 print:hidden select-none">
          <div className="h-[1px] bg-gray-300 flex-1"></div>
          <span className="text-gray-400 font-medium tracking-widest text-sm px-4">PAGE 2</span>
          <div className="h-[1px] bg-gray-300 flex-1"></div>
        </div>

        {/* Page 2 */}
        <div className="pdf-page w-[8.5in] h-[11in] relative overflow-hidden flex flex-col bg-[#fbfbfb] shadow-xl font-serif">
          <div className="absolute top-0 left-0 w-full h-full z-0"><BackgroundSVG /></div>
          <div className="relative z-10 flex-1 flex flex-col">
            {renderHeader()}
            <div className="flex-1 w-full flex flex-col relative">
              <div className="w-full flex-1 bg-[#e2e8f0] relative">
                {renderImageSlot("image7", "Floor Plan")}
              </div>
              {/* <div className="absolute bottom-4 left-[50px] z-20 flex gap-2 items-center bg-white/80 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-sm text-[10px] text-black">
                <img src="/bcfloor.png" alt="BC Floor Plans" className="h-[20px] object-contain" />
                 <span className="font-bold tracking-wider">DESIGNED AND PRINTED BY BC FLOOR PLANS</span>
              </div>  */}
            </div>
          </div>
        </div>
      </>
    );
  }
);

BcfpStandard20.displayName = "BcfpStandard20";

export default BcfpStandard20;
