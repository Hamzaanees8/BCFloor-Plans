"use client";

import React, { useEffect, useState, useRef } from "react";
import { GetPrintRequests, UpdatePrintRequestStatus, PrintRequest } from "./print-requests";
import { toast } from "sonner";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePrintRequestsList from "@/components/mobile/admin/MobilePrintRequestsList";

const Page = () => {
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  const [printRequests, setPrintRequests] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await GetPrintRequests();
      setPrintRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching print requests:", err);
      setError(true);
      toast.error("Failed to load print requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (uuid: string, newStatus: string) => {
    try {
      await UpdatePrintRequestStatus(uuid, newStatus);
      toast.success("Status updated successfully");
      setPrintRequests((prev) =>
        prev.map((req) =>
          req.uuid === uuid ? { ...req, status: newStatus as any } : req
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const columns: ColumnDef<PrintRequest>[] = [
    {
      accessorKey: "created_at",
      header: "DATE",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at")).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "short",
            day: "2-digit",
          }
        );
        return <div className="text-[#666666]">{date}</div>;
      },
    },
    {
      id: "agent",
      header: "AGENT",
      cell: ({ row }) => {
        const agent = row.original.agent;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-[#424242]">
              {agent?.first_name} {agent?.last_name}
            </span>
            <span className="text-[12px] text-[#888888]">{agent?.email}</span>
          </div>
        );
      },
    },
    {
      id: "property",
      header: "PROPERTY ADDRESS",
      cell: ({ row }) => (
        <div className="text-[#666666] max-w-[250px] truncate">
          {row.original.property?.address || "N/A"}
        </div>
      ),
    },
    {
      id: "feature_sheet",
      header: "TEMPLATE",
      cell: ({ row }) => {
        const featureSheet = row.original.feature_sheet;
        const templateKey = featureSheet?.template_key || "N/A";
        const orderId = featureSheet?.order_id;
        const sheetUuid = featureSheet?.uuid;

        return (
          <div className="flex flex-col text-[#666666]">
            <span>{templateKey}</span>
            {orderId && sheetUuid && (
              <a
                href={`/dashboard/file-manager/${orderId}?serviceId=CreateFeatureSheet&sheetUuid=${sheetUuid}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline text-xs"
              >
                Preview Sheet
              </a>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "copies",
      header: "COPIES",
      cell: ({ row }) => (
        <div className="text-center font-semibold text-[#424242]">
          {row.getValue("copies")}
        </div>
      ),
    },
    {
      accessorKey: "with_bleed",
      header: "BLEED",
      cell: ({ row }) => (
        <div className="text-[#666666]">
          {row.getValue("with_bleed") ? "Yes" : "No"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const uuid = row.original.uuid;

        return (
          <Select
            value={status}
            onValueChange={(value) => handleStatusChange(uuid, value)}
          >
            <SelectTrigger
              className={`w-[130px] h-[32px] text-[12px] font-medium rounded-full border ${getStatusColor(
                status
              )}`}
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
  ];

  if (isMobile) {
    return (
      <ProtectedAdminRoute>
        <div className="font-alexandria pb-16">
          {/* Header */}
          <div
            className="w-full h-14 z-50 sticky top-0 flex justify-between px-4 items-center border-b shadow-sm"
            style={{ backgroundColor: roleSettings.pageBg }}
          >
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5" style={{ color: roleSettings.pageTabColor }} />
              <p className="text-base font-medium" style={{ color: roleSettings.pageTabColor }}>
                Print Requests ({printRequests.length})
              </p>
            </div>
          </div>

          <MobilePrintRequestsList
            requests={printRequests}
            loading={loading}
            error={error}
            handleStatusChange={handleStatusChange}
            getStatusColor={getStatusColor}
          />
        </div>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <div className="flex flex-col h-full bg-white">
        <div
          ref={headerRef}
          className="w-full h-[80px] font-alexandria z-50 sticky top-0 flex justify-between px-[20px] items-center"
          style={{
            backgroundColor: roleSettings.pageBg,
            boxShadow: "0px 4px 4px #0000001F",
          }}
        >
          <div className="flex items-center gap-3">
            <Printer className="w-6 h-6" style={{ color: roleSettings.pageTabColor }} />
            <p
              className="text-[16px] md:text-[24px] font-[400]"
              style={{ color: roleSettings.pageTabColor }}
            >
              Print Requests ({printRequests.length})
            </p>
          </div>
        </div>

        <div className="w-full flex-1 overflow-auto">
          <DataTable
            data={printRequests}
            columns={columns}
            dataName="Print Requests"
            userType={role}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </ProtectedAdminRoute>
  );
};

export default Page;
