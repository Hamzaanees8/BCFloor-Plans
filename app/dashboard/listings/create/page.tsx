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
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { TagsInput } from "@/components/TagsInput";
import { toast } from "sonner";
import { CreateListings, EditListings, GetOneListing } from "../listing";
import { useParams, useRouter } from "next/navigation";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { Listings } from "../page";
import { SaveModal } from "@/components/SaveModal";
import { Country, State } from "country-state-city";
import DynamicMap from "@/components/DYnamicMap";
import { Get } from "../../agents/agents";
import { ArrowDown, ArrowUp } from "@/components/Icons";
import { useAppContext } from "@/app/context/AppContext";

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
  const [occupancy, setOccupancy] = useState("");
  const [mediaCreatorAccess, setMediaCreatorAccess] = useState("");
  const [instructions, setInstructions] = useState("");
  const [animalsOnProperty, setAnimalsOnProperty] = useState(false);
  const [coAgents, setCoAgents] = useState<string[]>([]);
  type Agent = { uuid: string; first_name: string; last_name: string; email: string; created_at: string };
  const [agent, setAgent] = useState<Agent[]>([]);
  const [Isstaticmail, setIsStaticmail] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState<string>("");
  const [staticEmail, setstaticEmail] = useState<string[]>([]);
  const [countries, setCountries] = useState<
    { name: string; isoCode: string }[]
  >([]);
  const [states, setStates] = useState<{ name: string; isoCode: string }[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [confirmOpen1, setConfirmOpen1] = useState(false);
  const [pendingAction1, setPendingAction1] = useState<(() => void) | null>(
    null
  );
  const [showAgain1, setShowAgain1] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  console.log("states", states);
  console.log("province", province);

  const confirmAndExecute1 = () => {
    pendingAction1?.();
    setPendingAction1(null);
  };

  const router = useRouter();
  const params = useParams();
  const listingId = params?.id as string;
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '');

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log('Token not found.')
      return;
    }

    if (token) {
      Get(token)
        .then(data => setAgent(data.data))
        .catch(err => console.log(err.message));
    } else {
      console.log('User ID is undefined.');
    }
  }, []);
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      return;
    }

    if (listingId) {
      GetOneListing(token, listingId)
        .then((res) => {
          const data = res.data;
          console.log("data.province", data.province);

          if (data) {
            setCurrentListing(data);
            setConnectedAgent(data.agent.uuid);
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
            setOccupancy(data.occupancy || "");
            setMediaCreatorAccess(data.media_creator_access || "");
            setInstructions(data.instructions || "");
            setAnimalsOnProperty(!!data.animals_on_property);
            setCoAgents(data.co_agents || []);
            setIsStaticmail(!!data.send_statistics_email);
            setEmailFrequency(data.statistics_email_frequency || "");
            setstaticEmail(data.statistics_email_recipients || []);
          }
        })
        .catch((err) => console.log(err.message));
    } else {
      console.log("Listing ID is undefined.");
    }
  }, [listingId]);
  console.log("currentListing", currentListing);

  useEffect(() => {
    if (states.length && currentListing && currentListing?.province) {
      const match = states.find((s) => s.isoCode === currentListing.province);
      if (match) {
        setProvince(match.isoCode);
      }
    }
  }, [states, currentListing]);

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (country) {
      setStates(State.getStatesOfCountry(country));
      setProvince("");
    }
  }, [country]);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const payload = {
        listing_price: Number(listingPrice),
        mls_number: mls,
        bedrooms: Number(bedrooms),
        agent_id: userType === 'agent' ? userInfo?.uuid : connectedAgent,
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
        occupancy: occupancy,
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
        const result = await EditListings(listingId, payload, token);
        if (result.status) {
          toast.success("Listing updated successfully");
          setIsLoading(true);
          setOpen(true);
          router.push('/dashboard/listings')
          console.log("User updated successfully:", result);
        }
        setIsLoading(false);
      } else {
        const result = await CreateListings(payload, token);
        if (result.status) {
          toast.success("Listings created successfully");
          setIsLoading(true);
          setOpen(true);
          router.push('/dashboard/listings')
          console.log("User created successfully:", result);
        }
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      setOpen(false);
      console.log("Raw error:", error);
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
        toast.error('Validation error kindly re-check your form');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit user data");
      }
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const openCalendar = () => {
    inputRef.current?.showPicker(); // Trigger native date picker
  };

  return (
    <div className="font-alexandria">
      <div
        className="w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center"
        style={{ boxShadow: "0px 4px 4px #0000001F" }}
      >
        <p className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}>
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
            {/* {isLoading ? (
                            <div role="status">
                                <svg
                                    aria-hidden="true"
                                    className="w-[28px] h-[28px] text-gray-600 animate-spin fill-[#fff]"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                        fill="currentFill"
                                    />
                                </svg>
                                <span className="sr-only">Loading...</span>
                            </div>
                        ) : (
                            ""
                        )} */}
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

      <div className={`w-full h-[160px] ${userType}-bg flex flex-col md:flex-row justify-between items-start py-[32px] px-[25px]`}>
        <p className="text-[14px] md:text-[20px] font-[500] text-[#F2F2F2]">
          {address && province && postalCode && country
            ? `${address}, ${province}, ${postalCode}, ${country}`
            : `Create Your Property Listing`}
        </p>
        <p className="text-[12px] md:text-[16px] font-[500] text-[#F2F2F2ff]">
          BC Floor Plans
        </p>
      </div>
      <div>
        <form
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
              <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
                Property Details
              </AccordionTrigger>
              <AccordionContent className="grid gap-4">
                <div className="w-full flex flex-col items-center">
                  <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                    <p>Add all requires details for listing</p>
                    <div className="grid grid-cols-2 gap-[16px]">
                      {userType != 'agent' &&
                        <div className='col-span-2'>
                          <label htmlFor="">Connected Agents <span className="text-red-500">*</span></label>
                          <Select value={connectedAgent} onValueChange={(val) => setConnectedAgent(val)}>
                            <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] mt-[12px] border border-[#BBBBBB]">
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

                          {fieldErrors.agent_id && <p className='text-red-500 text-[10px] mt-1'>{fieldErrors.agent_id[0]}</p>}
                        </div>
                      }

                      <div>
                        <label htmlFor="">Listing Price (CAD)</label>
                        <Input
                          value={listingPrice}
                          onChange={(e) => setListingPrice(e.target.value)}
                          placeholder="e.g 844,500"
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>
                      <div>
                        <label htmlFor="">MLS# <span className="text-red-500">*</span></label>
                        <Input
                          value={mls}
                          onChange={(e) => setMls(e.target.value)}
                          placeholder="e.g A2206608"
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />

                        {fieldErrors.mls_number && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.mls_number[0]}
                          </p>
                        )}
                      </div>
                      <div className={`relative w-full `}>
                        <label htmlFor="bedroom" className="block text-sm font-normal">
                          Bedrooms
                        </label>
                        <Input
                          id="bedroom"
                          type="number"
                          placeholder="3"
                          min={0}
                          value={bedrooms === '' ? '' : bedrooms}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (value === '') {
                              setBedrooms(''); // Allow clearing the input
                              return;
                            }

                            const numeric = Number(value);
                            if (!isNaN(numeric) && numeric >= 0) {
                              setBedrooms(numeric); // Only valid numbers >= 0
                            }
                          }}
                          className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />

                        <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                          <button type="button" onClick={() => setBedrooms(prev => Math.max(0, parseFloat((prev || 0).toString()) + 1))} className={`${userType}-fill-svg`}><ArrowUp /></button>
                          <button type="button" onClick={() => setBedrooms(prev => Math.max(0, parseFloat((prev || 0).toString()) - 1))} className={`${userType}-fill-svg`}><ArrowDown /></button>
                        </div>
                      </div>
                      <div className="relative w-full">
                        <label htmlFor="bathroom" className="block text-sm font-normal">
                          Bathrooms
                        </label>
                        <Input
                          id="bathroom"
                          type="number"
                          placeholder="3"
                          min={0}
                          value={bathrooms === '' ? '' : bathrooms}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (value === '') {
                              setBathrooms(''); // Allow clearing the input
                              return;
                            }

                            const numeric = Number(value);
                            if (!isNaN(numeric) && numeric >= 0) {
                              setBathrooms(numeric); // Only valid numbers >= 0
                            }
                          }}
                          className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />

                        <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                          <button type="button" onClick={() => setBathrooms(prev => Math.max(0, parseFloat((prev || 0).toString()) + 1))} className={`${userType}-fill-svg`}><ArrowUp /></button>
                          <button type="button" onClick={() => setBathrooms(prev => Math.max(0, parseFloat((prev || 0).toString()) - 1))} className={`${userType}-fill-svg`}><ArrowDown /></button>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="">Square Footage</label>
                        <Input
                          value={squareFootage}
                          onChange={(e) => setSquareFootage(e.target.value)}
                          placeholder="e.g 2230 sq. ft."
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>
                      <div>
                        <label htmlFor="">Lot Size (Acres) <span className="text-red-500">*</span></label>
                        <Input
                          value={lotSize}
                          onChange={(e) => setLotSize(e.target.value)}
                          placeholder="e.g 0-4,050 sq. ft."
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                        {fieldErrors.lot_size && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.lot_size[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="">Year Contstructed <span className="text-red-500">*</span></label>
                        <Input
                          value={yearConstructed}
                          onChange={(e) => setYearConstructed(e.target.value)}
                          placeholder="e.g 2020"
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                        {fieldErrors.year_constructed && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.year_constructed[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="">Parking Spots</label>
                        <Input
                          value={parkingSpots}
                          onChange={(e) => setParkingSpots(e.target.value)}
                          placeholder="e.g 3"
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">Property Type <span className="text-red-500">*</span></label>
                        <Select
                          value={propertyType}
                          onValueChange={(value) => setPropertyType(value)}
                        >
                          <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
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
                        <label htmlFor="">Property Status <span className="text-red-500">*</span></label>
                        <Select
                          value={propertyStatus}
                          onValueChange={(value) => setPropertyStatus(value)}
                        >
                          <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
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
                        <label htmlFor="">Heading <span className="text-red-500">*</span></label>
                        <Input
                          value={heading}
                          onChange={(e) => setHeading(e.target.value)}
                          placeholder="e.g Single Family Detached Starter Home"
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                        {fieldErrors.heading && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.heading[0]}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="">Description <span className="text-red-500">*</span></label>
                        {/* <Input placeholder='Single Family Detached Starter Home' className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" /> */}
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="write some description of your listing"
                          className="w-full resize-none h-[200px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                        />
                        {fieldErrors.description && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.description[0]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`grid grid-cols-2 gap-[16px] ${userType}-order-1`}>
                      <div className="col-span-2 grid grid-cols-5 gap-x-[16px]">
                        <div>
                          <label htmlFor="">Suite</label>
                          <Input
                            value={suite}
                            onChange={(e) => setSuite(e.target.value)}
                            placeholder=""
                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                            type="text"
                          />
                        </div>
                        <div className="col-span-4">
                          <label htmlFor="">Address <span className="text-red-500">*</span></label>
                          <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="e.g 4445 Parker St"
                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                            type="text"
                          />
                          {fieldErrors.address && (
                            <p className="text-red-500 text-[10px]">
                              {fieldErrors.address[0]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="">City <span className="text-red-500">*</span></label>
                        <Input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g Burnaby"
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />
                        {fieldErrors.city && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.city[0]}
                          </p>
                        )}
                      </div>
                      <div className="">
                        <label htmlFor="">Province <span className="text-red-500">*</span></label>
                        <Select
                          value={province}
                          onValueChange={(val) => setProvince(val)}
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
                        {fieldErrors.province && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.province[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="">Postal Code <span className="text-red-500">*</span></label>
                        <Input
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="e.g V5H 0H4"
                          className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          type="text"
                        />

                        {fieldErrors.postal_code && (
                          <p className="text-red-500 text-[10px]">
                            {fieldErrors.postal_code[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="" className="whitespace-nowrap">
                          Country (default Canada)
                        </label>
                        <Select
                          value={country}
                          onValueChange={(val) => setCountry(val)}
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
                        </Select>{" "}
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-[200px] md:h-[560px]">
                    {/* <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d83357.52320128103!2d-123.04024198044628!3d49.23995664757976!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x548677a8219c8373%3A0xdd0a72738752b169!2sBurnaby%2C%20BC%2C%20Canada!5e0!3m2!1sen!2s!4v1748548645299!5m2!1sen!2s"
                      width="100%"
                      height="100%"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="border-0"
                      title="Google Map - Burnaby, BC"
                    ></iframe> */}
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

            <AccordionItem value="additional">
              <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
                Additional Details
              </AccordionTrigger>
              <AccordionContent className="grid gap-4">
                <div className="w-full flex flex-col items-center">
                  <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                    {/* <div className='p-[8px] flex flex-col items-center justify-center border-[1px] border-dashed border-[#BBBBBB] rounded-[6px]'>
                                            <Button className='bg-[#BBBBBB] text-[20px] text-[#F2F2F2] font-[600] w-[330px] h-[44px] ' disabled>Processing</Button>
                                            <p className='text-[#7D7D7D] text-[14px]'>Orders are being processed. You will receive and email notification when file are uploaded for your to review.</p>
                                        </div> */}
                    {/* <div >
                                            <Table className={` ${currentListing && currentListing?.orders ? 'flex' : 'hidden'} font-alexandria px-0 overflow-x-auto whitespace-nowrap`}>
                                                <TableHeader >
                                                    <TableRow className='bg-[#E4E4E4] font-alexandria h-[54px] hover:bg-[#E4E4E4]'>
                                                        <TableHead className="pl-[20px] text-[14px] font-[700] text-[#666666]">Order</TableHead>
                                                        <TableHead className="text-[14px] font-[700] text-[#666666]">Total</TableHead>
                                                        <TableHead className="text-[14px] font-[700] text-[#666666]">Added</TableHead>
                                                        <TableHead className="text-[14px] font-[700] text-[#666666]">Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow className='text-[15px] text-[#666666]'>
                                                        <TableCell className="pl-[20px] text-[15px] py-[19px] font-[400] text-[#4290E9]">0145</TableCell>
                                                        <TableCell className="text-[15px] py-[19px] font-[400] ">$960.00</TableCell>
                                                        <TableCell className="text-[15px] py-[19px] font-[400] ">Mar 14, 2025</TableCell>
                                                        <TableCell className="text-[10px] py-[19px] font-[400] "><span className='uppercase bg-[#E06D5E] text-[#F2F2F2] rounded-[10px] px-[7px] py-[2px]'>unpaid</span></TableCell>
                                                    </TableRow>
                                                    <TableRow className='text-[15px] text-[#666666]'>
                                                        <TableCell className="pl-[20px] text-[15px] py-[19px] font-[400] text-[#4290E9]">0134</TableCell>
                                                        <TableCell className="text-[15px] py-[19px] font-[400] ">$60.00</TableCell>
                                                        <TableCell className="text-[15px] py-[19px] font-[400] ">Mar 10, 2025</TableCell>
                                                        <TableCell className="text-[10px] py-[19px] font-[400] "><span className='uppercase bg-[#E06D5E] text-[#F2F2F2] rounded-[10px] px-[7px] py-[2px]'>unpaid</span></TableCell>
                                                    </TableRow>


                                                </TableBody>
                                            </Table>
                                            <p className={`${currentListing && currentListing?.orders ? 'hidden' : 'flex'} text-[24px] flex justify-center items-center my-[20px]`}> No Order Found</p>
                                        </div> */}
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
                    <div className="text-[#424242] w-full text-[14px] flex flex-col gap-[16px]">
                      {/* <div className="w-full">
                                                <Label>Schedule Publish Date</Label>
                                                <div className='relative w-full '>
                                                    <Input
                                                        value={publishDate}
                                                        onChange={(e) => setPublishDate(e.target.value)}
                                                        type="date"
                                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                                    />
                                                    <Calendar className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-[#4290E9] h-[24px] w-[24px]" strokeWidth={1} />
                                                </div>
                                            </div> */}
                      <div className="w-full">
                        <Label>Schedule Publish Date</Label>
                        <div className="relative w-full">
                          <Input
                            ref={inputRef}
                            value={publishDate}
                            onChange={(e) => setPublishDate(e.target.value)}
                            type="date"
                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px] appearance-none pr-10"
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
                      <div className=" w-full">
                        <Label>Property Website</Label>
                        <div className="relative w-full ">
                          <Input
                            value={propertyWebsite}
                            onChange={(e) => setPropertyWebsite(e.target.value)}
                            type="text"
                            placeholder="company.bcfp.com/vendor/id=88392"
                            className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                          />
                          {/* <Copy
                            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-[#4290E9] h-[24px] w-[24px]"
                            strokeWidth={1}
                          /> */}
                        </div>
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
                          {/* <Copy
                            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-[#4290E9] h-[24px] w-[24px]"
                            strokeWidth={1}
                          /> */}
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
                        <label htmlFor="">Occupancy <span className="text-red-500">*</span></label>
                        <Select
                          value={occupancy}
                          onValueChange={(value) => setOccupancy(value)}
                        >
                          <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
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
                          {/* <p className='text-[#4290E9] flex gap-[10px] cursor-pointer'>Add<span className='flex bg-[#4290E9] w-[18px] h-[18px] rounded-[3px] justify-center items-center'><Plus className='text-[#F2F2F2] w-[12px]' /></span> </p> */}
                        </div>
                        <TagsInput
                          coAgents={coAgents}
                          setCoAgents={setCoAgents}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="statistics">
              <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
                Statistics
              </AccordionTrigger>
              <AccordionContent className="grid gap-4">
                <div className="w-full flex flex-col items-center">
                  <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">
                    <div className="grid grid-cols-[36px_1fr_1fr] gap-x-[16px] place-items-center">
                      <Switch
                        checked={Isstaticmail}
                        onCheckedChange={setIsStaticmail}
                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#4CAF50] "
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
            </AccordionItem>
          </Accordion>
        </form>
      </div>
      <SaveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        isLoading={isLoading}
        isSuccess={true}
        backLink="/dashboard/listings"
        title="Listing"
      />
    </div>
  );
};

export default ListingsFrom;
