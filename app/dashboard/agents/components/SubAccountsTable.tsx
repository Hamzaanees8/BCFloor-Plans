"use client";
import QuickViewCard, { AgentData, SubAccountData } from "@/components/QuickViewCard";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import SubAccountTable, { SubAccount } from "@/components/SubAccountTable";
import CoAgentTable from "@/components/CoAgentTable";
import AddCoAgentModal from "@/components/AddCoAgentModal";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import {
  Delete,
  Get,
  GetCoAgents,
  UnlinkCoAgent,
  CoAgent,
} from "../../sub-accounts/subaccounts";
import { Button } from "@/components/ui/button";

const SubAccountsTable = ({ agentId }: { agentId: string }) => {
  const [activeTab, setActiveTab] = useState<"staff" | "coagents">("staff");
  const [showCard, setShowCard] = React.useState(false);
  const [type, setType] = React.useState("");
  const [showHeader, setShowHeader] = useState(true);
  const [subAccountData, setSubAccountData] = useState<SubAccount[]>([]);
  const [coAgentData, setCoAgentData] = useState<CoAgent[]>([]);
  const [addCoAgentOpen, setAddCoAgentOpen] = useState(false);

  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  const [loadingStaff, setLoadingStaff] = useState<boolean>(true);
  const [loadingCoAgents, setLoadingCoAgents] = useState<boolean>(true);
  const [errorStaff, setErrorStaff] = useState<boolean>(false);
  const [errorCoAgents, setErrorCoAgents] = useState<boolean>(false);

  const [selectedData, setSelectedData] = useState<SubAccountData | null>(null);
  const [selectedData1, setSelectedData1] = useState<AgentData>();

  const fetchStaff = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoadingStaff(false);
      setErrorStaff(true);
      return;
    }
    setLoadingStaff(true);
    setErrorStaff(false);

    Get(token)
      .then((data) => {
        setSubAccountData(Array.isArray(data.data) ? data.data : []);
        if (data.success === false) {
          setErrorStaff(true);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch staff:", err);
        setErrorStaff(true);
      })
      .finally(() => {
        setLoadingStaff(false);
      });
  }, []);

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
    fetchStaff();
    fetchCoAgents();
  }, [fetchStaff, fetchCoAgents]);

  const handleDelete = async (userId: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      await Delete(userId, token);
      toast.success("Sub-Account deleted successfully");
      setSubAccountData((prev) =>
        prev.filter((subaccount) => subaccount.uuid !== userId)
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error("Delete failed:", error.message);
        toast.error(error.message || "Failed to delete Sub-Account");
      } else {
        console.error("Delete failed:", error);
        toast.error("Failed to delete Sub-Account");
      }
    }
  };

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

  const filteredSubAccounts = subAccountData.filter((subAccount) => {
    if (agentId) {
      const subAgentUuid =
        subAccount.agent?.uuid || (subAccount as any)?.agent_uuid;
      const subAgentId =
        (subAccount as any)?.agent?.id || (subAccount as any)?.agent_id;
      return (
        subAgentUuid === agentId ||
        (subAgentId && String(subAgentId) === String(agentId))
      );
    }
    return true;
  });

  return (
    <div>
      <div
        className="w-full min-h-[80px] bg-[#E4E4E4] font-alexandria z-10 relative flex flex-wrap justify-between px-[20px] py-3 items-center gap-3"
        style={{ boxShadow: "0px 4px 4px #0000001F" }}
      >
        {/* Inner Tabs: Staff vs Co-Agents */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-2 rounded-[6px] text-[14px] md:text-[16px] font-[500] transition-colors ${
              activeTab === "staff"
                ? "text-white shadow-sm"
                : "text-[#666666] hover:bg-black/5"
            }`}
            style={
              activeTab === "staff"
                ? { backgroundColor: roleSettings.pageTabColor }
                : {}
            }
          >
            Staff / Assistants ({filteredSubAccounts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("coagents")}
            className={`px-4 py-2 rounded-[6px] text-[14px] md:text-[16px] font-[500] transition-colors ${
              activeTab === "coagents"
                ? "text-white shadow-sm"
                : "text-[#666666] hover:bg-black/5"
            }`}
            style={
              activeTab === "coagents"
                ? { backgroundColor: roleSettings.pageTabColor }
                : {}
            }
          >
            Co-Agents / Partners ({coAgentData.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "staff" ? (
            <Link
              href={`/dashboard/sub-accounts/create?agentId=${agentId}`}
              onClick={() => {
                setShowHeader(false);
              }}
              className={`w-[120px] md:w-[150px] h-[35px] md:h-[44px] justify-center rounded-[6px] border-[1px] text-[13px] md:text-[15px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110 shadow-sm`}
              style={{
                backgroundColor: roleSettings.pageTabColor,
                borderColor: roleSettings.pageTabColor,
              }}
            >
              + Add Staff
            </Link>
          ) : (
            <Button
              type="button"
              onClick={() => setAddCoAgentOpen(true)}
              className={`w-[130px] md:w-[160px] h-[35px] md:h-[44px] justify-center rounded-[6px] border-[1px] text-[13px] md:text-[15px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110 shadow-sm`}
              style={{
                backgroundColor: roleSettings.pageTabColor,
                borderColor: roleSettings.pageTabColor,
              }}
            >
              + Add Co-Agent
            </Button>
          )}
        </div>
      </div>

      <div className="w-full">
        {activeTab === "staff" ? (
          <SubAccountTable
            subAccountData={filteredSubAccounts}
            showHeader={showHeader}
            setSubAccountData={setSubAccountData}
            setShowHeader={setShowHeader}
            onQuickView={(selectedType, data) => {
              setShowCard(true);
              setType(selectedType);
              setSelectedData(data);
            }}
            onQuickView1={(selectedType, data) => {
              setShowCard(true);
              setType(selectedType);
              setSelectedData1(data);
            }}
            onDelete={handleDelete}
            loading={loadingStaff}
            error={errorStaff}
          />
        ) : (
          <CoAgentTable
            coAgentData={coAgentData}
            loading={loadingCoAgents}
            error={errorCoAgents}
            onUnlink={handleUnlinkCoAgent}
            onQuickView={(data) => {
              setShowCard(true);
              setType("agent");
              setSelectedData1(data);
            }}
          />
        )}

        {type === "agent" && showCard && selectedData1 && (
          <QuickViewCard
            type="agent"
            data={selectedData1}
            onClose={() => setShowCard(false)}
          />
        )}
        {type === "subaccount" && showCard && selectedData && (
          <QuickViewCard
            type="subaccount"
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

export default SubAccountsTable;