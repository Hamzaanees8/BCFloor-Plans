"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import React, { useState } from "react";
import { useFileManagerContext } from "../FileManagerContext ";
import { Check, X } from "lucide-react";
import { DownloadIcon } from "@/components/Icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import CustomSlideshow from "./CustomPreview";
import { Label } from "@/components/ui/label";

function TourPicture() {
  const {
    selectedFiles,
    setSelectedFiles,
    delay,
    setDelay,
    transition,
    setTransition,
    audioUrl,
    setAudioUrl,
    selectedAudioTrack,
    setSelectedAudioTrack,
  } = useFileManagerContext();
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  //   const [selectedEffect, setSelectedEffect] = useState("fade-in");
  //   const [selectedDelay, setSelectedDelay] = useState(4000);
  //   const [selectedAudioTrack, setSelectedAudioTrack] = useState("none");
  //   const [audioURL, setAudioURL] = useState<string | null>(null);

  //   const handleAudioTrackChange = async (track: string) => {
  //     setSelectedAudioTrack(track);

  //     if (track === "none") {
  //       setAudioURL(null);
  //       return;
  //     }

  //     try {
  //       const response = await fetch(`/audio/${track}.mp3`);
  //       const blob = await response.blob();
  //       const blobUrl = URL.createObjectURL(blob);
  //       setAudioURL(blobUrl);
  //     } catch (error) {
  //       console.error("Error loading audio track:", error);
  //       setAudioURL(null);
  //     }
  //   };
  const handleAudioTrackChange = async (track: string) => {
    setSelectedAudioTrack(track); // ✅ This line fixes the select value not updating

    if (track === "none") {
      setAudioUrl(undefined);
      return;
    }

    try {
      const response = await fetch(`/audio/${track}.mp3`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setAudioUrl(blobUrl);
    } catch (error) {
      console.error("Error loading audio track:", error);
      setAudioUrl(undefined);
    }
  };

  // React.useEffect(() => {
  //     const generateSlideshow = async () => {
  //         if (!selectedFiles || selectedFiles.length === 0) return;

  //         const canvas = document.createElement("canvas");
  //         const ctx = canvas.getContext("2d");
  //         canvas.width = 640;
  //         canvas.height = 480;

  //         const stream = canvas.captureStream();
  //         const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  //         const chunks: Blob[] = [];

  //         recorder.ondataavailable = (e) => chunks.push(e.data);
  //         recorder.onstop = () => {
  //             const blob = new Blob(chunks, { type: "video/webm" });
  //             const url = URL.createObjectURL(blob);
  //             setVideoURL(url);
  //         };

  //         recorder.start();

  //         for (const file of selectedFiles) {
  //             const img = new Image();
  //             img.src = URL.createObjectURL(file.file);
  //             await new Promise((resolve) => {
  //                 img.onload = () => {
  //                     ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
  //                     setTimeout(resolve, 1000); // 1 sec per image
  //                 };
  //                 img.onerror = resolve;
  //             });
  //         }

  //         recorder.stop();
  //     };

  //     generateSlideshow();
  // }, [selectedFiles]);

  const checkedImages = selectedFiles.filter((files) => {
    return files.upload === true;
  });

  return (
    <div>
      <Accordion
        type="multiple"
        defaultValue={["item-1", "item-2", "item-3"]}
        className="w-full"
      >
        <AccordionItem value="item-1">
          <AccordionTrigger className="px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current">
            Arrange Photos (26)
          </AccordionTrigger>
          <AccordionContent>
            <div>
              {selectedFiles?.length > 0 && (
                <div className="mt-4 w-full grid grid-cols-4 gap-2 bg-[#BBBBBB] p-3">
                  {selectedFiles?.map((file, idx) => (
                    <div key={idx} className="bg-[#BBBBBB] h-auto relative">
                      <div className="relative w-full h-[240px]">
                        {/* eslint-disable @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(file.file)}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]`}
                          style={{
                            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                            backgroundColor: `${
                              file.upload ? "#6BAE41" : "#E06D5E"
                            }`,
                          }}
                          onClick={() => {
                            setSelectedFiles((prev) =>
                              prev.flatMap((f) => {
                                if (
                                  f.file === file.file &&
                                  f.service_id === file.service_id
                                ) {
                                  return f.upload
                                    ? [{ ...f, upload: false }]
                                    : [];
                                }
                                return [f];
                              })
                            );
                          }}
                        >
                          {file.upload ? (
                            <Check color="#fff" size={14} />
                          ) : (
                            <X color="#fff" size={14} />
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 bg-[#BBBBBB] text-[9px]">
                        <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">
                          {file.file.name}
                        </p>
                        <div className="col-span-2 flex items-center justify-between">
                          <p className="text-[#8E8E8E] mt-1">
                            Exterior ({idx + 1} of {selectedFiles.length})
                          </p>
                          <span className="flex w-[24px] h-[24px] cursor-pointer">
                            <DownloadIcon
                              width="24px"
                              height="24px"
                              fill="#6BAE41"
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current">
            Slideshow Video Settings
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <div className="w-full flex flex-col items-center">
              <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                <div className="grid grid-cols-2 gap-[16px]">
                  <div className="col-span-2">
                    <label className="text-sm text-gray-700">
                      Select Background Audio
                    </label>
                    <Select
                      value={selectedAudioTrack}
                      onValueChange={handleAudioTrackChange}
                    >
                      <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                        <SelectValue placeholder="Select Audio Track" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Audio</SelectItem>
                        <SelectItem value="tell-me-what">
                          Tell-me-what
                        </SelectItem>
                        <SelectItem value="embrace">Embrace</SelectItem>
                        <SelectItem value="sandbreaker">Sandbreaker</SelectItem>
                        <SelectItem value="showreel">Showreel</SelectItem>
                        {/* <SelectItem value="breaking-sweat">Breaking Sweat</SelectItem>
                                                <SelectItem value="chaos-at-the-spaceship">Chaos At The Spaceship</SelectItem>
                                                <SelectItem value="daboom-jiggle">Daboom Jiggle</SelectItem>
                                                <SelectItem value="dream-again">Dream Again</SelectItem>
                                                <SelectItem value="encourage">Encourage</SelectItem>
                                                <SelectItem value="endless-desert">Endless Desert</SelectItem>
                                                <SelectItem value="fragments-of-sunlight">Fragments Of Sunlight</SelectItem>
                                                <SelectItem value="gliding-hearts">Gliding Hearts</SelectItem>
                                                <SelectItem value="gold-rush">Gold Rush</SelectItem>
                                                <SelectItem value="good-feeling">Good Feeling</SelectItem>
                                                <SelectItem value="hot-chocolate">Hot Chocolate</SelectItem>
                                                <SelectItem value="i-want-you-to-stay">I Want You To Stay</SelectItem>
                                                <SelectItem value="illusion-of-perfection">Illusion Of Perfection</SelectItem>
                                                <SelectItem value="its-going-down">Its Going Down</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-[16px]">
                  <div className="col-span-2">
                    <label htmlFor="">Transitions</label>
                    <Select value={transition} onValueChange={setTransition}>
                      <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                        <SelectValue placeholder="Select Animation Effect" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fade-in">Fade In</SelectItem>
                        <SelectItem value="slide-right-left">
                          Slide Right to Left
                        </SelectItem>
                        <SelectItem value="slide-left-right">
                          Slide Left to Right
                        </SelectItem>
                        <SelectItem value="slide-top-bottom">
                          Slide Top to Bottom
                        </SelectItem>
                        <SelectItem value="slide-bottom-top">
                          Slide Bottom to Top
                        </SelectItem>
                        <SelectItem value="reveal-left-right">
                          Reveal Left to Right
                        </SelectItem>
                        <SelectItem value="rotate-bottom-left">
                          Rotate Bottom Left
                        </SelectItem>
                        <SelectItem value="rotate-bottom-right">
                          Rotate Bottom Right
                        </SelectItem>
                        <SelectItem value="rotate-left-bottom">
                          Rotate Left Bottom
                        </SelectItem>
                        <SelectItem value="rotate-left-top">
                          Rotate Left Top
                        </SelectItem>
                        <SelectItem value="kenburns">Ken Burns</SelectItem>
                        {/* <SelectItem value="fade-move-left">Fade Move Left</SelectItem>
                                                <SelectItem value="fade-move-right">Fade Move Right</SelectItem>
                                                <SelectItem value="fade-across-right">Fade Across Right</SelectItem>
                                                <SelectItem value="fade-across-left">Fade Across Left</SelectItem>*/}
                        {/* <SelectItem value="zoom-fast">Zoom Fast</SelectItem>
                                                <SelectItem value="zoom-slow">Zoom Slow</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-[16px]">
                  <div className="col-span-2">
                    <label htmlFor="">Slide Delay</label>
                    <Select
                      value={String(delay)}
                      onValueChange={(val) => setDelay(Number(val))}
                    >
                      <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                        <SelectValue placeholder="Select Slide Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3000">3 Seconds</SelectItem>
                        <SelectItem value="4000">4 Seconds</SelectItem>
                        <SelectItem value="5000">5 Seconds</SelectItem>
                        <SelectItem value="10000">10 Seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="col-span-2 flex items-center gap-[16px]">
                  <Switch
                    checked={autoPlay}
                    onCheckedChange={setAutoPlay}
                    className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#4CAF50] "
                  />
                  <Label className="text-[14px] text-[#424242]">
                    Auto Play Audio
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-[16px]">
                  <div className="col-span-2">
                    <label htmlFor="">Video Overlay</label>
                    <Select>
                      <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                        <SelectValue placeholder="Select Slide Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Realtor Branding">
                          Realtor Branding
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current">
            Slideshow Video Preview
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 space-y-4 h-[700px]">
              {/* <CustomSlideshow
                images={checkedImages}
                delay={selectedDelay}
                transition={selectedEffect}
                audioUrl={audioURL ?? undefined}
              /> */}
              <CustomSlideshow
                images={checkedImages}
                delay={delay}
                transition={transition}
                audioUrl={audioUrl}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default TourPicture;
