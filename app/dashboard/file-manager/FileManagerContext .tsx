'use client';
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { SelectedFiles } from './components/HDRStill';
type PreviewFile = {
    file: File;
    upload: boolean;
}

export type DroppedMarker = {
  x: number;
  y: number;
  file?: File;      
  file_path?: string; 
  floorImageUrl: string;
  name?: string;
  description?: string;
  isApi?: boolean;
};

export type Files = {

    id: number;
    uuid: string;
    tour_id: number;
    type: string;
    name: string;
    file_path: string;
    group: string | null;
    service_id: number | null;
    service?: { id: number; uuid: string, name: string };
    sort_order: number;
    created_at: string;
    updated_at: string;

}
export type SnapShots = {
    id: number;
    uuid: string;
    tour_id: number;
    type: string;
    file_name: string;
    file_path: string;
    name: string | null;
    description: string | null;
    x_axis: number;
    y_axis: string;

}
export type FilesData = {
    id: number
    uuid: string;
    order_id: number;
    files: Files[]
    links: {
        link: string;
        type: string
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
    type: "branded" | "unbranded";
    service_id: string;
    link: string;
};

type FormData = {
    background: string;
    border: string;
    avatar_url: string;
    AvatarfileName: string;
    Keyhighlights: string[];
    propertyNotesTitle: string;
    propertyNotesDescription: string;
    expandedDetail1: string;
    expandedDetail1Description: string;
    expandedDetail2: string;
    expandedDetail2Description: string;
    highlights: {
        title: string;
        icon: string;
        value: string;
    }[];
    imageUpload: string | null;
    imageUploadFileName: string;
    featuredImage1Preview: string | null;
    featuredImage1FileName: string;
    featuredImage2Preview: string | null;
    featuredImage2FileName: string;
    featuredImage3Preview: string | null;
    featuredImage3FileName: string;
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
};

const FileManagerContext = createContext<FileManagerContextType | undefined>(undefined);

export const FileManagerProvider = ({ children }: { children: ReactNode }) => {
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

    console.log('droppedMarkers', droppedMarkers);

    const [formData, setFormData] = useState<FormData>({
        background: "",
        border: "",
        avatar_url: "",
        AvatarfileName: "",
        Keyhighlights: Array(6).fill(""),
        propertyNotesTitle: "",
        propertyNotesDescription: "",
        expandedDetail1: "",
        expandedDetail1Description: "",
        expandedDetail2: "",
        expandedDetail2Description: "",
        highlights: [
            { title: "", icon: "eye", value: "" },
            { title: "", icon: "eye", value: "" },
            { title: "", icon: "eye", value: "" },
            { title: "", icon: "eye", value: "" },
        ],
        imageUpload: null,
        imageUploadFileName: "",
        featuredImage1Preview: null,
        featuredImage1FileName: "",
        featuredImage2Preview: null,
        featuredImage2FileName: "",
        featuredImage3Preview: null,
        featuredImage3FileName: "",
    });

    // Helper function for partial updates
    const updateFormData = (updates: Partial<FormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    return (
        <FileManagerContext.Provider value={{
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
            setFilesData
        }}>
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
