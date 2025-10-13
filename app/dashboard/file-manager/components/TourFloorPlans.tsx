"use client";
import React, { useRef, useState } from "react";
import { useFileManagerContext } from "../FileManagerContext ";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CameraIcon } from "@/components/Icons";
import { X } from "lucide-react";
import { toast } from "sonner";

type DroppedMarker = {
  x: number;
  y: number;
  file?: File;
  file_path?: string;
  floorImageUrl: string;
  name?: string;
  description?: string;
  isApi?: boolean;
};

function TourFloorPlans({ type = "" }) {
  const { floorFiles, selectedFiles, droppedMarkers, setDroppedMarkers, filesData } = useFileManagerContext();
  const currentTourFloorFiles = filesData?.files?.filter(file => file?.service?.name === '2D Floor Plans' || file?.service?.name === '3D Floor Plans');
  const currentTourPhotos = filesData?.files?.filter(file => file?.service?.name !== '2D Floor Plans' && file?.service?.name !== '3D Floor Plans');
  const [draggedFile, setDraggedFile] = useState<{ file?: File; file_path?: string } | null>(null);

  const [selectedImageId, setSelectedImageId] = useState<string | null>(() => {
    if (floorFiles?.length > 0) {
      return floorFiles[0].file.name;
    } else if ((currentTourFloorFiles?.length ?? 0) > 0) {
      return currentTourFloorFiles?.[0]?.name || null;
    }
    return null;
  });
  console.log('droppedMarkers', droppedMarkers);

  const [snapshotFile, setSnapshotFile] = useState<File | null>(null);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotDescription, setSnapshotDescription] = useState("");
  const [activeMarkerIndex, setActiveMarkerIndex] = useState<number | null>(
    null
  );
  const [tempMarkerPos, setTempMarkerPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [previewMarker, setPreviewMarker] = useState<DroppedMarker | null>(
    null
  );

  const imageContainerRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  const checkedImages = selectedFiles.filter((files) => {
    return files.upload === true;
  });



  const normalizeName = (filename: string) => {
    if (!filename) return "";
    return filename.replace(/\.[^/.]+$/, ""); // strip extension
  };

  const localSnapshots = droppedMarkers.filter(
    (marker) => normalizeName(marker.floorImageUrl) === normalizeName(selectedImageId || "")
  );


  const apiSnapshots = (filesData?.snapshots || []).filter((snap) =>
    normalizeName(snap.file_name) === normalizeName(selectedImageId || "")
  );



  const imgRef = useRef<HTMLImageElement | null>(null);


  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedFile || !imgRef.current || !selectedImageId) return;

    const img = imgRef.current;
    const imgRect = img.getBoundingClientRect();

    const relX = e.clientX - imgRect.left;
    const relY = e.clientY - imgRect.top;

    const xPercent = (relX / imgRect.width) * 100;
    const yPercent = (relY / imgRect.height) * 100;

    const newMarker: DroppedMarker = {
      x: xPercent,
      y: yPercent,
      floorImageUrl: selectedImageId,
      name: '',
      description: '',
    };

    if (draggedFile.file) {
      newMarker.file = draggedFile.file;
    } else if (draggedFile.file_path) {
      newMarker.file_path = draggedFile.file_path;
      newMarker.isApi = true;
    }

    setDroppedMarkers(prev => {
      const newArr = [...prev, newMarker];
      const newIndex = newArr.length - 1;
      setActiveMarkerIndex(newIndex);

      setSnapshotFile(draggedFile.file || null);
      setSnapshotName('');
      setSnapshotDescription('');
      setTempMarkerPos({ x: xPercent, y: yPercent });

      return newArr;
    });

    setDraggedFile(null);
  };





  const handleAddSnapshot = () => {
    if (!selectedImageId || !tempMarkerPos) return;

    const newMarker: DroppedMarker = {
      x: tempMarkerPos.x,
      y: tempMarkerPos.y,
      floorImageUrl: selectedImageId,
      name: snapshotName,
      description: snapshotDescription,
    };

    if (snapshotFile) {
      newMarker.file = snapshotFile;
    } else if (previewMarker?.file_path) {
      newMarker.file_path = previewMarker.file_path;
      newMarker.isApi = true;
    } else if (previewMarker?.file) {
      newMarker.file = previewMarker.file;
    }

    setDroppedMarkers(prev => {
      if (activeMarkerIndex !== null && prev[activeMarkerIndex]) {
        const updated = [...prev];
        updated[activeMarkerIndex] = {
          ...updated[activeMarkerIndex],
          ...newMarker,
        };
        return updated;
      } else {
        return [...prev, newMarker];
      }
    });

    setPreviewMarker(prev => prev ? { ...prev, ...newMarker } : prev);
    // setSnapshotName('')
    // setSnapshotDescription('')
    toast.success('Snapshot saved successfully');
  };



  const handleDeleteSnapshot = () => {
    if (activeMarkerIndex === null) {
      toast.error("No snapshot selected to delete");
      return;
    }

    setDroppedMarkers(prev => {
      const newMarkers = prev.filter((_, i) => i !== activeMarkerIndex);
      return newMarkers;
    });

    setActiveMarkerIndex(null);
    setSnapshotFile(null);
    setSnapshotName('');
    setSnapshotDescription('');
    setTempMarkerPos(null);
    setPreviewMarker(null);

    toast.success('Snapshot deleted successfully');
  };


  const selectedFile = floorFiles?.find((f) => f.file.name === selectedImageId);

  const selectedApiFile = currentTourFloorFiles?.find(
    (f) => f.name === selectedImageId
  );



  return (
    <div className={`w-full h-auto font-alexandria bg-gray-100 py-6  ${type !== "confirm" ? "pl-6" : "pl-0 mt-[75px] pt-0"}`}>
      <div className={`w-full h-[550px] flex gap-[30px] ${type === "confirm" ? "bg-white" : ""} `}>
        <div
          ref={imageContainerRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`relative w-[70%]  h-full bg-white overflow-hidden ${type === "confirm" ? "m-auto" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={
              selectedFile
                ? URL.createObjectURL(selectedFile.file)
                : selectedApiFile
                  ? `${API_URL}/${selectedApiFile.file_path}`
                  : ""
            }
            alt="Selected Floor"
            className="object-contain max-h-full max-w-full w-full h-full"
          />
          {[...localSnapshots, ...apiSnapshots].map((marker, idx) => {
            const isApiSnapshot = 'x_axis' in marker;
            const posX = isApiSnapshot ? marker.x_axis : marker.x;
            const posY = isApiSnapshot ? marker.y_axis : marker.y;

            return (
              <div
                key={idx}
                className="absolute cursor-pointer"
                style={{
                  top: `${posY}%`,
                  left: `${posX}%`,
                  transform: "translate(-50%, -100%)",
                }}
                onClick={() => {
                  if (isApiSnapshot) {
                    setPreviewMarker({
                      x: Number(marker.x_axis),
                      y: Number(marker.y_axis),
                      file_path: marker.file_path,
                      floorImageUrl: marker.file_name,
                      name: marker.name ?? "",
                      description: marker.description ?? "",
                      isApi: true,
                    });

                    setSnapshotFile(null);
                    setSnapshotName(marker.name ?? "");
                    setSnapshotDescription(marker.description ?? "");
                    setTempMarkerPos({ x: Number(marker.x_axis), y: Number(marker.y_axis) });
                    setActiveMarkerIndex(null);
                  } else {
                    const originalIndex = droppedMarkers.findIndex((m) => m === marker);
                    setActiveMarkerIndex(originalIndex);
                    setSnapshotFile(marker.file ?? null);
                    setSnapshotName(marker.name ?? "");
                    setSnapshotDescription(marker.description ?? "");
                    setTempMarkerPos({ x: marker.x, y: marker.y });
                    setPreviewMarker(marker);
                  }
                }}


              >
                <CameraIcon width={20} height={20} />
              </div>
            );
          })}

          {previewMarker && type === "confirm" && (
            <div className="bg-[#565656] text-white font-alexandria shadow-lg max-w-sm w-full h-[400px] absolute top-0 bottom-0 flex flex-col">
              <button
                onClick={() => setPreviewMarker(null)}
                className="absolute top-4 right-4 text-black text-[20px] bg-white rounded-full z-10 p-[2px]"
              >
                <X className="w-[20px] h-[20px]" />
              </button>

              {previewMarker && (

                //eslint-disable-next-line @next/next/no-img-element 
                <img
                  src={
                    previewMarker.file
                      ? URL.createObjectURL(previewMarker.file)
                      : previewMarker.file_path
                        ? `${API_URL}/${previewMarker.file_path}`
                        : ""
                  }
                  alt={previewMarker.name || "Snapshot"}
                  className="w-[95%] h-[70%] object-cover mx-auto mt-[10px]"
                />
              )}

              <div className="p-4 overflow-y-auto">
                <p className="text-[20px] font-[500] uppercase pb-2">
                  {previewMarker?.name}
                </p>
                <p className="line-clamp-2">{previewMarker?.description}</p>
              </div>
            </div>

          )}
        </div>


        {type !== "confirm" && (
          <div className="w-[30%] p-4 text-[#666666] border border-gray-400 rounded-[6px]">
            <p className="mb-[20px] text-[24px]">SnapShot</p>
            <div className="flex items-end gap-5">
              <div className="h-[150px] w-[200px] bg-gray-200">

                {snapshotFile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={URL.createObjectURL(snapshotFile)} alt="Snapshot Preview" />
                ) : (previewMarker?.isApi || previewMarker?.isApi) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${API_URL}/${previewMarker.file_path}`} alt="Snapshot Preview" />
                ) : null}


              </div>
              {/* <Button className="bg-[#4290E9] hover:bg-[#4898f3]">
                Change Photo
              </Button> */}
            </div>
            <div className="mt-[20px]">
              <Label>Name</Label>
              <div className="relative w-full ">
                <Input
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  type="text"
                  placeholder=""
                  className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                />
              </div>
            </div>
            <div className="mt-[20px]">
              <Label>Description</Label>
              <div className="relative w-full ">
                <Textarea
                  value={snapshotDescription}
                  onChange={(e) => setSnapshotDescription(e.target.value)}
                  placeholder=""
                  className="h-[100px] resize-none bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-5 mt-5">
              <Button
                onClick={handleAddSnapshot}
                className="bg-[#4290E9] hover:bg-[#4898f3]"
              >
                {activeMarkerIndex !== null ? "Update" : "Add"}
              </Button>
              <Button
                onClick={handleDeleteSnapshot}
                className="bg-[#E06D5E] hover:bg-[#f0796a]"
              >
                Delete Snapshot
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="w-full h-[200px]">
        <div className="w-[70%] h-full flex items-center gap-[20px] overflow-x-auto overflow-y-hidden">

          {currentTourFloorFiles?.map((file, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImageId(file.name)}
              className={`w-[200px] h-[100px] flex items-center rounded-[6px] justify-center cursor-pointer ${selectedImageId === file.name ? "border-2 border-[#4290E9]" : ""}`}
            >
              <div className="relative border border-gray-200 rounded-[6px] w-full h-full flex items-center justify-center">

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${API_URL}/${file.file_path}`} alt="preview" className="max-w-full max-h-full" />
              </div>
            </div>
          ))}

          {floorFiles?.map((file, idx) => {
            return (
              <div
                key={idx}
                onClick={() => setSelectedImageId(file.file.name)}
                className={`w-[200px] h-[100px] flex items-center rounded-[6px] justify-center cursor-pointer ${selectedImageId === file.file.name ? "border-2 border-[#4290E9]" : ""}`}
              >
                <div className="relative border border-gray-200 rounded-[6px] w-full h-full flex items-center justify-center">
                  {/* eslint-disable @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file.file)}
                    alt="preview"
                    className="max-w-full max-h-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {type !== "confirm" && (
        <div>
          <p className="text-[#666666] text-[24px] px-3">Photos</p>
          {checkedImages?.length > 0 && (
            <div className="mt-4 w-full grid grid-cols-6 gap-2 p-3">
              {checkedImages?.map((file, idx) => (
                <div key={idx} className="bg-[#BBBBBB] h-auto relative">
                  <div className="relative w-full h-[160px]">
                    {/* eslint-disable @next/next/no-img-element */}
                    <img
                      draggable
                      onDragStart={() => setDraggedFile({ file: file.file })}
                      src={URL.createObjectURL(file.file)}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}

            </div>
          )}

          {(currentTourPhotos || [])?.length > 0 && (
            <div className="mt-4 w-full grid grid-cols-6 gap-2 p-3">
              {currentTourPhotos?.map((file, idx) => (
                <div key={idx} className="bg-[#BBBBBB] h-auto relative">
                  <div className="relative w-full h-[160px]">
                    {/* eslint-disable @next/next/no-img-element */}
                    <img
                      draggable
                      onDragStart={() => setDraggedFile({ file_path: file.file_path })}
                      src={`${API_URL}/${file.file_path}`}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default TourFloorPlans;
