"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
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
} from "./matterport";
import { useAppContext } from "@/app/context/AppContext";
import DropdownActions from "@/components/DropdownActions";
import Link from "next/link";
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from "@tanstack/react-table";
import { useUser } from "@/context/UserContext";
import { GetOrganizations } from "@/app/dashboard/global-settings/global-settings";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileMatterportList from "@/components/mobile/matterport/MobileMatterportList";

const options = [
  { label: "Activate" },
  { label: "Deactivate" },
  { label: "Delete", confirm1: true },
];

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
  const [filter, setFilter] = useState("Show All");
  const [addressFilter, setAddressFilter] = useState<string>("");
  const { userType } = useAppContext();
  const { isSuperAdmin } = useUser();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgFilter, setOrgFilter] = useState<string>("all");

  const [loading, setLoading] = useState<boolean>(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isSuperAdmin) {
      GetOrganizations()
        .then(res => {
          if (res.status && Array.isArray(res.data)) {
            setOrganizations(res.data);
          }
        })
        .catch(err => console.error("Failed to fetch organizations:", err));
    }
  }, [isSuperAdmin]);

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

  /*
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  */

  const filteredData = useMemo(() => {
    let result = matterports;

    if (orgFilter !== "all") {
      result = result.filter((item) => String(item.organizationId) === orgFilter);
    }

    if (filter !== "Show All") {
      if (filter === "ACTIVE") {
        result = result.filter((item) => item.status === "ACTIVE");
      } else if (filter === "RENEWAL NEEDED") {
        result = result.filter((item) => item.renewal === "RENEW");
      } else {
        result = result.filter((item) => item.status === filter);
      }
    }

    if (addressFilter.trim()) {
      const searchLower = addressFilter.toLowerCase();
      result = result.filter(
        (item) =>
          item.agentName.toLowerCase().includes(searchLower) ||
          item.address.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [matterports, filter, addressFilter, orgFilter]);

  const columns = useMemo<ColumnDef<MatterportAd>[]>(() => {
    const cols: ColumnDef<MatterportAd>[] = [
      {
        accessorKey: "agentName",
        header: "AGENT NAME",
        cell: ({ row }) => <div className="text-[15px] font-[400] text-[#666666]">{row.original.agentName}</div>
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
        )
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
        )
      },
      {
        accessorKey: "reminderDate",
        header: "REMINDER DATE",
        cell: ({ row }) => <div className="text-[15px] font-[400] text-[#666666]">{row.original.reminderDate}</div>
      },
      {
        accessorKey: "renewalDate",
        header: "RENEWAL DATE",
        cell: ({ row }) => <div className="text-[15px] font-[400] text-[#666666]">{row.original.renewalDate}</div>
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
        }
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
        }
      },
      {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ row }) => {
          const status = row.original.status;
          return status ? (
            <div className="text-center">
              <span
                className={`px-[7px] py-[1.5px] text-white rounded-[10px] text-[10px] leading-[100%] ${status === "ACTIVE" ? "!bg-[#6BAE41]" : "bg-[#DC9600]"}`}
              >
                {status}
              </span>
            </div>
          ) : null;
        }
      },
      {
        id: "actions",
        header: () => <div className="text-center">ACTION</div>,
        cell: () => (
          <div className="flex justify-center">
            <DropdownActions options={options} />
          </div>
        )
      }
    ];

    if (isSuperAdmin) {
      cols.splice(1, 0, {
        accessorKey: "organizationName",
        header: "ORGANIZATION",
        cell: ({ row }) => <div className="text-[15px] font-[400] text-[#666666]">{row.original.organizationName || "Global / None"}</div>
      });
    }

    return cols;
  }, [isSuperAdmin]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token") || "";

      try {
        const response = await GetMatterPort(token);
        console.log("Raw Matterport API response:", response);
        // ✅ IMPORTANT: normalize response shape
        const apiData = Array.isArray(response)
          ? response
          : response?.data ?? [];

        // ✅ MAP API → UI MODEL
        const mapped: MatterportAd[] = apiData.map(mapMatterportApiToAd);

        setMatterports(mapped);

        console.log("Mapped Matterport data:", mapped);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching Matterport data:", error);
      }
    };

    fetchData();
  }, []);

  //   const getStatusColor = (status: string) => {
  //     switch (status) {
  //       case "ACTIVE":
  //         return "!bg-[#6BAE41]";
  //       case "INACTIVE":
  //         return "!bg-[#A3A3A3]";
  //       default:
  //         return "";
  //     }
  //   };

  if (isMobile) {
    return (
      <div className="font-alexandria pb-16">
        {/* Header */}
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

        {/* Filters */}
        <div className="p-4 space-y-2.5 bg-gray-50 border-b">
          <input
            type="text"
            placeholder="Search address..."
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
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="RENEWAL NEEDED">Renewal Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <MobileMatterportList
          tours={filteredData}
          loading={loading}
          isSuperAdmin={isSuperAdmin}
          options={options}
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
        <p className={`text-[16px] md:text-[24px] font-[400] ${userType}-text`}>
          3D Tours / Matterport ({filteredData.length})
        </p>

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
              placeholder="Search address..."
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
              className={`w-[174px] h-[42px] text-[#666666] border-[1px] border-[#BBBBBB] ${userType === "admin"
                ? "[&>svg]:text-[#4290E9]"
                : userType === "agent"
                  ? "[&>svg]:text-[#6BAE41]"
                  : "[&>svg]:text-[#4290E9]"
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
                value="INACTIVE"
                className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
              >
                Inactive
              </SelectItem>
              <SelectItem
                value="RENEWAL NEEDED"
                className="p-0 px-[16px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
              >
                Renewal Needed
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
    </div>
  );
};

export default MatterportPage;
