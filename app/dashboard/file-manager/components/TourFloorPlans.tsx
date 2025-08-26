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
  file: File;
  floorImageUrl: string;
  name?: string;
  description?: string;
};

function TourFloorPlans({ type = "" }) {
  const { floorFiles, selectedFiles, droppedMarkers, setDroppedMarkers } =
    useFileManagerContext();
  // const [droppedMarkers, setDroppedMarkers] = useState<DroppedMarker[]>([]);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [selectedImageId, setSelectedImageId] = useState(
    floorFiles?.[0]?.file.name ?? null
  );
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

  const checkedImages = selectedFiles.filter((files) => {
    return files.upload === true;
  });

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {

    e.preventDefault();
    if (!draggedFile || !imageContainerRef.current || !selectedImageId) return;

    const container = imageContainerRef.current;
    const img = container.querySelector('img');
    if (!img) return;

    const imgRect = img.getBoundingClientRect();
    const offsetX = e.clientX - imgRect.left;
    const offsetY = e.clientY - imgRect.top;

    const width = imgRect.width;
    const height = imgRect.height;
    const xPercent = (offsetX / width) * 100;
    const yPercent = (offsetY / height) * 100;

    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) return;

    setDroppedMarkers(prev => {
      const newArr = [...prev, {
        x: xPercent,
        y: yPercent,
        file: draggedFile,
        floorImageUrl: selectedImageId,
      }];

      const newIndex = newArr.length - 1;
      newArr[newIndex] = {
        ...newArr[newIndex],
        name: '',
        description: ''
      };

      setActiveMarkerIndex(newIndex);
      setSnapshotFile(draggedFile);
      setSnapshotName('');
      setSnapshotDescription('');
      setTempMarkerPos({ x: xPercent, y: yPercent });

      return newArr;
    });

    setDraggedFile(null);
  };


  const handleAddSnapshot = () => {
    if (!snapshotFile || !selectedImageId || !tempMarkerPos) return;

    const newMarker: DroppedMarker = {
      x: tempMarkerPos.x,
      y: tempMarkerPos.y,
      file: snapshotFile,
      floorImageUrl: selectedImageId,
      name: snapshotName,
      description: snapshotDescription,
    };

    setDroppedMarkers(prev => {
      if (activeMarkerIndex !== null && prev[activeMarkerIndex]) {

        const updated = [...prev];
        updated[activeMarkerIndex] = newMarker;
        return updated;
      } else {
        return [...prev, newMarker];
      }
    });

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

  return (
    <div className={`w-full h-auto font-alexandria bg-gray-100 py-6  ${type !== "confirm" ? "pl-6" : "pl-0 mt-[75px] pt-0"}`}>
      <div className="w-full h-[550px] flex gap-[30px]">
        <div
          ref={imageContainerRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`relative ${type !== "confirm" ? "w-[70%]" : "w-full"} h-full flex items-center justify-center bg-white overflow-hidden`}
        >
          <div className={`relative ${type !== "confirm" ? "w-full" : "w-[70%]"} h-full flex items-center justify-center`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedFile ? URL.createObjectURL(selectedFile.file) : ""}
              alt="Selected Floor"
              className="object-contain max-h-full max-w-full"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />

            {droppedMarkers
              .filter((marker) => marker.floorImageUrl === selectedImageId)
              .map((marker, idx) => (
                <div
                  className="cursor-pointer"
                  key={idx}
                  style={{
                    top: `${marker.y}%`,
                    left: `${marker.x}%`,
                    position: "absolute",
                    transform: "translate(-50%, -100%)",
                  }}
                  onClick={() => {
                    const originalIndex = droppedMarkers.findIndex(
                      (m) => m === marker
                    );
                    setActiveMarkerIndex(originalIndex);
                    setSnapshotFile(marker.file);
                    setSnapshotName(marker.name ?? "");
                    setSnapshotDescription(marker.description ?? "");
                    setTempMarkerPos({ x: marker.x, y: marker.y });
                    setPreviewMarker(marker);
                  }}
                >
                   {type !== "confirm" ? (
                    <CameraIcon width={20} height={20} />
                    ) : (
                    <CameraIcon width={30} height={30} />
                    )}
                </div>
              ))}

            {previewMarker && type === "confirm" && (
              <div className="bg-[#565656] text-white font-alexandria shadow-lg max-w-sm w-full h-[400px] absolute top-0 bottom-0 flex flex-col">
                <button
                  onClick={() => setPreviewMarker(null)}
                  className="absolute top-4 right-4 text-black text-[20px] bg-white rounded-full z-10 p-[2px]"
                >
                  <X className="w-[20px] h-[20px]"/>
                </button>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(previewMarker.file)}
                  alt={previewMarker.name || "Snapshot"}
                  className="w-[95%] h-[70%] object-cover mx-auto mt-[10px]"
                />

                <div className="p-4  overflow-y-auto">
                  <p className="text-[20px] font-[500] uppercase pb-2">
                    {previewMarker.name}
                  </p>
                  <p className="line-clamp-2">{previewMarker.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {type !== "confirm" && (
          <div className="w-[30%] p-4 text-[#666666] border border-gray-400 rounded-[6px]">
            <p className="mb-[20px] text-[24px]">SnapShot</p>
            <div className="flex items-end gap-5">
              <div className="h-[150px] w-[200px] bg-gray-200">
                {snapshotFile && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={URL.createObjectURL(snapshotFile)}
                    alt="Snapshot Preview"
                    className="w-full h-full object-cover"
                  />
                )}
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
          {floorFiles?.map((file, idx) => {
            return (
              <div
                key={idx}
                onClick={() => setSelectedImageId(file.file.name)}
                className="w-[200px] h-[100px] flex items-center justify-center cursor-pointer"
              >
                <div className="relative border border-gray-200 w-full h-full flex items-center justify-center">
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
                      onDragStart={() => setDraggedFile(file.file)}
                      src={URL.createObjectURL(file.file)}
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
