'use client';
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useCallback, useMemo, useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
export type SelectedFiles = {
    file: File;
    type: string;
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
};
import { FeatureSheetResponse } from './types/featureSheetTypes';
import { Area } from './file-manager';
type PreviewFile = {
    file: File;
    upload: boolean;
}

export type DroppedMarker = {
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
};

export type Files = {

    id: number;
    uuid: string;
    tour_id: number;
    type: string;
    name: string;
    file_path: string;
    url?: string;
    thumbnail_url?: string;
    group: string | null;
    service_id: number | null;
    service?: { id: number; uuid: string, name: string };
    sort_order: number;
    created_at: string;
    updated_at: string;
    is_featured?: boolean;
    is_admin_approved?: boolean;
    is_agent_approved?: boolean;
    is_show?: boolean;
    is_processing?: boolean;
    is_deleted?: boolean;
    is_paid?: boolean;
    is_complimentary?: boolean;
    variant_urls?: {
        thumb: string;
        slider: string;
        landing: string;
        popup: string;
    };

}
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

}
export type FilesData = {
    id: number
    uuid: string;
    order_id: number;
    files: Files[]
    links: {
        uuid?: string;
        link: string;
        type: string
        expiry_date?: string;
        service_id?: number | string;
        service?: { id: number; uuid: string };
    }[]
    snapshots: SnapShots[]
    slide_show: {
        slide_delay: string;
        transitions: string;
        background_audio: string;
        auto_play: string;
        video_overlay: string;
    }

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

    // Content Fields
    title: string;
    subtitle: string;
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    propertyName: string;
    description: string;
    amount: string;
    mlsNumber: string;
    siteInfluences: string;
    grossTaxes: string;
    featuresIncluded: string;
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

    // Featured Images (Legacy)
    featuredImage1Preview: string | null;
    featuredImage1FileName: string;
    featuredImage2Preview: string | null;
    featuredImage2FileName: string;
    featuredImage3Preview: string | null;
    featuredImage3FileName: string;
    fieldStyles?: { [key: string]: any };
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

    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>;
    updateFormData: (updates: Partial<FormData>) => void;

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

    fileManagerMode: 'upload' | 'reorder';
    setFileManagerMode: Dispatch<SetStateAction<'upload' | 'reorder'>>;

    imagesPerRow: number;
    setImagesPerRow: Dispatch<SetStateAction<number>>;

    isSaving: boolean;
    setIsSaving: Dispatch<SetStateAction<boolean>>;
};

const FileManagerContext = createContext<FileManagerContextType | undefined>(undefined);

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
    amount: "",
    mlsNumber: "",
    siteInfluences: "",
    grossTaxes: "",
    featuresIncluded: "",
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
        image1: null, image2: null, image3: null, image4: null, image5: null,
        image6: null, image7: null, image8: null, image9: null, image10: null,
        image11: null, image12: null, image13: null, image14: null, image15: null,
        image16: null, image17: null, image18: null
    },
    imageScales: {
        image1: 1, image2: 1, image3: 1, image4: 1, image5: 1,
        image6: 1, image7: 1, image8: 1, image9: 1, image10: 1,
        image11: 1, image12: 1, image13: 1, image14: 1, image15: 1,
        image16: 1, image17: 1, image18: 1
    },
    imagePositions: {
        image1: { x: 0, y: 0 }, image2: { x: 0, y: 0 }, image3: { x: 0, y: 0 },
        image4: { x: 0, y: 0 }, image5: { x: 0, y: 0 }, image6: { x: 0, y: 0 },
        image7: { x: 0, y: 0 }, image8: { x: 0, y: 0 }, image9: { x: 0, y: 0 },
        image10: { x: 0, y: 0 }, image11: { x: 0, y: 0 }, image12: { x: 0, y: 0 },
        image13: { x: 0, y: 0 }, image14: { x: 0, y: 0 }, image15: { x: 0, y: 0 },
        image16: { x: 0, y: 0 }, image17: { x: 0, y: 0 }, image18: { x: 0, y: 0 }
    },

    // Featured Images (Legacy)
    featuredImage1Preview: null,
    featuredImage1FileName: "",
    featuredImage2Preview: null,
    featuredImage2FileName: "",
    featuredImage3Preview: null,
    featuredImage3FileName: "",
    fieldStyles: {},
};

export const FileManagerProvider = ({ children }: { children: ReactNode }) => {
    const { setOpen } = useSidebar();

    useEffect(() => {
        setOpen(false);
    }, [setOpen]);

    const [files, setFiles] = useState<File[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<SelectedFiles[]>([]);
    const [selectedVideoFiles, setSelectedVideoFiles] = useState<SelectedFiles[]>([]);
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [floorFiles, setFloorFiles] = useState<SelectedFiles[]>([]);
    const [brandedSelected, setBrandedSelected] = useState(false);
    const [unBrandedSelected, setUnBrandedSelected] = useState(false);
    const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
    const [droppedMarkers, setDroppedMarkers] = useState<DroppedMarker[]>([]);
    const [delay, setDelay] = useState<number>(4000);
    const [transition, setTransition] = useState<string>("fade-in");
    const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
    const [selectedAudioTrack, setSelectedAudioTrack] = useState<string | undefined>("none");
    const [filesData, setFilesData] = useState<FilesData | null>(null);
    const [featureSheets, setFeatureSheets] = useState<FeatureSheetResponse[]>([]);
    const [changedFileUuids, setChangedFileUuids] = useState<Set<string>>(new Set());
    const [selectionChangedUuids, setSelectionChangedUuids] = useState<Set<string>>(new Set());
    const [area, setArea] = useState<Area[]>([]);
    const [fileManagerMode, setFileManagerMode] = useState<'upload' | 'reorder'>('upload');
    const [imagesPerRow, setImagesPerRow] = useState<number>(4);
    const [isSaving, setIsSaving] = useState<boolean>(false);


    const [formData, setFormData] = useState<FormData>(initialFormData);


    // Helper function for partial updates
    const updateFormData = useCallback((updates: Partial<FormData>) => {
        setFormData(prev => {
            const hasChanges = Object.entries(updates).some(([key, value]) => {
                const prevValue = prev[key as keyof FormData];
                if (typeof value === 'object' && value !== null) {
                    return JSON.stringify(prevValue) !== JSON.stringify(value);
                }
                return prevValue !== value;
            });
            if (!hasChanges) return prev;
            return { ...prev, ...updates };
        });
    }, []);

    const contextValue = useMemo(() => ({
        files, setFiles,
        floorFiles, setFloorFiles,
        selectedFiles, setSelectedFiles,
        links, setLinks,
        brandedSelected, setBrandedSelected,
        unBrandedSelected, setUnBrandedSelected,
        previewFiles, setPreviewFiles,
        selectedVideoFiles, setSelectedVideoFiles,
        droppedMarkers, setDroppedMarkers,
        delay,
        setDelay,
        transition,
        setTransition,
        audioUrl,
        setAudioUrl,
        selectedAudioTrack,
        setSelectedAudioTrack,
        formData,
        setFormData,
        updateFormData,
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
        setIsSaving
    }), [
        files, floorFiles, selectedFiles, links, brandedSelected, unBrandedSelected,
        previewFiles, selectedVideoFiles, droppedMarkers, delay, transition,
        audioUrl, selectedAudioTrack, formData, updateFormData, filesData,
        featureSheets, changedFileUuids, selectionChangedUuids, area, fileManagerMode, imagesPerRow,
        isSaving
    ]);

    return (
        <FileManagerContext.Provider value={contextValue}>
            {children}
        </FileManagerContext.Provider>
    );
};

export const useFileManagerContext = () => {
    const context = useContext(FileManagerContext);
    if (!context) {
        throw new Error('useFileManagerContext must be used within a FileManagerProvider');
    }
    return context;
};
