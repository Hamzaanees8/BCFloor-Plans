"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/app/context/AppContext";
import { agentLogin, agentSignup } from "../book-now";
import { Eye, EyeOff, X } from "lucide-react";

// Utility function to decode JWT token
function decodeJWT(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
}



interface RealtorSignInModalProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export const RealtorSignInModal: React.FC<RealtorSignInModalProps> = ({ open, setOpen }) => {
    const [mode, setMode] = React.useState<"login" | "signup">("login");

    // Shared States
    const [isLoading, setIsLoading] = React.useState(false);
    const { setUserType } = useAppContext();

    // Login/Signup States
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !validateEmail(email)) {
            toast.error("Please enter a valid email");
            return;
        }

        if (!password.trim() || password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const response = await agentLogin(email, password);
            const token = response?.data?.token || response?.token;
            let user = response?.data?.user || response?.user;

            if (!user && response?.data?.agent) {
                user = response.data.agent;
            }
            if (!user && response?.agent) {
                user = response.agent;
            }
            if (!user && response?.data) {
                if (response.data.uuid || response.data.email) {
                    user = response.data;
                }
            }


            // If no user found, try to decode from JWT token
            if (!user && token) {
                const decodedToken = decodeJWT(token);
                if (decodedToken) {
                    user = decodedToken;
                }
            }

            if (token) {
                localStorage.setItem("agentToken", token);
                if (user) {
                    localStorage.setItem("userInfo", JSON.stringify(user));
                } else {
                    console.warn("No user object found in response or JWT");
                }
                toast.success("Login successful!");
                setUserType("agent");

                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event('agentLogin'));

                setOpen(false);
                // Reset form
                setEmail("");
                setPassword("");
            } else {
                toast.error("Login failed. Please try again.");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Login failed";
            console.error("Login error:", error);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName.trim() || !lastName.trim()) {
            toast.error("Please enter your name");
            return;
        }

        if (!email.trim() || !validateEmail(email)) {
            toast.error("Please enter a valid email");
            return;
        }

        if (!password.trim() || password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const response = await agentSignup({
                first_name: firstName,
                last_name: lastName,
                email,
                password,
                password_confirmation: confirmPassword,
            });

            const token = response?.data?.token || response?.token;
            let user = response?.data?.user || response?.user;

            // Try additional paths for user data
            if (!user && response?.data?.agent) {
                user = response.data.agent;
            }
            if (!user && response?.agent) {
                user = response.agent;
            }
            if (!user && response?.data) {
                // Check if response.data itself is the user object
                if (response.data.uuid || response.data.email) {
                    user = response.data;
                }
            }
            if (!user && token) {
                const decodedToken = decodeJWT(token);
                if (decodedToken) {
                    user = decodedToken;
                }
            }

            if (token) {
                localStorage.setItem("agentToken", token);
                if (user) {
                    localStorage.setItem("userInfo", JSON.stringify(user));
                } else {
                    console.warn("No user object found in response or JWT");
                }
                toast.success("Signup successful!");
                setUserType("agent");

                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event('agentLogin'));

                setOpen(false);
                // Reset form
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setFirstName("");
                setLastName("");
            } else {
                toast.error("Signup failed. Please try again.");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Signup failed";
            console.error("Signup error:", error);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setOpen(false);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFirstName("");
        setLastName("");
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[320px] md:w-[450px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className={`flex items-center uppercase justify-between text-[#4290E9] text-[18px] font-[600]`}>
                        {mode === "login" ? "Agent Login" : "Agent Signup"}
                        <button
                            type="button"
                            onClick={closeModal}
                            className="border-none !shadow-none bg-transparent"
                        >
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </button>
                    </DialogTitle>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                </DialogHeader>

                <div className="w-full">
                    {/* Tabs */}
                    <div className="flex justify-center space-x-4 mb-4">
                        <button
                            type="button"
                            className={`px-3 py-1 w-[50%] rounded-md font-medium transition-all ${mode === "login"
                                ? "bg-[#4290E9] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            onClick={() => {
                                setMode("login");
                                setEmail("");
                                setPassword("");
                                setConfirmPassword("");
                                setFirstName("");
                                setLastName("");
                            }}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            className={`px-3 py-1 w-[50%] rounded-md font-medium transition-all ${mode === "signup"
                                ? "bg-[#4290E9] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            onClick={() => {
                                setMode("signup");
                                setEmail("");
                                setPassword("");
                                setConfirmPassword("");
                                setFirstName("");
                                setLastName("");
                            }}
                        >
                            Signup
                        </button>
                    </div>

                    {/* LOGIN FORM */}
                    {mode === "login" && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-normal text-[#666666]">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="agent@example.com"
                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB]"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-normal text-[#666666]">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D7D7D]"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#4290E9] text-white hover:opacity-90"
                                >
                                    {isLoading ? "Logging in..." : "Login"}
                                </Button>
                            </div>

                            <div className="text-center mt-4">
                                <p className="text-[14px] text-[#666666]">
                                    Don&apos;t have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode("signup");
                                            setEmail("");
                                            setPassword("");
                                        }}
                                        className="text-[#4290E9] font-[600] hover:underline"
                                    >
                                        Sign up
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}

                    {/* SIGNUP FORM */}
                    {mode === "signup" && (
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-normal text-[#666666]">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="John"
                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB]"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-normal text-[#666666]">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Doe"
                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB]"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-normal text-[#666666]">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="agent@example.com"
                                    className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB]"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-normal text-[#666666]">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D7D7D]"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-normal text-[#666666]">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D7D7D]"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#4290E9] text-white hover:opacity-90"
                                >
                                    {isLoading ? "Signing up..." : "Sign up"}
                                </Button>
                            </div>

                            <div className="text-center mt-4">
                                <p className="text-[14px] text-[#666666]">
                                    Already have an account?{" "}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode("login");
                                            setEmail("");
                                            setPassword("");
                                            setConfirmPassword("");
                                            setFirstName("");
                                            setLastName("");
                                        }}
                                        className="text-[#4290E9] font-[600] hover:underline"
                                    >
                                        Login
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
