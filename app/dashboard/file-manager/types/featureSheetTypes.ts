
export interface TextStyle {
    fontSize: string;
    fontWeight?: string | number;
    fontFamily?: string;
    color?: string;
    textAlign?: "left" | "center" | "right";
    lineHeight?: string;
    letterSpacing?: string;
}

export interface ImagePosition {
    x: number;
    y: number;
}

export interface ImageStyle {
    position: ImagePosition;
    scale: number;
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
  type: TemplateType;
  url: string;
  pages?: string[];
}

export const templateImages: TemplateDefinition[] = [
  { id: "BCFPStandard2", type: "tabloid", url: "BcfpStandard2" },
  { id: "BCFPStandard3", type: "tabloid", url: "BcfpStandard3" },
  { id: "BCFPStandard4", type: "tabloid", url: "BcfpStandard4" },
  { id: "BCFPStandard6", type: "tabloid", url: "BcfpStandard6" },
  { id: "BCFPStandard7", type: "tabloid", url: "BcfpStandard7" },
  { id: "BCFPStandard8", type: "tabloid", url: "BcfpStandard8" },
  { id: "BCFPStandard9", type: "tabloid", url: "BcfpStandard9" },
  { id: "BCFPStandard10", type: "tabloid", url: "BcfpStandard10" },
  { id: "BCFPStandard11", type: "tabloid", url: "BcfpStandard11" },
  { id: "BCFPStandard12", type: "tabloid", url: "BcfpStandard12" },
  { id: "BCFPStandard13", type: "listing", url: "BcfpStandard13", pages: ["/listing_flyer_13_page_1.png", "/listing_flyer_13_page_2.png"] },
  { id: "BCFPStandard14", type: "tabloid", url: "BcfpStandard14" },
  { id: "BCFPStandard15", type: "listing", url: "BcfpStandard15" },
  { id: "BCFPStandard16", type: "listing", url: "BcfpStandard16" },
  { id: "BCFPStandard17", type: "listing", url: "BcfpStandard17" },
  { id: "BCFPStandard18", type: "listing", url: "BcfpStandard18" },
  { id: "BCFPStandard19", type: "listing", url: "BcfpStandard19" },
  { id: "BCFPStandard20", type: "listing", url: "BcfpStandard20" },
  { id: "BCFPStandard21", type: "listing", url: "BcfpStandard21" },
  { id: "BCFPStandard22", type: "listing", url: "BcfpStandard22" },
  { id: "BCFPStandard23", type: "tabloid", url: "BcfpStandard23" },
  { id: "BCFPStandard24", type: "tabloid", url: "BcfpStandard24" },
];

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
}

export interface FeatureSheetResponse {
    id: number;
    uuid: string;
    order_id: string;
    type: FeatureSheetType;
    template_key: string;
    content: FeatureSheetContent;
    fieldStyles?: Record<string, any>;
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
    fieldStyles?: Record<string, any>;
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
