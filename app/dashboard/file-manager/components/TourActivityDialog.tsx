"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Flag, ImageIcon, Plus, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { fetchTourStats, TourStats } from "@/app/tour/tour";

interface TourActivityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tourUuid: string;
    propertyAddress: string;
}

export default function TourActivityDialog({
    open,
    onOpenChange,
    tourUuid,
    propertyAddress
}: TourActivityDialogProps) {
    const [stats, setStats] = React.useState<TourStats | null>(null);
    const [activeTab, setActiveTab] = React.useState<"report" | "settings">("report");
    const [emailStats, setEmailStats] = React.useState("yes");
    const [frequency, setFrequency] = React.useState("Weekly");
    const [emails, setEmails] = React.useState<string[]>([]);
    const [newEmail, setNewEmail] = React.useState("");

    React.useEffect(() => {
        if (open && tourUuid) {
            const token = localStorage.getItem("token");
            fetchTourStats(tourUuid, undefined, token || undefined)
                .then(setStats)
                .catch(console.error)
        }
    }, [open, tourUuid]);

    const handleAddEmail = () => {
        const email = newEmail.trim();
        if (email && !emails.includes(email)) {
            setEmails((prev) => [...prev, email]);
            setNewEmail("");
        }
    };
    const handleRemoveEmail = (email: string) => {
        setEmails((prev) => prev.filter((e) => e !== email));
    };

    const summary = stats?.summary || { total_views: 0, total_visitors: 0, total_photo_views: 0, views_per_visitor: 0 };
    const trafficStats = stats?.charts?.traffic || [];
    const referrerStats = stats?.charts?.referrers || [];
    const imageStats = stats?.media?.media_stats || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-none !w-[95vw] md:!w-[80vw] lg:!w-[60vw] p-0 overflow-y-auto h-[90vh] rounded-xl shadow-2xl font-alexandria">
                <DialogHeader className="px-6 pt-4">
                    <DialogTitle className="text-[24px] text-[#4290E9] pt-5">
                        Tour Activity
                    </DialogTitle>
                </DialogHeader>

                <div className="flex gap-3 px-6 mb-4">
                    {(["report", "settings"] as const).map((tab) => (
                        <Button
                            key={tab}
                            variant={activeTab === tab ? "default" : "secondary"}
                            className={cn(
                                "rounded-md text-sm font-[600] px-4 py-2",
                                activeTab === tab
                                    ? "bg-[#4290E9] text-white"
                                    : "bg-gray-100 text-gray-700"
                            )}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === "report" ? "Tour Activity Report" : "Settings"}
                        </Button>
                    ))}

                </div>

                {activeTab === "report" &&
                    <div className="px-6 pb-8">
                        <div className="relative w-full h-[150px] rounded-md overflow-hidden bg-[#4290E9]">
                            {/* <Image
                                src="/sample-property.jpg"
                                alt="Property"
                                fill
                                className="object-cover"
                            /> */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <div className="absolute bottom-4 left-4 text-white">
                                <p className="text-xl font-semibold">
                                    {propertyAddress}
                                </p>
                                {/* <p className="text-xs opacity-90">Canada</p> */}
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b-2 border-gray-300">
                            {[
                                { label: "Total Tour Views", value: summary.total_views, icon: <Flag strokeWidth={1} className="w-6 h-6 text-[#7D7D7D] " /> },
                                { label: "Total Visitors", value: summary.total_visitors, icon: <Users strokeWidth={1} className="w-6 h-6 text-[#7D7D7D] " /> },
                                { label: "Total Photos Viewed", value: summary.total_photo_views, icon: <ImageIcon strokeWidth={1} className="w-6 h-6 text-[#7D7D7D] " /> },
                                { label: "Photos Viewed Per Visitor", value: summary.views_per_visitor.toFixed(1), icon: <Eye strokeWidth={1} className="w-6 h-6 text-[#7D7D7D] " /> },
                            ].map((stat) => (
                                <Card
                                    key={stat.label}
                                    className="border-none shadow-none text-center bg-transparent"
                                >
                                    <CardContent className="py-3 flex flex-col items-center">
                                        <div className="text-[48px] leading-none font-semibold text-[#4290E9]">
                                            {stat.value}
                                        </div>
                                        <div className="mb-1">{stat.icon}</div>
                                        <div className="text-[14px] text-[#424242] mt-1">{stat.label}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-8">
                            <h4 className="text-sm text-[#424242] mb-3">Image Views</h4>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full max-h-[400px] overflow-y-auto">
                                {imageStats.map((item) => (
                                    <div
                                        key={item.media_uuid}
                                        className="relative w-full aspect-square bg-[#D9D9D9]  overflow-hidden flex items-center justify-center border"
                                    >
                                        {/* Ideally we would have thumbnail_url in stats, or fetch it separately. For now placeholders or if media_stats has urls */}
                                        <div className="absolute bottom-0 w-full bg-[#7D7D7D] h-[30px] text-white text-xs flex items-center justify-center gap-1 py-1">
                                            <Eye className="w-3 h-3" /> {item.views}
                                        </div>
                                    </div>
                                ))}
                                {imageStats.length === 0 && <p className="text-sm text-gray-500">No image views yet.</p>}
                            </div>

                            {/* View all button */}
                            <div className="flex justify-end mt-4">
                                <Button className="bg-[#4290E9] text-white text-sm px-5 rounded-md">
                                    View All
                                </Button>
                            </div>
                        </div>


                        <div className="mt-10">
                            <h4 className="text-[14px] text-[#424242] mb-3">Tour Traffic</h4>
                            <div className="space-y-3">
                                {
                                    trafficStats.length > 0 ? trafficStats.map(({ date, views }, i) => {
                                        // Basic percentage calc (relative to max view for bar width)
                                        const maxViews = Math.max(...trafficStats.map(s => s.views));
                                        const percent = maxViews > 0 ? (views / maxViews) * 100 : 0;
                                        return (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between gap-4 text-xs text-gray-700 !mt-1"
                                            >
                                                <span className="w-[35%] md:w-[25%] text-[#7D7D7D] text-[12px] md:text-[15px] truncate">{date}</span>
                                                <div className="flex-1 h-10  overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full flex items-center justify-start text-[15px] text-white transition-all duration-300 ease-in-out",
                                                            "bg-[#4290E9]"
                                                        )}
                                                        style={{ width: `${Math.max(percent, 5)}%` }}
                                                    >
                                                        <div className="flex justify-start gap-2 px-4">
                                                            <Eye className="text-[#fff] h-4 w-4" />
                                                            <span>{views}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }) : <p className="text-sm text-gray-500">No traffic data.</p>
                                }
                            </div>
                        </div>

                        <div className="mt-10">
                            <h4 className="text-[14px] text-[#424242] mb-3">Tour Traffic</h4>
                            <div className="space-y-3">
                                {
                                    referrerStats.length > 0 ? referrerStats.map(({ domain, count }, i) => {
                                        const totalRef = referrerStats.reduce((s, r) => s + r.count, 0);
                                        const percent = totalRef > 0 ? (count / totalRef) * 100 : 0;
                                        return (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between gap-4 text-xs text-gray-700 !mt-1"
                                            >
                                                <span className="w-[35%] md:w-[25%] text-[#7D7D7D] text-[12px] md:text-[15px] truncate">{domain}</span>
                                                <div className="flex-1 h-10  overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full flex items-center justify-start text-[15px] text-white transition-all duration-300 ease-in-out",
                                                            "bg-[#4290E9]"
                                                        )}
                                                        style={{ width: `${Math.max(percent, 5)}%` }}
                                                    >
                                                        <div className="flex justify-start gap-2 px-4">
                                                            <Eye className="text-[#fff] h-4 w-4" />
                                                            <span>{count}</span>
                                                            <span> ({percent.toFixed(1)}%)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }) : <p className="text-sm text-gray-500">No referrer data.</p>
                                }
                            </div>
                        </div>
                        <div className="mt-5">
                            <p className="text-[#424242] text-[14px]">Last Updated: November 1, 2025 10:11 AM</p>
                        </div>

                    </div>
                }
                {activeTab === "settings" &&
                    <div className="px-6 md:px-10 text-[#424242]">
                        <div className="mb-4">
                            <h4 className="text-sm text-[#424242] mb-2">
                                Email Tour Stats to Agent
                            </h4>
                            <div className="flex flex-col pl-3 gap-3 text-sm">
                                <label className="flex items-center gap-1">
                                    <input
                                        type="radio"
                                        name="emailStats"
                                        checked={emailStats === "yes"}
                                        onChange={() => setEmailStats("yes")}
                                    />
                                    Yes
                                </label>
                                <label className="flex items-center gap-1">
                                    <input
                                        type="radio"
                                        name="emailStats"
                                        checked={emailStats === "no"}
                                        onChange={() => setEmailStats("no")}
                                    />
                                    No
                                </label>
                            </div>
                        </div>

                        <div className="mb-4 relative">
                            <h4 className="text-sm text-[#424242] mb-2">Emails</h4>

                            <div className="relative w-full min-h-[67px] h-fit border border-[#8E8E8E] rounded-lg p-2 flex flex-wrap gap-2 bg-[#F2F2F2]">
                                {emails.map((email, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center h-[30px] bg-[#EAEAEA] rounded-full text-[12px] px-3 py-1 text-sm text-[#333]"
                                    >
                                        <span className="mr-2">{email}</span>
                                        <X
                                            className="h-4 w-4 text-red-400 cursor-pointer hover:text-red-600"
                                            onClick={() => handleRemoveEmail(email)}
                                        />
                                    </div>
                                ))}

                                <Input
                                    type="email"
                                    placeholder="Enter email..."
                                    className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[150px] text-sm"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && newEmail.trim()) {
                                            e.preventDefault();
                                            handleAddEmail();
                                        }
                                    }}
                                />

                                <div className='absolute top-[-30px] flex right-0 mb-[12px]'>
                                    <p
                                        onClick={() => handleAddEmail()}
                                        className={`text-[#6BAE41] flex gap-[10px] cursor-pointer`}
                                    >
                                        Add
                                        <span className={`flex bg-[#6BAE41] w-[18px] h-[18px] rounded-[3px] justify-center items-center`}>
                                            <Plus className='text-[#F2F2F2] w-[12px]' />
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-sm mb-2">
                                Email Tour Stats Frequency
                            </h4>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger className="border-[#BBBBBB] h-[40px] bg-[#EEEEEE] w-full md:w-[50%]">
                                    <SelectValue placeholder="Select Frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Daily">Daily</SelectItem>
                                    <SelectItem value="Weekly">Weekly</SelectItem>
                                    <SelectItem value="Monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-2">
                                Next Email Scheduled for{" "}
                                <span className="font-semibold text-[#4290E9]">
                                    October 29, 2025
                                </span>
                            </p>
                        </div>

                        <div className="mb-5">
                            <Button
                                variant="outline"
                                className="border-[#4290E9] text-[#4290E9] hover:bg-[#4290E9] hover:text-white h-[40px]"
                            >
                                Reset Tour Statistics
                            </Button>
                        </div>
                    </div>
                }

                <div className="flex flex-col md:flex-row justify-end gap-3 my-10 px-6 md:px-10 text-[20px] font-[600]">
                    <Button className="bg-[#4290E9] text-white text-sm h-[40px]">
                        View Tour
                    </Button>
                    <Button variant="outline" className="border-[#4290E9] h-[40px] text-[#4290E9] hover:bg-[#4290E9] hover:text-white">
                        Save & Exit
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
