"use client";
import React, { useEffect, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CreateListings,
  EditListings,
  fetchMlsData,
  GetOneListing,
} from "../listing";
import { useParams, useRouter } from "next/navigation";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { Listings } from "@/lib/types";
import { SaveModal } from "@/components/SaveModal";
import { State } from "country-state-city";
import DynamicMap from "@/components/DYnamicMap";
import { Get } from "../../agents/agents";
import { ArrowDown, ArrowUp } from "@/components/Icons";
import { useAppContext } from "@/app/context/AppContext";
import { useUnsaved } from "@/app/context/UnsavedContext";
import useUnsavedChangesWarning from "@/app/hooks/useUnsavedChangesWarning";
import Link from "next/link";
import GooglePlacesAutocomplete from "../../calendar/components/AutoCompleteInput";
import AddAgentDialog from "../../orders/components/AddAgentDialog";
import { cn } from "@/lib/utils";
import { Info, Plus } from "lucide-react";

const ListingsFrom = () => {
  const { userType } = useAppContext();
  const [currentListing, setCurrentListing] = useState<Listings | null>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [mls, setMls] = useState("");
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [bathrooms, setBathrooms] = useState<number | "">("");
  const [squareFootage, setSquareFootage] = useState("");
  const [lotSize, setLotSize] = useState<string | "">("");
  const [yearConstructed, setYearConstructed] = useState("");
  const [parkingSpots, setParkingSpots] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState("");
  const [suite, setSuite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("CA");
  const [connectedAgent, setConnectedAgent] = useState("");
  const [tourActivated, setTourActivated] = useState(false);
  const [publishDate, setPublishDate] = useState("");
  const [propertyWebsite, setPropertyWebsite] = useState("");
  const [mlsProperty, setMlsProperty] = useState("");
  //const [occupancy, setOccupancy] = useState("");
  const [mediaCreatorAccess, setMediaCreatorAccess] = useState("");
  const [instructions, setInstructions] = useState("");
  const [animalsOnProperty, setAnimalsOnProperty] = useState(false);
  const [coAgents, setCoAgents] = useState<string[]>([]);
  type Agent = {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
  };
  const [agent, setAgent] = useState<Agent[]>([]);
  const [Isstaticmail, setIsStaticmail] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState<string>("");
  const [staticEmail, setstaticEmail] = useState<string[]>([]);
  const [states, setStates] = useState<{ name: string; isoCode: string }[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [confirmOpen1, setConfirmOpen1] = useState(false);
  const [pendingAction1, setPendingAction1] = useState<(() => void) | null>(
    null
  );
  const [showAgain1, setShowAgain1] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [initialAgentId, setInitialAgentId] = useState("");
  const [isAgentChanged, setIsAgentChanged] = useState(false);
  const [showAgentChangeConfirmation, setShowAgentChangeConfirmation] = useState(false);
  const [pendingAgentSelection, setPendingAgentSelection] = useState("");
  const [openAddAgentDialog, setOpenAddAgentDialog] = useState(false);
  const [showAgainAgent, setShowAgainAgent] = useState(true);
  // const [origin, setOrigin] = useState("");

  // useEffect(() => {
  //   setOrigin(window.location.origin);
  // }, []);

  const { isDirty, setIsDirty } = useUnsaved();
  useUnsavedChangesWarning(isDirty);
  const isPopulatingData = useRef(false);
  const hasInitiallyRendered = useRef(false);
  const headerRef = useRef<HTMLDivElement>(null);

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

  const confirmAndExecute1 = () => {
    pendingAction1?.();
    setPendingAction1(null);
  };

  const router = useRouter();
  const params = useParams();
  const listingId = params?.id as string;
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      return;
    }

    if (token) {
      Get()
        .then((data) => setAgent(data.data))
        .catch((err) => console.log(err.message));
    } else {
      console.log("User ID is undefined.");
    }
  }, []);

  useEffect(() => {
    const showAgain = localStorage.getItem('confirmation_dialog_agent_change_show_again');
    if (showAgain !== null) {
      setShowAgainAgent(JSON.parse(showAgain));
    }
  }, []);

  const fetchAgents = async () => {
    try {
      const data = await Get();
      setAgent(data.data);
    } catch (err) {
      console.log("Error fetching agents:", err);
    }
  };

  // For create mode, mark as initially rendered after a short delay
  // This prevents browser autofill from triggering dirty state
  useEffect(() => {
    if (!listingId) {
      setTimeout(() => {
        hasInitiallyRendered.current = true;
      }, 500); // Longer delay to account for browser autofill
    }
  }, [listingId]);
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      return;
    }

    if (listingId) {
      GetOneListing(listingId)
        .then((res) => {
          const data = res.data;

          if (data) {
            isPopulatingData.current = true;
            setCurrentListing(data);
            setConnectedAgent(data.agent.uuid);
            setInitialAgentId(data.agent.uuid);
            setListingPrice(data.listing_price?.toString() || "");
            setMls(data.mls_number || "");
            setBedrooms(data.bedrooms ?? "");
            setBathrooms(data.bathrooms ?? "");
            setSquareFootage(data.square_footage?.toString() || "");
            setLotSize(data.lot_size?.toString() || "");
            setYearConstructed(data.year_constructed?.toString() || "");
            setParkingSpots(data.parking_spots?.toString() || "");
            setPropertyType(data.property_type || "");
            setPropertyStatus(data.property_status || "");
            setHeading(data.heading || "");
            setDescription(data.description || "");
            setSuite(data.suite || "");
            setAddress(data.address || "");
            setCity(data.city || "");
            // setProvince(data.province);
            setPostalCode(data.postal_code || "");
            setCountry(data.country || "CA");
            setTourActivated(!!data.tour_activated);
            setPublishDate(
              typeof data.publish_date === "string"
                ? data.publish_date.split(" ")[0]
                : ""
            );
            setPropertyWebsite(data.property_website || "");
            setMlsProperty(data.mls_property || "");
            //setOccupancy(data.occupancy || "");
            setMediaCreatorAccess(data.media_creator_access || "");
            setInstructions(data.instructions || "");
            setAnimalsOnProperty(!!data.animals_on_property);
            setCoAgents(data.co_agents || []);
            setIsStaticmail(!!data.send_statistics_email);
            setEmailFrequency(data.statistics_email_frequency || "");
            setstaticEmail(data.statistics_email_recipients || []);
            // Use setTimeout to ensure all state updates and DOM updates complete
            setTimeout(() => {
              isPopulatingData.current = false;
              hasInitiallyRendered.current = true;
            }, 100);

            setIsDirty(false);
          }
        })
        .catch((err) => console.log(err.message));
    } else {
      console.log("Listing ID is undefined.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  useEffect(() => {
    if (states.length && currentListing && currentListing?.province) {
      const match = states.find((s) => s.isoCode === currentListing.province);
      if (match) {
        setProvince(match.isoCode);
      }
    }
  }, [states, currentListing]);

  useEffect(() => {
    if (country) {
      setStates(State.getStatesOfCountry(country));
      setProvince("");
    }
  }, [country]);

  const handleSubmit = async () => {
    const validationErrors: Record<string, string[]> = {};

    // Validate required fields
    if (
      !listingPrice ||
      isNaN(Number(listingPrice)) ||
      Number(listingPrice) < 0
    )
      validationErrors.listing_price = [
        "Listing Price is required and must be a positive number",
      ];
    if (!mls) validationErrors.mls_number = ["MLS Number is required"];
    if (userType !== "agent" && !connectedAgent)
      validationErrors.agent_id = ["Agent is required"];
    if (
      bedrooms === "" ||
      isNaN(Number(bedrooms)) ||
      Number(bedrooms) < 0 ||
      Number(bedrooms) > 20
    )
      validationErrors.bedrooms = ["Bedrooms must be between 0 and 20"];
    if (
      bathrooms === "" ||
      isNaN(Number(bathrooms)) ||
      Number(bathrooms) < 0 ||
      Number(bathrooms) > 20
    )
      validationErrors.bathrooms = ["Bathrooms must be between 0 and 20"];
    if (
      squareFootage === "" ||
      isNaN(Number(squareFootage)) ||
      Number(squareFootage) < 0
    )
      validationErrors.square_footage = [
        "Square Footage must be a positive number",
      ];
    if (!lotSize) validationErrors.lot_size = ["Lot Size is required"];
    const currentYear = new Date().getFullYear();
    if (
      yearConstructed === "" ||
      isNaN(Number(yearConstructed)) ||
      Number(yearConstructed) < 1800 ||
      Number(yearConstructed) > currentYear
    )
      validationErrors.year_constructed = [
        `Year Constructed must be between 1800 and ${currentYear}`,
      ];
    if (
      parkingSpots === "" ||
      isNaN(Number(parkingSpots)) ||
      Number(parkingSpots) < 0 ||
      Number(parkingSpots) > 50
    )
      validationErrors.parking_spots = [
        "Parking Spots must be between 0 and 50",
      ];
    if (!propertyType)
      validationErrors.property_type = ["Property Type is required"];
    if (!propertyStatus)
      validationErrors.property_status = ["Property Status is required"];
    if (!heading) validationErrors.heading = ["Heading is required"];
    if (!description)
      validationErrors.description = ["Description is required"];
    if (!address) validationErrors.address = ["Address is required"];
    if (!city) validationErrors.city = ["City is required"];
    if (!province) validationErrors.province = ["Province is required"];
    if (!postalCode) validationErrors.postal_code = ["Postal Code is required"];
    // if (!occupancy) validationErrors.occupancy = ["Occupancy is required"];

    // const today = new Date();
    // today.setHours(0, 0, 0, 0);

    // if (!publishDate) {
    //   validationErrors.publish_date = ["Publish Date is required"];
    // } else {
    //   const selectedDate = new Date(publishDate + "T00:00:00");
    //   if (selectedDate < today) {
    //     validationErrors.publish_date = ["Publish Date cannot be in the past"];
    //   }
    // }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      const firstError = Object.values(validationErrors).flat()[0];
      toast.error(
        firstError || "Please fill in all required fields correctly."
      );
      return;
    }

    try {
      const payload = {
        listing_price: Number(listingPrice),
        mls_number: mls,
        bedrooms: Number(bedrooms),
        agent_id: userType === "agent" ? userInfo?.uuid : connectedAgent,
        bathrooms: Number(bathrooms),
        square_footage: Number(squareFootage),
        lot_size: lotSize,
        year_constructed: Number(yearConstructed),
        parking_spots: Number(parkingSpots),
        property_type: propertyType,
        property_status: propertyStatus,
        heading,
        description,
        suite: suite ? suite : null,
        address,
        city,
        province,
        postal_code: postalCode,
        country,
        tour_activated: tourActivated,
        publish_date: publishDate,
        property_website: propertyWebsite,
        mls_property: mlsProperty,
        // occupancy: occupancy,
        media_creator_access: mediaCreatorAccess,
        instructions: instructions,
        animals_on_property: animalsOnProperty,
        co_agents: coAgents,
        send_statistics_email: Isstaticmail,
        statistics_email_frequency: emailFrequency,
        statistics_email_recipients: staticEmail,
      };
      // coAgents.forEach((email, index) => {
      //     payload[`co_agents[${index}]`] = email;
      // });

      if (listingId) {
        const result = await EditListings(listingId, payload);
        if (result.status) {
          toast.success("Listing updated successfully");
          setIsLoading(true);
          setOpen(true);
          setIsDirty(false);
          router.push("/dashboard/listings");
        }
        setIsLoading(false);
      } else {
        const result = await CreateListings(payload);
        if (result.status) {
          toast.success("Listings created successfully");
          setIsLoading(true);
          setOpen(true);
          setIsDirty(false);
          router.push("/dashboard/listings");
        }
        setIsLoading(false);
      }
    } catch (error) {
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
        // toast.error(firstError || "Validation error");
        toast.error("Validation error kindly re-check your form");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit user data");
      }
    }
  };

  async function handleMlsFetch(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    if (!mls) {
      toast.error("Please enter an MLS number first");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchMlsData(mls);

      const mls_data = response.mls || response;

      if (mls_data && !mls_data.error) {
        isPopulatingData.current = true;

        setListingPrice(mls_data.listPrice?.toString() || "");
        setBedrooms(mls_data.details?.numBedrooms?.toString() || "");
        setBathrooms(mls_data.details?.numBathrooms?.toString() || "");

        const style = mls_data.details?.style || "";
        if (style.includes("Single Family Residence")) {
          setPropertyType("Detached Home");
        } else if (style.includes("Townhouse") || style.includes("Townhome")) {
          setPropertyType("Townhouse");
        } else if (style.includes("Condo") || style.includes("Condominium")) {
          setPropertyType("Condo");
        } else if (style.includes("Apartment")) {
          setPropertyType("Apartment");
        } else if (style.includes("Commercial")) {
          setPropertyType("Commercial");
        }

        setSquareFootage(mls_data.details?.sqft?.toString() || "");

        setYearConstructed(mls_data.details?.yearBuilt?.toString() || "");

        const parkingSpots =
          mls_data.details?.numParkingSpaces ||
          mls_data.details?.numDrivewaySpaces;
        setParkingSpots(parkingSpots?.toString() || "");

        const standardStatus = mls_data.standardStatus || "";
        if (standardStatus.includes("Active Under Contract")) {
          setPropertyStatus("Under contract");
        } else if (mls_data.status === "A") {
          setPropertyStatus("Just listed");
        } else if (mls_data.status === "S" || mls_data.status === "Sld") {
          setPropertyStatus("Sold");
        } else if (mls_data.status === "P") {
          setPropertyStatus("Pending");
        }

        const addressParts = [];
        if (mls_data.address?.streetNumber)
          addressParts.push(mls_data.address.streetNumber);
        if (mls_data.address?.streetName)
          addressParts.push(mls_data.address.streetName);
        if (mls_data.address?.streetSuffix)
          addressParts.push(mls_data.address.streetSuffix);

        const fullAddress = addressParts.join(" ");
        setAddress(fullAddress.trim());

        setCity(mls_data.address?.city || "");
        setPostalCode(mls_data.address?.zip || "");

        if (mls_data.address?.state === "NC") {
          setCountry("US");
          setProvince("NC");
        } else if (
          mls_data.address?.country === "US" ||
          mls_data.address?.state
        ) {
          setCountry("US");
          if (mls_data.address?.state) {
            setProvince(mls_data.address.state);
          }
        }

        if (mls_data.lot?.size) {
          setLotSize(mls_data.lot.size.toString());
        } else if (mls_data.lot?.squareFeet) {
          const acres = mls_data.lot.squareFeet / 43560;
          setLotSize(acres.toFixed(2));
        } else if (mls_data.lot?.acres) {
          setLotSize(mls_data.lot.acres.toString());
        }

        setDescription(mls_data.details?.description || "");

        if (!heading || heading.trim() === "") {
          const generatedHeading = `${mls_data.address?.streetNumber || ""} ${mls_data.address?.streetName || ""
            } ${mls_data.details?.style || "Property"}`;
          setHeading(generatedHeading.trim());
        }

        if (mls_data.address?.unitNumber) {
          setSuite(mls_data.address.unitNumber);
        }

        if (mls_data.listDate) {
          try {
            const date = new Date(mls_data.listDate);
            if (!isNaN(date.getTime())) {
              const formattedDate = date.toISOString().split("T")[0];
              setPublishDate(formattedDate);
            }
          } catch (error) {
            console.error("Error parsing listDate:", error);
          }
        }

        if (mls_data.details?.virtualTourUrl) {
          setPropertyWebsite(mls_data.details.virtualTourUrl);
        } else if (mls_data.details?.alternateURLVideoLink) {
          setPropertyWebsite(mls_data.details.alternateURLVideoLink);
        }

        setMlsProperty(`MLS#: ${mls_data.mlsNumber || mls}`);

        // if (mls_data.occupancy) {
        //   const occupancyLower = mls_data.occupancy.toLowerCase();
        //   if (occupancyLower.includes("owner")) {
        //     setOccupancy("Owner Occupied");
        //   } else if (occupancyLower.includes("tenant")) {
        //     setOccupancy("Tenant Occupied");
        //   } else if (occupancyLower.includes("vacant")) {
        //     setOccupancy("Single Vacant");
        //   }
        // }

        const extras = (mls_data.details?.extras || "").toLowerCase();
        const descriptionText = (
          mls_data.details?.description || ""
        ).toLowerCase();

        if (extras.includes("lockbox") || descriptionText.includes("lockbox")) {
          setMediaCreatorAccess("Lockbox");
        } else if (extras.includes("key") || descriptionText.includes("key")) {
          setMediaCreatorAccess("Key");
        } else if (
          descriptionText.includes("access code") ||
          descriptionText.includes("code access")
        ) {
          setMediaCreatorAccess("Access Code");
        } else if (
          descriptionText.includes("listing agent") ||
          descriptionText.includes("agent only")
        ) {
          setMediaCreatorAccess("Listing Agent Only");
        } else {
          setMediaCreatorAccess("Appointment Only");
        }

        const additionalInstructions = [];

        if (mls_data.details?.zoning) {
          additionalInstructions.push(`Zoning: ${mls_data.details.zoning}`);
        }

        if (mls_data.details?.waterSource) {
          additionalInstructions.push(
            `Water Source: ${mls_data.details.waterSource}`
          );
        }

        if (mls_data.details?.sewer) {
          additionalInstructions.push(`Sewer: ${mls_data.details.sewer}`);
        }

        if (mls_data.details?.extras) {
          additionalInstructions.push(
            `Included Extras: ${mls_data.details.extras}`
          );
        }

        if (additionalInstructions.length > 0) {
          const currentInstructions = instructions || "";
          const newInstructions = additionalInstructions.join("\n");
          setInstructions(
            currentInstructions
              ? `${currentInstructions}\n${newInstructions}`
              : newInstructions
          );
        }

        // Animals on property
        const descriptionLower = (
          mls_data.details?.description || ""
        ).toLowerCase();
        if (
          descriptionLower.includes("pet") ||
          descriptionLower.includes("dog") ||
          descriptionLower.includes("cat")
        ) {
          if (
            descriptionLower.includes("no pet") ||
            descriptionLower.includes("no animal")
          ) {
            setAnimalsOnProperty(false);
          } else {
            setAnimalsOnProperty(true);
          }
        }

        // Co-agents from agents array
        if (mls_data.agents && mls_data.agents.length > 0) {
          // Define the agent type
          type MlsAgent = {
            email?: string;
            name?: string;
            agentId?: string;
            phones?: string[];
          };

          const agentEmails = (mls_data.agents as MlsAgent[])
            .map((agent: MlsAgent) => agent.email)
            .filter(
              (email: string | undefined): email is string =>
                email !== undefined && email !== "REDACTED"
            );

          if (agentEmails.length > 0) {
            const newCoAgents = [...new Set([...coAgents, ...agentEmails])];
            setCoAgents(newCoAgents);
          }
        }

        toast.success("MLS data fetched and populated successfully!");

        // Use setTimeout to ensure all state updates and DOM updates complete
        setTimeout(() => {
          isPopulatingData.current = false;
          hasInitiallyRendered.current = true;
        }, 100);
        setIsDirty(true);
      } else {
        toast.error("Failed to fetch MLS data or no data returned");
      }
    } catch (error) {
      console.error("Error fetching MLS data:", error);
      toast.error(
        "Error fetching MLS data. Please check the MLS number and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleAgentChange = (val: string) => {
    if (!showAgainAgent) {
      setConnectedAgent(val);
      setIsAgentChanged(val !== initialAgentId);
      return;
    }
    setPendingAgentSelection(val);
    setShowAgentChangeConfirmation(true);
  };

  const confirmAgentChange = () => {
    const val = pendingAgentSelection;
    setConnectedAgent(val);
    setIsAgentChanged(val !== initialAgentId);
    setShowAgentChangeConfirmation(false);
    if (fieldErrors.agent_id) {
      const newErrors = { ...fieldErrors };
      delete newErrors.agent_id;
      setFieldErrors(newErrors);
    }
  };

  const handleNewAgentAdded = async () => {
    await fetchAgents();
    setOpenAddAgentDialog(false);
    toast.success("New agent added and can now be selected");
  };

  // const inputRef = useRef<HTMLInputElement>(null);

  // const openCalendar = () => {
  //   inputRef.current?.showPicker(); // Trigger native date picker
  // };

  return (
    <div className="font-alexandria">
      <div
        ref={headerRef}
        className="w-full h-[80px] bg-[#E4E4E4] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center"
        style={{ boxShadow: "0px 4px 4px #0000001F" }}
      >
        <p
          className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}
        >
          Listings &#62; {address ? `${address}` : `create`}
        </p>
        <div className="flex gap-[18px]">
          {/* <Link
            href={"/dashboard/listings/create"}
            className="w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px]  border-[1px] border-[#4290E9] bg-[#EEEEEE] text-[14px] md:text-[16px] font-[400] text-[#4290E9] flex gap-[5px] justify-center items-center hover:text-[#fff] hover:bg-[#4290E9]"
          >
            + New Listing
          </Link> */}
          <Button
            disabled={isLoading}
            onClick={() => {
              setPendingAction1(() => handleSubmit);
              setConfirmOpen1(true);
            }}
            className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button`}
          >
            Save Changes{" "}
          </Button>
          <ConfirmationDialog
            open={confirmOpen1}
            setOpen={setConfirmOpen1}
            onConfirm={confirmAndExecute1}
            showAgain={showAgain1}
            toggleShowAgain={() => setShowAgain1(!showAgain1)}
          />
        </div>
      </div>

      <div
        className={`w-full h-[160px] ${userType}-bg flex flex-col md:flex-row justify-between items-start py-[32px] px-[25px]`}
      >
        <p className="text-[14px] md:text-[20px] font-[500] text-[#F2F2F2]">
          {address && province && postalCode && country
            ? `${address}, ${province}, ${postalCode}, ${country}`
            : `Create Your Property Listing`}
        </p>
        <p className="text-[12px] md:text-[16px] font-[500] text-[#F2F2F2ff]">
          BC Floor Plans
        </p>
      </div>
      {listingId && (
        <div className="w-full h-[60px] bg-[#E4E4E4] font-alexandria pr-5 sticky top-[80px] z-40 flex items-center border-b border-[#BBBBBB]">
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center justify-center gap-x-6 w-full">
              <Link
                href={
                  (currentListing as Listings)?.orders?.[0]?.uuid
                    ? `/dashboard/file-manager/${(currentListing as Listings)?.orders?.[0]?.uuid
                    }?listingId=${currentListing?.uuid}`
                    : "#"
                }
                className={`h-[30px] w-[150px] cursor-pointer flex items-center uppercase justify-center font-medium text-[11px] border px-1 text-center rounded-[4px] transition-all duration-200 min-w-[95px] ${!(currentListing as Listings)?.orders?.[0]?.uuid
                  ? "opacity-50 pointer-events-none"
                  : ""
                  } ${false
                    ? `${userType}-bg text-white font-[700] ${userType}-border`
                    : `bg-[#fff] text-[#666666] font-[700] `
                  }`}
              >
                Media
              </Link>
              <div
                className={`h-[30px] w-[150px] cursor-pointer flex items-center uppercase justify-center font-medium text-[11px] border px-1 text-center rounded-[4px] transition-all duration-200 min-w-[95px] ${true
                  ? `${userType}-bg text-white font-[700] ${userType}-border`
                  : `bg-[#fff] text-[#666666] font-[700] `
                  }`}
              >
                Property details
              </div>
              <Link
                href={
                  currentListing?.orders?.[0]?.uuid
                    ? `/dashboard/orders/${currentListing?.orders?.[0]?.uuid}`
                    : "#"
                }
                className={`h-[30px] w-[150px] cursor-pointer flex items-center uppercase justify-center font-medium text-[11px] border px-1 text-center rounded-[4px] transition-all duration-200 min-w-[95px] ${!currentListing?.orders?.[0]?.uuid
                  ? "opacity-50 pointer-events-none"
                  : ""
                  } ${false
                    ? `${userType}-bg text-white font-[700] ${userType}-border`
                    : `bg-[#fff] text-[#666666] font-[700] `
                  }`}
              >
                Order details
              </Link>
            </div>
          </div>
        </div>
      )}
      <div>
        <form
          onChange={() => {
            // Only mark as dirty if:
            // 1. Not currently populating data from API
            // 2. Has initially rendered (prevents autofill from triggering)
            if (!isPopulatingData.current && hasInitiallyRendered.current) {
              setIsDirty(true);
            }
          }}
          onSubmit={() => {
            handleSubmit();
          }}
        >
          <Accordion
            type="multiple"
            defaultValue={["property", "additional", "statistics"]}
            className="w-full space-y-4"
          >
            <AccordionItem value="property">
              <AccordionTrigger
                className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
              >
                Property Details
              </AccordionTrigger>
              <AccordionContent className="grid gap-4">
                <div className="w-full flex flex-col items-center">
                  <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                    <p>Add all requires details for listing</p>
                    <div className="grid grid-cols-2 gap-[16px]">
                      {userType != "agent" && (
                        <div className="col-span-2">
                          <div className="flex justify-between items-center mb-[12px]">
                            <label htmlFor="" className="m-0">
                              Agent{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div
                              className="flex items-center gap-x-[10px] cursor-pointer"
                              onClick={() => setOpenAddAgentDialog(true)}
                            >
                              <p className='text-base font-semibold font-raleway text-[#6BAE41]'>Add New Agent</p>
                              <div className='w-[18px] h-[18px] bg-[#6BAE41] text-white rounded-sm flex items-center justify-center'>
                                <Plus className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          <div className={cn(
                            "rounded-md p-1 transition-all duration-300",
                            isAgentChanged && "bg-yellow-50 border border-yellow-200"
                          )}>
                            <Select
                              value={connectedAgent}
                              onValueChange={handleAgentChange}
                            >
                              <SelectTrigger
                                className={cn(
                                  "w-full h-[42px] bg-[#EEEEEE] border transition-all duration-300",
                                  fieldErrors.agent_id ? "border-red-500" : "border-[#BBBBBB]",
                                  isAgentChanged && "border-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]"
                                )}
                              >
                                <SelectValue placeholder="Select Agent" />
                              </SelectTrigger>
                              <SelectContent>
                                {agent?.map((ag) => (
                                  <SelectItem key={ag.uuid} value={ag.uuid}>
                                    {ag.first_name} {ag.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {isAgentChanged && (
                              <p className="text-yellow-700 text-[12px] mt-2 font-medium flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                The agent for this property has been changed. Review before saving.
                              </p>
                            )}
                          </div>

                          {fieldErrors.agent_id && (
                            <p className="text-red-500 text-[10px] mt-1">
                              {fieldErrors.agent_id[0]}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label htmlFor="">
                          Listing Price (CAD){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={listingPrice}
                          onChange={(e) => {
                            setListingPrice(e.target.value);
                            if (fieldErrors.listing_price) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.listing_price;
                              setFieldErrors(newErrors);
                            }
                          }}
                          placeholder="e.g 844,500"
                          className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.listing_price
                            ? "border-red-500"
                            : "border-[#BBBBBB]"
                            }`}
                          type="text"
                        />
                        {fieldErrors.listing_price && (
                          <p className="text-red-500 text-[10px] mt-1">
                            {fieldErrors.listing_price[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="">
                          MLS# <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={mls}
                          onChange={(e) => {
                            setMls(e.target.value);
                            if (fieldErrors.mls_number) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.mls_number;
                              setFieldErrors(newErrors);
                            }
                          }}
                          placeholder="e.g A2206608"
                          className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.mls_number
                            ? "border-red-500"
                            : "border-[#BBBBBB]"
                            }`}
                          type="text"
                        />

                        {fieldErrors.mls_number && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.mls_number[0]}
                          </p>
                        )}
                        <span>
                          <button
                            type="button"
                            onClick={(e) => handleMlsFetch(e)}
                            disabled={isLoading || !mls}
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {isLoading ? "Syncing..." : "Sync MLS Data"}
                          </button>
                        </span>
                      </div>
                      <div className={`relative w-full `}>
                        <label
                          htmlFor="bedroom"
                          className="block text-sm font-normal"
                        >
                          Bedrooms <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="bedroom"
                          type="number"
                          placeholder="3"
                          min={0}
                          value={bedrooms === "" ? "" : bedrooms}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (fieldErrors.bedrooms) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.bedrooms;
                              setFieldErrors(newErrors);
                            }

                            if (value === "") {
                              setBedrooms(""); // Allow clearing the input
                              return;
                            }

                            const numeric = Number(value);
                            if (!isNaN(numeric) && numeric >= 0) {
                              setBedrooms(numeric); // Only valid numbers >= 0
                            }
                          }}
                          className={`h-[42px] w-full bg-[#EEEEEE] border text-[16px] mt-[12px] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${fieldErrors.bedrooms
                            ? "border-red-500"
                            : "border-[#BBBBBB]"
                            }`}
                        />
                        {fieldErrors.bedrooms && (
                          <p className="text-red-500 text-[10px] mt-1">
                            {fieldErrors.bedrooms[0]}
                          </p>
                        )}

                        <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                          <button
                            type="button"
                            onClick={() =>
                              setBedrooms((prev) =>
                                Math.max(
                                  0,
                                  parseFloat((prev || 0).toString()) + 1
                                )
                              )
                            }
                            className={`${userType}-fill-svg`}
                          >
                            <ArrowUp />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setBedrooms((prev) =>
                                Math.max(
                                  0,
                                  parseFloat((prev || 0).toString()) - 1
                                )
                              )
                            }
                            className={`${userType}-fill-svg`}
                          >
                            <ArrowDown />
                          </button>
                        </div>
                      </div>
                      <div className="relative w-full">
                        <label
                          htmlFor="bathroom"
                          className="block text-sm font-normal"
                        >
                          Bathrooms <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="bathroom"
                          type="number"
                          placeholder="3"
                          min={0}
                          value={bathrooms === "" ? "" : bathrooms}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (fieldErrors.bathrooms) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.bathrooms;
                              setFieldErrors(newErrors);
                            }

                            if (value === "") {
                              setBathrooms("");
                              return;
                            }

                            const numeric = Number(value);
                            if (!isNaN(numeric) && numeric >= 0) {
                              setBathrooms(numeric); // Only valid numbers >= 0
                            }
                          }}
                          className={`h-[42px] w-full bg-[#EEEEEE] border text-[16px] mt-[12px] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${fieldErrors.bathrooms
                            ? "border-red-500"
                            : "border-[#BBBBBB]"
                            }`}
                        />
                        {fieldErrors.bathrooms && (
                          <p className="text-red-500 text-[10px] mt-1">
                            {fieldErrors.bathrooms[0]}
                          </p>
                        )}

                        <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                          <button
                            type="button"
                            onClick={() =>
                              setBathrooms((prev) =>
                                Math.max(
                                  0,
                                  parseFloat((prev || 0).toString()) + 1
                                )
                              )
                            }
                            className={`${userType}-fill-svg`}
                          >
                            <ArrowUp />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setBathrooms((prev) =>
                                Math.max(
                                  0,
                                  parseFloat((prev || 0).toString()) - 1
                                )
                              )
                            }
                            className={`${userType}-fill-svg`}
                          >
                            <ArrowDown />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="">
                          Square Footage <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={squareFootage}
                          onChange={(e) => {
                            setSquareFootage(e.target.value);
                            if (fieldErrors.square_footage) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.square_footage;
                              setFieldErrors(newErrors);
                            }
                          }}
                          placeholder="e.g 2230 sq. ft."
                          className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.square_footage
                            ? "border-red-500"
                            : "border-[#BBBBBB]"
                            }`}
                          type="text"
                        />
                        {fieldErrors.square_footage && (
                          <p className="text-red-500 text-[10px] mt-1">
                            {fieldErrors.square_footage[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="">
                          Lot Size (Acres){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={lotSize}
                          onChange={(e) => {
                            setLotSize(e.target.value);
                            if (fieldErrors.lot_size) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.lot_size;
                              setFieldErrors(newErrors);
                            }
                          }}
                          placeholder="e.g 0-4,050 sq. ft."
                          className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.lot_size
                            ? "border-red-500"
                            : "border-[#BBBBBB]"
                            }`}
                          type="text"
                        />
                        {fieldErrors.lot_size && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.lot_size[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="">
                          Year Contstructed{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={yearConstructed}
                          onChange={(e) => {
                            setYearConstructed(e.target.value);
                            if (fieldErrors.year_constructed) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.year_constructed;
                              setFieldErrors(newErrors);
                            }
                          }}
                          placeholder="e.g 2020"
                          className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.year_constructed
                            ? "border-red-500"
                            : "border-[#BBBBBB]"
                            }`}
                          type="text"
                        />
                        {fieldErrors.year_constructed && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.year_constructed[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="">
                          Parking Spots <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={parkingSpots}
                          onChange={(e) => {
                            setParkingSpots(e.target.value);
                            if (fieldErrors.parking_spots) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.parking_spots;
                              setFieldErrors(newErrors);
                            }
                          }}
                          placeholder="e.g 3"
                          className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.parking_spots
                            ? "border-red-500"
                            : "border-[#BBBBBB]"
                            }`}
                          type="text"
                        />
                        {fieldErrors.parking_spots && (
                          <p className="text-red-500 text-[10px] mt-1">
                            {fieldErrors.parking_spots[0]}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">
                          Property Type <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={propertyType}
                          onValueChange={(value) => {
                            setPropertyType(value);
                            if (fieldErrors.property_type) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.property_type;
                              setFieldErrors(newErrors);
                            }
                          }}
                        >
                          <SelectTrigger
                            className={`w-full  h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.property_type
                              ? "border-red-500"
                              : "border-[#BBBBBB]"
                              }`}
                          >
                            <SelectValue placeholder="Select Property Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Detached Home">
                              Detached Home
                            </SelectItem>
                            <SelectItem value="Semi-Detached">
                              Semi-Detached
                            </SelectItem>
                            <SelectItem value="Townhouse">Townhouse</SelectItem>
                            <SelectItem value="Condo">Condo</SelectItem>
                            <SelectItem value="Apartment">Apartment</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldErrors.property_type && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.property_type[0]}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">
                          Property Status{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={propertyStatus}
                          onValueChange={(value) => {
                            setPropertyStatus(value);
                            if (fieldErrors.property_status) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.property_status;
                              setFieldErrors(newErrors);
                            }
                          }}
                        >
                          <SelectTrigger
                            className={`w-full  h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.property_status
                              ? "border-red-500"
                              : "border-[#BBBBBB]"
                              }`}
                          >
                            <SelectValue placeholder="Select Property Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Just listed">
                              Just listed
                            </SelectItem>
                            <SelectItem value="Under contract">
                              Under contract
                            </SelectItem>
                            <SelectItem value="Sold">Sold</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                            <SelectItem value="Expired">
                              ConExpireddo
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldErrors.property_status && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.property_status[0]}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">
                          Heading <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={heading}
                          onChange={(e) => {
                            setHeading(e.target.value);
                            if (fieldErrors.heading) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.heading;
                              setFieldErrors(newErrors);
                            }
                          }}
                          placeholder="e.g Single Family Detached Starter Home"
                          className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.heading
                            ? "border-red-500"
                            : "border-[#BBBBBB]"
                            }`}
                          type="text"
                        />
                        {fieldErrors.heading && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.heading[0]}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">
                          Description <span className="text-red-500">*</span>
                        </label>
                        {/* <Input placeholder='Single Family Detached Starter Home' className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" /> */}
                        <Textarea
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value);
                            if (fieldErrors.description) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors.description;
                              setFieldErrors(newErrors);
                            }
                          }}
                          placeholder="write some description of your listing"
                          className={`w-full resize-none h-[200px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.description
                            ? "border-red-500"
                            : "border-[#BBBBBB]"
                            }`}
                        />
                        {fieldErrors.description && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.description[0]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      className={`grid grid-cols-1 gap-[16px] ${userType}-order-1`}
                    >
                      <div className="space-y-[10px]">
                        <label htmlFor="">Suite</label>
                        <Input
                          value={suite}
                          onChange={(e) => setSuite(e.target.value)}
                          placeholder="e.g Suite 100"
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>
                      <GooglePlacesAutocomplete
                        mode="split"
                        addressComponents={{
                          address_line_1: address,
                          city: city,
                          province: province,
                          country: country,
                          postal_code: postalCode,
                          full_address: address
                        }}
                        onAddressComponentsChange={(comp) => {
                          setAddress(comp.address_line_1);
                          setCity(comp.city);
                          setProvince(comp.province);
                          setCountry(comp.country);
                          setPostalCode(comp.postal_code);

                          if (fieldErrors.address) {
                            const newErrors = { ...fieldErrors };
                            delete newErrors.address;
                            setFieldErrors(newErrors);
                          }
                        }}
                        fieldErrors={fieldErrors}
                      />
                    </div>
                  </div>
                  <div className="w-full h-[200px] md:h-[560px]">
                    <DynamicMap
                      address={address}
                      city={city}
                      province={province}
                      country={country}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* <AccordionItem value="additional">
              <AccordionTrigger
                className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
              >
                Additional Details
              </AccordionTrigger>
              <AccordionContent className="grid gap-4">
                <div className="w-full flex flex-col items-center">
                  <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                    <div className="p-[8px] flex flex-col items-center justify-center border-[1px] border-dashed border-[#BBBBBB] rounded-[6px]">
                      <Button
                        className="bg-[#BBBBBB] text-[20px] text-[#F2F2F2] font-[600] w-[330px] h-[44px] "
                        disabled
                      >
                        Processing
                      </Button>
                      <p className="text-[#7D7D7D] text-[14px]">
                        Orders are being processed. You will receive and email
                        notification when file are uploaded for your to review.
                      </p>
                    </div>
                    <div className="w-full py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                      <Table
                        className={`${currentListing &&
                          (currentListing?.orders?.length ?? 0) > 0
                          ? "table"
                          : "hidden"
                          } font-alexandria px-0 overflow-x-auto whitespace-nowrap table-auto w-full`}
                      >
                        <TableHeader>
                          <TableRow className="bg-[#E4E4E4] font-alexandria h-[54px] hover:bg-[#E4E4E4] table-row">
                            <TableHead className="pl-[20px] text-[14px] font-[700] text-[#666666] table-cell">
                              Order
                            </TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#666666] table-cell">
                              Total
                            </TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#666666] table-cell">
                              Added
                            </TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#666666] table-cell">
                              Status
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="table-row-group">
                          {currentListing?.orders?.map((order, index) => {
                            return (
                              <TableRow
                                key={index}
                                className="text-[15px] text-[#666666] table-row"
                              >
                                <TableCell className="pl-[20px] text-[15px] py-[19px] font-[400] text-[#4290E9] table-cell">
                                  {order.id}
                                </TableCell>
                                <TableCell className="text-[15px] py-[19px] font-[400] table-cell">
                                  {order.amount}
                                </TableCell>
                                <TableCell className="text-[15px] py-[19px] font-[400] table-cell">
                                  {new Date(
                                    order.created_at
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </TableCell>
                                <TableCell className="text-[10px] py-[19px] font-[400] table-cell">
                                  <span className="uppercase bg-[#E06D5E] text-[#F2F2F2] rounded-[10px] px-[7px] py-[2px]">
                                    {order.payment_status}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <p
                      className={`${currentListing && currentListing?.orders?.length === 0
                        ? "flex"
                        : "hidden"
                        } text-[24px] flex justify-center items-center my-[20px]`}
                    >
                      {" "}
                      No Order Found
                    </p>
                    {(userType === "admin" || userType === "agent") && (
                      <div className="flex items-center gap-[16px]">
                        <Switch
                          checked={tourActivated}
                          onCheckedChange={setTourActivated}
                          className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#4CAF50] "
                        />
                        <Label className="text-[14px] text-[#424242]">
                          Activate Tour
                        </Label>
                      </div>
                    )}
                    <div className="text-[#424242] w-full text-[14px] flex flex-col gap-[16px]">
                      {(userType === "admin" || userType === "agent") && (
                        <div className="w-full">
                          <Label>
                            Schedule Publish Date{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative w-full">
                            <Input
                              ref={inputRef}
                              value={publishDate}
                              onChange={(e) => {
                                setPublishDate(e.target.value);
                                if (fieldErrors.publish_date) {
                                  const newErrors = { ...fieldErrors };
                                  delete newErrors.publish_date;
                                  setFieldErrors(newErrors);
                                }
                              }}
                              type="date"
                              className={`h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] appearance-none pr-10 ${fieldErrors.publish_date
                                ? "border-red-500"
                                : "border-[#BBBBBB]"
                                }`}
                            />
                            <Calendar
                              onClick={openCalendar}
                              className={`cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 ${userType}-text h-[24px] w-[24px]`}
                              strokeWidth={1}
                            />
                          </div>
                          {fieldErrors.publish_date && (
                            <p className="text-red-500 text-[10px]">
                              {fieldErrors.publish_date[0]}
                            </p>
                          )}
                        </div>
                      )}
                      <div className=" w-full">
                        <Label>Property Website</Label>
                        {currentListing?.orders?.[0]?.uuid ? (
                          <div className="relative w-full">
                            <Input
                              value={`${origin}/tour/${currentListing?.address?.replace(
                                /\s+/g,
                                "-"
                              )}/${currentListing?.orders?.[0]?.uuid}`}
                              readOnly
                              type="text"
                              className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] pr-10 truncate"
                            />
                            <Copy
                              onClick={() => {
                                const url = `${origin}/tour/${currentListing?.address?.replace(
                                  /\s+/g,
                                  "-"
                                )}/${currentListing?.orders?.[0]?.uuid}`;
                                navigator.clipboard.writeText(url);
                                toast.success("Tour link copied to clipboard");
                              }}
                              className="cursor-pointer absolute right-3 top-[calc(50%+6px)] -translate-y-1/2 text-[#4290E9] h-[20px] w-[20px]"
                              strokeWidth={1}
                            />
                          </div>
                        ) : (
                          <div className="relative w-full ">
                            <Input
                              value={propertyWebsite}
                              onChange={(e) =>
                                setPropertyWebsite(e.target.value)
                              }
                              type="text"
                              readOnly
                              placeholder="company.bcfp.com/vendor/id=88392"
                              className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                            />
                             <Copy
                            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-[#4290E9] h-[24px] w-[24px]"
                            strokeWidth={1}
                          /> 
          </div>
                        )}
          {fieldErrors.property_website && (
            <p className="text-red-500 text-[10px]">
              {fieldErrors.property_website[0]}
            </p>
          )}
      </div>
      <div className=" w-full">
        <Label>MLS Property</Label>
        <div className="relative w-full ">
          <Input
            value={mlsProperty}
            onChange={(e) => setMlsProperty(e.target.value)}
            type="text"
            placeholder="company.bcfp.com/mls/id=88392"
            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
          />
         <Copy
                            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-[#4290E9] h-[24px] w-[24px]"
                            strokeWidth={1}
                          />
        </div>
        {fieldErrors.mls_property && (
          <p className="text-red-500 text-[10px]">
            {fieldErrors.mls_property[0]}
          </p>
        )}
      </div>
      <div>
        <hr className="border-[#BBBBBB]" />
      </div>
      <div className="w-full">
        <label htmlFor="">
          Occupancy <span className="text-red-500">*</span>
        </label>
        <Select
          value={occupancy}
          onValueChange={(value) => {
            setOccupancy(value);
            if (fieldErrors.occupancy) {
              const newErrors = { ...fieldErrors };
              delete newErrors.occupancy;
              setFieldErrors(newErrors);
            }
          }}
        >
          <SelectTrigger
            className={`w-full  h-[42px] bg-[#EEEEEE] border-[1px] mt-[12px] ${fieldErrors.occupancy
              ? "border-red-500"
              : "border-[#BBBBBB]"
              }`}
          >
            <SelectValue placeholder="Select Occupancy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Single Vacant" defaultChecked>
              Single Vacant
            </SelectItem>
            <SelectItem value="Tenant Occupied">
              Tenant Occupied
            </SelectItem>
            <SelectItem value="Owner Occupied">
              Owner Occupied
            </SelectItem>
          </SelectContent>
        </Select>

        {fieldErrors.occupancy && (
          <p className="text-red-500 text-[10px]">
            {fieldErrors.occupancy[0]}
          </p>
        )}
      </div>
      <div className="w-full">
        <label htmlFor="">Media Creator Access</label>
        <Select
          value={mediaCreatorAccess}
          onValueChange={(value) =>
            setMediaCreatorAccess(value)
          }
        >
          <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
            <SelectValue placeholder="e.g Lockbox" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Lockbox">Lockbox</SelectItem>
            <SelectItem value="Key">Key</SelectItem>
            <SelectItem value="Access Code">
              Access Code
            </SelectItem>
            <SelectItem value="Appointment Only">
              Appointment Only
            </SelectItem>
            <SelectItem value="Listing Agent Only">
              Listing Agent Only
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="">Instructions</Label>
        <Input
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g 123457"
          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
          type="text"
        />
      </div>
      <div>
        <Label htmlFor="">Animals On Property</Label>
        <Select
          value={animalsOnProperty?.toString()}
          onValueChange={(value) =>
            setAnimalsOnProperty(value === "true")
          }
        >
          <SelectTrigger className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>{" "}
      </div>
      <div>
        <div className="flex justify-between mb-[12px]">
          <Label htmlFor="" className="">
            Co Agents
          </Label>
           <p className='text-[#4290E9] flex gap-[10px] cursor-pointer'>Add<span className='flex bg-[#4290E9] w-[18px] h-[18px] rounded-[3px] justify-center items-center'><Plus className='text-[#F2F2F2] w-[12px]' /></span> </p> 
        </div>
        <TagsInput
          coAgents={coAgents}
          setCoAgents={setCoAgents}
        />
      </div>
    </div>
                  </div >
                </div >
              </AccordionContent >
            </AccordionItem > */}

            {/* <AccordionItem value="statistics">
              <AccordionTrigger
                className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
              >
                Statistics
              </AccordionTrigger>
              <AccordionContent className="grid gap-4">
                <div className="w-full flex flex-col items-center">
                  <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                    <div className="grid grid-cols-[36px_1fr_1fr] gap-x-[16px] place-items-center">
                      <Switch
                        checked={Isstaticmail}
                        onCheckedChange={setIsStaticmail}
                        className={`data-[state=unchecked]:bg-[#E06D5E] 
                          ${userType === "admin"
                            ? "data-[state=checked]:bg-[#4290E9]"
                            : ""
                          }
                          ${userType === "agent"
                            ? "data-[state=checked]:bg-[#6BAE41]"
                            : ""
                          }
                          ${userType === "vendor"
                            ? "data-[state=checked]:bg-[#DC9600]"
                            : ""
                          }
                        `}
                      />
                      <Label>Send Statistics Email</Label>
                      <Select
                        value={emailFrequency}
                        onValueChange={(value) => setEmailFrequency(value)}
                      >
                        <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB]">
                          <SelectValue placeholder="Monthly" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="mt-[30px]">
                        <TagsInput
                          coAgents={staticEmail}
                          setCoAgents={setstaticEmail}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-x-[16px]">
                      <div className="flex flex-col items-center px-[15px]">
                        <span className="text-[20px]">0</span>
                        <span className="text-[10px] text-center">
                          Photos Viewed
                        </span>
                      </div>

                      <div className="flex flex-col items-center px-[15px]">
                        <span className="text-[20px]">0</span>
                        <span className="text-[10px] text-center">
                          Tour Viewed
                        </span>
                      </div>
                      <div className="flex flex-col items-center px-[15px]">
                        <span className="text-[20px]">0</span>
                        <span className="text-[10px] text-center">
                          Total Visitors
                        </span>
                      </div>
                      <div className="flex flex-col items-center px-[15px]">
                        <span className="text-[20px]">0</span>
                        <span className="text-[10px] text-center">
                          Visitor Image View
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem> */}
          </Accordion >
        </form >
      </div >
      <SaveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        isLoading={isLoading}
        isSuccess={true}
        backLink="/dashboard/listings"
        title="Listing"
      />
      <ConfirmationDialog
        open={showAgentChangeConfirmation}
        setOpen={setShowAgentChangeConfirmation}
        onConfirm={confirmAgentChange}
        showAgain={showAgainAgent}
        toggleShowAgain={() => setShowAgainAgent(!showAgainAgent)}
        dialogType="agent_change"
        title="Change Agent?"
        description="Are you sure you want to change the agent associated with this property? This is usually rarely changed."
      />
      <AddAgentDialog
        open={openAddAgentDialog}
        setOpen={setOpenAddAgentDialog}
        onSuccess={handleNewAgentAdded}
      />
    </div >
  );
};

export default ListingsFrom;
