
export interface TextStyle {
    fontSize: string;
    fontWeight?: string | number;
    fontFamily?: string;
    color?: string;
    textAlign?: "left" | "center" | "right" | "justify";
    verticalAlign?: "top" | "center" | "bottom";
    alignContent?: "start" | "center" | "end" | "space-between";
    lineHeight?: string;
    letterSpacing?: string;
}

export interface DetailField {
    id: string;       // stable key, e.g. "byLawRestrictions"
    title: string;    // editable label text, e.g. "BY-LAW RESTRICTIONS:"
    value: string;    // the field value
    style?: TextStyle;
    titleStyle?: TextStyle;
}

export interface ImagePosition {
    x: number;
    y: number;
}

export interface ImageStyle {
    position: ImagePosition;
    scale: number;
    rotation?: number;
    width?: string;
    height?: string;
    borderRadius?: string;
    objectFit?: "cover" | "contain";
}


export interface StyledTextField {
    value: string;
    style: TextStyle;
}

export interface HighlightItem {
    title: string;
    icon: string;
    value: string;
}

export interface StyledHighlights {
    value: HighlightItem[];
    style: TextStyle;
}

export interface StyledKeyHighlights {
    value: string[];                // Array of highlight strings
    style: TextStyle;
}

export interface FeatureSheetContent {
    offeredAtPrice?: StyledTextField;

    realtorTitle?: StyledTextField;
    realtorName?: StyledTextField;
    companyName?: StyledTextField;

    propertyNotesTitle?: StyledTextField;
    propertyNotesDescription?: StyledTextField;
    expandedDetail1Title?: StyledTextField;
    expandedDetail1Description?: StyledTextField;
    expandedDetail2Title?: StyledTextField;
    expandedDetail2Description?: StyledTextField;

    keyHighlightLabel?: StyledTextField;
    keyHighlights?: StyledKeyHighlights;
    highlights?: StyledHighlights;

    contactLabel?: StyledTextField;
    contactInfo?: StyledTextField;
    ctaText?: StyledTextField;
    emailLink?: StyledTextField;
    linkedinLink?: StyledTextField;
    phoneNumber?: StyledTextField;

    [key: string]: StyledTextField | StyledKeyHighlights | StyledHighlights | undefined;
}


export type ImageType = "logo" | "realtor" | "property" | "gallery" | "custom";
export type ImageSource = "upload" | "gallery";

export interface FeatureSheetImage {
    id?: number;
    uuid?: string;
    feature_sheet_id?: number;
    type: ImageType;
    source: ImageSource;
    slot: string;
    file?: string;
    file_path?: string;
    storage_path?: string;
    file_name?: string;
    url?: string;
    thumbnail_url?: string;
    variant_urls?: {
        thumb?: string;
        slider?: string;
        landing?: string;
        popup?: string;
        print?: string;
    } | null;
    is_processing?: boolean;
    is_hidden?: boolean;
    meta: ImageStyle;
}

export interface FeatureSheetImages {
    logo?: FeatureSheetImage;
    realtorImage?: FeatureSheetImage;
    image1?: FeatureSheetImage;
    image2?: FeatureSheetImage;
    image3?: FeatureSheetImage;
    image4?: FeatureSheetImage;
    image5?: FeatureSheetImage;
    image6?: FeatureSheetImage;
    image7?: FeatureSheetImage;
    image8?: FeatureSheetImage;
    image9?: FeatureSheetImage;
    image10?: FeatureSheetImage;
    image11?: FeatureSheetImage;
    image12?: FeatureSheetImage;
    image13?: FeatureSheetImage;
    [key: string]: FeatureSheetImage | undefined;
}

export interface FeatureSheetTheme {
    primaryColor: string;
    backgroundColor?: string;
    borderColor?: string;
}


export type TemplateType = "listing" | "tabloid";

export interface TemplateDefinition {
  id: string;
  label?: string;
  type: TemplateType;
  url: string;
  pages?: string[];
}

export const templateImages: TemplateDefinition[] = [
  // { id: "BCFPStandard2", type: "tabloid", url: "BcfpStandard2", label: "Tabloid 1" },
  { id: "BCFPStandard3", type: "tabloid", url: "BcfpStandard3", label: "Tabloid 1", pages: ["/tabloid_1_page1.png", "/tabloid_1_page2.png"] },
  { id: "BCFPStandard4", type: "tabloid", url: "BcfpStandard4", label: "Tabloid 2", pages: ["/tabloid_2_page1.png", "/tabloid_2_page2.png"] },
  { id: "BCFPStandard6", type: "tabloid", url: "BcfpStandard6", label: "Tabloid 3", pages: ["/tabloid_3_page1.png", "/tabloid_3_page2.png"] },
  { id: "BCFPStandard7", type: "tabloid", url: "BcfpStandard7", label: "Tabloid 4", pages: ["/tabloid_4_page1.png", "/tabloid_4_page2.png"] },
  { id: "BCFPStandard8", type: "tabloid", url: "BcfpStandard8", label: "Tabloid 5", pages: ["/tabloid_5_page1.png", "/tabloid_5_page2.png"] },
  { id: "BCFPStandard9", type: "tabloid", url: "BcfpStandard9", label: "Tabloid 6", pages: ["/tabloid_6_page1.png", "/tabloid_6_page2.png"] },
  { id: "BCFPStandard10", type: "tabloid", url: "BcfpStandard10", label: "Tabloid 7", pages: ["/tabloid_7_page1.png", "/tabloid_7_page2.png"] },
  { id: "BCFPStandard11", type: "tabloid", url: "BcfpStandard11", label: "Tabloid 8", pages: ["/tabloid_8_page1.png", "/tabloid_8_page2.png"] },
  // { id: "BCFPStandard12", type: "tabloid", url: "BcfpStandard12" },
  { id: "BCFPStandard13", type: "listing", url: "BcfpStandard13", label: "Flyer 1", pages: ["/listing_flyer_13_page_1.png", "/listing_flyer_13_page_2.png"] },
  { id: "BCFPStandard14", type: "tabloid", url: "BcfpStandard14", label: "Tabloid 9", pages: ["/tabloid_9_page1.png", "/tabloid_9_page2.png"] },
  { id: "BCFPStandard15", type: "listing", url: "BcfpStandard15", label: "Flyer 2", pages: ["/listing_flyer_15_page_1.png", "/listing_flyer_15_page_2.png"] },
  { id: "BCFPStandard16", type: "listing", url: "BcfpStandard16", label: "Flyer 3" },
  { id: "BCFPStandard17", type: "listing", url: "BcfpStandard17", label: "Flyer 4", pages: ["/listing_flyer_17_page_1.png", "/listing_flyer_17_page_2.png"] },
  { id: "BCFPStandard18", type: "listing", url: "BcfpStandard18", label: "Flyer 5", pages: ["/listing_flyer_18_page_1.png", "/listing_flyer_18_page_2.png"] },
  { id: "BCFPStandard19", type: "listing", url: "BcfpStandard19", label: "Flyer 6" },
  { id: "BCFPStandard20", type: "listing", url: "BcfpStandard20", label: "Flyer 7", pages: ["/listing_flyer_20_page_1.png", "/listing_flyer_20_page_2.png"] },
  { id: "BCFPStandard21", type: "listing", url: "BcfpStandard21", label: "Flyer 8", pages: ["/listing_flyer_21_page_1.png", "/listing_flyer_21_page_2.png"] },
  { id: "BCFPStandard22", type: "listing", url: "BcfpStandard22", label: "Flyer 9", pages: ["/listing_flyer_22_page_1.png", "/listing_flyer_22_page_2.png"] },
  // { id: "BCFPStandard23", type: "tabloid", url: "BcfpStandard23" },
  // { id: "BCFPStandard24", type: "tabloid", url: "BcfpStandard24" },
];

export const getTemplateLabel = (templateKey: string): string => {
  if (!templateKey) return "";
  const found = templateImages.find((t) => t.id === templateKey || t.url === templateKey);
  if (found?.label) return found.label;
  return templateKey;
};

export type UploadedBy = "admin" | "agent" | "vendor";
export type FeatureSheetType = "template" | "custom" | "pdf";

export interface FeatureSheetMetadata {
    template_id: string;
    template_type: TemplateType;
    order_uuid?: string;
    copies_count?: number;
    custom_pdf_url?: string;
}

/**
 * Payload sent to POST /feature-sheets and PUT /feature-sheets/:uuid
 *
 * For template feature sheets:
 *   - image_uuids: UUIDs returned from the /uploads/confirm step (new uploads)
 *   - images:      Used internally only; NOT sent to the backend
 *
 * For PDF feature sheets:
 *   - type: "pdf", pdf_s3_key: S3 key returned from /uploads/presigned-urls step
 */
export interface FeatureSheetPayload {
    order_uuid: string;
    type: FeatureSheetType;
    uploaded_by: UploadedBy;
    // For template sheets:
    template_key?: string;
    theme?: FeatureSheetTheme;
    content?: FeatureSheetContent;
    image_uuids?: string[];   // UUIDs from the confirm step — sent to backend
    // For PDF sheets:
    pdf_s3_key?: string;
    // Internal only — used by buildPayload, never sent to backend directly
    images?: FeatureSheetImage[];
    fieldStyles?: Record<string, any>;
    fieldPositions?: Record<string, { x: number; y: number }>;
}

export interface FeatureSheetResponse {
    id: number;
    uuid: string;
    order_id: string;
    type: FeatureSheetType;
    template_key: string;
    content: FeatureSheetContent;
    fieldStyles?: Record<string, any>;
    fieldPositions?: Record<string, { x: number; y: number }>;
    images: FeatureSheetImage[];
    pdf_path: string | null;
    pdf_url: string | null;
    uploaded_by: UploadedBy;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface FeatureSheetState {
    templateKey: string;
    orderUuid: string;
    uploadedBy: UploadedBy;
    type: FeatureSheetType;
    primaryColor: string;
    backgroundColor: string;
    borderColor: string;
    offeredAtPrice: string;
    contactLabel: string;
    contactInfo: string;
    ctaText: string;
    title: string;
    subtitle: string;
    fullName: string;
    realtorName: string;
    realtorTitle: string;
    companyName: string;
    propertyName: string;
    propertyNotesTitle: string;
    propertyNotesDescription: string;
    description: string;
    siteInfluences: string;
    grossTaxes: string;
    featuresIncluded: string;
    amount: string;
    mlsNumber: string;
    email: string;
    phone: string;
    linkedin: string;
    expandedDetail1Title: string;
    expandedDetail1Description: string;
    expandedDetail2Title: string;
    expandedDetail2Description: string;
    expandedDetail3Title: string;
    expandedDetail3Description: string;
    expandedDetail4Title: string;
    expandedDetail4Description: string;
    keyHighlightLabel: string;
    keyHighlights: string[];
    highlights: HighlightItem[];
    emailLink: string;
    linkedinLink: string;
    phoneNumber: string;
    otherDetails: Record<string, unknown>;
    images: { [key: string]: string | null };
    imageUuids: { [key: string]: string | null };
    hiddenImages: { [key: string]: boolean };
    imageScales: { [key: string]: number };
    imagePositions: { [key: string]: ImagePosition };
    imageRotations: { [key: string]: number };
    fieldStyles?: Record<string, any>;
    fieldPositions?: Record<string, { x: number; y: number }>;
    detailFields?: DetailField[];
}


export interface ImageState {
    [key: string]: string | null;
}

export interface ScaleState {
    [key: string]: number;
}

export interface PositionState {
    [key: string]: ImagePosition;
}

export interface DraggingState {
    [key: string]: boolean;
}

export interface PrintRequestData {
    copies: number;
    with_bleed: boolean;
    additional_info?: string;
    agent_id: string;
    property_id: string;
    tour_id?: string;
}
