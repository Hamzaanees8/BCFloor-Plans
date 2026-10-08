"use client";
import QuickViewCard, { AgentData } from "@/components/QuickViewCard";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import CoAgentTable from "@/components/CoAgentTable";
import AddCoAgentModal from "@/components/AddCoAgentModal";
import {
  GetCoAgents,
  UnlinkCoAgent,
  CoAgent,
} from "../sub-accounts/subaccounts";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { GetOrganizations } from "@/app/dashboard/global-settings/global-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CoAgentsPage = () => {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId") || "";
  const [showCard, setShowCard] = React.useState(false);
  const [coAgentData, setCoAgentData] = useState<CoAgent[]>([]);
  const [addCoAgentOpen, setAddCoAgentOpen] = useState(false);

  const { userType } = useAppContext();
  const { isSuperAdmin } = useUser();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgFilter, setOrgFilter] = useState<string>("all");

  const [loadingCoAgents, setLoadingCoAgents] = useState<boolean>(true);
  const [errorCoAgents, setErrorCoAgents] = useState<boolean>(false);

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

  const [selectedData1, setSelectedData1] = useState<AgentData>();
  const headerRef = useRef<HTMLDivElement>(null);

  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  const fetchCoAgents = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoadingCoAgents(false);
      setErrorCoAgents(true);
      return;
    }
    setLoadingCoAgents(true);
    setErrorCoAgents(false);

    GetCoAgents(token, agentId || undefined)
      .then((data) => {
        setCoAgentData(Array.isArray(data.data) ? data.data : []);
        if (data.success === false) {
          setErrorCoAgents(true);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch co-agents:", err);
        setErrorCoAgents(true);
      })
      .finally(() => {
        setLoadingCoAgents(false);
      });
  }, [agentId]);

  useEffect(() => {
    fetchCoAgents();
  }, [fetchCoAgents]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let ancestor = header.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      if (
        style.overflowX === "hidden" ||
        ancestor.classList.contains("overflow-x-hidden")
      ) {
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
  }, [headerRef]);

  const handleUnlinkCoAgent = async (uuid: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      await UnlinkCoAgent(uuid, token, agentId || undefined);
      toast.success("Co-Agent unlinked successfully");
      setCoAgentData((prev) => prev.filter((coAgent) => coAgent.uuid !== uuid));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Unlink failed:", error.message);
        toast.error(error.message || "Failed to unlink Co-Agent");
      } else {
        console.error("Unlink failed:", error);
        toast.error("Failed to unlink Co-Agent");
      }
    }
  };

  const filteredCoAgents = coAgentData.filter((coAgent) => {
    if (
      orgFilter !== "all" &&
      coAgent.organization_id &&
      String(coAgent.organization_id) !== orgFilter
    ) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <div
        ref={headerRef}
        className="w-full min-h-[80px] font-alexandria z-50 sticky top-0 flex flex-wrap justify-between px-[20px] py-3 items-center gap-3"
        style={{
          backgroundColor: roleSettings.pageBg,
          boxShadow: "0px 4px 4px #0000001F",
        }}
      >
        <div className="flex items-center gap-2">
          <span className={`text-[16px] md:text-[18px] font-[600] ${userType}-text`}>
            Co-Agents / Partners ({filteredCoAgents.length})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger
                className="w-[180px] h-[35px] md:h-[42px] text-[#666666] border border-[#BBBBBB] rounded-[6px]"
                style={{ backgroundColor: roleSettings.pageBg }}
              >
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent
                className="border border-[#BBBBBB]"
                style={{ backgroundColor: roleSettings.pageBg }}
              >
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={String(org.id)}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={() => setAddCoAgentOpen(true)}
            className="w-[130px] md:w-[160px] h-[35px] md:h-[44px] justify-center rounded-[6px] border-[1px] text-[13px] md:text-[15px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110 shadow-sm"
            style={{
              backgroundColor: roleSettings.pageTabColor,
              borderColor: roleSettings.pageTabColor,
            }}
          >
            + Add Co-Agent
          </Button>
        </div>
      </div>

      <div className="w-full">
        <CoAgentTable
          coAgentData={filteredCoAgents}
          loading={loadingCoAgents}
          error={errorCoAgents}
          onUnlink={handleUnlinkCoAgent}
          onQuickView={(data) => {
            setShowCard(true);
            setSelectedData1(data);
          }}
          isSuperAdmin={isSuperAdmin}
        />

        {showCard && selectedData1 && (
          <QuickViewCard
            type="agent"
            data={selectedData1}
            hideEdit={true}
            onClose={() => setShowCard(false)}
          />
        )}
      </div>

      <AddCoAgentModal
        open={addCoAgentOpen}
        setOpen={setAddCoAgentOpen}
        agentUuid={agentId || undefined}
        onSuccess={fetchCoAgents}
      />
    </div>
  );
};

export default CoAgentsPage;
