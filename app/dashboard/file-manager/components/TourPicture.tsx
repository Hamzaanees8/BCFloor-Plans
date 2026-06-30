"use client";
import CopyableFileName from './CopyableFileName';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import React, { useState, useCallback, useEffect } from "react";
import { useFileManagerContext } from "../FileManagerContext";
import { Check, X, GripVertical, ArrowLeftRight } from "lucide-react";
import { PanoramaBadge } from "./PanoramaBadge";
import { isPanoramaFile } from "../utils/panoramaUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import CustomSlideshow from "./CustomPreview";
import { useGlobalFileUpload } from "@/context/GlobalFileUploadContext";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Order } from "../../orders/page";
import { useAppContext } from "@/app/context/AppContext";
import { OptimizedImagePreview, PdfPlaceholder } from "./OptimizedPreview";
import { GetAgentAudios, AgentAudio } from "../../agents/agent-audio";
import { SortableGrid } from "./dual-mode/SortableGrid";
import { GridSizeToggle } from "./dual-mode/GridSizeToggle";
import { FileItem } from "./dual-mode/types";
import { getGlobalPhotoOrder, computeGlobalReorderUpdates } from "../utils/sortOrderUtils";
import { Files } from "../FileManagerContext";
import { Button } from "@/components/ui/button";

function TourPicture({ orderData }: { orderData: Order | null }) {
  const { userType } = useAppContext();
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
    filesData,
    setFilesData,
    links,
    isSaving,
    setIsSaving,
    imagesPerRow,
    deletedSnapshotUuids,
    tourSettings,
    tourDefaultSettings,
  } = useFileManagerContext();

  const { startUpload } = useGlobalFileUpload();

  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [branding, setBranding] = useState<string>("none");
  const [agentAudios, setAgentAudios] = useState<AgentAudio[]>([]);
  const [loadingAudios, setLoadingAudios] = useState<boolean>(false);
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);

  // FileItem list for the drag-sortable grid — rebuilt whenever filesData changes
  const [fileItems, setFileItems] = useState<FileItem[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  // ─── Agent audio fetch ─────────────────────────────────────────────────────
  React.useEffect(() => {
    const fetchAgentAudios = async () => {
      if (!orderData?.agent?.uuid) return;
      setLoadingAudios(true);
      try {
        const response = await GetAgentAudios(orderData.agent.uuid);
        if (response.status && Array.isArray(response.data)) {
          setAgentAudios(response.data);
        }
      } catch (error) {
        console.error("Error fetching agent audios:", error);
      } finally {
        setLoadingAudios(false);
      }
    };
    fetchAgentAudios();
  }, [orderData?.agent?.uuid]);

  // ─── Legacy audio hydration ────────────────────────────────────────────────
  React.useEffect(() => {
    if (selectedAudioTrack && selectedAudioTrack !== "none" && !audioUrl) {
      if (selectedAudioTrack.startsWith("http")) {
        setAudioUrl(selectedAudioTrack);
      } else {
        const loadLegacyAudio = async () => {
          try {
            const response = await fetch(`/audio/${selectedAudioTrack}.mp3`);
            if (response.ok) {
              const blob = await response.blob();
              setAudioUrl(URL.createObjectURL(blob));
            }
          } catch (error) {
            console.error("Error loading legacy audio:", error);
          }
        };
        loadLegacyAudio();
      }
    }
  }, [selectedAudioTrack, audioUrl, setAudioUrl]);

  React.useEffect(() => {
    // Determine the source of truth for settings:
    // If per-tour settings exist, use them. Otherwise, fall back to org defaults.
    const settings = tourSettings && Object.keys(tourSettings).length > 0 ? tourSettings : tourDefaultSettings;

    if (settings) {
      if (settings.autoplay_enabled !== undefined && typeof settings.autoplay_enabled === 'boolean') {
        setAutoPlay(settings.autoplay_enabled);
      }
      if (settings.transition_effect && Array.isArray(settings.transition_effect) && settings.transition_effect.length > 0) {
        if (!settings.transition_effect.includes(transition)) {
          setTransition(settings.transition_effect[0]);
        }
      }
    }
  }, [tourSettings, tourDefaultSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    // If no audio is currently selected (or it's "none") and we have an org default audio, auto-select it.
    // This applies primarily to new tours that haven't saved a specific audio track yet.
    if ((!selectedAudioTrack || selectedAudioTrack === "none") && tourDefaultSettings?.default_audio_uuid) {
      // Find the corresponding URL from agentAudios, or fallback to the UUID string directly (since backend might accept UUID)
      const matchedAudio = agentAudios.find(a => a.uuid === tourDefaultSettings.default_audio_uuid);
      if (matchedAudio && matchedAudio.audio_url) {
        handleAudioTrackChange(matchedAudio.audio_url);
      }
    }
  }, [selectedAudioTrack, tourDefaultSettings, agentAudios]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Compute globally-sorted photo list ───────────────────────────────────
  // getGlobalPhotoOrder sorts by sort_order ASC, ties broken by service_id ASC
  let globalSortedPhotos: Files[] = filesData?.files
    ? getGlobalPhotoOrder(filesData.files)
    : [];

  if (userType === 'agent') {
    globalSortedPhotos = globalSortedPhotos.filter(
      (file) => file.is_agent_approved || file.is_complimentary
    );
  }

  // ─── Rebuild FileItem[] whenever the API files change ─────────────────────
  // We only rebuild from filesData, NOT on every fileItems setState, to avoid loops.
  useEffect(() => {
    const globalPhotos = filesData?.files ? getGlobalPhotoOrder(filesData.files) : [];
    const agentFiltered = userType === 'agent'
      ? globalPhotos.filter(f => f.is_agent_approved || f.is_complimentary)
      : globalPhotos;

    setFileItems(
      agentFiltered.map((file, index) => ({
        clientId: file.uuid,
        serverId: file.uuid,
        url:
          file.variant_urls?.thumb ||
          file.thumbnail_url ||
          file.url ||
          (file.file_path ? `${API_URL}/${file.file_path}` : ""),
        status: "uploaded" as const,
        order: index + 1,
        originalData: file,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesData?.files, userType]);

  // ─── Global reorder handler ────────────────────────────────────────────────
  const handleGlobalReorder = useCallback(
    (newItems: FileItem[]) => {
      setFileItems(newItems);
    },
    []
  );

  const handleSaveReorder = useCallback(async () => {
    if (!filesData) return;

    // Compute globally-unique sort_orders: position 0 → sort_order 1, etc.
    const reorderedFiles = fileItems
      .map((item) => item.originalData as Files)
      .filter(Boolean);
    const updates = computeGlobalReorderUpdates(reorderedFiles);
    const updatesMap = new Map(updates.map((u) => [u.uuid, u.sort_order]));

    const newlyChangedFiles: Files[] = [];
    const newFilesList = filesData.files.map((f) => {
      const newOrder = updatesMap.get(f.uuid);
      if (newOrder !== undefined && f.sort_order !== newOrder) {
        const updatedFile = { ...f, sort_order: newOrder };
        newlyChangedFiles.push(updatedFile);
        return updatedFile;
      }
      return f;
    });

    if (newlyChangedFiles.length === 0) {
      setIsReorderMode(false);
      return;
    }

    // Write new sort_orders into context immediately for UI update
    setFilesData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        files: newFilesList,
      };
    });

    const token = localStorage.getItem("token");
    if (!token || !orderData) {
      toast.error("Could not save reorder. Missing data.");
      return;
    }

    // Map API snapshots (x_axis/y_axis) → DroppedMarker shape (x/y)
    // Filter out deleted snapshots based on local state
    const activeSnapshots = (filesData.snapshots || [])
      .filter((s) => !deletedSnapshotUuids.has(s.uuid))
      .map((snap) => ({
        uuid: snap.uuid,
        x: Number(snap.x_axis ?? 0),
        y: Number(snap.y_axis ?? 0),
        floorImageUrl: snap.file_name ?? "",
        isApi: true as const,
        name: snap.name ?? undefined,
        description: snap.description ?? undefined,
        file_path: snap.file_path,
        url: snap.url,
        thumbnail_url: snap.thumbnail_url,
        variant_urls: snap.variant_urls,
      }));

    setIsSaving(true);
    try {
      await startUpload({
        token,
        orderUuid: orderData.uuid,
        filesDataUuid: filesData.uuid,
        files: [],
        links: links,
        droppedMarkers: activeSnapshots,
        delay: delay,
        transition: transition,
        selectedAudioTrack: selectedAudioTrack || "none",
        changedFiles: newlyChangedFiles,
        isUpdate: true,
        successMessage: "Media reordered successfully."
      });
      setIsReorderMode(false);
    } catch (error) {
      console.error("Failed to save reorder", error);
    } finally {
      setIsSaving(false);
    }
  }, [fileItems, filesData, setFilesData, setIsSaving, startUpload, orderData, delay, transition, selectedAudioTrack, deletedSnapshotUuids, links]);

  const handleCancelReorder = useCallback(() => {
    // Revert fileItems to match filesData
    const globalPhotos = filesData?.files ? getGlobalPhotoOrder(filesData.files) : [];
    const agentFiltered = userType === 'agent'
      ? globalPhotos.filter(f => f.is_agent_approved || f.is_complimentary)
      : globalPhotos;

    setFileItems(
      agentFiltered.map((file, index) => ({
        clientId: file.uuid,
        serverId: file.uuid,
        url:
          file.variant_urls?.thumb ||
          file.thumbnail_url ||
          file.url ||
          (file.file_path ? `${API_URL}/${file.file_path}` : ""),
        status: "uploaded" as const,
        order: index + 1,
        originalData: file,
      }))
    );
    setIsReorderMode(false);
  }, [filesData?.files, userType, API_URL]);

  // ─── Render a single photo card inside the global drag grid ───────────────
  const renderPhotoCard = useCallback(
    (item: FileItem) => {
      const file = item.originalData as Files;
      if (!file) return null;

      const imgSrc =
        file.variant_urls?.thumb ||
        file.thumbnail_url ||
        file.url ||
        (file.file_path ? `${API_URL}/${file.file_path}` : "");

      return (
        <div className="relative bg-black rounded-sm overflow-hidden group select-none">
          <div className="relative w-full h-[180px] overflow-hidden">
            {isPanoramaFile(file) && <PanoramaBadge />}
            {file.is_processing ? (
              <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                <p className="text-gray-500 font-medium text-sm">Processing…</p>
              </div>
            ) : file.file_path?.toLowerCase().endsWith(".pdf") || file.type === "pdf" ? (
              <PdfPlaceholder className="absolute inset-0 w-full h-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgSrc}
                alt="preview"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            )}
            {/* Drag hint shown on hover in reorder mode */}
            {isReorderMode && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <GripVertical className="text-white w-8 h-8 drop-shadow-lg" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-2 py-1 bg-[#BBBBBB] text-[12px]">
            <p className="text-[#8E8E8E] truncate max-w-[80%]">
              <CopyableFileName name={file.service?.name ?? "Photo"} />
            </p>
            {/* Show the current global position number */}
            <span className="text-[#aaa] text-[10px] ml-1 shrink-0">
              #{file.sort_order}
            </span>
          </div>
        </div>
      );
    },
    [isReorderMode, API_URL]
  );

  // ─── Audio track handler ───────────────────────────────────────────────────
  const handleAudioTrackChange = async (track: string) => {
    setSelectedAudioTrack(track);
    if (track === "none") { setAudioUrl(undefined); return; }
    if (track.startsWith("http")) { setAudioUrl(track); return; }
    try {
      const response = await fetch(`/audio/${track}.mp3`);
      const blob = await response.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error("Error loading audio track:", error);
      setAudioUrl(undefined);
    }
  };

  const checkedImages = selectedFiles.filter((f) => f.upload === true);

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (
    (!globalSortedPhotos || globalSortedPhotos.length === 0) &&
    (!selectedFiles || selectedFiles.length === 0)
  ) {
    const allPhotos =
      filesData?.files?.filter(
        (file) =>
          file?.service?.name !== "2D Floor Plans" &&
          file?.service?.name !== "3D Floor Plans" &&
          file.type === "photo"
      ) || [];

    if (userType === "agent") {
      if (allPhotos.length > 0) {
        return (
          <div className="font-alexandria w-full h-[50vh] text-[#4290E9] flex justify-center items-center font-[500] text-[18px]">
            <p>You have not approved any photos yet. Go to Photo service and approve media.</p>
          </div>
        );
      }
      return (
        <div className="font-alexandria w-full h-[50vh] text-[#E06D5E] flex justify-center items-center font-[500] text-[18px]">
          <p>Vendor has not uploaded any photos yet.</p>
        </div>
      );
    }
    return (
      <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
        <p>No Photo found — please add Photos or select a Photo service.</p>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div>
      <Accordion type="multiple" defaultValue={["item-1", "item-2", "item-3"]} className="w-full">

        {/* ── Arrange Photos ─────────────────────────────────────────────── */}
        <AccordionItem value="item-1">
          <div className="flex items-center justify-between pr-4 bg-[#E4E4E4] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px]">
            <AccordionTrigger className={`px-[14px] py-[19px] flex-1 hover:no-underline ${userType}-text text-[18px] font-[600] uppercase [&>svg]:text-current [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current border-none h-full`}>
              Arrange Photos ({globalSortedPhotos.length + selectedFiles.length})
            </AccordionTrigger>
            {globalSortedPhotos.length > 0 && (
              <div className="hidden md:flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                {isReorderMode ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[12px] border-[#BBBBBB] text-[#666666]"
                      onClick={handleCancelReorder}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className={`h-8 text-[12px] ${userType}-bg hover:${userType}-bg hover:opacity-90 text-white transition-all`}
                      onClick={handleSaveReorder}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className={`h-8 text-[12px] gap-1.5 font-medium ${userType}-bg hover:opacity-90 text-white transition-all`}
                    onClick={() => setIsReorderMode(true)}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Reorder
                  </Button>
                )}
                {isSaving && (
                  <span className="text-[12px] text-[#4290E9] animate-pulse font-medium ml-2">Saving…</span>
                )}
              </div>
            )}
          </div>
          <AccordionContent>
            <div>
              {(selectedFiles?.length > 0 || globalSortedPhotos.length > 0) && (
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <p className="text-[#666666] text-[13px] font-medium">
                    Note: The reorder will be shown in public tour and MLS sync.
                  </p>
                  <GridSizeToggle />
                </div>
              )}
              {(selectedFiles?.length > 0 || globalSortedPhotos.length > 0) && (
                <div className="w-full bg-[#BBBBBB] p-3 space-y-3">
                  {/* Pending (local, not-yet-uploaded) files — shown above the grid */}
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="bg-[#BBBBBB] h-auto relative">
                          <div className="relative w-full h-[180px] overflow-hidden">
                            <OptimizedImagePreview
                              file={file.file}
                              alt="preview"
                              className="absolute inset-0 w-full h-full object-contain"
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className="cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]"
                                  style={{
                                    clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                    backgroundColor: file.upload ? "#6BAE41" : "#E06D5E",
                                  }}
                                  onClick={() => {
                                    setSelectedFiles((prev) =>
                                      prev.flatMap((f) => {
                                        if (f.file === file.file && f.service_id === file.service_id) {
                                          return f.upload ? [{ ...f, upload: false }] : [];
                                        }
                                        return [f];
                                      })
                                    );
                                  }}
                                >
                                  {file.upload ? <Check color="#fff" size={14} /> : <X color="#fff" size={14} />}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="left" align="start" className="mt-2 mr-2">
                                {file.upload ? "Hide from agent" : "Make visible to agent"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1 bg-[#BBBBBB] text-[14px]">
                            <p className="text-[#8E8E8E] mt-1 flex items-center gap-1">
                              <CopyableFileName name={file.type || "Exterior"} /> ({idx + 1} of {selectedFiles.length})
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Globally ordered uploaded photos — drag-sortable in reorder mode */}
                  {fileItems.length > 0 && (
                    <SortableGrid
                      items={fileItems}
                      onOrderChange={handleGlobalReorder}
                      mode={isReorderMode ? "reorder" : "upload"}
                      renderItem={renderPhotoCard}
                      columns={imagesPerRow}
                    />
                  )}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Slideshow Settings ─────────────────────────────────────────── */}
        <AccordionItem value="item-2">
          <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase [&>svg]:text-current [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`} style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
            Slideshow Video Settings
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <div className="w-full flex flex-col items-center">
              <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                <div className="grid grid-cols-2 gap-[16px]">
                  <div className="col-span-2">
                    <label className="text-sm text-gray-700">Select Background Audio</label>
                    <Select value={selectedAudioTrack} onValueChange={handleAudioTrackChange}>
                      <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                        <SelectValue placeholder={loadingAudios ? "Loading Audios..." : "Select Audio Track"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Audio</SelectItem>
                        {agentAudios.map((audio) => (
                          <SelectItem key={audio.uuid} value={audio.audio_url || audio.file_url || ""}>
                            {audio.name}
                          </SelectItem>
                        ))}
                        {agentAudios.length === 0 && !loadingAudios && (
                          <>
                            <SelectItem value="tell-me-what">Tell-me-what (Default)</SelectItem>
                            <SelectItem value="embrace">Embrace (Default)</SelectItem>
                            <SelectItem value="sandbreaker">Sandbreaker (Default)</SelectItem>
                            <SelectItem value="showreel">Showreel (Default)</SelectItem>
                          </>
                        )}
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
                        {tourSettings?.transition_effect && Array.isArray(tourSettings.transition_effect) && tourSettings.transition_effect.length > 0 ? (
                          tourSettings.transition_effect.map((t: string) => (
                            <SelectItem key={t} value={t}>
                              {t.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="fade-in">Fade In</SelectItem>
                            <SelectItem value="slide-right-left">Slide Right to Left</SelectItem>
                            <SelectItem value="slide-left-right">Slide Left to Right</SelectItem>
                            <SelectItem value="slide-top-bottom">Slide Top to Bottom</SelectItem>
                            <SelectItem value="slide-bottom-top">Slide Bottom to Top</SelectItem>
                            <SelectItem value="reveal-left-right">Reveal Left to Right</SelectItem>
                            <SelectItem value="rotate-bottom-left">Rotate Bottom Left</SelectItem>
                            <SelectItem value="rotate-bottom-right">Rotate Bottom Right</SelectItem>
                            <SelectItem value="rotate-left-bottom">Rotate Left Bottom</SelectItem>
                            <SelectItem value="rotate-left-top">Rotate Left Top</SelectItem>
                            <SelectItem value="kenburns">Ken Burns</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-[16px]">
                  <div className="col-span-2">
                    <label htmlFor="">Slide Delay</label>
                    <Select value={String(delay)} onValueChange={(val) => setDelay(Number(val))}>
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
                    className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#4CAF50]"
                  />
                  <Label className="text-[14px] text-[#424242]">Auto Play Audio</Label>
                </div>

                <div className="grid grid-cols-2 gap-[16px]">
                  <div className="col-span-2">
                    <label htmlFor="">Video Overlay</label>
                    <Select value={branding} onValueChange={setBranding}>
                      <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                        <SelectValue placeholder="Select Branding Option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Branding</SelectItem>
                        <SelectItem value="realtor">Realtor Branding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Slideshow Preview ──────────────────────────────────────────── */}
        <AccordionItem value="item-3">
          <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase [&>svg]:text-current [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`} style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
            Slideshow Video Preview
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 space-y-4 h-[350px] md:h-[700px]">
              <CustomSlideshow
                images={checkedImages}
                delay={delay}
                transition={transition}
                audioUrl={audioUrl}
                api_images={globalSortedPhotos}
                watermarkUrl={
                  branding === "realtor" && orderData?.agent?.company_logo_url
                    ? `${orderData.agent.company_logo_url}`
                    : undefined
                }
                propIsPlaying={autoPlay}
                propSetIsPlaying={setAutoPlay}
                className="w-full h-full"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}

export default TourPicture;
