"use client";
import React, { useEffect } from "react";
import QuickViewCard, { NotificationData } from "@/components/QuickViewCard";
import NotificationTable from "@/components/NotificationTable";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/app/context/AppContext";
import { GetNotifications } from "./notification";

const Page = () => {
    const [showCard, setShowCard] = React.useState(false);
    const [selectedNotification, setSelectedNotification] =
        React.useState<NotificationData | null>(null);
    const [notificationData, setNotificationData] = React.useState<NotificationData[]>([]);
    const { userType } = useAppContext();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) return;

        GetNotifications(token)
            .then((res) => {
                const data = res.data;
                setNotificationData(data);
            })
            .catch((err) => console.log(err.message));
    }, []);

    return (
        <div>
            <div
                className="w-full h-[80px] bg-[#E4E4E4] font-alexandria z-10 relative flex justify-between px-[20px] items-center"
                style={{ boxShadow: "0px 4px 4px #0000001F" }}
            >
                <p
                    className={`text-[16px] md:text-[24px] font-[400] ${userType}-text`}
                >
                    Notifications
                </p>
                <Select onValueChange={(value) => console.log(value)}>
                    <SelectTrigger
                        className={`w-[283px] h-[42px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] ${userType === "admin"
                            ? "[&>svg]:text-[#4290E9]"
                            : "[&>svg]:text-[#6BAE41]"
                            } [&>svg]:opacity-100 `}
                    >
                        <SelectValue placeholder="Show All" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#EEEEEE] rounded-none w-full py-[12px] text-[#666666]">
                        <SelectItem
                            value="all"
                            className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
                        >
                            Show All
                        </SelectItem>
                        <SelectItem
                            value="unpaid"
                            className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
                        >
                            Read
                        </SelectItem>
                        <SelectItem
                            value="draft"
                            className="p-0 px-[16px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
                        >
                            Unread
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full">
                <NotificationTable
                    data={notificationData}
                    onQuickView={(notification) => {
                        setSelectedNotification(notification);
                        setShowCard(true);
                    }}
                />

                {showCard && selectedNotification && (
                    <QuickViewCard
                        type="notification"
                        data={selectedNotification}
                        onClose={() => setShowCard(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default Page;
