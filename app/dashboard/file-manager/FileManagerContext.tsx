"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useSidebar } from "@/components/ui/sidebar";
export type SelectedFiles = {
  file: File;
  type: string;
  subtype?: string | null;
  group?: string;
  upload?: boolean;
  service_id?: string;
  is_featured?: boolean;
  is_admin_approved?: boolean;
  is_agent_approved?: boolean;
  is_show?: boolean;
  is_deleted?: boolean;
  sort_order?: number;
  is_complimentary?: boolean;
  thumbnailFile?: File;
  isPanorama?: boolean;
};
import { FeatureSheetResponse, DetailField } from "./types/featureSheetTypes";
import { Area } from "./file-manager";
import { usePanoramaDetection } from "./utils/panoramaUtils";

type PreviewFile = {
  file: File;
  upload: boolean;
};

export type DroppedMarker = {
  uuid?: string;
  x: number;
  y: number;
  file?: File;
  file_path?: string;
  url?: string;
  floorImageUrl: string;
  name?: string;
  description?: string;
  isApi?: boolean;
  thumbnail_url?: string;
  variant_urls?: {
    thumb: string;
    slider: string;
    landing: string;
    popup: string;
    print?: string;
  };
};

export type Files = {
  id: number;
  uuid: string;
  tour_id: number;
  type: string;
  subtype?: string | null;
  name: string;
  file_path: string;
  url?: string;
  thumbnail_url?: string;
  group: string | null;
  service_id: number | null;
  service?: {
    id: number;
    uuid: string;
    name: string;
    category?: { name: string };
  };
  sort_order: number;
  created_at: string;
  updated_at: string;
  is_featured?: boolean;
  is_admin_approved?: boolean;
  is_agent_approved?: boolean;
  is_show?: boolean;
  is_processing?: boolean;
  status?: string;
  is_deleted?: boolean;
  is_paid?: boolean;
  is_complimentary?: boolean;
  is_hidden?: boolean;
  variant_urls?: {
    thumb: string;
    slider: string;
    landing: string;
    popup: string;
    print?: string;
  };
  isPanorama?: boolean;
  size?: number;
};
export type SnapShots = {
  id: number;
  uuid: string;
  tour_id: number;
  type: string;
  file_name: string;
  file_path: string;
  url?: string;
  name: string | null;
  description: string | null;
  x_axis: number;
  y_axis: string;
  thumbnail_url?: string;
  variant_urls?: {
    thumb: string;
    slider: string;
    landing: string;
    popup: string;
    print?: string;
  };
};
export type FilesData = {
  id: number;
  uuid: string;
  order_id: number;
  files: Files[];
  links: {
    uuid?: string;
    link: string;
    type: string;
    expiry_date?: string;
    service_id?: number | string;
    service?: { id: number; uuid: string };
    is_hidden?: boolean;
  }[];
  snapshots: SnapShots[];
  slide_show: {
    slide_delay: string;
    transitions: string;
    background_audio: string;
    auto_play: string;
    video_overlay: string;
  };
};

type LinkItem = {
  uuid?: string;
  type: "branded" | "unbranded";
  service_id: string;
  link: string;
  expiry_date?: string;
};

type FormData = {
  // Theme & Info
  background: string;
  border: string;
  avatar_url: string;
  AvatarfileName: string;
  image7Rotation?: number;

  // Content Fields
  title: string;
  subtitle: string;
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  propertyName: string;
  description: string;
  headline?: string;
  amount: string;
  mlsNumber: string;
  siteInfluences: string;
  grossTaxes: string;
  featuresIncluded: string;
  outdoorAreas?: string;
  byLawRestrictions: string;
  maintenanceFees: string;
  maintenanceFeesInclude: string;
  amenities: string;
  view: string;
  number: string;
  address: string;
  addressCode: string;
  roadName: string;
  cityLine: string;
  bedroom: string;
  bathroom: string;
  sqft: string;
  builtYear: string;
  suite?: string;

  // Legacy/Internal mappings
  offeredAtPrice: string;
  realtorTitle: string;
  realtorName: string;
  companyName: string;
  propertyNotesTitle: string;
  propertyNotesDescription: string;
  expandedDetail1: string;
  expandedDetail1Description: string;
  expandedDetail2: string;
  expandedDetail2Description: string;

  Keyhighlights: string[];
  highlights: {
    title: string;
    icon: string;
    value: string;
  }[];

  // Images & Transformations
  imageUpload: string | null;
  imageUploadFileName: string;
  images: { [key: string]: string | null };
  imageScales: { [key: string]: number };
  imagePositions: { [key: string]: { x: number; y: number } };
  imageRotations?: { [key: string]: number };

  // Featured Images (Legacy)
  featuredImage1Preview: string | null;
  featuredImage1FileName: string;
  featuredImage2Preview: string | null;
  featuredImage2FileName: string;
  featuredImage3Preview: string | null;
  featuredImage3FileName: string;
  fieldStyles?: { [key: string]: any };
  fieldPositions?: { [key: string]: { x: number; y: number } };
  imageSettings?: { [key: string]: any };
  detailFields?: DetailField[];
  leftDetailFields?: DetailField[];
  rightDetailFields?: DetailField[];
  deletedDetailFields?: any[];
  deletedStandardFieldIds?: string[];
  contactLabel?: string;
  phoneLabel?: string;
  emailLabel?: string;
  realtorLabel?: string;
  propertyLabel?: string;
  priceLabel?: string;
  bedroomLabel?: string;
  bathroomLabel?: string;
  sqftLabel?: string;
  builtYearLabel?: string;
  byLawLabel?: string;
  maintFeesLabel?: string;
  maintFeesIncludeLabel?: string;
  featuresIncludedLabel?: string;
  siteInfluencesLabel?: string;
  amenitiesLabel?: string;
  viewLabel?: string;
  roadLabelBefore?: string;
  roadLabelAfter?: string;
  mlsLabel?: string;
  disclaimerText?: string;
  printedByText?: string;
};

type FileManagerContextType = {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;

  selectedFiles: SelectedFiles[];
  setSelectedFiles: Dispatch<SetStateAction<SelectedFiles[]>>;

  selectedVideoFiles: SelectedFiles[];
  setSelectedVideoFiles: Dispatch<SetStateAction<SelectedFiles[]>>;

  floorFiles: SelectedFiles[];
  setFloorFiles: Dispatch<SetStateAction<SelectedFiles[]>>;

  links: LinkItem[];
  setLinks: Dispatch<SetStateAction<LinkItem[]>>;

  brandedSelected: boolean;
  setBrandedSelected: (value: boolean) => void;

  unBrandedSelected: boolean;
  setUnBrandedSelected: (value: boolean) => void;

  previewFiles: PreviewFile[];
  setPreviewFiles: Dispatch<SetStateAction<PreviewFile[]>>;

  droppedMarkers: DroppedMarker[];
  setDroppedMarkers: Dispatch<SetStateAction<DroppedMarker[]>>;

  delay: number;
  setDelay: Dispatch<SetStateAction<number>>;

  transition: string;
  setTransition: Dispatch<SetStateAction<string>>;

  audioUrl: string | undefined;
  setAudioUrl: Dispatch<SetStateAction<string | undefined>>;

  selectedAudioTrack: string | undefined;
  setSelectedAudioTrack: Dispatch<SetStateAction<string | undefined>>;

  heroType: "slideshow" | "single_photo" | "video";
  setHeroType: Dispatch<SetStateAction<"slideshow" | "single_photo" | "video">>;

  heroVideoUuid: string | undefined;
  setHeroVideoUuid: Dispatch<SetStateAction<string | undefined>>;

  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
  updateFormData: (updates: Partial<FormData>) => void;

  restoreDetailFieldHandler: ((id: string) => void) | null;
  setRestoreDetailFieldHandler: Dispatch<
    SetStateAction<((id: string) => void) | null>
  >;

  restoreAllDetailFieldsHandler: (() => void) | null;
  setRestoreAllDetailFieldsHandler: Dispatch<
    SetStateAction<(() => void) | null>
  >;

  filesData: FilesData | null;
  setFilesData: Dispatch<SetStateAction<FilesData | null>>;

  featureSheets: FeatureSheetResponse[];
  setFeatureSheets: Dispatch<SetStateAction<FeatureSheetResponse[]>>;

  changedFileUuids: Set<string>;
  setChangedFileUuids: Dispatch<SetStateAction<Set<string>>>;

  selectionChangedUuids: Set<string>;
  setSelectionChangedUuids: Dispatch<SetStateAction<Set<string>>>;

  area: Area[];
  setArea: Dispatch<SetStateAction<Area[]>>;

  fileManagerMode: "upload" | "reorder";
  setFileManagerMode: Dispatch<SetStateAction<"upload" | "reorder">>;

  imagesPerRow: number;
  setImagesPerRow: Dispatch<SetStateAction<number>>;

  isSaving: boolean;
  setIsSaving: Dispatch<SetStateAction<boolean>>;

  isHidingMode: boolean;
  setIsHidingMode: Dispatch<SetStateAction<boolean>>;

  filesToHide: Set<string>;
  setFilesToHide: Dispatch<SetStateAction<Set<string>>>;
  includeHidden: boolean;
  setIncludeHidden: Dispatch<SetStateAction<boolean>>;
  deletedSnapshotUuids: Set<string>;
  setDeletedSnapshotUuids: Dispatch<SetStateAction<Set<string>>>;

  approvalSelectedUuids: Set<string>;
  setApprovalSelectedUuids: Dispatch<SetStateAction<Set<string>>>;

  tourSettings: any | null;
  setTourSettings: Dispatch<SetStateAction<any | null>>;

  tourDefaultSettings: any | null;
  setTourDefaultSettings: Dispatch<SetStateAction<any | null>>;

  handleSave: (overrideChangedFiles?: Files[]) => Promise<void>;
};

const FileManagerContext = createContext<FileManagerContextType | undefined>(
  undefined,
);

export const initialFormData: FormData = {
  // Theme & Info
  background: "",
  border: "",
  avatar_url: "",
  AvatarfileName: "",

  // Content Fields
  title: "",
  subtitle: "",
  fullName: "",
  email: "",
  phone: "",
  linkedin: "",
  propertyName: "",
  description: "",
  headline: "",
  amount: "",
  mlsNumber: "",
  siteInfluences: "",
  grossTaxes: "",
  featuresIncluded: "",
  outdoorAreas: "",
  byLawRestrictions: "",
  maintenanceFees: "",
  maintenanceFeesInclude: "",
  amenities: "",
  view: "",
  number: "",
  address: "",
  addressCode: "",
  roadName: "",
  cityLine: "",
  bedroom: "",
  bathroom: "",
  sqft: "",
  builtYear: "",
  suite: "",

  // Legacy/Internal mappings
  offeredAtPrice: "",
  realtorTitle: "",
  realtorName: "",
  companyName: "",
  propertyNotesTitle: "",
  propertyNotesDescription: "",
  expandedDetail1: "",
  expandedDetail1Description: "",
  expandedDetail2: "",
  expandedDetail2Description: "",

  Keyhighlights: Array(6).fill(""),
  highlights: [
    { title: "", icon: "eye", value: "" },
    { title: "", icon: "eye", value: "" },
    { title: "", icon: "eye", value: "" },
    { title: "", icon: "eye", value: "" },
  ],

  // Images & Transformations
  imageUpload: null,
  imageUploadFileName: "",
  images: {
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    image5: null,
    image6: null,
    image7: null,
    image8: null,
    image9: null,
    image10: null,
    image11: null,
    image12: null,
    image13: null,
    image14: null,
    image15: null,
    image16: null,
    image17: null,
    image18: null,
  },
  imageScales: {
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
  },
  imagePositions: {
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
  },
  imageRotations: {
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
  },

  // Featured Images (Legacy)
  featuredImage1Preview: null,
  featuredImage1FileName: "",
  featuredImage2Preview: null,
  featuredImage2FileName: "",
  featuredImage3Preview: null,
  featuredImage3FileName: "",
  fieldStyles: {},
  fieldPositions: {},
  detailFields: undefined,
  leftDetailFields: undefined,
  rightDetailFields: undefined,
};

export const FileManagerProvider = ({ children }: { children: ReactNode }) => {
  const { setOpen } = useSidebar();

  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  const [files, setFiles] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles[]>([]);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<SelectedFiles[]>(
    [],
  );
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [floorFiles, setFloorFiles] = useState<SelectedFiles[]>([]);
  const [brandedSelected, setBrandedSelected] = useState(false);
  const [unBrandedSelected, setUnBrandedSelected] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [droppedMarkers, setDroppedMarkers] = useState<DroppedMarker[]>([]);
  const [delay, setDelay] = useState<number>(4000);
  const [transition, setTransition] = useState<string>("fade-in");
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<
    string | undefined
  >("none");
  const [heroType, setHeroType] = useState<"slideshow" | "single_photo" | "video">("slideshow");
  const [heroVideoUuid, setHeroVideoUuid] = useState<string | undefined>(undefined);
  const [filesData, setFilesData] = useState<FilesData | null>(null);
  const [featureSheets, setFeatureSheets] = useState<FeatureSheetResponse[]>(
    [],
  );
  const [changedFileUuids, setChangedFileUuids] = useState<Set<string>>(
    new Set(),
  );
  const [selectionChangedUuids, setSelectionChangedUuids] = useState<
    Set<string>
  >(new Set());
  const [area, setArea] = useState<Area[]>([]);
  const [fileManagerMode, setFileManagerMode] = useState<"upload" | "reorder">(
    "upload",
  );
  const [imagesPerRow, setImagesPerRow] = useState<number>(4);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMobile = window.innerWidth < 768;

    const handleResize = () => {
      const currentIsMobile = window.innerWidth < 768;

      if (currentIsMobile !== isMobile) {
        // Crossed breakpoint
        isMobile = currentIsMobile;
        if (isMobile) {
          setImagesPerRow(1);
        } else {
          setImagesPerRow((prev) => (prev === 1 ? 4 : prev));
        }
      }
    };

    // Initial setup
    if (isMobile) {
      setImagesPerRow(1);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isHidingMode, setIsHidingMode] = useState<boolean>(false);
  const [filesToHide, setFilesToHide] = useState<Set<string>>(new Set());
  const [includeHidden, setIncludeHidden] = useState<boolean>(false);
  const [deletedSnapshotUuids, setDeletedSnapshotUuids] = useState<Set<string>>(
    new Set(),
  );
  const [approvalSelectedUuids, setApprovalSelectedUuids] = useState<
    Set<string>
  >(new Set());
  const [tourSettings, setTourSettings] = useState<any | null>(null);
  const [tourDefaultSettings, setTourDefaultSettings] = useState<any | null>(
    null,
  );
  const [restoreDetailFieldHandler, setRestoreDetailFieldHandler] = useState<
    ((id: string) => void) | null
  >(null);
  const [restoreAllDetailFieldsHandler, setRestoreAllDetailFieldsHandler] =
    useState<(() => void) | null>(null);

  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Auto-detect panoramas for existing files
  usePanoramaDetection(
    filesData?.files,
    setFilesData,
    process.env.NEXT_PUBLIC_FILES_API_URL || process.env.NEXT_PUBLIC_API_URL,
  );

  // Helper function for partial updates
  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => {
      const hasChanges = Object.entries(updates).some(([key, value]) => {
        const prevValue = prev[key as keyof FormData];
        if (typeof value === "object" && value !== null) {
          return JSON.stringify(prevValue) !== JSON.stringify(value);
        }
        return prevValue !== value;
      });
      if (!hasChanges) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      files,
      setFiles,
      floorFiles,
      setFloorFiles,
      selectedFiles,
      setSelectedFiles,
      links,
      setLinks,
      brandedSelected,
      setBrandedSelected,
      unBrandedSelected,
      setUnBrandedSelected,
      previewFiles,
      setPreviewFiles,
      selectedVideoFiles,
      setSelectedVideoFiles,
      droppedMarkers,
      setDroppedMarkers,
      delay,
      setDelay,
      transition,
      setTransition,
      audioUrl,
      setAudioUrl,
      selectedAudioTrack,
      setSelectedAudioTrack,
      heroType,
      setHeroType,
      heroVideoUuid,
      setHeroVideoUuid,
      formData,
      setFormData,
      updateFormData,
      restoreDetailFieldHandler,
      setRestoreDetailFieldHandler,
      restoreAllDetailFieldsHandler,
      setRestoreAllDetailFieldsHandler,
      filesData,
      setFilesData,
      featureSheets,
      setFeatureSheets,
      changedFileUuids,
      setChangedFileUuids,
      selectionChangedUuids,
      setSelectionChangedUuids,
      area,
      setArea,
      fileManagerMode,
      setFileManagerMode,
      imagesPerRow,
      setImagesPerRow,
      isSaving,
      setIsSaving,
      isHidingMode,
      setIsHidingMode,
      filesToHide,
      setFilesToHide,
      includeHidden,
      setIncludeHidden,
      deletedSnapshotUuids,
      setDeletedSnapshotUuids,
      approvalSelectedUuids,
      setApprovalSelectedUuids,
      tourSettings,
      setTourSettings,
      tourDefaultSettings,
      setTourDefaultSettings,
      handleSave: async () => {},
    }),
    [
      files,
      floorFiles,
      selectedFiles,
      links,
      brandedSelected,
      unBrandedSelected,
      previewFiles,
      selectedVideoFiles,
      droppedMarkers,
      delay,
      transition,
      audioUrl,
      selectedAudioTrack,
      heroType,
      heroVideoUuid,
      formData,
      updateFormData,
      filesData,
      featureSheets,
      changedFileUuids,
      selectionChangedUuids,
      area,
      fileManagerMode,
      imagesPerRow,
      isSaving,
      isHidingMode,
      filesToHide,
      includeHidden,
      deletedSnapshotUuids,
      approvalSelectedUuids,
      tourSettings,
      tourDefaultSettings,
      restoreDetailFieldHandler,
      restoreAllDetailFieldsHandler,
      // handleSave is injected by FileManager, so it's not in the deps array here for the default context
    ],
  );

  return (
    <FileManagerContext.Provider value={contextValue}>
      {children}
    </FileManagerContext.Provider>
  );
};

export const useFileManagerContext = () => {
  const context = useContext(FileManagerContext);
  if (!context) {
    throw new Error(
      "useFileManagerContext must be used within a FileManagerProvider",
    );
  }
  return context;
};

export const useOptionalFileManagerContext = () => {
  return useContext(FileManagerContext);
};
