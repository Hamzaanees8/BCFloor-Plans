"use client";
import QuickViewCard, { AgentData } from "@/components/QuickViewCard";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import CoAgentTable from "@/components/CoAgentTable";
import AddCoAgentModal from "@/components/AddCoAgentModal";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import {
  GetCoAgents,
  UnlinkCoAgent,
  CoAgent,
} from "../../sub-accounts/subaccounts";
import { Button } from "@/components/ui/button";

const CoAgentsTab = ({ agentId }: { agentId: string }) => {
  const [showCard, setShowCard] = React.useState(false);
  const [coAgentData, setCoAgentData] = useState<CoAgent[]>([]);
  const [addCoAgentOpen, setAddCoAgentOpen] = useState(false);

  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  const [loadingCoAgents, setLoadingCoAgents] = useState<boolean>(true);
  const [errorCoAgents, setErrorCoAgents] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<AgentData>();

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

  return (
    <div>
      <div
        className="w-full min-h-[80px] bg-[#E4E4E4] font-alexandria z-10 relative flex flex-wrap justify-between px-[20px] py-3 items-center gap-3"
        style={{ boxShadow: "0px 4px 4px #0000001F" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[16px] md:text-[18px] font-[600] text-[#333333]">
            Co-Agents / Partners ({coAgentData.length})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
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
          coAgentData={coAgentData}
          loading={loadingCoAgents}
          error={errorCoAgents}
          onUnlink={handleUnlinkCoAgent}
          onQuickView={(data) => {
            setShowCard(true);
            setSelectedData(data);
          }}
        />

        {showCard && selectedData && (
          <QuickViewCard
            type="agent"
            data={selectedData}
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

export default CoAgentsTab;
