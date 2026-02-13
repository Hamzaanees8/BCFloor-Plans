import { Pencil, Trash, ZoomIn, ZoomOut } from "lucide-react";
import NextImage from "next/image";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Order } from "../../orders/page";
import "../../../globals.css";
import StyledInput from "./StyledInput";
import ImageSourceModal from "./ImageSourceModal";
import FileManagerGallery from "./fileManagerGallery";
import { BathIcon, Bedrooms, Sqft } from "@/components/Icons";
import { featureSheetService } from "../file-manager";
import { FeatureSheetPayload, FeatureSheetResponse, ImageState, ScaleState, PositionState, DraggingState } from "../types/featureSheetTypes";

export interface BcfpStandard24Ref {
  exportToPayload: () => Promise<FeatureSheetPayload>;
  importFromPayload: (payload: FeatureSheetResponse) => void;
}

interface BcfpStandard24Props {
  orderData: Order | null;
}

const BcfpStandard24 = forwardRef<BcfpStandard24Ref, BcfpStandard24Props>(
  ({ orderData }, ref) => {
    // const [title, setTitle] = useState("");
    // const [subtitle, setSubtitle] = useState("");
    // const [fullName, setFullName] = useState("");
    // const [email, setEmail] = useState("");
    // const [propertyName, setPropertyName] = useState("");
    // const [amount, setAmount] = useState("");
    const [strNum, setStrNum] = useState("");
    const [strName, setStrName] = useState("");
    // const [byLawRestrictions, setByLawRestrictions] = useState("");
    // const [maintenanceFees, setMaintenanceFees] = useState("");
    // const [maintenanceFeesInclude, setMaintenanceFeesInclude] = useState("");
    // const [featuresIncluded, setFeaturesIncluded] = useState("");
    // const [siteInfluences, setSiteInfluences] = useState("");
    // const [outdoorArea, setOutdoorArea] = useState("");
    // const [grossTaxes, setGrossTaxes] = useState("");
    // const [amenities, setAmenities] = useState("");
    // const [mlsNumber, setMlsNumber] = useState("");
    // const [view, setView] = useState("");
    const [bedroom, setBedroom] = useState("");
    const [bathroom, setBathroom] = useState("");
    const [sqft, setSqft] = useState("");
    // const [builtYear, setBuiltYear] = useState("");
    // const [description, setDescription] = useState("");
    // const [number, setNumber] = useState("");

    // last section stats
    const [presentedBy, setPresentedBy] = useState("Joe Chan");
    const [presentedByCompany, setPresentedByCompany] = useState(
      "Sutton Group - 1st West Realty",
    );
    const [phone, setPhone] = useState("778-668-1668");
    const [email, setEmail] = useState("joechan@sutton.com");
    // Status + MLS Section
    const [mlsNumber, setMlsNumber] = useState("R2236953");
    const [board, setBoard] = useState("V");
    const [propertyType, setPropertyType] = useState("Apartment/Condo");
    const [fullAddress, setFullAddress] = useState("906 555 JERVIS STREET");
    const [area, setArea] = useState("Vancouver West");
    const [neighborhood, setNeighborhood] = useState("Coal Harbour");
    const [postalCode, setPostalCode] = useState("V6E 4N1");
    const [propertyCategory, setPropertyCategory] = useState(
      "Residential Attached",
    );
    const [listPrice, setListPrice] = useState("$799,000");
    const [soldPrice, setSoldPrice] = useState("");
    // Sold / Lot Info Section - Left Column
    const [soldDate, setSoldDate] = useState("");
    const [measureType, setMeasureType] = useState("");
    const [depthSize, setDepthSize] = useState("");
    const [lotArea, setLotArea] = useState("0.00");
    const [floodPlain, setFloodPlain] = useState("");
    const [councilApproval, setCouncilApproval] = useState("");
    const [exposure, setExposure] = useState("");
    // Sold / Lot Info Section - Middle Column
    const [frontageFeet, setFrontageFeet] = useState("");
    const [frontageMeters, setFrontageMeters] = useState("");
    const [depthSizeFeet, setDepthSizeFeet] = useState("");
    const [bedrooms, setBedrooms] = useState("1");
    const [bathrooms, setBathrooms] = useState("1");
    const [fullBaths, setFullBaths] = useState("1");
    const [halfBaths, setHalfBaths] = useState("0");
    const [maintenanceFee, setMaintenanceFee] = useState("380.76");
    // Sold / Lot Info Section - Right Column
    const [originalPrice, setOriginalPrice] = useState("799,000");
    const [depth, setDepth] = useState("");
    const [age, setAge] = useState("21");
    const [zoning, setZoning] = useState("CD-1");
    const [grossTaxes, setGrossTaxes] = useState("1,381.81");
    const [taxYear, setTaxYear] = useState("2017");
    const [taxIncludeUtilities, setTaxIncludeUtilities] = useState("No");
    const [pid, setPid] = useState("023-225-629");
    const [tour, setTour] = useState("");
    // Additional Info Section
    const [gstHst, setGstHst] = useState("");
    const [managementCompany, setManagementCompany] = useState(
      "FirstService Residentia",
    );
    const [managementPhone, setManagementPhone] = useState("604-683-8900");
    const [view, setView] = useState("Yes: Coal Harbour & Burrard Inlet");
    const [complexSubdiv, setComplexSubdiv] = useState("Harbourside Park");
    const [servicesConnected, setServicesConnected] = useState(
      "Electricity, Sanitary Sewer, Water",
    );
    // Property Details - Left Column
    const [styleOfHome, setStyleOfHome] = useState("Corner Unit");
    const [construction, setConstruction] = useState("Concrete");
    const [exterior, setExterior] = useState("Glass, Metal, Mixed");
    const [foundation, setFoundation] = useState("Concrete Perimeter");
    const [rainScreen, setRainScreen] = useState("");
    const [renovations, setRenovations] = useState("");
    const [waterSupply, setWaterSupply] = useState("City/Municipal");
    const [fireplaceFuel, setFireplaceFuel] = useState("");
    const [fuelHeating, setFuelHeating] = useState("Baseboard, Electric");
    const [outdoorArea, setOutdoorArea] = useState("Balcony(s)");
    const [roofType, setRoofType] = useState("Other");
    // Property Details - Right Column (Renovations)
    const [renoYear, setRenoYear] = useState("");
    const [riPlumbing, setRiPlumbing] = useState("");
    const [riFireplaces, setRiFireplaces] = useState("");
    const [numFireplaces, setNumFireplaces] = useState("0");
    // Parking & Transit Section - Left
    const [totalParking, setTotalParking] = useState("1");
    const [coveredParking, setCoveredParking] = useState("1");
    const [parking, setParking] = useState("Garage; Underground");
    const [distToPublicTransit, setDistToPublicTransit] = useState("1 Block");
    const [unitsInDevelopment, setUnitsInDevelopment] = useState("");
    // Parking & Transit Section - Right
    const [parkingAccess, setParkingAccess] = useState("Side");
    const [locker, setLocker] = useState("Y");
    const [distToSchoolBus, setDistToSchoolBus] = useState("");
    const [totalUnitsInStrata, setTotalUnitsInStrata] = useState("382");
    // Additional Property Details
    const [titleToLand, setTitleToLand] = useState("Freehold Strata");
    const [propertyDisclosure, setPropertyDisclosure] = useState("No");
    const [fixturesLeased, setFixturesLeased] = useState("");
    const [fixturesRemoved, setFixturesRemoved] = useState(
      "Baseboard, Electric",
    );
    const [floorFinish, setFloorFinish] = useState("Hardwood, Laminate, Mixed");
    // Maintenance & Features Section
    const [maintFeeInc, setMaintFeeInc] = useState(
      "Caretaker, Gardening, Hot Water, Management, Recreation Facility",
    );
    const [legal, setLegal] = useState(
      "PL LMS2064 LT 253 DL 185 LD 36. GROUP 1, UNDIV 620/249910 SHARE IN COM PROP THEREIN TOGETHER WITH AN INTEREST IN THE COMMON PROPERTY IN PROPORTION TO THE UNIT ENTITLEMENT OF THE STRATA LOT AS SHOWN ON FORM 1 OR V, AS APPROPRIATE.",
    );
    const [amenities, setAmenities] = useState(
      "Elevator, Exercise Centre, In Suite Laundry, Pool; Indoor, Storage, Swirlpool/Hot Tub",
    );
    const [siteInfluences, setSiteInfluences] = useState(
      "Central Location, Recreation Nearby, Shopping Nearby, Waterfront Property",
    );
    const [features, setFeatures] = useState(
      "ClthWsh/Dryr/Frdg/Stve/DW, Drapes/Window Coverings, Smoke Alarm, Sprinkler - Fire",
    );
    // Room Dimensions - First 7 Rooms
    const [floor1, setFloor1] = useState("Main");
    const [type1, setType1] = useState("Living Room");
    const [dimensions1, setDimensions1] = useState("9'11 x 9'2");

    const [floor2, setFloor2] = useState("Main");
    const [type2, setType2] = useState("Kitchen");
    const [dimensions2, setDimensions2] = useState("9'2 x 7'4");

    const [floor3, setFloor3] = useState("Main");
    const [type3, setType3] = useState("Dining Room");
    const [dimensions3, setDimensions3] = useState("9'11 x 8'4");

    const [floor4, setFloor4] = useState("Main");
    const [type4, setType4] = useState("Bedroom");
    const [dimensions4, setDimensions4] = useState("11'4 x 10'8");

    const [floor5, setFloor5] = useState("Main");
    const [type5, setType5] = useState("Den");
    const [dimensions5, setDimensions5] = useState("6'6 x 4'8");

    const [floor6, setFloor6] = useState("Main");
    const [type6, setType6] = useState("Storage");
    const [dimensions6, setDimensions6] = useState("7'6 x 4'8");

    const [floor7, setFloor7] = useState("Main");
    const [type7, setType7] = useState("Foyer");
    const [dimensions7, setDimensions7] = useState("7'2 x 4'7");

    // Empty Room Fields (8-30)
    const [floor8, setFloor8] = useState("");
    const [type8, setType8] = useState("");
    const [dimensions8, setDimensions8] = useState("");

    const [floor9, setFloor9] = useState("");
    const [type9, setType9] = useState("");
    const [dimensions9, setDimensions9] = useState("");

    const [floor10, setFloor10] = useState("");
    const [type10, setType10] = useState("");
    const [dimensions10, setDimensions10] = useState("");

    const [floor11, setFloor11] = useState("");
    const [type11, setType11] = useState("");
    const [dimensions11, setDimensions11] = useState("");

    const [floor12, setFloor12] = useState("");
    const [type12, setType12] = useState("");
    const [dimensions12, setDimensions12] = useState("");

    const [floor13, setFloor13] = useState("");
    const [type13, setType13] = useState("");
    const [dimensions13, setDimensions13] = useState("");

    const [floor14, setFloor14] = useState("");
    const [type14, setType14] = useState("");
    const [dimensions14, setDimensions14] = useState("");

    const [floor15, setFloor15] = useState("");
    const [type15, setType15] = useState("");
    const [dimensions15, setDimensions15] = useState("");

    const [floor16, setFloor16] = useState("");
    const [type16, setType16] = useState("");
    const [dimensions16, setDimensions16] = useState("");

    const [floor17, setFloor17] = useState("");
    const [type17, setType17] = useState("");
    const [dimensions17, setDimensions17] = useState("");

    const [floor18, setFloor18] = useState("");
    const [type18, setType18] = useState("");
    const [dimensions18, setDimensions18] = useState("");

    const [floor19, setFloor19] = useState("");
    const [type19, setType19] = useState("");
    const [dimensions19, setDimensions19] = useState("");

    const [floor20, setFloor20] = useState("");
    const [type20, setType20] = useState("");
    const [dimensions20, setDimensions20] = useState("");

    const [floor21, setFloor21] = useState("");
    const [type21, setType21] = useState("");
    const [dimensions21, setDimensions21] = useState("");

    const [floor22, setFloor22] = useState("");
    const [type22, setType22] = useState("");
    const [dimensions22, setDimensions22] = useState("");

    const [floor23, setFloor23] = useState("");
    const [type23, setType23] = useState("");
    const [dimensions23, setDimensions23] = useState("");

    const [floor24, setFloor24] = useState("");
    const [type24, setType24] = useState("");
    const [dimensions24, setDimensions24] = useState("");

    const [floor25, setFloor25] = useState("");
    const [type25, setType25] = useState("");
    const [dimensions25, setDimensions25] = useState("");

    const [floor26, setFloor26] = useState("");
    const [type26, setType26] = useState("");
    const [dimensions26, setDimensions26] = useState("");

    const [floor27, setFloor27] = useState("");
    const [type27, setType27] = useState("");
    const [dimensions27, setDimensions27] = useState("");

    const [floor28, setFloor28] = useState("");
    const [type28, setType28] = useState("");
    const [dimensions28, setDimensions28] = useState("");

    const [floor29, setFloor29] = useState("");
    const [type29, setType29] = useState("");
    const [dimensions29, setDimensions29] = useState("");

    const [floor30, setFloor30] = useState("");
    const [type30, setType30] = useState("");
    const [dimensions30, setDimensions30] = useState("");

    // Floor Area Section
    const [finishedFloorMain, setFinishedFloorMain] = useState("640");
    const [finishedFloorAbove, setFinishedFloorAbove] = useState("0");
    const [finishedFloorBelow, setFinishedFloorBelow] = useState("0");
    const [finishedFloorBasement, setFinishedFloorBasement] = useState("0");
    const [finishedFloorTotal, setFinishedFloorTotal] = useState("640");
    const [unfinishedFloor, setUnfinishedFloor] = useState("0");
    const [grandTotal, setGrandTotal] = useState("640");

    // Room Counts Section
    const [numRooms, setNumRooms] = useState("7");
    const [numKitchens, setNumKitchens] = useState("1");
    const [numLevels, setNumLevels] = useState("1");
    const [crawlBasementHeight, setCrawlBasementHeight] = useState("");
    const [restrictedAge, setRestrictedAge] = useState("");
    const [numPets, setNumPets] = useState("");
    const [cats, setCats] = useState("");
    const [dogs, setDogs] = useState("");
    const [rentalsAllowed, setRentalsAllowed] = useState("");
    const [bylawRestrictions, setBylawRestrictions] = useState(
      "Pets Allowed w/Rest., Rentals Allwd w/Restrctns",
    );
    const [basement, setBasement] = useState("None");
    // Bathroom Details
    // Bathroom Details - Complete from 1 to 8
    const [bath1, setBath1] = useState("1");
    const [bathType1, setBathType1] = useState("Main");
    const [bathPieces1, setBathPieces1] = useState("4");
    const [bathEnsuite1, setBathEnsuite1] = useState("No");

    const [bath2, setBath2] = useState("2");
    const [bathType2, setBathType2] = useState("");
    const [bathPieces2, setBathPieces2] = useState("");
    const [bathEnsuite2, setBathEnsuite2] = useState("");

    const [bath3, setBath3] = useState("3");
    const [bathType3, setBathType3] = useState("");
    const [bathPieces3, setBathPieces3] = useState("");
    const [bathEnsuite3, setBathEnsuite3] = useState("");

    const [bath4, setBath4] = useState("4");
    const [bathType4, setBathType4] = useState("");
    const [bathPieces4, setBathPieces4] = useState("");
    const [bathEnsuite4, setBathEnsuite4] = useState("");

    const [bath5, setBath5] = useState("5");
    const [bathType5, setBathType5] = useState("");
    const [bathPieces5, setBathPieces5] = useState("");
    const [bathEnsuite5, setBathEnsuite5] = useState("");

    const [bath6, setBath6] = useState("6");
    const [bathType6, setBathType6] = useState("");
    const [bathPieces6, setBathPieces6] = useState("");
    const [bathEnsuite6, setBathEnsuite6] = useState("");

    const [bath7, setBath7] = useState("7");
    const [bathType7, setBathType7] = useState("");
    const [bathPieces7, setBathPieces7] = useState("");
    const [bathEnsuite7, setBathEnsuite7] = useState("");

    const [bath8, setBath8] = useState("8");
    const [bathType8, setBathType8] = useState("");
    const [bathPieces8, setBathPieces8] = useState("");
    const [bathEnsuite8, setBathEnsuite8] = useState("");

    // Outbuildings Section
    const [barn, setBarn] = useState("");
    const [workshopShed, setWorkshopShed] = useState("");
    const [pool, setPool] = useState("");
    const [garageSize, setGarageSize] = useState("");
    const [doorHeight, setDoorHeight] = useState("");
    // Final Sections
    const [listingBroker, setListingBroker] = useState(
      "Sutton Group - 1st West Realty",
    );
    const [description, setDescription] = useState(
      "View! View! View! Ocean view Coal Harbour 1 Bedroom + Den/Office Condo with gorgeous water view of Burrard Inlet. Great layout with Floor-to-ceiling Windows in living room. Spacious bedroom with separate area for home office. Bright kitchen with windows. 1 underground parking & 1 storage locker. Very convenient location with just a few steps to the Seawall, Stanley Park, Robson St. This Harbourside Park condo complex is Architecturally Stunning designed by Arthur Erickson with full amenities including indoor pool, exercise centre, swirlpool/ hot tub. Don't miss the great opportunity to own this nice Condo at an affordable price! Won't last long! Come and visit the Open House on November 25th & 26th (Sat & Sunday) 2-4pm.",
    );

    // --- images States ---
    const [images, setImages] = useState<ImageState>({
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


    const [scale, setScale] = useState<ScaleState>({
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

    const [position, setPosition] = useState<PositionState>({
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

    const [dragging, setDragging] = useState<DraggingState>({
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

    const lastPosition = useRef<PositionState>({
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
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      exportToPayload: async () => {
        const payload = await featureSheetService.buildPayload({
          orderUuid: orderData?.uuid || "",
          templateKey: "BCFPStandard24",
          uploadedBy: "admin",
          type: "template",
          primaryColor: "#707176",
          offeredAtPrice: listPrice,
          realtorName: presentedBy,
          emailLink: email,
          companyName: presentedByCompany,
          propertyNotesDescription: description,
          otherDetails: {
            presentedBy,
            presentedByCompany,
            phone,
            email,
            mlsNumber,
            board,
            propertyType,
            fullAddress,
            area,
            neighborhood,
            postalCode,
            propertyCategory,
            listPrice,
            soldPrice,
            soldDate,
            measureType,
            depthSize,
            lotArea,
            floodPlain,
            councilApproval,
            exposure,
            frontageFeet,
            frontageMeters,
            depthSizeFeet,
            bedrooms,
            bathrooms,
            fullBaths,
            halfBaths,
            maintenanceFee,
            originalPrice,
            depth,
            age,
            zoning,
            grossTaxes,
            taxYear,
            taxIncludeUtilities,
            pid,
            tour,
            gstHst,
            managementCompany,
            managementPhone,
            view,
            complexSubdiv,
            servicesConnected,
            styleOfHome,
            construction,
            exterior,
            foundation,
            rainScreen,
            renovations,
            waterSupply,
            fireplaceFuel,
            fuelHeating,
            outdoorArea,
            roofType,
            renoYear,
            riPlumbing,
            riFireplaces,
            numFireplaces,
            totalParking,
            coveredParking,
            parking,
            distToPublicTransit,
            unitsInDevelopment,
            parkingAccess,
            locker,
            distToSchoolBus,
            totalUnitsInStrata,
            titleToLand,
            propertyDisclosure,
            fixturesLeased,
            fixturesRemoved,
            floorFinish,
            maintFeeInc,
            legal,
            amenities,
            siteInfluences,
            features,
            numRooms,
            numKitchens,
            numLevels,
            crawlBasementHeight,
            restrictedAge,
            numPets,
            cats,
            dogs,
            rentalsAllowed,
            bylawRestrictions,
            basement,
            finishedFloorMain,
            finishedFloorAbove,
            finishedFloorBelow,
            finishedFloorBasement,
            finishedFloorTotal,
            unfinishedFloor,
            grandTotal,
            // Rooms
            floor1,
            type1,
            dimensions1,
            floor2,
            type2,
            dimensions2,
            floor3,
            type3,
            dimensions3,
            floor4,
            type4,
            dimensions4,
            floor5,
            type5,
            dimensions5,
            floor6,
            type6,
            dimensions6,
            floor7,
            type7,
            dimensions7,
            floor8,
            type8,
            dimensions8,
            floor9,
            type9,
            dimensions9,
            floor10,
            type10,
            dimensions10,
            floor11,
            type11,
            dimensions11,
            floor12,
            type12,
            dimensions12,
            floor13,
            type13,
            dimensions13,
            floor14,
            type14,
            dimensions14,
            floor15,
            type15,
            dimensions15,
            floor16,
            type16,
            dimensions16,
            floor17,
            type17,
            dimensions17,
            floor18,
            type18,
            dimensions18,
            floor19,
            type19,
            dimensions19,
            floor20,
            type20,
            dimensions20,
            floor21,
            type21,
            dimensions21,
            floor22,
            type22,
            dimensions22,
            floor23,
            type23,
            dimensions23,
            floor24,
            type24,
            dimensions24,
            floor25,
            type25,
            dimensions25,
            floor26,
            type26,
            dimensions26,
            floor27,
            type27,
            dimensions27,
            floor28,
            type28,
            dimensions28,
            floor29,
            type29,
            dimensions29,
            floor30,
            type30,
            dimensions30,
            // Baths
            bath1,
            bathType1,
            bathPieces1,
            bathEnsuite1,
            bath2,
            bathType2,
            bathPieces2,
            bathEnsuite2,
            bath3,
            bathType3,
            bathPieces3,
            bathEnsuite3,
            bath4,
            bathType4,
            bathPieces4,
            bathEnsuite4,
            bath5,
            bathType5,
            bathPieces5,
            bathEnsuite5,
            bath6,
            bathType6,
            bathPieces6,
            bathEnsuite6,
            bath7,
            bathType7,
            bathPieces7,
            bathEnsuite7,
            bath8,
            bathType8,
            bathPieces8,
            bathEnsuite8,
            barn,
            workshopShed,
            pool,
            garageSize,
            doorHeight,
            listingBroker,
          },
          images,
          imageScales: scale,
          imagePositions: position,
        });
        return payload;
      },
      importFromPayload: (payload: FeatureSheetResponse) => {
        const state = featureSheetService.parsePayloadToState(payload);
        if (state.offeredAtPrice) setListPrice(state.offeredAtPrice as string);
        if (state.realtorName) setPresentedBy(state.realtorName as string);
        if (state.emailLink) setEmail(state.emailLink as string);
        if (state.companyName)
          setPresentedByCompany(state.companyName as string);
        if (state.propertyNotesDescription)
          setDescription(state.propertyNotesDescription as string);

        if (state.otherDetails) {
          const details = state.otherDetails as Record<string, unknown>;
          if (details.presentedBy)
            setPresentedBy(details.presentedBy as string);
          if (details.presentedByCompany)
            setPresentedByCompany(details.presentedByCompany as string);
          if (details.phone) setPhone(details.phone as string);
          if (details.email) setEmail(details.email as string);
          if (details.mlsNumber) setMlsNumber(details.mlsNumber as string);
          if (details.board) setBoard(details.board as string);
          if (details.propertyType)
            setPropertyType(details.propertyType as string);
          if (details.fullAddress)
            setFullAddress(details.fullAddress as string);
          if (details.area) setArea(details.area as string);
          if (details.neighborhood)
            setNeighborhood(details.neighborhood as string);
          if (details.postalCode) setPostalCode(details.postalCode as string);
          if (details.propertyCategory)
            setPropertyCategory(details.propertyCategory as string);
          if (details.listPrice) setListPrice(details.listPrice as string);
          if (details.soldPrice) setSoldPrice(details.soldPrice as string);
          if (details.soldDate) setSoldDate(details.soldDate as string);
          if (details.measureType)
            setMeasureType(details.measureType as string);
          if (details.depthSize) setDepthSize(details.depthSize as string);
          if (details.lotArea) setLotArea(details.lotArea as string);
          if (details.floodPlain) setFloodPlain(details.floodPlain as string);
          if (details.councilApproval)
            setCouncilApproval(details.councilApproval as string);
          if (details.exposure) setExposure(details.exposure as string);
          if (details.frontageFeet)
            setFrontageFeet(details.frontageFeet as string);
          if (details.frontageMeters)
            setFrontageMeters(details.frontageMeters as string);
          if (details.depthSizeFeet)
            setDepthSizeFeet(details.depthSizeFeet as string);
          if (details.bedrooms) setBedrooms(details.bedrooms as string);
          if (details.bathrooms) setBathrooms(details.bathrooms as string);
          if (details.fullBaths) setFullBaths(details.fullBaths as string);
          if (details.halfBaths) setHalfBaths(details.halfBaths as string);
          if (details.maintenanceFee)
            setMaintenanceFee(details.maintenanceFee as string);
          if (details.originalPrice)
            setOriginalPrice(details.originalPrice as string);
          if (details.depth) setDepth(details.depth as string);
          if (details.age) setAge(details.age as string);
          if (details.zoning) setZoning(details.zoning as string);
          if (details.grossTaxes) setGrossTaxes(details.grossTaxes as string);
          if (details.taxYear) setTaxYear(details.taxYear as string);
          if (details.taxIncludeUtilities)
            setTaxIncludeUtilities(details.taxIncludeUtilities as string);
          if (details.pid) setPid(details.pid as string);
          if (details.tour) setTour(details.tour as string);
          if (details.gstHst) setGstHst(details.gstHst as string);
          if (details.managementCompany)
            setManagementCompany(details.managementCompany as string);
          if (details.managementPhone)
            setManagementPhone(details.managementPhone as string);
          if (details.view) setView(details.view as string);
          if (details.complexSubdiv)
            setComplexSubdiv(details.complexSubdiv as string);
          if (details.servicesConnected)
            setServicesConnected(details.servicesConnected as string);
          if (details.styleOfHome)
            setStyleOfHome(details.styleOfHome as string);
          if (details.construction)
            setConstruction(details.construction as string);
          if (details.exterior) setExterior(details.exterior as string);
          if (details.foundation) setFoundation(details.foundation as string);
          if (details.rainScreen) setRainScreen(details.rainScreen as string);
          if (details.renovations)
            setRenovations(details.renovations as string);
          if (details.waterSupply)
            setWaterSupply(details.waterSupply as string);
          if (details.fireplaceFuel)
            setFireplaceFuel(details.fireplaceFuel as string);
          if (details.fuelHeating)
            setFuelHeating(details.fuelHeating as string);
          if (details.outdoorArea)
            setOutdoorArea(details.outdoorArea as string);
          if (details.roofType) setRoofType(details.roofType as string);
          if (details.renoYear) setRenoYear(details.renoYear as string);
          if (details.riPlumbing) setRiPlumbing(details.riPlumbing as string);
          if (details.riFireplaces)
            setRiFireplaces(details.riFireplaces as string);
          if (details.numFireplaces)
            setNumFireplaces(details.numFireplaces as string);
          if (details.totalParking)
            setTotalParking(details.totalParking as string);
          if (details.coveredParking)
            setCoveredParking(details.coveredParking as string);
          if (details.parking) setParking(details.parking as string);
          if (details.distToPublicTransit)
            setDistToPublicTransit(details.distToPublicTransit as string);
          if (details.unitsInDevelopment)
            setUnitsInDevelopment(details.unitsInDevelopment as string);
          if (details.parkingAccess)
            setParkingAccess(details.parkingAccess as string);
          if (details.locker) setLocker(details.locker as string);
          if (details.distToSchoolBus)
            setDistToSchoolBus(details.distToSchoolBus as string);
          if (details.totalUnitsInStrata)
            setTotalUnitsInStrata(details.totalUnitsInStrata as string);
          if (details.titleToLand)
            setTitleToLand(details.titleToLand as string);
          if (details.propertyDisclosure)
            setPropertyDisclosure(details.propertyDisclosure as string);
          if (details.fixturesLeased)
            setFixturesLeased(details.fixturesLeased as string);
          if (details.fixturesRemoved)
            setFixturesRemoved(details.fixturesRemoved as string);
          if (details.floorFinish)
            setFloorFinish(details.floorFinish as string);
          if (details.maintFeeInc)
            setMaintFeeInc(details.maintFeeInc as string);
          if (details.legal) setLegal(details.legal as string);
          if (details.amenities) setAmenities(details.amenities as string);
          if (details.siteInfluences)
            setSiteInfluences(details.siteInfluences as string);
          if (details.features) setFeatures(details.features as string);
          if (details.numRooms) setNumRooms(details.numRooms as string);
          if (details.numKitchens)
            setNumKitchens(details.numKitchens as string);
          if (details.numLevels) setNumLevels(details.numLevels as string);
          if (details.crawlBasementHeight)
            setCrawlBasementHeight(details.crawlBasementHeight as string);
          if (details.restrictedAge)
            setRestrictedAge(details.restrictedAge as string);
          if (details.numPets) setNumPets(details.numPets as string);
          if (details.cats) setCats(details.cats as string);
          if (details.dogs) setDogs(details.dogs as string);
          if (details.rentalsAllowed)
            setRentalsAllowed(details.rentalsAllowed as string);
          if (details.bylawRestrictions)
            setBylawRestrictions(details.bylawRestrictions as string);
          if (details.basement) setBasement(details.basement as string);
          if (details.finishedFloorMain)
            setFinishedFloorMain(details.finishedFloorMain as string);
          if (details.finishedFloorAbove)
            setFinishedFloorAbove(details.finishedFloorAbove as string);
          if (details.finishedFloorBelow)
            setFinishedFloorBelow(details.finishedFloorBelow as string);
          if (details.finishedFloorBasement)
            setFinishedFloorBasement(details.finishedFloorBasement as string);
          if (details.finishedFloorTotal)
            setFinishedFloorTotal(details.finishedFloorTotal as string);
          if (details.unfinishedFloor)
            setUnfinishedFloor(details.unfinishedFloor as string);
          if (details.grandTotal) setGrandTotal(details.grandTotal as string);

          // Rooms Loop (simplified but complete)
          for (let i = 1; i <= 30; i++) {
            if (details[`floor${i}`])
              eval(`setFloor${i}`)(details[`floor${i}`] as string);
            if (details[`type${i}`])
              eval(`setType${i}`)(details[`type${i}`] as string);
            if (details[`dimensions${i}`])
              eval(`setDimensions${i}`)(details[`dimensions${i}`] as string);
          }

          // Baths Loop
          for (let i = 1; i <= 8; i++) {
            if (details[`bath${i}`])
              eval(`setBath${i}`)(details[`bath${i}`] as string);
            if (details[`bathType${i}`])
              eval(`setBathType${i}`)(details[`bathType${i}`] as string);
            if (details[`bathPieces${i}`])
              eval(`setBathPieces${i}`)(details[`bathPieces${i}`] as string);
            if (details[`bathEnsuite${i}`])
              eval(`setBathEnsuite${i}`)(details[`bathEnsuite${i}`] as string);
          }

          if (details.barn) setBarn(details.barn as string);
          if (details.workshopShed)
            setWorkshopShed(details.workshopShed as string);
          if (details.pool) setPool(details.pool as string);
          if (details.garageSize) setGarageSize(details.garageSize as string);
          if (details.doorHeight) setDoorHeight(details.doorHeight as string);
          if (details.listingBroker)
            setListingBroker(details.listingBroker as string);
        }

        if (state.images) {
          setImages((prev) => ({
            ...prev,
            ...state.images,
          }));
        }
        if (state.imageScales) {
          setScale((prev) => ({
            ...prev,
            ...state.imageScales,
          }));
        }
        if (state.imagePositions) {
          setPosition((prev) => ({
            ...prev,
            ...state.imagePositions,
          }));
        }
      },
    }));

    console.log("orderData", orderData);

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
          <div className="flex bg-[#707176]">
            <div className="w-1/2 gap-4 flex flex-col py-[40px] pl-[40px] pr-[10px]">
              <div
                className="h-[400px] w-full group relative overflow-hidden"
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

                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="h-[250px] w-full group relative overflow-hidden"
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
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

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
                <div
                  className="h-[250px] w-full group relative overflow-hidden"
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

                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                <div
                  className="h-[250px] w-full group relative overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image4", e)}
                  onMouseMove={(e) => handleMouseMove("image4", e)}
                  onMouseUp={() => handleMouseUp("image4")}
                  onMouseLeave={() => handleMouseLeave("image4")}
                >
                  {images.image4 ? (
                    <>
                      <NextImage
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
                  className="h-[250px] w-full group relative overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image5", e)}
                  onMouseMove={(e) => handleMouseMove("image5", e)}
                  onMouseUp={() => handleMouseUp("image5")}
                  onMouseLeave={() => handleMouseLeave("image5")}
                >
                  {images.image5 ? (
                    <>
                      <NextImage
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
              </div>
            </div>
            <div className="w-1/2 flex flex-col py-[40px] pr-[40px] pl-[10px] relative group">
              <div className="relative w-full h-full overflow-hidden">
                {/* right-top Triangle */}
                <div
                  className="absolute inset-0 group-hover:z-10"
                  style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%)" }}
                >
                  <div
                    className="h-full w-full group relative overflow-hidden"
                    onMouseDown={(e) => handleMouseDown("image6", e)}
                    onMouseMove={(e) => handleMouseMove("image6", e)}
                    onMouseUp={() => handleMouseUp("image6")}
                    onMouseLeave={() => handleMouseLeave("image6")}
                  >
                    {images.image6 ? (
                      <>
                        <NextImage
                          unoptimized
                          src={images.image6}
                          alt="uploaded"
                          width={200}
                          height={300}
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

                        <div className="absolute top-[20%] right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                        className="w-full h-full bg-gray-200 text-gray-600 flex items-start pt-20 justify-center cursor-pointer border border-dashed border-gray-400 hover:bg-gray-300"
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

                {/* left-bottom Triangle */}
                <div
                  className="absolute inset-0 group-hover:z-10"
                  style={{ clipPath: "polygon(100% 100%, 0% 100%, 0% 0%)" }}
                >
                  <div
                    className="h-full w-full group relative overflow-hidden"
                    onMouseDown={(e) => handleMouseDown("image7", e)}
                    onMouseMove={(e) => handleMouseMove("image7", e)}
                    onMouseUp={() => handleMouseUp("image7")}
                    onMouseLeave={() => handleMouseLeave("image7")}
                  >
                    {images.image7 ? (
                      <>
                        <NextImage
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

                        <div className="absolute bottom-3 right-[50%] flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                          onClick={() => openImageSourceModal("image7")}
                          className="absolute top-[17%] left-1 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete("image7", fileInputRef7)}
                          className="absolute top-[20%] left-1 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        onClick={() => openImageSourceModal("image7")}
                        className="w-full h-full bg-gray-200 text-gray-600 flex items-end pb-20 justify-center cursor-pointer border border-dashed border-gray-400 hover:bg-gray-300"
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
              <svg
                viewBox="0 0 621 801"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute bottom-0 left-0 top-0 right-0 w-full h-full pointer-events-none"
              >
                <path
                  opacity={0.529999}
                  d="M275.5 434H8V94.5L275.5 434Z"
                  fill="#AE2621"
                />
                <path
                  d="M0 0V83.984L564.48 801H621V684L79.76 0H0Z"
                  fill="#152255"
                />
                <path d="M359 540L419.993 616H621V540H359Z" fill="#A92219" />
                <path
                  d="M274 433L357.018 539.558L621 540V433H274Z"
                  fill="#1D1B3A"
                />
                <path d="M276.326 434H8V540H359L276.326 434Z" fill="#A92219" />
              </svg>
              <div className="flex flex-col gap-4 justify-between absolute bottom-0 left-0 top-0 right-0 w-auto h-full">
                <div className="h-[50%] w-full flex flex-col justify-between px-[75px] pt-[80px]">
                  <div
                    className="h-[90px] w-[160px] relative overflow-hidden group-hover:z-[11] "
                    onMouseDown={(e) => handleMouseDown("image8", e)}
                    onMouseMove={(e) => handleMouseMove("image8", e)}
                    onMouseUp={() => handleMouseUp("image8")}
                    onMouseLeave={() => handleMouseLeave("image8")}
                  >
                    {images.image8 ? (
                      <>
                        <NextImage
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

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                          onClick={() => openImageSourceModal("image8")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

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
                        className="w-full h-full bg-gray-200 text-gray-600 flex  items-center justify-center cursor-pointer border border-dashed border-gray-400 hover:bg-gray-300"
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
                  <div className="flex flex-col gap-2">
                    <div className="flex text-white content-center h-[40px] relative group-hover:z-[11]">
                      <span className="whitespace-nowrap content-center">
                        #
                      </span>
                      <StyledInput
                        value={strNum}
                        rows={1}
                        onChange={(e) => setStrNum(e.target.value)}
                        className="font-bold text-[40px] bg-transparent h-full text-left content-center w-full focus:outline-none border-none placeholder-white  placeholder:font-[500]"
                        placeholder="906-555"
                      />
                    </div>
                    <div className="flex text-white content-center h-[40px] relative group-hover:z-[11]">
                      <StyledInput
                        value={strName}
                        rows={1}
                        onChange={(e) => setStrName(e.target.value)}
                        className="font-thin text-[40px] bg-transparent h-full text-left content-center w-full focus:outline-none border-none placeholder-white "
                        placeholder="JERVIS STREET"
                      />
                    </div>
                  </div>
                </div>
                <div className="h-[50%] w-full flex flex-col px-[75px] pt-[190px] ">
                  <div className="flex flex-col gap-2 w-[170px] align-self-end ml-auto">
                    <div className="flex text-white content-center h-[40px] relative group-hover:z-[11]">
                      <span className="whitespace-nowrap content-center">
                        $
                      </span>
                      <StyledInput
                        value={strNum}
                        rows={1}
                        onChange={(e) => setStrNum(e.target.value)}
                        className="font-bold text-[40px] bg-transparent h-full text-left content-center w-full focus:outline-none border-none placeholder-white  placeholder:font-[500]"
                        placeholder="000,000"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 w-[210px] group-hover:z-[11] text-[24px]">
                    <div className="flex text-white relative z-[12] items-center ">
                      <div className="bg-white rounded-full p-3 mr-3 flex items-center justify-center w-10 h-10">
                        <Bedrooms className="w-4 h-4 text-black" />
                      </div>
                      <StyledInput
                        value={bedroom}
                        onChange={(e) => setBedroom(e.target.value)}
                        className="font-semibold text-[24px] bg-transparent text-left w-[20px] h-[20px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                        placeholder="0"
                      />
                      BEDROOM
                    </div>
                    <div className="flex text-white relative  z-[12] items-center ">
                      <div className="bg-white rounded-full p-3 mr-3 flex items-center justify-center w-10 h-10">
                        <BathIcon className="w-4 h-4 text-black " />
                      </div>
                      <StyledInput
                        value={bathroom}
                        onChange={(e) => setBathroom(e.target.value)}
                        className="font-semibold text-[24px] w-[33px] bg-transparent text-left  h-[20px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                        placeholder="0"
                      />
                      BATHROOM
                    </div>
                    <div className="flex text-white relative z-[12] items-center ">
                      <div className="bg-white rounded-full p-3 mr-3 flex items-center justify-center w-10 h-10">
                        <Sqft className="w-4 h-4 text-black text-8" />
                      </div>
                      <div className="w-[72px]">
                        <StyledInput
                          value={sqft}
                          onChange={(e) => setSqft(e.target.value)}
                          className="font-semibold text-[24px] bg-transparent text-left w-full h-[20px] focus:outline-none border-none placeholder-white placeholder:font-[500]"
                          placeholder="0,000"
                        />
                      </div>
                      SQ. FT.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex bg-[#707176] gap-4">
            <div className="w-1/2 gap-4 flex flex-col py-[40px] pl-[40px] ">
              <div
                className="h-[510px] w-full group relative overflow-hidden"
                onMouseDown={(e) => handleMouseDown("image9", e)}
                onMouseMove={(e) => handleMouseMove("image9", e)}
                onMouseUp={() => handleMouseUp("image9")}
                onMouseLeave={() => handleMouseLeave("image9")}
              >
                {images.image9 ? (
                  <>
                    <NextImage
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

                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                      onClick={() => openImageSourceModal("image9")}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

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

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="h-[415px] w-full group relative overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image10", e)}
                  onMouseMove={(e) => handleMouseMove("image10", e)}
                  onMouseUp={() => handleMouseUp("image10")}
                  onMouseLeave={() => handleMouseLeave("image10")}
                >
                  {images.image10 ? (
                    <>
                      <NextImage
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

                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                        onClick={() => openImageSourceModal("image10")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

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
                <div
                  className="h-[415px] w-full group relative overflow-hidden"
                  onMouseDown={(e) => handleMouseDown("image11", e)}
                  onMouseMove={(e) => handleMouseMove("image11", e)}
                  onMouseUp={() => handleMouseUp("image11")}
                  onMouseLeave={() => handleMouseLeave("image11")}
                >
                  {images.image11 ? (
                    <>
                      <NextImage
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

                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                        onClick={() => openImageSourceModal("image11")}
                        className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4 text-gray-700" />
                      </button>

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

              <div
                className="h-[510px] w-full group relative overflow-hidden"
                onMouseDown={(e) => handleMouseDown("image12", e)}
                onMouseMove={(e) => handleMouseMove("image12", e)}
                onMouseUp={() => handleMouseUp("image12")}
                onMouseLeave={() => handleMouseLeave("image12")}
              >
                {images.image12 ? (
                  <>
                    <NextImage
                      unoptimized
                      src={images.image12}
                      alt="uploaded"
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

                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                      onClick={() => openImageSourceModal("image12")}
                      className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      title="Edit image"
                    >
                      <Pencil className="w-4 h-4 text-gray-700" />
                    </button>

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
            {/*  */}
            <div className="w-1/2 gap-4 flex flex-col py-[40px] pr-[10px]">
              <div className="bg-white text-black p-4 space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between pb-2">
                  <div
                    className="h-[90px] w-[90px] relative overflow-hidden group "
                    onMouseDown={(e) => handleMouseDown("image13", e)}
                    onMouseMove={(e) => handleMouseMove("image13", e)}
                    onMouseUp={() => handleMouseUp("image13")}
                    onMouseLeave={() => handleMouseLeave("image13")}
                  >
                    {images.image13 ? (
                      <>
                        <NextImage
                          unoptimized
                          src={images.image13}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover transition-transform duration-150"
                          style={{
                            transform: `scale(${scale.image13}) translate(${position.image13.x}px, ${position.image13.y}px)`,
                            cursor: dragging.image13
                              ? "grabbing"
                              : scale.image13 > 1
                                ? "grab"
                                : "default",
                          }}
                        />

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                          onClick={() => openImageSourceModal("image13")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete("image13", fileInputRef13)
                          }
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        onClick={() => openImageSourceModal("image13")}
                        className="w-full h-full bg-gray-200 text-gray-600 flex text-center  items-center justify-center cursor-pointer border border-dashed border-gray-400 hover:bg-gray-300"
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

                  <div className="w-1/2 text-[10px] bg-[#EDF0F0] border-2 border-[#929D9B] text-center">
                    <div>Presented by:</div>
                    <div className="font-bold text-lg">
                      <StyledInput
                        value={presentedBy}
                        onChange={(e) => setPresentedBy(e.target.value)}
                        rows={1}
                        className=" h-full bg-transparent font-bold text-black placeholder:text-black placeholder:font-bold text-center w-full focus:outline-none border-none "
                        placeholder="Joe Chan"
                      />
                    </div>
                    <div>
                      <StyledInput
                        value={presentedByCompany}
                        onChange={(e) => setPresentedByCompany(e.target.value)}
                        rows={1}
                        className=" h-full bg-transparent text-[10px] font-thin text-black placeholder:text-black placeholder:font-thin text-center w-full focus:outline-none border-none "
                        placeholder="Sutton Group - 1st West Realty"
                      />
                    </div>
                    <div className="flex gap-1 justify-center w-fit content-center place-self-center">
                      Phone:
                      <StyledInput
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        rows={1}
                        className=" h-full bg-transparent text-[10px] font-thin text-black placeholder:text-black placeholder:font-thin text-left w-full focus:outline-none border-none "
                        placeholder="778-668-1668"
                      />
                    </div>
                    <div className="flex gap-1 justify-center w-fit content-center place-self-center">
                      <StyledInput
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        rows={1}
                        className=" h-full bg-transparent text-[10px] font-thin text-black placeholder:text-black placeholder:font-thin text-center w-full focus:outline-none border-none "
                        placeholder="joechan@sutton.com"
                      />
                    </div>
                  </div>

                  <div
                    className="h-[90px] w-[160px] relative overflow-hidden group "
                    onMouseDown={(e) => handleMouseDown("image14", e)}
                    onMouseMove={(e) => handleMouseMove("image14", e)}
                    onMouseUp={() => handleMouseUp("image14")}
                    onMouseLeave={() => handleMouseLeave("image14")}
                  >
                    {images.image14 ? (
                      <>
                        <NextImage
                          unoptimized
                          src={images.image14}
                          alt="uploaded"
                          width={200}
                          height={300}
                          className="w-full h-full object-cover transition-transform duration-150"
                          style={{
                            transform: `scale(${scale.image14}) translate(${position.image14.x}px, ${position.image14.y}px)`,
                            cursor: dragging.image14
                              ? "grabbing"
                              : scale.image14 > 1
                                ? "grab"
                                : "default",
                          }}
                        />

                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                          onClick={() => openImageSourceModal("image14")}
                          className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Edit image"
                        >
                          <Pencil className="w-4 h-4 text-gray-700" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete("image14", fileInputRef14)
                          }
                          className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                          title="Delete image"
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    ) : (
                      <div
                        onClick={() => openImageSourceModal("image14")}
                        className="w-full h-full bg-gray-200 text-gray-600 flex  items-center justify-center cursor-pointer border border-dashed border-gray-400 hover:bg-gray-300"
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
                <div>
                  {/* Status + MLS */}
                  <div className="flex justify-between bg-[#EDF0F0] border border-[#929D9B] p-2 ">
                    <div className="flex flex-col text-left">
                      <div className="text-red-500 font-bold">Active</div>
                      <div className="flex gap-1  w-fit content-center ">
                        <StyledInput
                          value={mlsNumber}
                          onChange={(e) => setMlsNumber(e.target.value)}
                          rows={1}
                          className=" h-full bg-transparent text-[12px] font-bold placeholder:font-bold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                          placeholder="R2236953"
                        />
                      </div>
                      <div className="flex gap-1  w-fit content-center font-normal ">
                        {" "}
                        Board:
                        <StyledInput
                          value={board}
                          onChange={(e) => setBoard(e.target.value)}
                          rows={1}
                          className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                          placeholder="V"
                        />
                      </div>
                      <div className="flex gap-1  w-fit content-center font-normal">
                        <StyledInput
                          value={propertyType}
                          onChange={(e) => setPropertyType(e.target.value)}
                          rows={1}
                          className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                          placeholder="Apartment/Condo"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col text-center items-center">
                      <div className="flex gap-1  w-[200px] content-center ">
                        <StyledInput
                          value={fullAddress}
                          onChange={(e) => setFullAddress(e.target.value)}
                          rows={1}
                          className=" h-full bg-transparent text-[12px] font-bold placeholder:font-bold text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                          placeholder="906 555 JERVIS STREET"
                        />
                      </div>
                      <div className="flex gap-1  w-fit content-center ">
                        <StyledInput
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          rows={1}
                          className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                          placeholder="Vancouver West"
                        />
                      </div>
                      <div className="flex gap-1  w-fit content-center ">
                        <StyledInput
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          rows={1}
                          className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                          placeholder="Coal Harbour"
                        />
                      </div>
                      <div className="flex gap-1  w-fit content-center ">
                        <StyledInput
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          rows={1}
                          className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                          placeholder="V6E 4N1"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col text-right">
                      <div className="flex gap-1  w-fit content-center ">
                        <StyledInput
                          value={propertyCategory}
                          onChange={(e) => setPropertyCategory(e.target.value)}
                          rows={1}
                          className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-right w-full focus:outline-none border-none "
                          placeholder="Residential Attached"
                        />
                      </div>
                      <div className="flex gap-1 text-[12px]  w-fit content-center font-normal ">
                        <StyledInput
                          value={listPrice}
                          onChange={(e) => setListPrice(e.target.value)}
                          rows={1}
                          className=" h-full bg-transparent text-[12px] font-bold placeholder:font-bold text-black placeholder:text-black text-right w-full focus:outline-none border-none "
                          placeholder="$799,000 "
                        />
                        (LP)
                      </div>
                      <div className="flex gap-1  w-fit content-center ">
                        <StyledInput
                          value={soldPrice}
                          onChange={(e) => setSoldPrice(e.target.value)}
                          rows={1}
                          className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-right w-full focus:outline-none border-none "
                          placeholder="(SP)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Image and Sold / Lot Info */}
                  <div className="flex gap-2 border border-[#929D9B]">
                    <div className="w-[30%]">
                      <div
                        className="h-[250px] w-full relative overflow-hidden group "
                        onMouseDown={(e) => handleMouseDown("image15", e)}
                        onMouseMove={(e) => handleMouseMove("image15", e)}
                        onMouseUp={() => handleMouseUp("image15")}
                        onMouseLeave={() => handleMouseLeave("image15")}
                      >
                        {images.image15 ? (
                          <>
                            <NextImage
                              unoptimized
                              src={images.image15}
                              alt="uploaded"
                              width={200}
                              height={300}
                              className="w-full h-full object-cover transition-transform duration-150"
                              style={{
                                transform: `scale(${scale.image15}) translate(${position.image15.x}px, ${position.image15.y}px)`,
                                cursor: dragging.image15
                                  ? "grabbing"
                                  : scale.image15 > 1
                                    ? "grab"
                                    : "default",
                              }}
                            />

                            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
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
                              onClick={() => openImageSourceModal("image15")}
                              className="absolute top-2 right-10 bg-white p-1 rounded-full shadow hover:bg-gray-100 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                              title="Edit image"
                            >
                              <Pencil className="w-4 h-4 text-gray-700" />
                            </button>

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
                            className="w-full h-full bg-gray-200 text-gray-600 flex text-center  items-center justify-center cursor-pointer border border-dashed border-gray-400 hover:bg-gray-300"
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
                    <div className="w-[70%]">
                      <div className=" flex justify-between">
                        <div className="text-[10px]">
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Sold Date:
                            </span>
                            <StyledInput
                              value={soldDate}
                              onChange={(e) => setSoldDate(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Meas. Type:
                            </span>
                            <StyledInput
                              value={measureType}
                              onChange={(e) => setMeasureType(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Depth / Size (ft.):
                            </span>
                            <StyledInput
                              value={depthSize}
                              onChange={(e) => setDepthSize(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Lot Area (sq.ft.):{" "}
                            </span>
                            <StyledInput
                              value={lotArea}
                              onChange={(e) => setLotArea(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="0.00"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Flood Plain:
                            </span>
                            <StyledInput
                              value={floodPlain}
                              onChange={(e) => setFloodPlain(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Council Apprv?:
                            </span>
                            <StyledInput
                              value={councilApproval}
                              onChange={(e) =>
                                setCouncilApproval(e.target.value)
                              }
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">Exposure:</span>
                            <StyledInput
                              value={exposure}
                              onChange={(e) => setExposure(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-normal placeholder:font-normal text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                        </div>
                        <div className="text-[10px]">
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Frontage (feet):
                            </span>
                            <StyledInput
                              value={frontageFeet}
                              onChange={(e) => setFrontageFeet(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Frontage (metres):
                            </span>
                            <StyledInput
                              value={frontageMeters}
                              onChange={(e) =>
                                setFrontageMeters(e.target.value)
                              }
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Depth / Size (ft.):
                            </span>
                            <StyledInput
                              value={depthSizeFeet}
                              onChange={(e) => setDepthSizeFeet(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Bedrooms:{" "}
                            </span>
                            <StyledInput
                              value={bedrooms}
                              onChange={(e) => setBedrooms(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="1"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Bathrooms:{" "}
                            </span>
                            <StyledInput
                              value={bathrooms}
                              onChange={(e) => setBathrooms(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="1"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Full Baths:{" "}
                            </span>
                            <StyledInput
                              value={fullBaths}
                              onChange={(e) => setFullBaths(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="1"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Half Baths:{" "}
                            </span>
                            <StyledInput
                              value={halfBaths}
                              onChange={(e) => setHalfBaths(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="0"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Maint. Fee: $
                            </span>
                            <StyledInput
                              value={maintenanceFee}
                              onChange={(e) =>
                                setMaintenanceFee(e.target.value)
                              }
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="380.76"
                            />
                          </div>
                        </div>
                        <div className="text-[10px]">
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Original Price: $
                            </span>
                            <StyledInput
                              value={originalPrice}
                              onChange={(e) => setOriginalPrice(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="799,000"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">Depth</span>
                            <StyledInput
                              value={depth}
                              onChange={(e) => setDepth(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">Age: </span>
                            <StyledInput
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="21"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">Zoning: </span>
                            <StyledInput
                              value={zoning}
                              onChange={(e) => setZoning(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="CD-1"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Gross Taxes: $
                            </span>
                            <StyledInput
                              value={grossTaxes}
                              onChange={(e) => setGrossTaxes(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="1,381.81"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              For Tax Year:{" "}
                            </span>
                            <StyledInput
                              value={taxYear}
                              onChange={(e) => setTaxYear(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="2017"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Tax Inc. Utilities?:{" "}
                            </span>
                            <StyledInput
                              value={taxIncludeUtilities}
                              onChange={(e) =>
                                setTaxIncludeUtilities(e.target.value)
                              }
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="No"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">P.I.D.: </span>
                            <StyledInput
                              value={pid}
                              onChange={(e) => setPid(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="023-225-629"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">Tour:</span>
                            <StyledInput
                              value={tour}
                              onChange={(e) => setTour(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px]">
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            If new, GST/HST inc?:{" "}
                          </span>
                          <StyledInput
                            value={gstHst}
                            onChange={(e) => setGstHst(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Mgmt. Co&apos;s Name:{" "}
                          </span>
                          <StyledInput
                            value={managementCompany}
                            onChange={(e) =>
                              setManagementCompany(e.target.value)
                            }
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="FirstService Residentia"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Mgmt. Co&apos;s Phone:{" "}
                          </span>
                          <StyledInput
                            value={managementPhone}
                            onChange={(e) => setManagementPhone(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="604-683-8900"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">View: </span>
                          <StyledInput
                            value={view}
                            onChange={(e) => setView(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Yes: Coal Harbour & Burrard Inlet"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Complex / Subdiv:{" "}
                          </span>
                          <StyledInput
                            value={complexSubdiv}
                            onChange={(e) => setComplexSubdiv(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Harbourside Park"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Services Connected:{" "}
                          </span>
                          <StyledInput
                            value={servicesConnected}
                            onChange={(e) =>
                              setServicesConnected(e.target.value)
                            }
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Electricity, Sanitary Sewer, Water"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="flex ">
                    <div className="w-1/2 flex  border border-[#929D9B] text-[10px] p-1">
                      <div className="">
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Style of Home:{" "}
                          </span>
                          <StyledInput
                            value={styleOfHome}
                            onChange={(e) => setStyleOfHome(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Corner Unit"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Construction:{" "}
                          </span>
                          <StyledInput
                            value={construction}
                            onChange={(e) => setConstruction(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Concrete"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">Exterior: </span>
                          <StyledInput
                            value={exterior}
                            onChange={(e) => setExterior(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Glass, Metal, Mixed"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Foundation:{" "}
                          </span>
                          <StyledInput
                            value={foundation}
                            onChange={(e) => setFoundation(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Concrete Perimeter"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Rain Screen:{" "}
                          </span>
                          <StyledInput
                            value={rainScreen}
                            onChange={(e) => setRainScreen(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Renovations:{" "}
                          </span>
                          <StyledInput
                            value={renovations}
                            onChange={(e) => setRenovations(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Water Supply:
                          </span>
                          <StyledInput
                            value={waterSupply}
                            onChange={(e) => setWaterSupply(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="City/Municipal"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Fireplace Fuel:{" "}
                          </span>
                          <StyledInput
                            value={fireplaceFuel}
                            onChange={(e) => setFireplaceFuel(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Fuel/Heating:{" "}
                          </span>
                          <StyledInput
                            value={fuelHeating}
                            onChange={(e) => setFuelHeating(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Baseboard, Electric"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Outdoor Area:{" "}
                          </span>
                          <StyledInput
                            value={outdoorArea}
                            onChange={(e) => setOutdoorArea(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Balcony(s)"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Type of Roof:{" "}
                          </span>
                          <StyledInput
                            value={roofType}
                            onChange={(e) => setRoofType(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Other"
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Reno. Year:{" "}
                          </span>
                          <StyledInput
                            value={renoYear}
                            onChange={(e) => setRenoYear(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            R.I. Plumbing:{" "}
                          </span>
                          <StyledInput
                            value={riPlumbing}
                            onChange={(e) => setRiPlumbing(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            R.I. Fireplaces:{" "}
                          </span>
                          <StyledInput
                            value={riFireplaces}
                            onChange={(e) => setRiFireplaces(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            # of Fireplaces:{" "}
                          </span>
                          <StyledInput
                            value={numFireplaces}
                            onChange={(e) => setNumFireplaces(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-1/2 flex flex-col border border-[#929D9B] text-[10px] p-1">
                      <div className="flex gap-4">
                        <div className="">
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Total Parking:{" "}
                            </span>
                            <StyledInput
                              value={totalParking}
                              onChange={(e) => setTotalParking(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="1"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Covered Parking:
                            </span>
                            <StyledInput
                              value={coveredParking}
                              onChange={(e) =>
                                setCoveredParking(e.target.value)
                              }
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="1"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">Parking: </span>
                            <StyledInput
                              value={parking}
                              onChange={(e) => setParking(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="Garage; Underground"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Dist. to Public Transit:
                            </span>
                            <StyledInput
                              value={distToPublicTransit}
                              onChange={(e) =>
                                setDistToPublicTransit(e.target.value)
                              }
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="1 Block"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Units in Development:
                            </span>
                            <StyledInput
                              value={unitsInDevelopment}
                              onChange={(e) =>
                                setUnitsInDevelopment(e.target.value)
                              }
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                        </div>
                        <div className="">
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Parking Access:
                            </span>
                            <StyledInput
                              value={parkingAccess}
                              onChange={(e) => setParkingAccess(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="Side"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">Locker:</span>
                            <StyledInput
                              value={locker}
                              onChange={(e) => setLocker(e.target.value)}
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="Y"
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Dist. to School Bus:
                            </span>
                            <StyledInput
                              value={distToSchoolBus}
                              onChange={(e) =>
                                setDistToSchoolBus(e.target.value)
                              }
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder=""
                            />
                          </div>
                          <div className="flex content-center h-[20px]">
                            <span className="whitespace-nowrap">
                              Total Units in Strata:{" "}
                            </span>
                            <StyledInput
                              value={totalUnitsInStrata}
                              onChange={(e) =>
                                setTotalUnitsInStrata(e.target.value)
                              }
                              rows={1}
                              className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                              placeholder="382"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="">
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Title to Land:
                          </span>
                          <StyledInput
                            value={titleToLand}
                            onChange={(e) => setTitleToLand(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Freehold Strata"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Property Disc.:
                          </span>
                          <StyledInput
                            value={propertyDisclosure}
                            onChange={(e) =>
                              setPropertyDisclosure(e.target.value)
                            }
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="No"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Fixtures Leased:{" "}
                          </span>
                          <StyledInput
                            value={fixturesLeased}
                            onChange={(e) => setFixturesLeased(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Fixtures Rmvd:{" "}
                          </span>
                          <StyledInput
                            value={fixturesRemoved}
                            onChange={(e) => setFixturesRemoved(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Baseboard, Electric"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Floor Finish:{" "}
                          </span>
                          <StyledInput
                            value={floorFinish}
                            onChange={(e) => setFloorFinish(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Hardwood, Laminate, Mixed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- */}
                  <div className="border border-[#929D9B] text-[10px] p-1">
                    <div className="flex content-center h-[20px]">
                      <span className="whitespace-nowrap">Maint Fee Inc:</span>
                      <StyledInput
                        value={maintFeeInc}
                        onChange={(e) => setMaintFeeInc(e.target.value)}
                        rows={1}
                        className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                        placeholder="Caretaker, Gardening, Hot Water, Management, Recreation Facility"
                      />
                    </div>
                    <div className="flex content-center ">
                      <span className="whitespace-nowrap">Legal:</span>
                      <StyledInput
                        value={legal}
                        onChange={(e) => setLegal(e.target.value)}
                        rows={2}
                        className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                        placeholder="PL LMS2064 LT 253 DL 185 LD 36. GROUP 1, UNDIV 620/249910 SHARE IN COM PROP THEREIN TOGETHER WITH AN INTEREST IN THE
                      COMMON PROPERTY IN PROPORTION TO THE UNIT ENTITLEMENT OF THE STRATA LOT AS SHOWN ON FORM 1 OR V, AS APPROPRIATE."
                      />
                    </div>
                    <div className="flex content-center h-[20px]">
                      <span className="whitespace-nowrap">Amenities:</span>
                      <StyledInput
                        value={amenities}
                        onChange={(e) => setAmenities(e.target.value)}
                        rows={1}
                        className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                        placeholder="Elevator, Exercise Centre, In Suite Laundry, Pool; Indoor, Storage, Swirlpool/Hot Tub"
                      />
                    </div>
                    <div className="flex content-center h-[20px]">
                      <span className="whitespace-nowrap">
                        Site Influences:
                      </span>
                      <StyledInput
                        value={siteInfluences}
                        onChange={(e) => setSiteInfluences(e.target.value)}
                        rows={1}
                        className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                        placeholder="Central Location, Recreation Nearby, Shopping Nearby, Waterfront Property"
                      />
                    </div>
                    <div className="flex content-center h-[20px]">
                      <span className="whitespace-nowrap">Features:</span>
                      <StyledInput
                        value={features}
                        onChange={(e) => setFeatures(e.target.value)}
                        rows={1}
                        className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                        placeholder="ClthWsh/Dryr/Frdg/Stve/DW, Drapes/Window Coverings, Smoke Alarm, Sprinkler - Fire"
                      />
                    </div>
                  </div>

                  {/* -- */}
                  <div className="flex ">
                    <div className="w-1/3 flex gap-4 border border-[#929D9B] text-[10px] p-1">
                      <div className="">
                        <div className="underline">Floor</div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor1}
                            onChange={(e) => setFloor1(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Main"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor2}
                            onChange={(e) => setFloor2(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Main"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor3}
                            onChange={(e) => setFloor3(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Main"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor4}
                            onChange={(e) => setFloor4(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Main"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor5}
                            onChange={(e) => setFloor5(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Main"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor6}
                            onChange={(e) => setFloor6(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Main"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor7}
                            onChange={(e) => setFloor7(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Main"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor8}
                            onChange={(e) => setFloor8(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor9}
                            onChange={(e) => setFloor9(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor10}
                            onChange={(e) => setFloor10(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="underline">Type</div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type1}
                            onChange={(e) => setType1(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Living Room"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type2}
                            onChange={(e) => setType2(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Kitchen"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type3}
                            onChange={(e) => setType3(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Dining Room"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type4}
                            onChange={(e) => setType4(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Bedroom"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type5}
                            onChange={(e) => setType5(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Den"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type6}
                            onChange={(e) => setType6(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Storage"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type7}
                            onChange={(e) => setType7(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder="Foyer"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type8}
                            onChange={(e) => setType8(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type9}
                            onChange={(e) => setType9(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type10}
                            onChange={(e) => setType10(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none "
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="underline">Dimensions</div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions1}
                            onChange={(e) => setDimensions1(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                            placeholder="9'11 x 9'2"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions2}
                            onChange={(e) => setDimensions2(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                            placeholder="9'2 x 7'4"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions3}
                            onChange={(e) => setDimensions3(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                            placeholder="9'11 x 8'4"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions4}
                            onChange={(e) => setDimensions4(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                            placeholder="11'4 x 10'8"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions5}
                            onChange={(e) => setDimensions5(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                            placeholder="6'6 x 4'8"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions6}
                            onChange={(e) => setDimensions6(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                            placeholder="7'6 x 4'8"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions7}
                            onChange={(e) => setDimensions7(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                            placeholder="7'2 x 4'7"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions8}
                            onChange={(e) => setDimensions8(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions9}
                            onChange={(e) => setDimensions9(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions10}
                            onChange={(e) => setDimensions10(e.target.value)}
                            rows={1}
                            className=" h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none "
                            placeholder="x"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-1/3 flex gap-4 border border-[#929D9B] text-[10px] p-1">
                      <div className="">
                        <div className="underline">Floor</div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor11}
                            onChange={(e) => setFloor11(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor12}
                            onChange={(e) => setFloor12(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor13}
                            onChange={(e) => setFloor13(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor14}
                            onChange={(e) => setFloor14(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor15}
                            onChange={(e) => setFloor15(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor16}
                            onChange={(e) => setFloor16(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor17}
                            onChange={(e) => setFloor17(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor18}
                            onChange={(e) => setFloor18(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor19}
                            onChange={(e) => setFloor19(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor20}
                            onChange={(e) => setFloor20(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="underline">Type</div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type11}
                            onChange={(e) => setType11(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type12}
                            onChange={(e) => setType12(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type13}
                            onChange={(e) => setType13(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type14}
                            onChange={(e) => setType14(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type15}
                            onChange={(e) => setType15(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type16}
                            onChange={(e) => setType16(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type17}
                            onChange={(e) => setType17(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type18}
                            onChange={(e) => setType18(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type19}
                            onChange={(e) => setType19(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type20}
                            onChange={(e) => setType20(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="underline">Dimensions</div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions11}
                            onChange={(e) => setDimensions11(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions12}
                            onChange={(e) => setDimensions12(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions13}
                            onChange={(e) => setDimensions13(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions14}
                            onChange={(e) => setDimensions14(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions15}
                            onChange={(e) => setDimensions15(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions16}
                            onChange={(e) => setDimensions16(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions17}
                            onChange={(e) => setDimensions17(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions18}
                            onChange={(e) => setDimensions18(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions19}
                            onChange={(e) => setDimensions19(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions20}
                            onChange={(e) => setDimensions20(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-1/3 flex gap-4 border border-[#929D9B] text-[10px] p-1">
                      <div className="">
                        <div className="underline">Floor</div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor21}
                            onChange={(e) => setFloor21(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor22}
                            onChange={(e) => setFloor22(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor23}
                            onChange={(e) => setFloor23(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor24}
                            onChange={(e) => setFloor24(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor25}
                            onChange={(e) => setFloor25(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor26}
                            onChange={(e) => setFloor26(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor27}
                            onChange={(e) => setFloor27(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor28}
                            onChange={(e) => setFloor28(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor29}
                            onChange={(e) => setFloor29(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={floor30}
                            onChange={(e) => setFloor30(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="underline">Type</div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type21}
                            onChange={(e) => setType21(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type22}
                            onChange={(e) => setType22(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type23}
                            onChange={(e) => setType23(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type24}
                            onChange={(e) => setType24(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type25}
                            onChange={(e) => setType25(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type26}
                            onChange={(e) => setType26(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type27}
                            onChange={(e) => setType27(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type28}
                            onChange={(e) => setType28(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type29}
                            onChange={(e) => setType29(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={type30}
                            onChange={(e) => setType30(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="underline">Dimensions</div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions21}
                            onChange={(e) => setDimensions21(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions22}
                            onChange={(e) => setDimensions22(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions23}
                            onChange={(e) => setDimensions23(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions24}
                            onChange={(e) => setDimensions24(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions25}
                            onChange={(e) => setDimensions25(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions26}
                            onChange={(e) => setDimensions26(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions27}
                            onChange={(e) => setDimensions27(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions28}
                            onChange={(e) => setDimensions28(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions29}
                            onChange={(e) => setDimensions29(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={dimensions30}
                            onChange={(e) => setDimensions30(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="x"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ---ffff */}
                  <div className="flex">
                    <div className="flex flex-col w-[25%] border border-[#929D9B] text-[10px] p-1">
                      <div className="flex content-center h-[20px]">
                        <span className="whitespace-nowrap">
                          Finished Floor (Main):{" "}
                        </span>
                        <StyledInput
                          value={finishedFloorMain}
                          onChange={(e) => setFinishedFloorMain(e.target.value)}
                          rows={1}
                          className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-right w-full focus:outline-none border-none"
                          placeholder="640"
                        />
                      </div>
                      <div className="flex content-center h-[20px]">
                        <span className="whitespace-nowrap">
                          Finished Floor (Above):{" "}
                        </span>
                        <StyledInput
                          value={finishedFloorAbove}
                          onChange={(e) =>
                            setFinishedFloorAbove(e.target.value)
                          }
                          rows={1}
                          className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-right w-full focus:outline-none border-none"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex content-center h-[20px]">
                        <span className="whitespace-nowrap">
                          Finished Floor (Below):{" "}
                        </span>
                        <StyledInput
                          value={finishedFloorBelow}
                          onChange={(e) =>
                            setFinishedFloorBelow(e.target.value)
                          }
                          rows={1}
                          className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-right w-full focus:outline-none border-none"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex content-center h-[20px]">
                        <span className="whitespace-nowrap">
                          Finished Floor (Basement):{" "}
                        </span>
                        <StyledInput
                          value={finishedFloorBasement}
                          onChange={(e) =>
                            setFinishedFloorBasement(e.target.value)
                          }
                          rows={1}
                          className="h-full bg-transparent border-b border-dotted border-gray-400 border-x-0 border-t-0 rounded-none text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-right w-full focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex content-center h-[20px]">
                        <span className="whitespace-nowrap">
                          Finished Floor (Total):{" "}
                        </span>
                        <StyledInput
                          value={finishedFloorTotal}
                          onChange={(e) =>
                            setFinishedFloorTotal(e.target.value)
                          }
                          rows={1}
                          className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-right w-full focus:outline-none border-none"
                          placeholder="640"
                        />{" "}
                        sqft
                      </div>
                      <div className="flex content-center h-[20px]">
                        <span className="whitespace-nowrap">
                          Unfinished Floor:{" "}
                        </span>
                        <StyledInput
                          value={unfinishedFloor}
                          onChange={(e) => setUnfinishedFloor(e.target.value)}
                          rows={1}
                          className="h-full bg-transparent border-b border-dotted border-gray-400 border-x-0 border-t-0 rounded-none text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-right w-full focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex content-center h-[20px]">
                        <span className="whitespace-nowrap">Grand Total: </span>
                        <StyledInput
                          value={grandTotal}
                          onChange={(e) => setGrandTotal(e.target.value)}
                          rows={1}
                          className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-right w-full focus:outline-none border-none"
                          placeholder="640"
                        />{" "}
                        sqft
                      </div>
                    </div>
                    <div className="flex flex-col w-[35%] border border-[#929D9B] text-[10px] p-1">
                      <div className="flex">
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            # of Rooms:{" "}
                          </span>
                          <StyledInput
                            value={numRooms}
                            onChange={(e) => setNumRooms(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="7"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            # of Kitchens:{" "}
                          </span>
                          <StyledInput
                            value={numKitchens}
                            onChange={(e) => setNumKitchens(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="1"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            # of Levels:{" "}
                          </span>
                          <StyledInput
                            value={numLevels}
                            onChange={(e) => setNumLevels(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="1"
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Crawl/Bsmt. Height:{" "}
                          </span>
                          <StyledInput
                            value={crawlBasementHeight}
                            onChange={(e) =>
                              setCrawlBasementHeight(e.target.value)
                            }
                            rows={1}
                            className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Restricted Age:{" "}
                          </span>
                          <StyledInput
                            value={restrictedAge}
                            onChange={(e) => setRestrictedAge(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="flex">
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap"># of Pets: </span>
                          <StyledInput
                            value={numPets}
                            onChange={(e) => setNumPets(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">Cats: </span>
                          <StyledInput
                            value={cats}
                            onChange={(e) => setCats(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">Dogs: </span>
                          <StyledInput
                            value={dogs}
                            onChange={(e) => setDogs(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            # or % of Rentals Allowed:{" "}
                          </span>
                          <StyledInput
                            value={rentalsAllowed}
                            onChange={(e) => setRentalsAllowed(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center">
                          <span className="whitespace-nowrap">
                            Bylaw Restric:{" "}
                          </span>
                          <StyledInput
                            value={bylawRestrictions}
                            onChange={(e) =>
                              setBylawRestrictions(e.target.value)
                            }
                            rows={2}
                            className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="Pets Allowed w/Rest., Rentals Allwd w/Restrctns"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">Basement: </span>
                          <StyledInput
                            value={basement}
                            onChange={(e) => setBasement(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="None"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex w-[25%] gap-1 border border-[#929D9B] text-[10px] p-1">
                      <div className="">
                        <div className="underline whitespace-nowrap">Bath</div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bath1}
                            onChange={(e) => setBath1(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="1"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bath2}
                            onChange={(e) => setBath2(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="2"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bath3}
                            onChange={(e) => setBath3(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="3"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bath4}
                            onChange={(e) => setBath4(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="4"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bath5}
                            onChange={(e) => setBath5(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="5"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bath6}
                            onChange={(e) => setBath6(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="6"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bath7}
                            onChange={(e) => setBath7(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="7"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bath8}
                            onChange={(e) => setBath8(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="8"
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="underline whitespace-nowrap">Type</div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathType1}
                            onChange={(e) => setBathType1(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder="Main"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathType2}
                            onChange={(e) => setBathType2(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathType3}
                            onChange={(e) => setBathType3(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathType4}
                            onChange={(e) => setBathType4(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathType5}
                            onChange={(e) => setBathType5(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathType6}
                            onChange={(e) => setBathType6(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathType7}
                            onChange={(e) => setBathType7(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathType8}
                            onChange={(e) => setBathType8(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="underline whitespace-nowrap">
                          # of Pieces
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathPieces1}
                            onChange={(e) => setBathPieces1(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="4"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathPieces2}
                            onChange={(e) => setBathPieces2(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathPieces3}
                            onChange={(e) => setBathPieces3(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathPieces4}
                            onChange={(e) => setBathPieces4(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathPieces5}
                            onChange={(e) => setBathPieces5(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathPieces6}
                            onChange={(e) => setBathPieces6(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathPieces7}
                            onChange={(e) => setBathPieces7(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathPieces8}
                            onChange={(e) => setBathPieces8(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                      </div>
                      <div className="">
                        <div className="underline whitespace-nowrap">
                          Ensuite?
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathEnsuite1}
                            onChange={(e) => setBathEnsuite1(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder="No"
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathEnsuite2}
                            onChange={(e) => setBathEnsuite2(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathEnsuite3}
                            onChange={(e) => setBathEnsuite3(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathEnsuite4}
                            onChange={(e) => setBathEnsuite4(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathEnsuite5}
                            onChange={(e) => setBathEnsuite5(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathEnsuite6}
                            onChange={(e) => setBathEnsuite6(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathEnsuite7}
                            onChange={(e) => setBathEnsuite7(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <StyledInput
                            value={bathEnsuite8}
                            onChange={(e) => setBathEnsuite8(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex w-[15%] border border-[#929D9B] text-[10px] p-1">
                      <div className="">
                        <div className="underline whitespace-nowrap text-center">
                          Outbuildings
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">Barn: </span>
                          <StyledInput
                            value={barn}
                            onChange={(e) => setBarn(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Workshop/Shed:{" "}
                          </span>
                          <StyledInput
                            value={workshopShed}
                            onChange={(e) => setWorkshopShed(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">Pool: </span>
                          <StyledInput
                            value={pool}
                            onChange={(e) => setPool(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">Garage Sz: </span>
                          <StyledInput
                            value={garageSize}
                            onChange={(e) => setGarageSize(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                        <div className="flex content-center h-[20px]">
                          <span className="whitespace-nowrap">
                            Door Height:{" "}
                          </span>
                          <StyledInput
                            value={doorHeight}
                            onChange={(e) => setDoorHeight(e.target.value)}
                            rows={1}
                            className="h-full bg-transparent text-[10px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-center w-full focus:outline-none border-none"
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* -- */}
                  <div className="">
                    <div className="flex border border-[#929D9B] text-[10px] p-1">
                      <div className="flex content-center h-[20px]">
                        <span className="whitespace-nowrap">
                          Listing Broker(s):{" "}
                        </span>
                        <StyledInput
                          value={listingBroker}
                          onChange={(e) => setListingBroker(e.target.value)}
                          rows={1}
                          className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-right w-full focus:outline-none border-none"
                          placeholder="Sutton Group - 1st West Realty"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="">
                    <div className="flex border border-[#929D9B] text-[10px] p-1">
                      <div className="flex content-center w-full">
                        <StyledInput
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={6}
                          className="h-full bg-transparent text-[12px] font-semibold placeholder:font-semibold text-black placeholder:text-black text-left w-full focus:outline-none border-none"
                          placeholder="View! View! View! Ocean view Coal Harbour 1 Bedroom + Den/Office Condo with gorgeous water view of Burrard Inlet. Great layout with
                        Floor-to-ceiling Windows in living room. Spacious bedroom with separate area for home office. Bright kitchen with windows. 1 underground parking &
                        1 storage locker. Very convenient location with just a few steps to the Seawall, Stanley Park, Robson St. This Harbourside Park condo complex is
                        Architecturally Stunning designed by Arthur Erickson with full amenities including indoor pool, exercise centre, swirlpool/ hot tub. Don't miss the
                        great opportunity to own this nice Condo at an affordable price! Won't last long! Come and visit the Open House on November 25th & 26th (Sat &
                        Sunday) 2-4pm."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
);

BcfpStandard24.displayName = "BcfpStandard24";

export default BcfpStandard24;
