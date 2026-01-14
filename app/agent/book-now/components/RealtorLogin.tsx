"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { login } from "../../login-user/login";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/app/context/AppContext";
import { AgentSignup } from "../book-now";



interface RealtorSignInModalProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export const RealtorSignInModal: React.FC<RealtorSignInModalProps> = ({ open, setOpen }) => {
    const [activeTab, setActiveTab] = React.useState<"login" | "signup">("login");

    // Shared States
    const [isLoading, setIsLoading] = React.useState(false);
    const { setUserType } = useAppContext();

    // Login States
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [loginErrors, setLoginErrors] = React.useState<{ email: boolean; password: boolean }>({
        email: false,
        password: false,
    });

    // Signup States
    const [companyName, setCompanyName] = React.useState("");
    const [companyEmail, setCompanyEmail] = React.useState("");
    const [signupPassword, setSignupPassword] = React.useState("");
    const [signupErrors, setSignupErrors] = React.useState<{
        companyName: boolean;
        companyEmail: boolean;
        signupPassword: boolean;
    }>({
        companyName: false,
        companyEmail: false,
        signupPassword: false,
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        const newErrors = {
            email: email.trim() === "" || !isValidEmail(email),
            password: password.trim() === "" || password.length < 6,
        };
        setLoginErrors(newErrors);
        if (Object.values(newErrors).some(Boolean)) return;

        setIsLoading(true);
        try {
            const response = await login({ email, password, role: "agent" });
            toast.success("Login successful");
            localStorage.setItem("agentSession", response.data.token);
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("userType", response.data.type === "user" ? "admin" : response.data.type);
            localStorage.setItem("userInfo", JSON.stringify(response.data.user));
            setUserType(response.data.type === "user" ? "admin" : response.data.type);
            setIsLoading(false);
            setOpen(false);
        } catch (error: unknown) {
            if (error instanceof Error) toast.error(error.message);
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        const newErrors = {
            companyName: companyName.trim() === "",
            companyEmail: companyEmail.trim() === "" || !isValidEmail(companyEmail),
            signupPassword: signupPassword.trim() === "" || signupPassword.length < 6,
        };
        setSignupErrors(newErrors);
        if (Object.values(newErrors).some(Boolean)) return;

        const nameParts = companyName.trim().split(" ");
        const first_name = nameParts[0] || "";
        const last_name = nameParts.slice(1).join(" ") || "";

        setIsLoading(true);
        try {
            const response = await AgentSignup({
                first_name,
                last_name,
                email: companyEmail,
                password: signupPassword,
            });
            toast.success("Signup successful");
            console.log("Signup response:", response);
            setIsLoading(false);
            setActiveTab("login");
        } catch (error: unknown) {
            if (error instanceof Error) toast.error(error.message);
            setIsLoading(false);
        }
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md rounded-lg p-6 font-alexandria">
                <DialogHeader className="flex flex-row justify-between items-center mb-2 w-full">
                    <DialogTitle className="text-[#4290E9] w-full font-semibold text-[18px] border-b-[1px] pb-1">
                        REALTOR {activeTab === "login" ? "SIGN IN" : "SIGN UP"}
                    </DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex justify-center space-x-4 mb-4">
                    <button
                        className={`px-3 py-1 w-[50%] rounded-md font-medium transition-all ${activeTab === "login"
                            ? "bg-[#4290E9] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        onClick={() => setActiveTab("login")}
                    >
                        Login
                    </button>
                    <button
                        className={`px-3 py-1 w-[50%]  rounded-md font-medium transition-all ${activeTab === "signup"
                            ? "bg-[#4290E9] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        onClick={() => setActiveTab("signup")}
                    >
                        Signup
                    </button>
                </div>

                {/* LOGIN FORM */}
                {activeTab === "login" && (
                    <form className="space-y-3" onSubmit={handleLogin}>
                        <div className="flex flex-col gap-[10px]">
                            <label
                                className={`text-[14px] font-[500] ${loginErrors.email ? "text-red-500" : ""
                                    }`}
                                htmlFor="email"
                            >
                                Email Address
                            </label>
                            <Input
                                className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                type="email"
                                id="email"
                                placeholder="taylor.tayburn@mail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {loginErrors.email && (
                                <span className="text-red-500 text-sm">Enter a valid email</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-[10px]">
                            <label
                                className={`text-[14px] font-[500] ${loginErrors.password ? "text-red-500" : ""
                                    }`}
                                htmlFor="password"
                            >
                                Password
                            </label>
                            <Input
                                className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                id="password"
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <DialogClose asChild>
                                <Button
                                    onClick={() => setOpen(false)}
                                    variant="outline"
                                    className="border-[#4290E9] text-[#4290E9] hover:bg-blue-50"
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                className="bg-[#4290E9] hover:bg-blue-600 text-white"
                            >
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                        </div>
                    </form>
                )}

                {activeTab === "signup" && (
                    <form className="space-y-3" onSubmit={handleSignup}>

                        <div className="flex flex-col gap-[10px]">
                            <label
                                className={`text-[14px] font-[500] ${signupErrors.companyName ? "text-red-500" : ""
                                    }`}
                            >
                                Company Name
                            </label>
                            <Input
                                className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                type="text"
                                placeholder="Company Name"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-[10px]">
                            <label
                                className={`text-[14px] font-[500] ${signupErrors.companyEmail ? "text-red-500" : ""
                                    }`}
                            >
                                Company Email
                            </label>
                            <Input
                                className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                type="email"
                                placeholder="company@email.com"
                                value={companyEmail}
                                onChange={(e) => setCompanyEmail(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-[10px]">
                            <label
                                className={`text-[14px] font-[500] ${signupErrors.signupPassword ? "text-red-500" : ""
                                    }`}
                            >
                                Password
                            </label>
                            <Input
                                className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                type="password"
                                placeholder="********"
                                value={signupPassword}
                                onChange={(e) => setSignupPassword(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <DialogClose asChild>
                                <Button
                                    onClick={() => setOpen(false)}
                                    variant="outline"
                                    className="border-[#4290E9] text-[#4290E9] hover:bg-blue-50"
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                className="bg-[#4290E9] hover:bg-blue-600 text-white"
                            >
                                {isLoading ? "Signing up..." : "Signup"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};
