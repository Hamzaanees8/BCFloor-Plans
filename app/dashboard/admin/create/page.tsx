"use client";
import React, { useEffect, useRef, useState } from "react";
// import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
// import { Label } from "@/components/ui/label";
import {
  Create,
  Edit,
  GetOne,
  GetPermissions,
  GetRole,
  ResetPassword,
  UserPayload,
} from "../admin";
import { GetOrganizations, Organization } from "../../global-settings/global-settings";
import { useParams, useRouter } from "next/navigation";
import { Country, State } from "country-state-city";
import { SaveModal } from "@/components/SaveModal";
import DynamicMap from "@/components/DYnamicMap";
import { useUnsaved } from "@/app/context/UnsavedContext";
import useUnsavedChangesWarning from "@/app/hooks/useUnsavedChangesWarning";
import { usePermissions } from "@/app/hooks/usePermissions";
const ROLE_PERMISSION_NAMES = {
  super_admin: null, // means ALL
  admin: [
    "Book Appointments",
    "Edit Appointments",
    "View Appointments",
    "Access Billing",
    "Create Agent",
    "View Agent",
    "Set Discounts",
    "Create Services",
    "View Services",
  ],
  booking_agent: [
    "Book Appointments",
    "Edit Appointments",
    "View Appointments",
    "Access Billing",
    "Create Agent",
    "View Agent",
  ],
};

const AdminForm = () => {
  type CurrentUser = {
    first_name?: string;
    last_name?: string;
    roles?: [{ id: number }];
    email?: string;
    secondary_email?: string;
    notification_email?: string;
    email_type?: string;
    primary_phone?: string;
    secondary_phone?: string;
    company_name?: string;
    website?: string;
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    permissions?: { id: number | string }[];
    avatar_url?: string;
    company_logo_url?: string;
    company_banner_url?: string;
    organization_id?: number | string;
  };
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("CA");
  const [password, setPassword] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [activeRolePreset, setActiveRolePreset] = useState<
    "super_admin" | "admin" | "booking_agent" | null
  >(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState<string>("");

  const applyRolePreset = (preset: "super_admin" | "admin" | "booking_agent") => {
    if (activeRolePreset === preset) {
      setActiveRolePreset(null);
      setSelectedPermissions([]);
      return;
    }

    setActiveRolePreset(preset);
    if (preset === "super_admin") {
      setSelectedPermissions(permissions.map((p) => Number(p.id)));
    } else {
      const targetNames = ROLE_PERMISSION_NAMES[preset];
      const targetIds = permissions
        .filter((p) => targetNames.includes(p.name))
        .map((p) => Number(p.id));
      setSelectedPermissions(targetIds);
    }
  };

  // const CompanyLogofileInputRef = useRef(null);
  // const [CompanyLogofileName, setCompanyLogoFileName] = useState("");
  // const [CompanyLogoUrl, setCompanyLogoUrl] = useState("");
  // const AvatarfileInputRef = useRef(null);
  // const [AvatarfileName, setAvatarFileName] = useState("");
  // const [avatarUrl, setAvatarUrl] = useState("");
  // const CompanyBannerfileInputRef = useRef(null);
  // const [CompanyBannerfileName, setCompanyBannerFileName] = useState("");
  // const [CompanyBannerUrl, setCompanyBannerUrl] = useState("");
  type Role = { id: string; name: string };
  const [roles, setRoles] = useState<Role[]>([]);
  type Permission = { id: string; name: string };
  const [permissions, setPermissions] = useState<Permission[]>([]);
  // const [avatarFile, setAvatarFile] = useState<File | null>(null);
  // const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  // const [companyBannerFile, setCompanyBannerFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [countries, setCountries] = useState<
    { name: string; isoCode: string }[]
  >([]);
  const [states, setStates] = useState<{ name: string; isoCode: string }[]>([]);

  useEffect(() => {
    if (permissions.length === 0 || selectedPermissions.length === 0) {
      setActiveRolePreset(null);
      return;
    }

    // Check for Super Admin
    if (selectedPermissions.length === permissions.length) {
      const allSelected = permissions.every((p) =>
        selectedPermissions.includes(Number(p.id))
      );
      if (allSelected) {
        setActiveRolePreset("super_admin");
        return;
      }
    }

    // Check for Admin and Booking Agent
    const presets: ("admin" | "booking_agent")[] = ["admin", "booking_agent"];
    for (const presetKey of presets) {
      const targetNames = ROLE_PERMISSION_NAMES[presetKey];
      const targetIds = permissions
        .filter((p) => targetNames.includes(p.name))
        .map((p) => Number(p.id));

      if (
        targetIds.length > 0 &&
        targetIds.length === selectedPermissions.length
      ) {
        const isMatch = targetIds.every((id) =>
          selectedPermissions.includes(id)
        );
        if (isMatch) {
          setActiveRolePreset(presetKey);
          return;
        }
      }
    }

    setActiveRolePreset(null);
  }, [permissions, selectedPermissions]);

  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { isSuperAdmin } = usePermissions();

  const { isDirty, setIsDirty } = useUnsaved();
  useUnsavedChangesWarning(isDirty);
  const isPopulatingData = useRef(true);
  const hasInitiallyRendered = useRef(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDirty(false);
  }, [setIsDirty]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let ancestor = header.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
        ancestor.style.setProperty('overflow-x', 'visible', 'important');
        ancestor.style.setProperty('overflow-y', 'visible', 'important');

        const target = ancestor;
        return () => {
          target.style.removeProperty('overflow-x');
          target.style.removeProperty('overflow-y');
        };
      }
      ancestor = ancestor.parentElement;
    }
  }, []);

  const params = useParams();
  const userId = params?.id as string;

  useEffect(() => {
    GetRole()
      .then((data) => {
        const allRoles = Array.isArray(data.data) ? data.data : [];
        setRoles(allRoles);

        // If creating a new admin (no userId), set default role to 'admin' or 'adn'
        if (!userId && allRoles.length > 0) {
          const adminRole = allRoles.find(
            (r: any) =>
              r.name.toLowerCase() === "admin" ||
              r.name.toLowerCase() === "adn" ||
              r.name.toLowerCase() === "super admin"
          );
          if (adminRole) {
            setRole(String(adminRole.id));
          }
        }
      })
      .catch((err) => console.log(err.message));

    GetOrganizations()
      .then((res) => setOrganizations(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.log("Failed to fetch organizations", err));

    // For non-super-admins, pre-fill org from their own userInfo
    if (!isSuperAdmin && !userId) {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          const orgId = userInfo?.organization_id ?? userInfo?.data?.organization_id;
          if (orgId) {
            setOrganizationId(String(orgId));
          }
        }
      } catch (e) {
        console.error('Failed to read userInfo for org prefill:', e);
      }
    }
  }, [userId, isSuperAdmin]);

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (country) {
      setStates(State.getStatesOfCountry(country));
      // Only reset province when the user manually changes country,
      // not when we are populating existing data from the API.
      if (!isPopulatingData.current) {
        setProvince("");
      }
    }
  }, [country]);

  // For create mode, mark as initially rendered after a short delay
  // This prevents browser autofill from triggering dirty state
  useEffect(() => {
    if (!userId) {
      setIsDirty(false); // Reset dirty state on mount for create mode
      setTimeout(() => {
        isPopulatingData.current = false;
        hasInitiallyRendered.current = true;
        setIsDirty(false); // Ensure clean state after settlement
      }, 1500); // Longer delay to account for browser autofill and initial state settlement
    }
  }, [userId, setIsDirty]);

  useEffect(() => {
    if (currentUser) {
      isPopulatingData.current = true;
      setFirstName(currentUser.first_name || "");
      setLastName(currentUser.last_name || "");
      setRole(
        currentUser.roles && currentUser.roles.length > 0
          ? String(currentUser.roles[0].id)
          : ""
      );

      setEmail(currentUser.email || "");
      setSecondaryEmail(currentUser.secondary_email || "");
      setNotificationEmail(currentUser.notification_email || "");
      setPrimaryPhone(currentUser.primary_phone || "");
      setSecondaryPhone(currentUser.secondary_phone || "");
      setCompanyName(currentUser.company_name || "");
      setCompanyWebsite(currentUser.website || "");
      setAddress(currentUser.address || "");
      setCity(currentUser.city || "");
      setProvince(currentUser.province || "");
      setCountry(currentUser.country || "");
      setSelectedPermissions(
        currentUser.permissions?.map((p) => Number(p.id)) || []
      );
      setOrganizationId(currentUser.organization_id ? String(currentUser.organization_id) : "");

      // if (currentUser.avatar_url) setAvatarUrl(currentUser.avatar_url);
      // if (currentUser.company_logo_url)
      //   setCompanyLogoUrl(currentUser.company_logo_url);
      // if (currentUser.company_banner_url)
      //   setCompanyBannerUrl(currentUser.company_banner_url);

      // Use setTimeout to ensure all state updates + cascading effects (e.g. country→states)
      // complete before dirty tracking is enabled. 300ms covers the async chain.
      setTimeout(() => {
        isPopulatingData.current = false;
        hasInitiallyRendered.current = true;
      }, 300);

      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setAvatarFile(file);
  //     setAvatarFileName(file.name);
  //     setAvatarUrl(URL.createObjectURL(file));
  //   }
  // };

  // const triggerFileInput = () => {
  //   if (AvatarfileInputRef.current) {
  //     (AvatarfileInputRef.current as HTMLInputElement).click();
  //   }
  // };
  // const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setCompanyLogoFile(file);
  //     setCompanyLogoFileName(file.name);
  //     setCompanyLogoUrl(URL.createObjectURL(file));
  //   }
  // };

  // const triggerFileInput1 = () => {
  //   if (CompanyLogofileInputRef.current) {
  //     (CompanyLogofileInputRef.current as HTMLInputElement).click();
  //   }
  // };
  // const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setCompanyBannerFile(file);
  //     setCompanyBannerFileName(file.name);
  //     setCompanyBannerUrl(URL.createObjectURL(file));
  //   }
  // };

  // const triggerFileInput2 = () => {
  //   if (CompanyBannerfileInputRef.current) {
  //     (CompanyBannerfileInputRef.current as HTMLInputElement).click();
  //   }
  // };

  // const togglePermission = (id: number, checked: boolean) => {
  //   setSelectedPermissions((prev) => {
  //     const newPermissions = checked
  //       ? [...prev, id]
  //       : prev.filter((pid) => pid !== id);
  //     if (fieldErrors.permissions && newPermissions.length > 0) {
  //       setFieldErrors((prevErrors) => {
  //         const newErrors = { ...prevErrors };
  //         delete newErrors.permissions;
  //         return newErrors;
  //       });
  //     }
  //     return newPermissions;
  //   });
  // };

  useEffect(() => {
    if (userId) {
      GetOne(userId)
        .then((data) => setCurrentUser(data.data))
        .catch((err) => console.log(err.message));
    } else {
      console.log("User ID is undefined.");
    }
  }, [userId]);

  useEffect(() => {
    GetPermissions()
      .then((data) => {
        const perms = Array.isArray(data.data) ? data.data : [];
        setPermissions(perms);
        
        // If creating a new admin, select all permissions by default
        if (!userId) {
            setSelectedPermissions(perms.map((p: any) => Number(p.id)));
        }
      })
      .catch((err) => console.log(err.message));
  }, [userId]);

  const validateForm = () => {
    const errors: Record<string, string[]> = {};
    let isValid = true;

    if (!firstName.trim()) {
      errors.first_name = ["First Name is required"];
      isValid = false;
    } else if (firstName.length > 255) {
      errors.first_name = ["First Name must be less than 255 characters"];
      isValid = false;
    }

    if (lastName && lastName.length > 255) {
      errors.last_name = ["Last Name must be less than 255 characters"];
      isValid = false;
    }

    if (!email.trim()) {
      errors.email = ["Email is required"];
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = ["Invalid email format"];
      isValid = false;
    }

    if (secondaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secondaryEmail)) {
      errors.secondary_email = ["Invalid email format"];
      isValid = false;
    }

    // Validate password only if creating a new user or if password field is filled
    if (!userId) {
      if (!password) {
        errors.password = ["Password is required"];
        isValid = false;
      } else if (password.length < 8) {
        errors.password = ["Password must be at least 8 characters"];
        isValid = false;
      }
    } else if (password && password.length < 8) {
      errors.password = ["Password must be at least 8 characters"];
      isValid = false;
    }

    if (!role) {
      errors.roles = ["Role is required"];
      isValid = false;
    }

    if (selectedPermissions.length === 0) {
      errors.permissions = ["At least one permission is required"];
      isValid = false;
    }

    if (primaryPhone && primaryPhone.length > 20) {
      errors.primary_phone = ["Primary Phone must be less than 20 characters"];
      isValid = false;
    }

    if (secondaryPhone && secondaryPhone.length > 20) {
      errors.secondary_phone = [
        "Secondary Phone must be less than 20 characters",
      ];
      isValid = false;
    }

    if (companyName && companyName.length > 255) {
      errors.company_name = ["Company Name must be less than 255 characters"];
      isValid = false;
    }

    setFieldErrors(errors);

    if (!isValid) {
      const firstError = Object.values(errors).flat()[0];
      toast.error(firstError || "Please fill all required fields");

      // Scroll to top if there are errors to ensure visibility
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let formattedWebsite = companyWebsite?.trim();
      if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
        formattedWebsite = "https://" + formattedWebsite;
      }

      const payload: UserPayload = {
        first_name: firstName,
        last_name: lastName,
        email,
        secondary_email: secondaryEmail || undefined,
        primary_phone: primaryPhone || undefined,
        secondary_phone: secondaryPhone || undefined,
        company_name: companyName || undefined,
        website: formattedWebsite || undefined,
        address: address || undefined,
        city: city || undefined,
        province: province || undefined,
        country: country || undefined,
        password: userId ? undefined : password || undefined,
        password_confirmation: userId ? undefined : password || undefined,
        // avatar: avatarFile || undefined,
        // company_logo: companyLogoFile || undefined,
        // company_banner: companyBannerFile || undefined,
        roles: role ? [Number(role)] : undefined,
        permissions: selectedPermissions || [],
        organization_id: organizationId && organizationId !== "none" ? Number(organizationId) : undefined,
      };

      if (userId) {
        const updatedPayload = { ...payload, _method: "PUT" };
        await Edit(userId, updatedPayload);
        toast.success("User updated successfully");
        setIsLoading(true);
        setOpen(true);
        router.push("/dashboard/admin");
        setIsLoading(false);
        setIsDirty(false);
      } else {
        await Create(payload);
        toast.success("User created successfully");
        setIsLoading(true);
        setOpen(true);
        router.push("/dashboard/admin");
        setIsLoading(false);
        setIsDirty(false);
      }
    } catch (error) {
      console.log("Raw error:", error);
      setIsLoading(false);
      setOpen(false);
      setFieldErrors({});
      const apiError = error as {
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (apiError.errors && typeof apiError.errors === "object") {
        const normalizedErrors: Record<string, string[]> = {};

        Object.entries(apiError.errors).forEach(([key, messages]) => {
          const normalizedKey = key.split(".")[0];
          if (!normalizedErrors[normalizedKey]) {
            normalizedErrors[normalizedKey] = [];
          }
          normalizedErrors[normalizedKey].push(...messages);
        });

        setFieldErrors(normalizedErrors);

        // const firstError = Object.values(normalizedErrors).flat()[0];
        // toast.error(firstError || 'Validation error');
        toast.error("Validation error kindly re-check your form");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit user data");
      }
    }
  };

  const handlePasswordReset = async (userId: string) => {
    try {
      const payload = {
        new_password: password,
        password_confirmation: password,
        _method: "PUT",
      };
      console.log("payload", payload);

      await ResetPassword(payload, userId);
      toast.success("Reset email Send successfully");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Delete failed:", error.message);
        toast.error(error.message || "Failed to send email");
      } else {
        console.error("sending failed:", error);
        toast.error("Failed to send email");
      }
    }
  };
  return (
    <div className="font-alexandria">
      <div
        ref={headerRef}
        className="w-full h-[80px] bg-[#E4E4E4] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center"
        style={{ boxShadow: "0px 4px 4px #0000001F" }}
      >
        {userId ? (
          <p className="text-[16px] md:text-[24px] font-[400] text-[#4290E9]">
            Admin Edit › {currentUser?.first_name} {currentUser?.last_name}
          </p>
        ) : (
          <p className="text-[16px] md:text-[24px] font-[400] text-[#4290E9]">
            Admin Create
          </p>
        )}
        <Button
          onClick={(e) => {
            handleSubmit(e);
          }}
          className="w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]"
        >
          Save Changes
        </Button>
      </div>
      {/* <div className='flex justify-center items-center gap-x-2.5 px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600]' >
                <ToggleButtons />
            </div> */}
      <div>
        <form
          onChange={() => {
            if (!isPopulatingData.current && hasInitiallyRendered.current) {
              setIsDirty(true);
            }
          }}
        >
          <Accordion
            type="multiple"
            defaultValue={["profile", "permissions", "branding"]}
            className="w-full space-y-4"
          >
            <AccordionItem value="profile">
              <AccordionTrigger className="px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current">
                PROFILE
              </AccordionTrigger>
              <AccordionContent className="grid gap-4">
                <div className="w-full flex flex-col items-center">
                  <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                    <div className="grid grid-cols-2 gap-[16px]">
                      <div>
                        <label htmlFor="">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          required
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            if (fieldErrors.first_name) {
                              setFieldErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.first_name;
                                return newErrors;
                              });
                            }
                          }}
                          className={`h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] ${fieldErrors.first_name ? "border-red-500" : ""
                            }`}
                          type="text"
                        />
                        {fieldErrors.first_name && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.first_name[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="">Last Name</label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">
                          Role <span className="text-red-500">*</span>
                        </label>
                        <Select
                          disabled
                          value={String(role)}
                          onValueChange={(val) => {
                            setRole(val);
                            if (hasInitiallyRendered.current) {
                              setIsDirty(true);
                            }
                            if (fieldErrors.roles) {
                              setFieldErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.roles;
                                return newErrors;
                              });
                            }
                          }}
                        >
                          <SelectTrigger
                            className={`h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] ${fieldErrors.roles ? "border-red-500" : ""
                              }`}
                          >
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles?.map((role) => (
                              <SelectItem key={role.id} value={String(role.id)}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {fieldErrors.roles && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.roles[0]}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">Organization</label>
                        {isSuperAdmin ? (
                          <Select
                            value={organizationId}
                            onValueChange={(val) => {
                              setOrganizationId(val);
                              if (hasInitiallyRendered.current) {
                                setIsDirty(true);
                              }
                            }}
                          >
                            <SelectTrigger
                              className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                            >
                              <SelectValue placeholder="Select an organization" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None (Global Admin)</SelectItem>
                              {organizations?.map((org) => (
                                <SelectItem key={org.id} value={String(org.id)}>
                                  {org.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div
                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] rounded-md px-3 flex items-center text-[14px] text-[#424242] cursor-not-allowed opacity-70"
                          >
                            {organizations.find(o => String(o.id) === organizationId)?.name || organizationId || 'Your Organization'}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={email}
                          autoComplete="off"
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) {
                              setFieldErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.email;
                                return newErrors;
                              });
                            }
                          }}
                          className={`h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] ${fieldErrors.email ? "border-red-500" : ""
                            }`}
                          type="text"
                        />

                        {fieldErrors.email && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.email[0]}
                          </p>
                        )}
                      </div>
                      {!userId && (
                        <div className="col-span-2">
                          <label htmlFor="">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={password}
                            autoComplete="new-password"
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (fieldErrors.password) {
                                setFieldErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.password;
                                  return newErrors;
                                });
                              }
                            }}
                            className={`h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] ${fieldErrors.password ? "border-red-500" : ""
                              }`}
                            type="password"
                          />

                          {fieldErrors.password && (
                            <p className="text-red-500 text-[10px]">
                              {fieldErrors.password[0]}
                            </p>
                          )}
                        </div>
                      )}
                      {userId && (
                        <div className="col-span-2">
                          <label htmlFor="">Password Change</label>
                          <div className="flex items-center bg-gray-100 border border-[#A8A8A8] rounded-[8px] shadow-inner w-full h-10 overflow-hidden mt-[12px]">
                            <input
                              type="password"
                              disabled
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="bg-[#EEEEEE] text-[16px] font-medium w-full h-full px-4 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handlePasswordReset(userId)}
                              className="px-4 bg-[#E4E4E4] text-base font-normal w-[94px] h-full text-[#7D7D7D] border-l border-[#A8A8A8]"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="col-span-2">
                        <label htmlFor="">Email Secondary</label>
                        <Input
                          value={secondaryEmail}
                          onChange={(e) => setSecondaryEmail(e.target.value)}
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>
                      <div className="flex items-center gap-[10px]">
                        <Input
                          value={notificationEmail}
                          onChange={(e) => setNotificationEmail(e.target.value)}
                          type="checkbox"
                          className="h-[20px] w-[20px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                        />
                        <p className="text-[16px] font-normal text-[#666666] mt-[12px]">
                          Notification Email
                        </p>
                      </div>
                      <div>
                        <label htmlFor="">Primary Phone</label>
                        <Input
                          value={primaryPhone}
                          onChange={(e) => setPrimaryPhone(e.target.value)}
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>
                      <div>
                        <label htmlFor="">Secondary Phone</label>
                        <Input
                          value={secondaryPhone}
                          onChange={(e) => setSecondaryPhone(e.target.value)}
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>

                      <div className="col-span-2">
                        <label htmlFor="">Company Name</label>
                        <Input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">Company Website</label>
                        <Input
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">Address</label>
                        <Input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>
                      <div>
                        <label htmlFor="">City</label>

                        <Input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Burnaby"
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>
                      <div>
                        <label htmlFor="">Province</label>
                        <Select
                          value={province}
                          onValueChange={(val) => {
                            setProvince(val);
                            if (hasInitiallyRendered.current) setIsDirty(true);
                          }}
                          disabled={!states.length}
                        >
                          <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                            <SelectValue placeholder="Select Province" />
                          </SelectTrigger>
                          <SelectContent>
                            {states.map((s, i) => (
                              <SelectItem key={i} value={s.isoCode}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">Country</label>
                        <Select
                          value={country}
                          onValueChange={(val) => {
                            setCountry(val);
                            if (hasInitiallyRendered.current) setIsDirty(true);
                          }}
                        >
                          <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c, i) => (
                              <SelectItem key={i} value={c.isoCode}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 h-[200px]">
                        <DynamicMap
                          address={address}
                          city={city}
                          province={province}
                          country={country}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="permissions">
              <AccordionTrigger className="px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current">
                PERMISSION ACCESS
              </AccordionTrigger>
              <AccordionContent className="grid gap-4">
                <div className="w-full flex flex-col items-center">
                  <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                    {/* Role Presets */}
                    <div className="space-y-4 mb-4">
                      <div className="flex items-center justify-between p-3 bg-[#EEEEEE] border border-[#BBBBBB] rounded-md">
                        <div>
                          <p className="font-[500] text-[14px]">Super Admin</p>
                          <p className="text-[12px] text-[#666]">All access</p>
                        </div>
                        <Switch
                          checked={activeRolePreset === "super_admin"}
                          onCheckedChange={() => applyRolePreset("super_admin")}
                          className="bg-gray-300 data-[state=checked]:bg-[#6BAE41]"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#EEEEEE] border border-[#BBBBBB] rounded-md">
                        <div>
                          <p className="font-[500] text-[14px]">Admin</p>
                          <p className="text-[12px] text-[#666]">
                            Orders · Billing · Agent · Discounts · Services
                          </p>
                        </div>
                        <Switch
                          checked={activeRolePreset === "admin"}
                          onCheckedChange={() => applyRolePreset("admin")}
                          className="bg-gray-300 data-[state=checked]:bg-[#6BAE41]"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#EEEEEE] border border-[#BBBBBB] rounded-md">
                        <div>
                          <p className="font-[500] text-[14px]">Booking Agent</p>
                          <p className="text-[12px] text-[#666]">
                            Orders · Billing · Agent
                          </p>
                        </div>
                        <Switch
                          checked={activeRolePreset === "booking_agent"}
                          onCheckedChange={() => applyRolePreset("booking_agent")}
                          className="bg-gray-300 data-[state=checked]:bg-[#6BAE41]"
                        />
                      </div>
                    </div>

                    {/* Individual Permissions Accordion */}
                    {/* <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="individual-permissions" className="border-none">
                        <AccordionTrigger className="text-[#4290E9] text-[14px] font-[500] py-2 hover:no-underline">
                          Advanced Permissions
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          {(() => {
                            const allGroupedNames = [
                              "Book Appointments", "View Appointments", "Edit Appointments",
                              "Create Listing", "View Listing", "Create Tour Settings",
                              "View Services", "Create Services",
                              "Access Billing", "Access Vendor Billing", "Set Discounts",
                              "Create Agent", "View Agent", "Create Vendor", "View Vendor",
                              "Create Admin", "View Admin", "Receive Notifications", "Create Sub-Accounts"
                            ];

                            const excludedNames = [
                              "Create Orders", "Edit Orders", "View All Orders",
                              "View Only Orders For Co-Agent", "View Only Appointments For Co-Agent",
                              "View All Appointments"
                            ];

                            const filteredPermissions = permissions?.filter(p => !excludedNames.includes(p.name)) || [];

                            const sortedPermissions = [...filteredPermissions].sort((a, b) => {
                              const indexA = allGroupedNames.indexOf(a.name);
                              const indexB = allGroupedNames.indexOf(b.name);

                              if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                              if (indexA !== -1) return -1; // a is in group, b is not, a comes first
                              if (indexB !== -1) return 1;  // b is in group, a is not, b comes first
                              return a.name.localeCompare(b.name); // neither are in group, sort alphabetically
                            });

                            return sortedPermissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-center justify-between"
                              >
                                <p>{permission.name}</p>
                                <Switch
                                  checked={selectedPermissions.includes(
                                    Number(permission.id)
                                  )}
                                  onCheckedChange={(checked) =>
                                    togglePermission(Number(permission.id), checked)
                                  }
                                  className="bg-gray-300 data-[state=checked]:bg-[#6BAE41]"
                                />
                              </div>
                            ));
                          })()}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion> */}

                    {fieldErrors.permissions && (
                      <p className="text-red-500 text-[10px]">
                        {fieldErrors.permissions[0]}
                      </p>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>


          </Accordion>
        </form>
      </div>
      <SaveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        isLoading={isLoading}
        isSuccess={true}
        backLink="/dashboard/admin"
        title={"Admin"}
      />
    </div>
  );
};

export default AdminForm;
