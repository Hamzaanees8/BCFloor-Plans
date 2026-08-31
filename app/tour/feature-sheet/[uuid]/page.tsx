"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FileManagerProvider, useFileManagerContext } from "@/app/dashboard/file-manager/FileManagerContext";
import { featureSheetService } from "@/app/dashboard/file-manager/file-manager";
import { FeatureSheetResponse } from "@/app/dashboard/file-manager/types/featureSheetTypes";
import CreateFeatureSheet from "@/app/dashboard/file-manager/components/CreateFeatureSheet";
import { fetchPublicTourData, OrderData } from "@/app/tour/tour";
import { GetOneOrder } from "@/app/dashboard/orders/orders";
import { Loader2 } from "lucide-react";

const FeatureSheetClient = ({ 
  sheet, 
  orderData 
}: { 
  sheet: FeatureSheetResponse; 
  orderData: OrderData | null;
}) => {
  const { setFeatureSheets } = useFileManagerContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Populate the context with this single sheet so CreateFeatureSheet can find it
    setFeatureSheets([sheet]);
    setReady(true);
  }, [sheet, setFeatureSheets]);

  if (!ready) return null;

  return (
    <CreateFeatureSheet 
      orderData={orderData as any} 
      isReadonly={true} 
      previewSheetUuid={sheet.uuid}
    />
  );
};

const FeatureSheetPreviewPage = () => {
  const params = useParams();
  const uuid = params.uuid as string;

  const [featureSheet, setFeatureSheet] = useState<FeatureSheetResponse | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch feature sheet
        const sheetResponse = await featureSheetService.getFeatureSheet(uuid);
        const sheet = Array.isArray(sheetResponse) ? sheetResponse[0] : (sheetResponse as any).data || sheetResponse;
        
        if (!sheet) {
          throw new Error("Feature sheet not found");
        }
        
        setFeatureSheet(sheet);

        // 2. Fetch order data (needed for templates)
        if (sheet.order_id) {
          let order = null;
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

          if (token) {
            try {
              const adminData = await GetOneOrder(token, sheet.order_id);
              order = adminData.data || adminData;
            } catch (authErr) {
              console.warn("Authenticated fetch failed, falling back to public tour data", authErr);
            }
          }

          if (!order) {
            order = await fetchPublicTourData(sheet.order_id);
          }
          
          setOrderData(order);
        }
      } catch (err) {
        console.error("Error fetching preview data:", err);
        setError("Failed to load feature sheet preview.");
      } finally {
        setLoading(false);
      }
    };

    if (uuid) {
      fetchData();
    }
  }, [uuid]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !featureSheet) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-xl font-semibold text-gray-700">{error || "Feature sheet not found"}</p>
      </div>
    );
  }

  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || localStorage.getItem("agentToken")) : null;
  const isDraft = !featureSheet.is_published;

  if (isDraft && !token) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 gap-4 p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Feature Sheet Not Published</h2>
          <p className="text-gray-600">This feature sheet is currently in draft mode and not viewable on the public tour.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <FileManagerProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col w-full">
          <FeatureSheetClient sheet={featureSheet} orderData={orderData} />
        </div>
      </FileManagerProvider>
    </SidebarProvider>
  );
};

export default FeatureSheetPreviewPage;
