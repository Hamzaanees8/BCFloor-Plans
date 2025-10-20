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

export default function TourActivityDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [activeTab, setActiveTab] = React.useState<"report" | "settings">("report");
    const [emailStats, setEmailStats] = React.useState("yes");
    const [frequency, setFrequency] = React.useState("Weekly");
    const [emails, setEmails] = React.useState<string[]>([]);
    const [newEmail, setNewEmail] = React.useState("");

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-none !w-[60vw] p-0 overflow-y-auto h-[90vh] rounded-xl shadow-2xl font-alexandria">
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
                                <p className="text-sm font-semibold">
                                    2171 Sperling Ave, Burnaby, BC
                                </p>
                                <p className="text-xs opacity-90">Canada</p>
                                <p className="text-xs opacity-90">Postal/Zip Code</p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b-2 border-gray-300">
                            {[
                                { label: "Total Tour Views", value: "32", icon: <Flag strokeWidth={1} className="w-6 h-6 text-[#7D7D7D] " /> },
                                { label: "Total Visitors", value: "29", icon: <Users strokeWidth={1} className="w-6 h-6 text-[#7D7D7D] " /> },
                                { label: "Total Photos Viewed", value: "132", icon: <ImageIcon strokeWidth={1} className="w-6 h-6 text-[#7D7D7D] " /> },
                                { label: "Photos Viewed Per Visitor", value: "10.8", icon: <Eye strokeWidth={1} className="w-6 h-6 text-[#7D7D7D] " /> },
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

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="relative w-full aspect-square bg-[#D9D9D9]  overflow-hidden flex items-center justify-center"
                                    >
                                        {/* <Image
                                            src={`https://via.placeholder.com/300x300?text=${i + 1}`}
                                            alt={`Placeholder ${i + 1}`}
                                            fill
                                            className="object-cover"
                                        /> */}
                                        <div className="absolute bottom-0 w-full bg-[#7D7D7D] h-[30px] text-white text-xs flex items-center justify-center gap-1 py-1">
                                            <Eye className="w-3 h-3" /> {Math.floor(Math.random() * 40) + 5}
                                        </div>
                                    </div>
                                ))}
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
                                {[
                                    { day: "Sunday October 23", percent: 20, views: 10 },
                                    { day: "Monday October 24", percent: 35, views: 15 },
                                    { day: "Tuesday October 25", percent: 50, views: 20 },
                                    { day: "Wednesday October 26", percent: 25, views: 17 },
                                    { day: "Thursday October 27", percent: 40, views: 20 },
                                    { day: "Friday October 29", percent: 42, views: 21, color: "bg-yellow-400" },
                                    { day: "Saturday October 30", percent: 30, views: 18 },
                                ].map(({ day, percent, color, views }, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between gap-4 text-xs text-gray-700 !mt-1"
                                    >
                                        <span className="w-[25%] text-[#7D7D7D] text-[15px]">{day}</span>
                                        <div className="flex-1 h-10  overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full flex items-center justify-start text-[15px] text-white transition-all duration-300 ease-in-out",
                                                    color || "bg-[#4290E9]",
                                                    percent >= 98
                                                        ? ""
                                                        : ""
                                                )}
                                                style={{ width: `${percent}%` }}
                                            >
                                                <div className="flex justify-start gap-2 px-4">
                                                    <Eye className="text-[#fff] h-4 w-4" />
                                                    <span>{views}</span>
                                                    <span> ({percent}%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10">
                            <h4 className="text-[14px] text-[#424242] mb-3">Tour Traffic</h4>
                            <div className="space-y-3">
                                {[
                                    { source: "Direct Traffic", percent: 70, views: 40 },
                                    { source: "google.com", percent: 30, views: 25 },
                                    { source: "facebook.com", percent: 40, views: 22 },
                                    { source: "instagram.com", percent: 35, views: 13 },
                                    { source: "realtor.ca", percent: 20, views: 9 },
                                    { source: "yahoo.com", percent: 25, views: 4 },
                                ].map(({ source, percent, views }, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between gap-4 text-xs text-gray-700 !mt-1"
                                    >
                                        <span className="w-[25%] text-[#7D7D7D] text-[15px]">{source}</span>
                                        <div className="flex-1 h-10  overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full flex items-center justify-start text-[15px] text-white transition-all duration-300 ease-in-out",
                                                    "bg-[#4290E9]",
                                                    percent >= 98
                                                        ? ""
                                                        : ""
                                                )}
                                                style={{ width: `${percent}%` }}
                                            >
                                                <div className="flex justify-start gap-2 px-4">
                                                    <Eye className="text-[#fff] h-4 w-4" />
                                                    <span>{views}</span>
                                                    <span> ({percent}%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-5">
                            <p className="text-[#424242] text-[14px]">Last Updated: November 1, 2025 10:11 AM</p>
                        </div>

                    </div>
                }
                {activeTab === "settings" &&
                    <div className="px-10 text-[#424242]">
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
                                <SelectTrigger className="border-[#BBBBBB] h-[40px] bg-[#EEEEEE] w-[50%]">
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

                <div className="flex justify-end gap-3 my-10 px-10 text-[20px] font-[600]">
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
