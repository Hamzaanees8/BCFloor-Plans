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
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/app/context/AppContext";
import { GetNotifications } from "./notification";

const Page = () => {
    const [showCard, setShowCard] = React.useState(false);
    const [selectedNotification, setSelectedNotification] =
        React.useState<NotificationData | null>(null);
    const [notificationData, setNotificationData] = React.useState<NotificationData[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);
    const { userType } = useAppContext();

    const [searchAddress, setSearchAddress] = React.useState("");
    const [searchName, setSearchName] = React.useState("");
    const [filterReadStatus, setFilterReadStatus] = React.useState("all");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) return;

        setLoading(true);
        setError(false);

        GetNotifications(token)
            .then((res) => {
                const data = res.data;
                setNotificationData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.log(err.message);
                setError(true);
                setLoading(false);
            });
    }, []);

    const filteredNotifications = notificationData.filter((notification) => {
        const addressSearch = searchAddress.toLowerCase();
        const nameSearch = searchName.toLowerCase();

        const matchesAddress =
            addressSearch === "" ||
            notification.order?.property_address?.toLowerCase().includes(addressSearch) ||
            notification.order?.property_location?.toLowerCase().includes(addressSearch) ||
            notification.order?.id === Number(addressSearch);

        const matchesName =
            nameSearch === "" ||
            notification.created_by_name?.toLowerCase().includes(nameSearch);

        const matchesReadStatus =
            filterReadStatus === "all" ||
            (filterReadStatus === "read" && !!notification.read_at) ||
            (filterReadStatus === "unread" && !notification.read_at);

        return matchesAddress && matchesName && matchesReadStatus;
    });

    return (
        <div style={{ backgroundColor: `var(--${userType}-page-bg, #F2F2F2)` }}>
            <div
                className="w-full h-[80px] font-alexandria z-10 relative flex justify-between px-[20px] items-center"
                style={{
                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                    boxShadow: "0px 4px 4px #0000001F"
                }}
            >
                <p
                    className={`text-[16px] md:text-[24px] font-[400] ${userType}-text`}
                >
                    Notifications ({filteredNotifications.length})
                </p>

            </div>

            <div
                className="w-full px-4 py-3 border-b border-gray-200 border border-b-gray-300 grid grid-cols-3 gap-4 h-[60px] font-alexandria"
                style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
            >
                <Input
                    placeholder="Search Address, Order ID..."
                    className="h-[38px] w-full"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchAddress(e.target.value)}
                    value={searchAddress}
                />

                <Input
                    placeholder="Search Name..."
                    className="h-[38px] w-full"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchName(e.target.value)}
                    value={searchName}
                />

                <Select onValueChange={(value) => setFilterReadStatus(value)} defaultValue="all">
                    <SelectTrigger
                        className="w-full h-[38px]"
                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    >
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full">
                <NotificationTable
                    data={filteredNotifications}
                    loading={loading}
                    error={error}
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
