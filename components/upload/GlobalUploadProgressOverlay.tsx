"use client";

import React from "react";
import { useGlobalFileUpload } from "@/context/GlobalFileUploadContext";
import { UploadProgressOverlay } from "@/app/dashboard/file-manager/components/UploadProgressOverlay";

export function GlobalUploadProgressOverlay() {
    const { uploadStates, overallProgress, isUploading, closeProgress } =
        useGlobalFileUpload();

    if (!isUploading && uploadStates.length === 0) return null;

    return (
        <UploadProgressOverlay
            uploadStates={uploadStates}
            overallProgress={overallProgress}
            isUploading={isUploading}
            onClose={closeProgress}
        />
    );
}
