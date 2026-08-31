"use client";
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GetMatterPort,
  mapMatterportApiToAd,
  MatterportAd,
  MatterportStatus,
  RenewalPlan,
  SendRenewalReminder,
} from "./matterport";
import { useAppContext } from "@/app/context/AppContext";
import Link from "next/link";
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from "@tanstack/react-table";
import { useUser } from "@/context/UserContext";
import { GetOrganizations } from "@/app/dashboard/global-settings/global-settings";
import { Copy, Check, ExternalLink, ShieldCheck, Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileMatterportList from "@/components/mobile/matterport/MobileMatterportList";
import MatterportRenewModal from "@/components/MatterportRenewModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CopyableLink = ({ url }: { url: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="flex items-center gap-2 max-w-[200px] group">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#4290E9] hover:underline truncate text-[14px] font-[400]"
        title={url}
      >
        {url}
      </a>
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
        title="Copy Link"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500 animate-in fade-in zoom-in duration-200" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        )}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Open in new tab"
      >
        <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-[#4290E9]" />
      </a>
    </div>
  );
};

const MatterportPage = () => {
  const [matterports, setMatterports] = useState<MatterportAd[]>([]);
  const [renewalPlans, setRenewalPlans] = useState<RenewalPlan[]>([]);
  const [filter, setFilter] = useState("Show All");
  const [addressFilter, setAddressFilter] = useState<string>("");
  const { userType } = useAppContext();
  const { isSuperAdmin } = useUser();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgFilter, setOrgFilter] = useState<string>("all");

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTourForRenewal, setSelectedTourForRenewal] = useState<MatterportAd | null>(null);
  const [renewalModalOpen, setRenewalModalOpen] = useState<boolean>(false);
  const [sendingReminderUuid, setSendingReminderUuid] = useState<string | null>(null);

  const headerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isSuperAdmin) {
      GetOrganizations()
        .then((res) => {
          if (res.status && Array.isArray(res.data)) {
            setOrganizations(res.data);
          }
        })
        .catch((err) => console.error("Failed to fetch organizations:", err));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let ancestor = header.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      if (style.overflowX === "hidden" || ancestor.classList.contains("overflow-x-hidden")) {
        ancestor.style.setProperty("overflow-x", "visible", "important");
        ancestor.style.setProperty("overflow-y", "visible", "important");

        const target = ancestor;
        return () => {
          target.style.removeProperty("overflow-x");
          target.style.removeProperty("overflow-y");
        };
      }
      ancestor = ancestor.parentElement;
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token") || "";

    try {
      const response = await GetMatterPort(token);
      const apiData = Array.isArray(response) ? response : response?.data ?? [];
      if (response?.meta?.renewal_plans) {
        setRenewalPlans(response.meta.renewal_plans);
      }

      const mapped: MatterportAd[] = apiData.map(mapMatterportApiToAd);
      setMatterports(mapped);
    } catch (error) {
      console.error("Error fetching Matterport data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendReminder = async (tour: MatterportAd) => {
    const token = localStorage.getItem("token") || "";
    setSendingReminderUuid(tour.tourUuid);
    try {
      const res = await SendRenewalReminder(token, tour.tourUuid);
      if (res.success) {
        toast.success(`Renewal reminder sent to ${tour.agentName || "agent"}`);
      } else {
        toast.error(res.message || "Failed to send reminder");
      }
    } catch (err: any) {
      console.error("Reminder error:", err);
      toast.error(err.response?.data?.message || "Failed to send reminder email");
    } finally {
      setSendingReminderUuid(null);
    }
  };

  const filteredData = useMemo(() => {
    let result = matterports;

    if (orgFilter !== "all") {
      result = result.filter((item) => String(item.organizationId) === orgFilter);
    }

    if (filter !== "Show All") {
      if (filter === "ACTIVE") {
        result = result.filter((item) => item.status === MatterportStatus.ACTIVE);
      } else if (filter === "EXPIRING_SOON") {
        result = result.filter((item) => item.status === MatterportStatus.EXPIRING_SOON);
      } else if (filter === "EXPIRED") {
        result = result.filter((item) => item.status === MatterportStatus.EXPIRED);
      }
    }

    if (addressFilter.trim()) {
      const searchLower = addressFilter.toLowerCase();
      result = result.filter(
        (item) =>
          item.agentName.toLowerCase().includes(searchLower) ||
          item.address.toLowerCase().includes(searchLower) ||
          item.orderNumber.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [matterports, filter, addressFilter, orgFilter]);

  const columns = useMemo<ColumnDef<MatterportAd>[]>(() => {
    const cols: ColumnDef<MatterportAd>[] = [
      {
        accessorKey: "agentName",
        header: "AGENT NAME",
        cell: ({ row }) => (
          <div>
            <div className="text-[15px] font-[500] text-[#333333]">{row.original.agentName}</div>
            {row.original.agentEmail && (
              <div className="text-xs text-[#888888]">{row.original.agentEmail}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "orderNumber",
        header: "ORDER NUMBER",
        cell: ({ row }) => (
          <div className="text-[15px] font-[400] text-[#4290E9]">
            <Link href={`orders/${row.original.orderuud}`}>
              {row.original.orderNumber}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "address",
        header: "ADDRESS",
        cell: ({ row }) => (
          <div className="text-[15px] font-[400] text-[#4290E9]">
            <Link href={`listings/create/${row.original.propertyuuid}`}>
              {row.original.address}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "renewalDate",
        header: "EXPIRATION DATE",
        cell: ({ row }) => {
          const item = row.original;
          const days = item.daysRemaining;

          return (
            <div>
              <div className="text-[14px] font-[500] text-[#333333]">{item.renewalDate}</div>
              {days !== null && (
                <div className="text-[11px] font-medium mt-0.5">
                  {days < 0 ? (
                    <span className="text-red-600 font-bold">
                      Expired {Math.abs(days)}d ago
                    </span>
                  ) : days <= 30 ? (
                    <span className="text-amber-600 font-bold">
                      Expires in {days}d
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      {days} days left
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "brandedLink",
        header: "BRANDED LINK",
        cell: ({ row }) => {
          const url = row.original.brandedLink;
          return url ? (
            <CopyableLink url={url} />
          ) : (
            <span className="text-gray-400 italic text-[14px]">None</span>
          );
        },
      },
      {
        accessorKey: "unbrandedLink",
        header: "UNBRANDED LINK",
        cell: ({ row }) => {
          const url = row.original.unbrandedLink;
          return url ? (
            <CopyableLink url={url} />
          ) : (
            <span className="text-gray-400 italic text-[14px]">None</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ row }) => {
          const status = row.original.status;
          let badgeBg = "bg-green-600";
          let label = "ACTIVE";

          if (status === MatterportStatus.EXPIRED) {
            badgeBg = "bg-red-600";
            label = "EXPIRED";
          } else if (status === MatterportStatus.EXPIRING_SOON) {
            badgeBg = "bg-amber-500";
            label = "EXPIRING SOON";
          } else if (status === MatterportStatus.INACTIVE) {
            badgeBg = "bg-gray-500";
            label = "INACTIVE";
          }

          return (
            <div className="text-center">
              <span
                className={`px-[8px] py-[3px] text-white rounded-[10px] text-[10px] font-bold leading-[100%] ${badgeBg}`}
              >
                {label}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">ACTIONS</div>,
        cell: ({ row }) => {
          const tour = row.original;
          const isReminding = sendingReminderUuid === tour.tourUuid;

          return (
            <div className="flex items-center justify-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setSelectedTourForRenewal(tour);
                  setRenewalModalOpen(true);
                }}
                className="h-8 px-2.5 bg-[#4290E9] hover:bg-[#357ac8] text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1"
                title="Renew / Pay for Hosting"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Renew
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isReminding}
                onClick={() => handleSendReminder(tour)}
                className="h-8 px-2 border-gray-300 text-gray-700 hover:bg-gray-100 text-xs rounded-md flex items-center gap-1"
                title="Send Reminder Email to Agent"
              >
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                {isReminding ? "Sending..." : "Remind"}
              </Button>
            </div>
          );
        },
      },
    ];

    if (isSuperAdmin) {
      cols.splice(1, 0, {
        accessorKey: "organizationName",
        header: "ORGANIZATION",
        cell: ({ row }) => (
          <div className="text-[15px] font-[400] text-[#666666]">
            {row.original.organizationName || "Global / None"}
          </div>
        ),
      });
    }

    return cols;
  }, [isSuperAdmin, sendingReminderUuid]);

  if (isMobile) {
    return (
      <div className="font-alexandria pb-16">
        <div
          className="w-full h-14 z-50 sticky top-0 flex justify-between px-4 items-center border-b shadow-sm"
          style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
        >
          <p className={`text-base font-medium ${userType}-text`}>
            Matterport ({filteredData.length})
          </p>
          {isSuperAdmin && (
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="h-8 text-xs border bg-white rounded-md w-28">
                <SelectValue placeholder="All Orgs" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                <SelectItem value="all">All Orgs</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="p-4 space-y-2.5 bg-gray-50 border-b">
          <input
            type="text"
            placeholder="Search address or agent..."
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="w-full px-3 h-10 border border-gray-300 rounded-md focus:outline-none text-sm bg-white"
          />
          <Select onValueChange={(value) => setFilter(value)} defaultValue="Show All">
            <SelectTrigger className="w-full h-9 bg-white text-xs">
              <SelectValue placeholder="Show All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Show All">Show All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRING_SOON">Expiring Soon (30 Days)</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <MobileMatterportList
          tours={filteredData}
          loading={loading}
          isSuperAdmin={isSuperAdmin}
          options={[]}
        />

        <MatterportRenewModal
          open={renewalModalOpen}
          onOpenChange={setRenewalModalOpen}
          tourItem={selectedTourForRenewal}
          onSuccess={fetchData}
          renewalPlans={renewalPlans}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 ">
      <div
        ref={headerRef}
        className="w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center"
        style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`, boxShadow: "0px 4px 4px #0000001F" }}
      >
        <div className="flex items-center gap-3">
          <p className={`text-[16px] md:text-[24px] font-[400] ${userType}-text`}>
            3D Tours / Matterport Hosting ({filteredData.length})
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {isSuperAdmin && (
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-[180px] h-[42px] text-[#666666] border border-[#BBBBBB] rounded-[6px]" style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent className="border border-[#BBBBBB]" style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search address or agent..."
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
              className="w-full px-3 h-[42px] py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:ring-blue-500"
              style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
            />
          </div>
          <Select
            onValueChange={(value) => setFilter(value)}
            defaultValue="Show All"
          >
            <SelectTrigger
              className={`w-[190px] h-[42px] text-[#666666] border-[1px] border-[#BBBBBB] ${
                userType === "admin"
                  ? "[&>svg]:text-[#4290E9]"
                  : "[&>svg]:text-[#6BAE41]"
              } [&>svg]:opacity-100`}
              style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
            >
              <SelectValue placeholder="Show All" />
            </SelectTrigger>

            <SelectContent
              className="rounded-none w-full py-[12px] text-[#666666]"
              style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
            >
              <SelectItem
                value="Show All"
                className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
              >
                Show All
              </SelectItem>
              <SelectItem
                value="ACTIVE"
                className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
              >
                Active
              </SelectItem>
              <SelectItem
                value="EXPIRING_SOON"
                className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
              >
                Expiring Soon (30 Days)
              </SelectItem>
              <SelectItem
                value="EXPIRED"
                className="p-0 px-[16px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
              >
                Expired
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full relative min-w-0">
        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          dataName="Matterports"
          userType={userType}
        />
      </div>

      <MatterportRenewModal
        open={renewalModalOpen}
        onOpenChange={setRenewalModalOpen}
        tourItem={selectedTourForRenewal}
        onSuccess={fetchData}
        renewalPlans={renewalPlans}
      />
    </div>
  );
};

export default MatterportPage;
