"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useEffect, useState, useRef } from "react";
import { BackArrow } from "@/components/Icons";
import {
  useParams,
  usePathname,
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
import { useAppContext } from "@/app/context/AppContext";
import { Button } from "@/components/ui/button";
import { useFileManagerContext, Files } from "../FileManagerContext";
import { useGlobalFileUpload } from "@/context/GlobalFileUploadContext";
import { useUnsaved } from "@/app/context/UnsavedContext";
import { toast } from "sonner";
import InvoicePaymentDialog from "./invoicePaymentDialog";
import {
  GetFilesData,
} from "../file-manager";
import { GetOneListing } from "../../listings/listing";
import { Listings } from "@/lib/types";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type Service = {
  uuid: string;
  name: string;
};
type OrerServices = {
  service: Service;
};

const FileManager = () => {
  const router = useRouter();
  const [services, setServices] = React.useState([]);
  const [servicesData, setServicesData] = React.useState<Services[]>([]);
  const [activeTab, setActiveTab] = useState<string>("download");
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
    setIsSaving
  } = useFileManagerContext();
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

  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [currentListing, setCurrentListing] = useState<Listings | null>(null);
  const pathname = usePathname();
  const serviceIdFromURL = searchParams.get("serviceId");

  const fullUrl = `/dashboard${pathname.replace("/dashboard", "")}${searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

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

  const renderContent = () => {
    if (activeTab === "tour") {
      return <TourTabs orderData={orderData} />;
    }

    if (activeTab === "download") {
      return <DownloadTab orderData={orderData} />;
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
              isListing={false}
              reviewFilesEnabled={reviewFilesEnabled}
              onSave={handleSave}
            />
          </div>
        );
      case "Floor Plan":
        return (
          <Service
            orderData={orderData}
            currentService={activeService}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onSave={handleSave}
          />
        );
      case "HDR Photos":
        return (
          <FileTab1
            currentService={activeService}
            orderData={orderData}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onSave={handleSave}
          />
        );
      case "3d rendering":
        return (
          <FileTab2
            currentService={activeService}
            orderData={orderData}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
          />
        );
      case "drone":
        return (
          <FileTab1
            currentService={activeService}
            orderData={orderData}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onSave={handleSave}
          />
        );
      case "Staging":
        return (
          <FileTab2
            currentService={activeService}
            orderData={orderData}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
          />
        );
      case "Standard Photos":
        return (
          <FileTab1
            currentService={activeService}
            orderData={orderData}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onSave={handleSave}
          />
        );
      case "Twilight Photos":
        return (
          <FileTab1
            currentService={activeService}
            orderData={orderData}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
            onSave={handleSave}
          />
        );
      case "3D Tour":
        return (
          <FileTab2
            currentService={activeService}
            orderData={orderData}
            isListing={false}
            reviewFilesEnabled={reviewFilesEnabled}
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

  // Add this function to get the current active service with pricing info
  const getCurrentService = () => {
    const serviceFromData = servicesData?.find((srv) => srv.uuid === activeTab);
    const serviceFromOrder = orderData?.services?.find(
      (srv: OrerServices) => srv.service?.uuid === activeTab
    );
    // If no service found at all, return null
    if (!serviceFromData && !serviceFromOrder) {
      return null;
    }

    // Let the payment dialog handle the "no price" case
    return {
      name: serviceFromData?.name,
      amount: Number(
        serviceFromOrder?.amount !== undefined ? serviceFromOrder?.amount : 0
      ),
      uuid: serviceFromOrder?.uuid,
    };
  };
  interface CurrentServiceType {
    name: string | undefined;
    amount: number | undefined;
    uuid: string | undefined;
  }
  // Use this in your component
  const currentService: CurrentServiceType | null = getCurrentService();

  useEffect(() => {
    async function fetchFilesData() {
      const token = localStorage.getItem("token");
      if (!token || !orderData) {
        console.log("Token not found.");
        return;
      }
      try {
        const filesData = await GetFilesData(token, orderData?.uuid || "");
        if (filesData.data[0]) {
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
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "An error occurred while getting changes."
        );
      }
    }
    fetchFilesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData]);



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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        cancelLabel: "Cancel",
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
        {/* Invoice Payment Dialog - Move this outside the header div */}
        <InvoicePaymentDialog
          open={showInvoiceDialog}
          onClose={() => setShowInvoiceDialog(false)}
          orderData={orderData}
          currentService={currentService} // Pass the actual service object
          activeTab={activeTab}
          userType={userType}
          url={fullUrl}
        />
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
            onClick={() => setShowInvoiceDialog(true)} // Add this onClick handler
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
            {services?.map((service: OrerServices) => {
              const isActive = service.service.uuid === activeTab;
              return (
                <div
                  key={service.service.uuid}
                  onClick={() => {
                    setActiveTab(service.service.uuid);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("serviceId", service.service.uuid);
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
                  {service.service.name}
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
      </div>
      <div>{renderContent()}</div>
    </div >
  );
};

export default FileManager;
