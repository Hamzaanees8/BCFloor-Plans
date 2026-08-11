"use client";

import { useEffect, useMemo, useState } from "react";
import TourSettings from "./TourSettings";
import TourPicture from "./TourPicture";
import TourMatterport from "./TourMatterport";
import { Order } from "../../orders/page";
import TourVideos from "./TourVideos";
import TourFloorPlans from "./TourFloorPlans";
import TourConfirm from "./TourConfirm";
import { useAppContext } from "@/app/context/AppContext";
import { useFileManagerContext } from "../FileManagerContext";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { useGlobalFileUpload } from "@/context/GlobalFileUploadContext";
import { GetFilesData } from "../file-manager";
import { toast } from "sonner";

interface TourProps {
  orderData: Order | null;
  setOrderData?: React.Dispatch<React.SetStateAction<Order | null>>;
  onRefresh?: () => Promise<void>;
  isScrolled?: boolean;
  isListing?: boolean;
}

export default function TourTabs({
  orderData,
  setOrderData,
  onRefresh,
  isScrolled = false,
  isListing = false,
}: TourProps) {
  const [activeTab, setActiveTab] = useState("Settings");
  const { userType } = useAppContext();
  const { startUpload } = useGlobalFileUpload();
  const {
    droppedMarkers,
    setDroppedMarkers,
    deletedSnapshotUuids,
    setDeletedSnapshotUuids,
    filesData,
    setFilesData,
    delay,
    transition,
    selectedAudioTrack,
    setIsSaving,
    isSaving,
  } = useFileManagerContext();

  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const hasUnsavedSnapshots =
    droppedMarkers.length > 0 || deletedSnapshotUuids.size > 0;

  const handleTabClick = (tab: string) => {
    if (tab === activeTab) return;
    if (activeTab === "Floor plans" && hasUnsavedSnapshots) {
      setPendingTab(tab);
      setShowUnsavedModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleConfirmSave = async () => {
    const token = localStorage.getItem("token");
    const orderUuid =
      orderData?.uuid ||
      ((filesData as any)?.tour_id ? String((filesData as any).tour_id) : "");
    if (!token || !filesData || !orderUuid) {
      toast.error(
        "Could not save snapshots. Missing token or order information.",
      );
      return;
    }

    const activeSnapshots = [
      ...(filesData?.snapshots || [])
        .filter((snap) => !deletedSnapshotUuids.has(snap.uuid))
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
        })),
      ...droppedMarkers,
    ];

    setIsSaving(true);
    try {
      const response = await startUpload({
        token,
        orderUuid: orderUuid,
        filesDataUuid: filesData.uuid,
        files: [],
        links: filesData.links || [],
        droppedMarkers: activeSnapshots,
        delay: delay || 3,
        transition: transition || "fade",
        selectedAudioTrack: selectedAudioTrack || "none",
        changedFiles: [],
        isUpdate: true,
        successMessage: "Snapshots saved successfully.",
      });

      if (response) {
        const freshFilesData = await GetFilesData(token, orderUuid);
        if (freshFilesData?.data?.[0]) {
          const updatedTour = freshFilesData.data[0];
          if (updatedTour.files) {
            updatedTour.files = updatedTour.files.map((f: any) => ({
              ...f,
              is_processing:
                f.status === "processing" ||
                f.is_processing ||
                (f.type === "photo" &&
                  (!f.variant_urls ||
                    Object.keys(f.variant_urls).length === 0)),
            }));
          }
          setFilesData(updatedTour);
        }
        setDroppedMarkers([]);
        setDeletedSnapshotUuids(new Set());
        setShowUnsavedModal(false);
        if (pendingTab) {
          setActiveTab(pendingTab);
          setPendingTab(null);
        }
      }
    } catch (err) {
      console.error("Failed to save snapshot changes:", err);
      toast.error("Failed to save snapshots.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDiscard = () => {
    setDroppedMarkers([]);
    setDeletedSnapshotUuids(new Set());
    setShowUnsavedModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const hasPhotos = orderData?.services?.some((s) =>
    s?.service?.name?.toLowerCase().includes("photo"),
  );
  const hasVideos = orderData?.services?.some(
    (s) =>
      s?.service?.name?.toLowerCase().includes("video") ||
      s?.service?.name?.toLowerCase().includes("reel"),
  );
  const hasMatterport = orderData?.services?.some(
    (s) =>
      s?.service?.name?.toLowerCase().includes("matterport") ||
      s?.service?.name?.toLowerCase().includes("3d tour"),
  );
  const hasFloorPlans = orderData?.services?.some((s) =>
    s?.service?.name?.toLowerCase().includes("floor plan"),
  );

  const visibleTabs = useMemo(() => {
    const tabs = ["Settings"];
    if (hasPhotos) tabs.push("Photos");
    if (hasMatterport) tabs.push("Matterport");
    if (hasVideos) tabs.push("Videos");
    if (hasFloorPlans) tabs.push("Floor plans");
    tabs.push("Confirm");
    return tabs;
  }, [hasPhotos, hasMatterport, hasVideos, hasFloorPlans]);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab("Settings");
    }
  }, [visibleTabs, activeTab]);

  return (
    <div className="w-full font-alexandria">
      <div
        className={`w-full sticky z-20 transition-all duration-300 flex justify-start md:justify-center overflow-x-auto whitespace-nowrap scrollbar-none items-center bg-[#E4E4E4] border-b border-[#BBBBBB] px-4 ${
          isScrolled
            ? `${isListing ? "top-[145px] h-[40px] shadow-sm" : "top-[105px] h-[40px] shadow-sm"}`
            : `${isListing ? "top-[230px] h-[60px]" : "top-[170px] h-[60px]"}`
        }`}
      >
        <div className="flex border-gray-300 gap-[10px] shrink-0">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`text-center flex items-center justify-center shrink-0 transition-all duration-300 rounded-[6px] ${
                isScrolled
                  ? "h-[26px] w-auto min-w-[80px] md:w-[130px] text-[10px] md:text-[11px] px-2 py-1"
                  : "h-[32px] w-auto min-w-[100px] md:w-[180px] text-[13px] px-4 py-2"
              } ${
                activeTab === tab
                  ? `${userType}-bg text-white font-[500]`
                  : "text-[#666666] hover:text-[#666666] font-[700]"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white shadow-md border rounded-b-md mt-0">
        <div
          style={{ display: activeTab === "Settings" ? undefined : "none" }}
          className="p-4"
        >
          <TourSettings
            orderData={orderData}
            setOrderData={setOrderData}
            onRefresh={onRefresh}
          />
        </div>
        {visibleTabs.includes("Photos") && (
          <div
            style={{ display: activeTab === "Photos" ? undefined : "none" }}
            className="p-4"
          >
            <TourPicture orderData={orderData} />
          </div>
        )}
        {visibleTabs.includes("Floor plans") && (
          <div
            style={{
              display: activeTab === "Floor plans" ? undefined : "none",
            }}
          >
            <TourFloorPlans orderData={orderData} />
          </div>
        )}
        {visibleTabs.includes("Videos") && (
          <div
            style={{ display: activeTab === "Videos" ? undefined : "none" }}
            className="p-4"
          >
            <TourVideos />
          </div>
        )}
        {visibleTabs.includes("Matterport") && (
          <div
            style={{ display: activeTab === "Matterport" ? undefined : "none" }}
            className="p-4"
          >
            <TourMatterport orderData={orderData} />
          </div>
        )}
        <div style={{ display: activeTab === "Confirm" ? undefined : "none" }}>
          <TourConfirm orderData={orderData} />
        </div>
      </div>

      {/* Unsaved Snapshot Changes Warning Modal */}
      <Dialog
        open={showUnsavedModal}
        onOpenChange={(open) => {
          if (!open && !isSaving) setShowUnsavedModal(false);
        }}
      >
        <DialogContent className="max-w-lg bg-white rounded-2xl p-0 overflow-hidden shadow-2xl border border-gray-100 font-alexandria">
          <div className="p-6 bg-gradient-to-b from-amber-50/60 to-white flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-xs border border-amber-200/50">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight mb-2">
              Unsaved Snapshot Changes
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 leading-relaxed max-w-sm">
              You have placed or edited snapshots on your floor plan that are
              not saved yet. Would you like to save these changes before leaving
              this tab?
            </DialogDescription>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleConfirmDiscard}
              disabled={isSaving}
              className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 h-10 px-4 font-medium transition-colors w-full sm:w-auto"
            >
              Discard Changes
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUnsavedModal(false)}
                disabled={isSaving}
                className="text-gray-700 border-gray-300 hover:bg-gray-100 h-10 px-4 text-xs font-medium rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="bg-[#4290E9] hover:bg-[#4290E9]/90 text-white h-10 px-5 text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 min-w-[140px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Continue
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
