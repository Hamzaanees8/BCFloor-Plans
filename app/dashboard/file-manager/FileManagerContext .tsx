'use client';
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { SelectedFiles } from './components/HDRStill';
type PreviewFile = {
    file: File;
    upload: boolean;
}
type DroppedMarker = {
    x: number;
    y: number;
    file: File;
    floorImageUrl: string;
    name?: string;
    description?: string;
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

    brandedLink: string;
    setBrandedLink: (value: string) => void;

    unbrandedLink: string;
    setUnbrandedLink: (value: string) => void;

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
};

const FileManagerContext = createContext<FileManagerContextType | undefined>(undefined);

export const FileManagerProvider = ({ children }: { children: ReactNode }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<SelectedFiles[]>([]);
    const [selectedVideoFiles, setSelectedVideoFiles] = useState<SelectedFiles[]>([]);
    const [brandedLink, setBrandedLink] = useState('');
    const [unbrandedLink, setUnbrandedLink] = useState('');
    const [floorFiles, setFloorFiles] = useState<SelectedFiles[]>([]);
    const [brandedSelected, setBrandedSelected] = useState(false);
    const [unBrandedSelected, setUnBrandedSelected] = useState(false);
    const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
    const [droppedMarkers, setDroppedMarkers] = useState<DroppedMarker[]>([]);
    const [delay, setDelay] = useState<number>(4000);
    const [transition, setTransition] = useState<string>("fade-in");
    const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
    const [selectedAudioTrack, setSelectedAudioTrack] = useState<string | undefined>("none");

    // Feature Sheet Form Data State
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
            brandedLink, setBrandedLink,
            unbrandedLink, setUnbrandedLink,
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
