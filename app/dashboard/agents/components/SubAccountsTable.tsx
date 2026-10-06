"use client";
import QuickViewCard, { AgentData, SubAccountData } from "@/components/QuickViewCard";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import SubAccountTable, { SubAccount } from "@/components/SubAccountTable";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import {
  Delete,
  Get,
} from "../../sub-accounts/subaccounts";

const SubAccountsTable = ({ agentId }: { agentId: string }) => {
  const [showCard, setShowCard] = React.useState(false);
  const [type, setType] = React.useState("");
  const [showHeader, setShowHeader] = useState(true);
  const [subAccountData, setSubAccountData] = useState<SubAccount[]>([]);

  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  const [loadingStaff, setLoadingStaff] = useState<boolean>(true);
  const [errorStaff, setErrorStaff] = useState<boolean>(false);

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

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

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
        <div className="flex items-center gap-2">
          <span className="text-[16px] md:text-[18px] font-[600] text-[#333333]">
            Sub-Accounts / Staff ({filteredSubAccounts.length})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/sub-accounts/create?agentId=${agentId}`}
            onClick={() => {
              setShowHeader(false);
            }}
            className="w-[120px] md:w-[150px] h-[35px] md:h-[44px] justify-center rounded-[6px] border-[1px] text-[13px] md:text-[15px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110 shadow-sm"
            style={{
              backgroundColor: roleSettings.pageTabColor,
              borderColor: roleSettings.pageTabColor,
            }}
          >
            + Add Staff
          </Link>
        </div>
      </div>

      <div className="w-full">
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
    </div>
  );
};

export default SubAccountsTable;