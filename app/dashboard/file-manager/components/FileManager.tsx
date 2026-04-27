"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState, useRef } from "react";
import { BackArrow } from "@/components/Icons";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { GetOneOrder } from "../../orders/orders";
import Service from "./2DFloor";
import { Order, Slot } from "../../orders/page";
import { GetServices } from "../../services/services";
import { Services } from "../../services/page";
import FileTab1 from "./HDRStill";
import FileTab2 from "./3DFloor";
import TourTabs from "./TourTabs";
import Video from "./Video";
import CreateFeatureSheet, { CreateFeatureSheetRef } from "./CreateFeatureSheet";
import DownloadTab from "./DownloadTab";
import HiddenMediaModal from "./HiddenMediaModal";
import { useAppContext } from "@/app/context/AppContext";
import { Button } from "@/components/ui/button";
import { useFileManagerContext, Files } from "../FileManagerContext";
import { useGlobalFileUpload } from "@/context/GlobalFileUploadContext";
import { useUnsaved } from "@/app/context/UnsavedContext";
import { toast } from "sonner";
import { GetInvoicesByOrder, PayInvoiceWithStripe } from "../../invoice/invoice_api";
import InvoiceDocument from "../../invoice/components/InvoiceDocument";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GetFilesData,
} from "../file-manager";
import { GetOneListing } from "../../listings/listing";
import { Listings } from "@/lib/types";
import Link from "next/link";
import { Loader2, X } from "lucide-react";

type Service = {
  uuid: string;
  name: string;
};
type OrerServices = {
  service: Service;
};

export type MediaDateBoundary = {
  from: Date | null;
  to: Date | null;
};

const FileManager = () => {
  const router = useRouter();
  const [servicesData, setServicesData] = React.useState<Services[]>([]);
  // services is set by useEffect (used by setServices) but the value is consumed via groupedServices
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [services, setServices] = React.useState<OrerServices[]>([]);
  const [activeTab, setActiveTab] = useState<string>("download");
  const [activeServiceIndex, setActiveServiceIndex] = useState<number>(0);
  const [orderData, setOrderData] = React.useState<Order | null>(null);
  const { userType } = useAppContext();
  const {
    selectedFiles,
    setSelectedFiles,
    selectedVideoFiles,
    setSelectedVideoFiles,
    links,
    floorFiles,
    setFloorFiles,
    droppedMarkers,
    delay,
    transition,
    selectedAudioTrack,
    filesData,
    setFilesData,
    setTransition,
    setSelectedAudioTrack,
    setDelay,
    changedFileUuids,
    setChangedFileUuids,
    setSelectionChangedUuids,
    setFileManagerMode,
    isSaving,
    setIsSaving,
    includeHidden,
    setIncludeHidden
  } = useFileManagerContext();
  const [isHiddenMediaModalOpen, setIsHiddenMediaModalOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const featureSheetRef = useRef<CreateFeatureSheetRef>(null);
  const { startUpload } = useGlobalFileUpload();

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let ancestor = header.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
        ancestor.style.setProperty('overflow-x', 'visible', 'important');
        ancestor.style.setProperty('overflow-y', 'visible', 'important');

        const target = ancestor;
        return () => {
          target.style.removeProperty('overflow-x');
          target.style.removeProperty('overflow-y');
        };
      }
      ancestor = ancestor.parentElement;
    }
  }, []);

  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.id as string;
  const listingId = searchParams.get("listingId");
  const isListing = listingId ? true : false;

  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [currentListing, setCurrentListing] = useState<Listings | null>(null);

  const serviceIdFromURL = searchParams.get("serviceId");



  useEffect(() => {
    const fetchListing = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("Token not found.");
        return;
      }

      if (!listingId) {
        console.log("Listing ID is undefined.");
        return;
      }

      try {
        const res = await GetOneListing(listingId);
        const data = res.data;

        if (data) {
          setCurrentListing(data);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchListing();
  }, [listingId]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return; // no payment session to process

    const processStripePayment = async () => {
      toast.info("Processing your payment, please wait...");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/stripe/session?session_id=${sessionId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          }
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || result.error || "Payment processing failed"
          );
        }

        toast.success("Payment processed successfully! ");

        // remove session_id from URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete("session_id");
        router.replace(`?${params.toString()}`);
      } catch (error) {
        console.error("Stripe session error:", error);
        toast.error(
          error instanceof Error
            ? error.message || "Unable to verify payment session."
            : "Unable to verify payment session."
        );
      }
    };

    processStripePayment();
  }, [searchParams, router]);

  useEffect(() => {
    if (!orderData?.uuid) return;
    setInvoicesLoading(true);
    GetInvoicesByOrder(orderData.uuid)
      .then((res) => setInvoices(Array.isArray(res.data) ? res.data : []))
      .catch(() => console.log("Failed to load invoices"))
      .finally(() => setInvoicesLoading(false));
  }, [orderData?.uuid]);

  const handlePayInvoice = async (invoice: any) => {
    if (!orderData) return;
    try {
      const redirectUrl =
        window.location.origin +
        window.location.pathname +
        (window.location.search ? window.location.search : "");
      await PayInvoiceWithStripe(invoice, orderData, redirectUrl);
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate payment.");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const currentVendorUUID = userInfo?.uuid;
    const userType = localStorage.getItem("userType");

    if (!token) {
      console.log("Token not found.");
      return;
    }

    GetOneOrder(token, orderId || "")
      .then((data) => {
        const order = data.data;
        setOrderData(order);

        let filteredServices = order.services;

        if (userType === "vendor") {
          const vendorServiceIds = order.slots
            ?.filter((slot: Slot) => slot.vendor?.uuid === currentVendorUUID)
            .map((slot: Slot) => slot.service_id);

          const uniqueVendorServiceIds = Array.from(new Set(vendorServiceIds));
          filteredServices = order.services?.filter(
            (srv: { service_id: number }) =>
              uniqueVendorServiceIds.includes(srv.service_id)
          );
        }

        setServices(filteredServices);

        if (!serviceIdFromURL) {
          if (activeTab === "tour" || activeTab === "CreateFeatureSheet" || activeTab === "download")
            return;
          setActiveTab("download");
        }
      })
      .catch((err) => console.log(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (serviceIdFromURL) {
      if (activeTab === "tour" || activeTab === "CreateFeatureSheet") return;
      setActiveTab(serviceIdFromURL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceIdFromURL]);
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      return;
    }

    GetServices(token)
      .then((data) => {
        setServicesData(data.data);
      })
      .catch((err) => console.log(err.message));
  }, [orderId]);
  const activeService = servicesData?.find((srv) => srv.uuid === activeTab);
  const activeSlot = orderData?.slots?.find(
    (slot) => slot.service_id === activeService?.id
  );
  const reviewFilesEnabled = Boolean(
    activeSlot?.vendor?.review_files ?? orderData?.vendor?.review_files
  );

  // --- Duplicate service grouping ---
  // Group order.services by service.uuid (definition UUID), sorted by created_at asc
  const groupedServices = React.useMemo(() => {
    const map = new Map<string, NonNullable<typeof orderData>["services"][0][]>();
    (orderData?.services ?? []).forEach((os) => {
      const key = os.service.uuid;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(os);
    });
    // Sort each group by created_at ascending
    map.forEach((group) =>
      group.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    );
    return map;
  }, [orderData]);

  // Compute the media date boundary for the current service + sub-tab index
  type OrderServiceEntry = NonNullable<typeof orderData>["services"][0];
  const computeMediaBoundary = (
    group: OrderServiceEntry[] | undefined,
    index: number
  ): MediaDateBoundary => {
    if (!group || group.length <= 1) return { from: null, to: null };
    const from = index === 0 ? null : new Date(group[index].created_at);
    const to =
      index < group.length - 1
        ? new Date(group[index + 1].created_at)
        : null;
    return { from, to };
  };

  const activeServiceGroup = groupedServices.get(activeTab);
  const mediaDateBoundary = computeMediaBoundary(
    activeServiceGroup,
    activeServiceIndex
  );

  const handleOpenInvoice = (serviceName?: string) => {
    const serviceInv = invoices.find(inv => 
      inv.items?.some((i: any) => i.description?.toLowerCase() === serviceName?.toLowerCase())
    ) || invoices[0];
    
    if (serviceInv) {
      setViewingInvoice(serviceInv);
    } else {
      setShowInvoicesModal(true);
    }
  };

  const renderContent = () => {
    if (activeTab === "tour") {
      return <TourTabs orderData={orderData} />;
    }

    if (activeTab === "download") {
      return <DownloadTab orderData={orderData} groupedOrderServices={groupedServices} onOpenInvoice={handleOpenInvoice} />;
    }

    if (activeTab === "CreateFeatureSheet") {
      return <CreateFeatureSheet ref={featureSheetRef} orderData={orderData} />;
    }
    const category = activeService?.category?.name;

    switch (category) {
      case "Video":
        return (
          <div>
            <Video
              currentService={activeService}
              orderData={orderData}
              currentBookedService={activeServiceGroup?.[activeServiceIndex]}
              isListing={false}
              reviewFilesEnabled={reviewFilesEnabled}
              onSave={handleSave}
              mediaDateBoundary={mediaDateBoundary}
              onOpenInvoice={handleOpenInvoice}
            />
          </div>
        );
      case "Floor Plan":
        return (
          <Service
            orderData={orderData}
            currentService={activeService}
            currentBookedService={activeServiceGroup?.[activeServiceIndex]}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onSave={handleSave}
            mediaDateBoundary={mediaDateBoundary}
            onOpenInvoice={handleOpenInvoice}
          />
        );
      case "HDR Photos":
        return (
          <FileTab1
            currentService={activeService}
            orderData={orderData}
            currentBookedService={activeServiceGroup?.[activeServiceIndex]}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onSave={handleSave}
            mediaDateBoundary={mediaDateBoundary}
            onOpenInvoice={handleOpenInvoice}
          />
        );
      case "3d rendering":
        return (
          <FileTab2
            currentService={activeService}
            orderData={orderData}
            currentBookedService={activeServiceGroup?.[activeServiceIndex]}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onOpenInvoice={handleOpenInvoice}
          />
        );
      case "drone":
        return (
          <FileTab1
            currentService={activeService}
            orderData={orderData}
            currentBookedService={activeServiceGroup?.[activeServiceIndex]}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onSave={handleSave}
            mediaDateBoundary={mediaDateBoundary}
            onOpenInvoice={handleOpenInvoice}
          />
        );
      case "Staging":
        return (
          <FileTab2
            currentService={activeService}
            orderData={orderData}
            currentBookedService={activeServiceGroup?.[activeServiceIndex]}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onOpenInvoice={handleOpenInvoice}
          />
        );
      case "Standard Photos":
        return (
          <FileTab1
            currentService={activeService}
            orderData={orderData}
            currentBookedService={activeServiceGroup?.[activeServiceIndex]}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onSave={handleSave}
            mediaDateBoundary={mediaDateBoundary}
            onOpenInvoice={handleOpenInvoice}
          />
        );
      case "Twilight Photos":
        return (
          <FileTab1
            currentService={activeService}
            orderData={orderData}
            currentBookedService={activeServiceGroup?.[activeServiceIndex]}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onSave={handleSave}
            mediaDateBoundary={mediaDateBoundary}
            onOpenInvoice={handleOpenInvoice}
          />
        );
      case "3D Tour":
        return (
          <FileTab2
            currentService={activeService}
            orderData={orderData}
            currentBookedService={activeServiceGroup?.[activeServiceIndex]}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onOpenInvoice={handleOpenInvoice}
          />
        );
      default:
        return (
          <div className="flex justify-center font-alexandria mt-20">
            <p>Default Component</p>
          </div>
        );
    }
  };

  // currentService removed — no longer needed after invoice-first flow

  useEffect(() => {
    async function fetchFilesData() {
      const token = localStorage.getItem("token");
      if (!token || !orderData) {
        console.log("Token not found.");
        return;
      }
      try {
        const filesData = await GetFilesData(token, orderData?.uuid || "", includeHidden);
        if (filesData.data && filesData.data.length > 0) {
          setFilesData(filesData.data[0]);
          // Removed accidental setInterval call

          setSelectedAudioTrack(
            filesData.data[0].slide_show &&
            (filesData.data[0].slide_show.background_audio || "none")
          );
          setTransition(
            filesData.data[0].slide_show &&
            (filesData.data[0].slide_show.transitions || "fade-in")
          );
          setDelay(
            filesData.data[0].slide_show &&
            (filesData.data[0].slide_show.slide_delay || 3000)
          );
        } else {
          // If no data found, set to an empty object to stop the loader in children
          setFilesData({ files: [], links: [], snapshots: [] } as any);
        }
      } catch (error) {
        console.error("Error fetching files data:", error);
        // Also set to empty state on error to prevent infinite loader
        setFilesData({ files: [], links: [], snapshots: [] } as any);
      }
    }
    fetchFilesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData, includeHidden]);



  const handleUpload = React.useCallback(async () => {
    setFileManagerMode('upload');
    const token = localStorage.getItem("token");
    if (!token) return;

    // Get all files to upload
    const allFiles = [...selectedFiles, ...floorFiles, ...selectedVideoFiles].filter(f => !f.is_deleted);

    let changedFiles: Files[] = [];
    if (filesData) {
      // Filter only the files that have changed (featured status changed)
      changedFiles = filesData.files.filter((file) =>
        changedFileUuids.has(file.uuid)
      );
    }

    const response = await startUpload({
      token,
      orderUuid: orderData?.uuid,
      filesDataUuid: filesData?.uuid,
      files: allFiles,
      links,
      droppedMarkers,
      delay,
      transition,
      selectedAudioTrack: selectedAudioTrack || "none",
      changedFiles,
      isUpdate: !!filesData
    });

    // If we're here, the upload was successful
    if (response) {
      console.log("Upload successful. Fetching fresh data...");

      try {
        const freshFilesData = await GetFilesData(token, orderData?.uuid || "");

        if (freshFilesData.data && freshFilesData.data[0]) {
          const updatedTour = freshFilesData.data[0];

          // Map status='processing' to is_processing=true
          if (updatedTour.files) {
            updatedTour.files = updatedTour.files.map((f: any) => ({
              ...f,
              is_processing: f.status === 'processing' || f.is_processing
            }));
          }

          setFilesData(updatedTour);
        }

        // Clear local pending files
        setSelectedFiles([]);
        setFloorFiles([]);
        setSelectedVideoFiles([]);
        setChangedFileUuids(new Set());
        setSelectionChangedUuids(new Set());

      } catch (err) {
        console.error("Error fetching fresh data:", err);
        // Fallback or toast error? For now just log it, as the upload itself succeeded.
      }
    } else {
      console.log("Upload finished but response is falsy:", response);
    }
  }, [selectedFiles, floorFiles, selectedVideoFiles, filesData, changedFileUuids, startUpload, orderData?.uuid, links, droppedMarkers, delay, transition, selectedAudioTrack, setSelectedFiles, setFloorFiles, setSelectedVideoFiles, setChangedFileUuids, setSelectionChangedUuids, setFilesData, setFileManagerMode]);

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    try {
      if (activeTab === "CreateFeatureSheet") {
        if (featureSheetRef.current) {
          await featureSheetRef.current.handleSave();
        }
      } else {
        await handleUpload();
      }
    } catch (error) {
      console.error("Error during save:", error);
    } finally {
      setIsSaving(false);
    }
  }, [activeTab, handleUpload, setIsSaving]);

  const { setIsDirty, confirmNavigation } = useUnsaved();

  const unsavedCount = React.useMemo(() => {
    return selectedFiles.length + floorFiles.length + selectedVideoFiles.length + changedFileUuids.size;
  }, [selectedFiles, floorFiles, selectedVideoFiles, changedFileUuids]);

  React.useEffect(() => {
    if (unsavedCount > 0) {
      setIsDirty(true, {
        title: "Unsaved Changes",
        description: `You have ${unsavedCount} file(s) unsaved. Are you sure you want to leave? Your changes will not be saved.`,
        confirmLabel: "Leave Anyway",
        onSave: handleSave
      });
    } else {
      setIsDirty(false);
    }

    return () => {
      setIsDirty(false);
    };
  }, [unsavedCount, setIsDirty, handleSave]);

  const handleBackNavigation = () => {
    confirmNavigation(() => {
      if (isListing) {
        router.back();
      } else {
        router.push(`/dashboard/orders/${orderData?.uuid}`);
      }
    });
  };

  return (
    <div>
      {/* Upload Progress Overlay */}
      <div

        ref={headerRef}
        className="w-full h-[80px] font-alexandria pr-5 sticky top-0 z-50 flex justify-between items-center"
        style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
      >
        {/* Invoices List Modal */}
        <Dialog open={showInvoicesModal} onOpenChange={setShowInvoicesModal}>
          <DialogContent className="max-w-4xl w-[95vw] md:w-[850px] rounded-[8px] p-0 font-alexandria overflow-hidden [&>button]:hidden">
            <DialogHeader className="p-4 md:p-6 border-b border-[#E4E4E4] bg-white">
              <DialogTitle className="flex items-center justify-between text-[18px] font-[600] uppercase" style={{ color: `var(--${userType}-page-tab-color)` }}>
                Order Invoices
                <Button className="border-none !shadow-none bg-transparent hover:bg-transparent p-0" onClick={() => setShowInvoicesModal(false)}>
                  <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                </Button>
              </DialogTitle>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-10 bg-white">
              {invoicesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: `var(--${userType}-page-tab-color)` }} />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-10 italic text-[#666666]">
                  No invoices found for this order.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {invoices.map((invoice) => {
                    const status = (invoice.status || "unpaid").toUpperCase();
                    let badgeBg = "#E06D5E";
                    if (status === "PAID") badgeBg = "#6BAE41";
                    else if (status === "ISSUED") badgeBg = "#4A90E2";
                    else if (status === "VOID") badgeBg = "#A0A0A0";
                    else if (
                      status === "PARTIAL_PAID" ||
                      status === "PARTIALLY_PAID" ||
                      status === "PARTIAL"
                    ) badgeBg = "#F5A623";
                    else if (status === "REFUNDED") badgeBg = "#D0021B";

                    return (
                      <div
                        key={invoice.uuid}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-[6px] border border-[#E4E4E4] gap-4"
                        style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #EEEEEE), white 70%)` }}
                      >
                        <div className="flex flex-col gap-1 w-full md:w-1/2">
                          <div className="flex items-center gap-3">
                            <span className="font-[600] text-[16px] text-[#424242]">
                              #{invoice.invoice_number || invoice.id}
                            </span>
                            <span
                              className="text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                              style={{ backgroundColor: badgeBg }}
                            >
                              {status}
                            </span>
                          </div>
                          <span className="text-[12px] text-[#666666]">
                            Issued: {new Date(invoice.issued_at).toLocaleDateString()}
                          </span>
                          {invoice.items && invoice.items.length > 0 && (
                            <div className="mt-1 text-[12px] truncate text-[#7D7D7D]">
                              Services: {invoice.items.map((i: any) => i.description || "Service Item").join(", ")}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                          <div className="flex flex-col md:items-end">
                            <span className="text-[18px] font-bold text-[#424242]">
                              ${parseFloat(invoice.total).toFixed(2)}
                            </span>
                            {parseFloat(invoice.paid_amount) > 0 && (
                              <span className="text-[12px] text-[#6BAE41] font-medium">
                                Paid: ${parseFloat(invoice.paid_amount).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap justify-start md:justify-end">
                            <Button
                              variant="outline"
                              onClick={() => setViewingInvoice(invoice)}
                              className={`h-[35px] text-[13px] px-4 font-semibold hover:opacity-80 border rounded-[6px] ${userType}-button`}
                              style={{
                                borderColor: `var(--${userType}-page-tab-color)`,
                                color: `var(--${userType}-page-tab-color)`,
                                backgroundColor: 'transparent'
                              }}
                            >
                              View
                            </Button>
                            {userType !== "vendor" &&
                              status !== "PAID" &&
                              status !== "VOID" && (
                                <Button
                                  onClick={() => {
                                    setShowInvoicesModal(false);
                                    handlePayInvoice(invoice);
                                  }}
                                  className={`h-[35px] text-[13px] px-4 font-semibold text-white hover:opacity-90 rounded-[6px] ${userType}-bg`}
                                  style={{
                                    backgroundColor: `var(--${userType}-page-tab-color)`,
                                  }}
                                >
                                  Pay Now
                                </Button>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>


          </DialogContent>
        </Dialog>

        {/* Invoice Document View Modal */}
        <Dialog
          open={!!viewingInvoice}
          onOpenChange={(open) => !open && setViewingInvoice(null)}
        >
          <DialogContent className="max-w-4xl w-[95vw] rounded-[8px] p-0 font-alexandria overflow-hidden [&>button]:hidden">
            <DialogHeader className="p-4 md:p-6 border-b border-[#E4E4E4] bg-white">
              <DialogTitle className="flex items-center justify-between text-[18px] font-[600] uppercase" style={{ color: `var(--${userType}-page-tab-color)` }}>
                Invoice #{viewingInvoice?.invoice_number || viewingInvoice?.id}
                <div className="flex items-center gap-4">
                  {userType !== "vendor" &&
                    viewingInvoice?.status?.toUpperCase() !== "PAID" &&
                    viewingInvoice?.status?.toUpperCase() !== "VOID" && (
                    <Button
                      onClick={() => {
                        handlePayInvoice(viewingInvoice);
                        setViewingInvoice(null);
                      }}
                      className={`h-[32px] px-6 text-[14px] font-semibold text-white hover:brightness-110 rounded-[6px] ${userType}-bg`}
                      style={{
                        backgroundColor: `var(--${userType}-page-tab-color, #4290E9)`,
                      }}
                    >
                      Pay Now
                    </Button>
                  )}
                  <Button className="border-none !shadow-none bg-transparent hover:bg-transparent p-0" onClick={() => setViewingInvoice(null)}>
                    <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="max-h-[70vh] overflow-y-auto p-4 md:p-8 bg-[#F9F9F9]">
              {viewingInvoice && (
                <div className="flex flex-col items-center">
                  <InvoiceDocument
                    invoice={viewingInvoice}
                    editData={viewingInvoice}
                    isEditing={false}
                    updateItem={() => {}}
                    addItem={() => {}}
                    removeItem={() => {}}
                    updateTaxRate={() => {}}
                    setEditData={() => {}}
                    roleSettings={{
                      pageTabColor: `var(--${userType}-page-tab-color, #4290E9)`,
                      pageBg: `var(--${userType}-page-bg, #FFFFFF)`,
                    }}
                  />
                </div>
              )}
            </div>


          </DialogContent>
        </Dialog>
        <div className="flex items-center gap-x-4">
          {!isListing && (
            <div
              className={`flex items-center p-4 gap-x-2.5 ${userType}-bg h-full w-[240px]`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[14px] font-normal text-white font-alexandria leading-4">
                  BC Floor Plans
                </p>
                <p className="text-[14px] font-normal text-white font-alexandria leading-4">
                  Media Company Owner
                </p>
                <p className="text-[12px] font-normal text-white font-alexandria leading-4">
                  {(() => {
                    const vendor = activeSlot?.vendor || orderData?.vendor;
                    return vendor ? `${vendor.first_name} ${vendor.last_name}` : "Taylor Tayburn";
                  })()}
                </p>
              </div>
            </div>
          )}
          <p
            className={`text-[16px] md:text-[24px] font-[400] pl-5 ${userType}-text`}
          >
            {isListing
              ? `Listings › ${currentListing?.address || ""}`
              : `File Manager › Order #${orderData?.id || ""}`}
          </p>
        </div>
        <div className="flex items-center gap-x-2.5">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px]  border-[1px] ${userType}-border text-[14px] md:text-[16px] font-[500] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button`}
            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <Button
            onClick={() => setShowInvoicesModal(true)}
            className={`w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px]  border-[1px] ${userType}-border text-[14px] md:text-[16px] font-[400] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button`}
            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
          >
            Invoice
          </Button>


          {/* <Link
            href={""}
            className="w-[110px] md:w-[143px] h-[35px] md:h-[44px]  justify-center rounded-[6px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]"
          >
            Submit
          </Link> */}
        </div>
        {/* Invoice Payment Dialog */}
      </div>
      <div
        className={`w-full h-[160px] ${userType}-bg flex flex-col md:flex-row justify-between items-start py-[32px] px-[25px] relative overflow-hidden`}
        style={{
          backgroundImage: `url('${filesData?.files.find(f => f.is_featured)?.url || filesData?.files[0]?.url || ""}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay to ensure text is readable */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <p className="text-[14px] md:text-[20px] font-[500] text-white">
              {isListing
                ? currentListing?.address &&
                  currentListing?.province &&
                  currentListing?.postal_code &&
                  currentListing?.country
                  ? `${currentListing?.address}, ${currentListing?.province}, ${currentListing?.postal_code}, ${currentListing?.country}`
                  : `Create Your Property Listing`
                : orderData?.property?.address &&
                  orderData?.property?.province &&
                  orderData?.property?.postal_code &&
                  orderData?.property?.country
                  ? `${orderData?.property?.address}, ${orderData?.property?.province}, ${orderData?.property?.postal_code}, ${orderData?.property?.country}`
                  : orderData?.property?.address || "Property Details"}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-[12px] md:text-[16px] font-[500] text-white">
              BC Floor Plans
            </p>
          </div>
        </div>
      </div>
      {isListing && (
        <div
          className="w-full h-[60px] font-alexandria pr-5 sticky top-[80px] z-40 flex items-center border-b border-[#BBBBBB]"
          style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
        >
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center justify-center gap-x-6 w-full">
              <div
                className={`h-[30px] w-[150px] cursor-pointer flex items-center uppercase justify-center font-medium text-[11px] border px-1 text-center rounded-[4px] transition-all duration-200 min-w-[95px] ${true
                  ? `${userType}-bg text-white font-[700] ${userType}-border`
                  : `text-[#666666] font-[700]`
                  }`}
                style={{
                  backgroundColor: true
                    ? undefined
                    : "#FFFFFF",
                }}
              >
                Media
              </div>
              {userType !== 'vendor' && (
                <Link
                  href={`/dashboard/listings/create/${currentListing?.uuid}`}
                  className={`h-[30px] w-[150px] cursor-pointer flex items-center uppercase justify-center font-medium text-[11px] border px-1 text-center rounded-[4px] transition-all duration-200 min-w-[95px] ${false
                    ? `${userType}-bg text-white font-[700] ${userType}-border`
                    : `text-[#666666] font-[700]`
                    }`}
                  style={{
                    backgroundColor: true
                      ? `var(--${userType}-page-bg, #FFFFFF)`
                      : "#FFFFFF",
                  }}
                >
                  Property details
                </Link>
              )}
              <Link
                href={`/dashboard/orders/${orderId}`}
                className={`h-[30px] w-[150px] cursor-pointer flex items-center uppercase justify-center font-medium text-[11px] border px-1 text-center rounded-[4px] transition-all duration-200 min-w-[95px] ${false
                  ? `${userType}-bg text-white font-[700] ${userType}-border`
                  : `text-[#666666] font-[700]`
                  }`}
                style={{
                  backgroundColor: true
                    ? `var(--${userType}-page-bg, #FFFFFF)`
                    : "#FFFFFF",
                }}
              >
                Order details
              </Link>
            </div>
          </div>
        </div>
      )}
      <div
        className="w-full h-[90px] font-alexandria pr-5 z-10 flex items-center border-b border-[#BBBBBB]"
        style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
      >
        <div className="px-[26px]">
          {!isListing && (
            <div
              className={`min-h-[32px] w-[115px] flex items-center cursor-pointer rounded-[24px] ${userType}-bg`}
              onClick={handleBackNavigation}
            >
              <div className="flex items-center px-[14px] py-[4px] gap-x-[10px]">
                <BackArrow />
                <p className="text-[16px] font-semibold text-white font-alexandria">
                  BACK
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center w-full">
          <div className="flex items-center gap-x-6">
            <div
              key="download"
              onClick={() => {
                setActiveTab("download");
                const params = new URLSearchParams(searchParams.toString());
                params.delete("serviceId"); // remove serviceId param
                router.replace(`?${params.toString()}`);
              }}
              className={`h-[60px] cursor-pointer flex items-center justify-center font-medium text-[9px] w-[95px] border px-1 text-center rounded-[4px] transition-all duration-200 ${activeTab === "download"
                ? `bg-[#DC9600] text-white border-[#DC9600]`
                : `text-[#DC9600] border-[#DC9600]`
                }`}
              style={{
                backgroundColor:
                  activeTab === "download"
                    ? undefined
                    : `var(--${userType}-page-bg, #F2F2F2)`,
              }}
            >
              Download
            </div>
            {/* Render one tab per unique service uuid */}
            {Array.from(groupedServices.entries()).map(([serviceUuid, group]) => {
              const isActive = serviceUuid === activeTab;
              return (
                <div
                  key={serviceUuid}
                  onClick={() => {
                    setActiveTab(serviceUuid);
                    setActiveServiceIndex(0);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("serviceId", serviceUuid);
                    router.replace(`?${params.toString()}`);
                  }}
                  className={`h-[60px] cursor-pointer flex items-center justify-center font-medium text-[9px] w-[95px] border px-1 text-center rounded-[4px] transition-all duration-200 ${isActive
                    ? `${userType}-bg text-white ${userType}-border`
                    : `${userType}-text ${userType}-border`
                    }`}
                  style={{
                    backgroundColor: isActive
                      ? undefined
                      : `var(--${userType}-page-bg, #F2F2F2)`,
                  }}
                >
                  {group[0].service.name}
                </div>
              );
            })}

            <div
              key="tour"
              onClick={() => {
                setActiveTab("tour");
                const params = new URLSearchParams(searchParams.toString());
                params.delete("serviceId"); // remove serviceId param
                router.replace(`?${params.toString()}`);
              }}
              className={`h-[60px] cursor-pointer flex items-center justify-center font-medium text-[9px] w-[95px] border px-1 text-center rounded-[4px] transition-all duration-200 ${activeTab === "tour"
                ? `${userType}-bg text-white ${userType}-border`
                : `${userType}-text  ${userType}-border`
                }`}
              style={{
                backgroundColor:
                  activeTab === "tour"
                    ? undefined
                    : `var(--${userType}-page-bg, #F2F2F2)`,
              }}
            >
              Tour
            </div>
            <div
              key="CreateFeatureSheet"
              onClick={() => {
                setActiveTab("CreateFeatureSheet");
                const params = new URLSearchParams(searchParams.toString());
                params.delete("serviceId"); // remove serviceId param
                router.replace(`?${params.toString()}`);
              }}
              className={`h-[60px] cursor-pointer flex items-center justify-center font-medium text-[9px] w-[95px] border px-1 text-center rounded-[4px] transition-all duration-200 ${activeTab === "CreateFeatureSheet"
                ? `${userType}-bg text-white ${userType}-border`
                : `${userType}-text  ${userType}-border`
                }`}
              style={{
                backgroundColor:
                  activeTab === "CreateFeatureSheet"
                    ? undefined
                    : `var(--${userType}-page-bg, #F2F2F2)`,
              }}
            >
              Create Feature Sheet
            </div>
          </div>
        </div>
        {userType !== 'vendor' && (
          <div className="flex items-center gap-x-4 pr-6">
            <Button
              onClick={() => {
                setIsHiddenMediaModalOpen(true);
                setIncludeHidden(true); // Ensure hidden files are fetched when opening the modal
              }}
              className={`h-[40px] px-4 rounded-[6px] border-[1px] transition-all duration-200 text-[12px] md:text-[14px] font-[500] flex items-center gap-2 ${userType}-border ${userType}-text hover:text-white hover-${userType}-bg ${userType}-button`}
              style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
            >
              Show Hidden Media
            </Button>
          </div>
        )}
      </div>

      {/* Sub-tabs for duplicate service bookings */}
      {activeServiceGroup && activeServiceGroup.length > 1 && (
        <div
          className="w-full flex flex-col gap-0 border-b border-[#BBBBBB]"
          style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), white 40%)` }}
        >
          <div className="flex items-stretch h-[45px]">
            {activeServiceGroup.map((booking, idx) => {
              const isSubActive = idx === activeServiceIndex;
              const bookingDate = new Date(booking.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const isPaid =
                orderData?.payment_status === "PAID" ||
                booking.payment_status === "PAID";

              return (
                <div
                  key={booking.uuid}
                  onClick={() => setActiveServiceIndex(idx)}
                  className={`flex-1 cursor-pointer border-r border-[#BBBBBB] last:border-r-0 transition-all duration-200 flex items-center justify-between px-6 ${isSubActive
                      ? `${userType}-bg shadow-inner`
                      : "bg-white/50 hover:bg-white/80"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[13px] font-bold tracking-tight ${isSubActive ? "text-white" : `${userType}-text`
                        }`}
                    >
                      Booking #{idx + 1}
                    </span>
                    <span
                      className={`text-[11px] font-medium ${isSubActive ? "text-white/80" : "text-[#7D7D7D]"
                        }`}
                    >
                      {bookingDate}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {isPaid ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#6BAE41] text-white">
                        PAID
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInvoice(booking.service?.name);
                        }}
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#DC9600] text-white hover:bg-[#b87d00] transition-colors"
                      >
                        UNPAID
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>{renderContent()}</div>

      <HiddenMediaModal
        open={isHiddenMediaModalOpen}
        onClose={() => setIsHiddenMediaModalOpen(false)}
        currentService={activeService}
        mediaDateBoundary={mediaDateBoundary}
      />
    </div >
  );
};

export default FileManager;
