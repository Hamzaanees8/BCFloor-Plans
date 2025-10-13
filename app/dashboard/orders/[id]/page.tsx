"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import { TriangleAlert } from "lucide-react";
//import Link from 'next/link';
import React, { useEffect, useState } from "react";
import { GetOneOrder, GetVendors } from "../orders";
import { useParams, useRouter } from "next/navigation";
import { Order } from "../page";
import { Country } from "country-state-city";
import { useAppContext } from "@/app/context/AppContext";
import VendorOrderEdit from "../components/VendorOrderEdit";
import OrderDetailView from "../components/OrderDetailView";
import { Agent } from "@/components/AgentTable";
import { GetAgents } from "../../calendar/calendar";
export interface VendorAddress {
  type: "company" | "billing" | string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  province: string;
  country: string;
}

export interface VendorData {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  work_hours: {
    start_time: string;
    end_time: string;
    break_start: string;
    break_end: string;
  };
  addresses?: VendorAddress[];
  vendor_services: {
    service: { uuid: string }
  }[]
  coordinates: string[]
}
export interface OrderData {
  uuid: string;
  agent: {
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
    uuid: string;
  };
  vendor: {
    first_name: string;
    last_name: string;
    email: string;
    uuid: string;
    company_name: string;
  };
}

function Page() {
  const [orderData, setOrderData] = React.useState<Order | null>(null);
  const [order_status, setOrder_status] = React.useState('');
  const [property_website, setProperty_website] = React.useState('');
  const [mls_property, setMls_property] = React.useState('');
  const [amount, setAmount] = React.useState("");
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState<
    { name: string; isoCode: string }[]
  >([]);
  const [vendors, setVendors] = React.useState<VendorData[]>([]);
  const [selectedVendors, setselectedVendors] = React.useState('');
  const [openEditPopup, setOpenEditPopup] = React.useState<boolean>(false);
  const { userType } = useAppContext();
  const [openDetails, setOpenDetails] = useState(false);
  const [agentData, setAgentData] = useState<Agent[]>([]);

  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);


  useEffect(() => {
    if (orderData) {
      setselectedVendors(orderData?.slots[0].vendor.uuid)

    }
  }, [orderData])
  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      console.log("Token not found.");
      return;
    }

    GetAgents(token)
      .then((data) => {
        const allAgents = Array.isArray(data.data) ? data.data : [];
        const filteredAgents = allAgents.filter((agent: Agent) => agent.status === true);
        setAgentData(filteredAgents);
      })
      .catch((err) => console.log("Error fetching data:", err.message));

  }, []);
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      return;
    }

    GetOneOrder(token, orderId)
      .then((data) => {
        setOrderData(data.data);
        setCountry(data.data.property?.country || "CA");
        setOrder_status(data.data.order_status);
        setProperty_website(data.data.property.property_website);
        setMls_property(data.data.property.mls_property);
        setAmount(data.data.amount);
        setselectedVendors(data.data.vendor.uuid);

      })
      .catch((err) => console.log(err.message));
  }, [orderId]);
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      return;
    }

    GetVendors(token)
      .then((data) => {
        setVendors(data.data);
      })
      .catch((err) => console.log(err.message));
  }, [orderId]);
  const totalServiceAmount =
    orderData?.services?.reduce((sum, s) => {
      return sum + parseFloat(s.amount || "0");
    }, 0) ?? 0;
  const totalDiscountValue =
    orderData?.totals?.reduce((sum, d) => {
      return sum + parseFloat(d.discount_value || "0");
    }, 0) ?? 0;

  const discountPercent =
    totalServiceAmount > 0
      ? ((totalDiscountValue / totalServiceAmount) * 100).toFixed(2)
      : "0.00";

  const uniqueVendorsMap = new Map();

  if (Array.isArray(orderData?.slots)) {
    orderData?.slots.forEach((slot) => {
      const vendor = slot?.vendor;
      if (vendor && !uniqueVendorsMap.has(vendor.uuid)) {
        uniqueVendorsMap.set(vendor.uuid, vendor);
      }
    });
  }
  function getCountryNameByIso(
    isoCode: string,
    countries: { name: string; isoCode: string }[]
  ) {
    const found = countries.find((c) => c.isoCode === isoCode);
    return found ? found.name : isoCode;
  }
  const uniqueVendors = Array.from(uniqueVendorsMap.values());

  return (
    <div className="font-alexandria">
      {openEditPopup && userType === "vendor" &&
        <VendorOrderEdit
          currentOrder={orderData ?? undefined}
          open={openEditPopup}
          onOpenChange={setOpenEditPopup}
        />
      }
      <OrderDetailView agentData={agentData} open={openDetails} onClose={() => { setOpenDetails(false) }} orderId={orderData?.uuid ?? ''} serviceId={22} orderData={orderData ? [orderData] : []} />
      <div
        className="w-full h-[80px] bg-[#E4E4E4] font-alexandria  z-10 relative  flex justify-between px-[20px] items-center"
        style={{ boxShadow: "0px 4px 4px #0000001F" }}
      >
        <p className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}>
          Orders ›{" "}
          <span className="hidden md:inline-block">
            {" "}
            {orderData?.id || ""} {`(${orderData?.property?.address || ""})`}
          </span>
        </p>
        <div className="flex gap-[18px]">
          <Button
            onClick={() => { setOpenDetails(true) }}
            className="w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px]  border-[1px] border-[#4290E9] bg-[#EEEEEE] text-[14px] md:text-[16px] font-[400] text-[#4290E9] flex gap-[5px] justify-center items-center hover:text-[#fff] hover:bg-[#4290E9]"
          >
            Edit Order
          </Button>
          {/* <Button
            disabled={isLoading}
            onClick={() => {
              setPendingAction1(() => handleSubmit);
              setConfirmOpen1(true);
            }}
            className="w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]"
          >
            {isLoading ? (
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
            )}
            Save Changes{" "}
          </Button> */}

        </div>
      </div>
      <div className={` relative w-full h-[160px] ${userType}-bg flex flex-col md:flex-row justify-between items-start py-[32px] px-[25px]`}>
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: "url('/ordersBgImg.png')",
          }}
        ></div>

        <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-black/70 to-transparent z-10" />
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black/70 to-transparent z-10" />

        <p className="text-[14px] md:text-[20px] font-[500] text-[#F2F2F2] z-20">
          {orderData?.property?.address || ""}
          <br />
          {getCountryNameByIso(country, countries) || ""} <br />
          {orderData?.property?.postal_code || ""}
        </p>
        {/*<p className="text-[12px] md:text-[16px] font-[500] text-[#F2F2F2ff] z-20">
                    Photographer
                </p>*/}
      </div>
      <Accordion
        type="multiple"
        defaultValue={["property", "additional", "statistics"]}
        className="w-full space-y-4"
      >
        <AccordionItem value="property">
          <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
            Order Details
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <div className="w-full flex flex-col items-center">
              <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[#424242] text-[14px] font-[400]">

                <div className="grid grid-cols-2 gap-[16px]">

                  <div className="col-span-2">
                    <label htmlFor="">Order Status <span className="text-red-500">*</span></label>
                    <Select
                      value={order_status}
                      onValueChange={(value) => setOrder_status(value)}
                    >
                      <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
                        <SelectValue placeholder="Select Order Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* {fieldErrors.property_type && (
                                            <p className="text-red-500 text-[10px]">
                                                {fieldErrors.property_type[0]}
                                            </p>
                                        )} */}
                  </div>
                  {/* <div className="col-span-2 flex flex-col gap-[16px]">

                    <label htmlFor="">Order Fulfilled Email</label>
                    <div className=' grid grid-cols-5 gap-[16px]'>
                      <Button
                        className="col-span-2 w-full rounded-[3px] md:w-full h-[32px] md:h-[32px]  border-[1px] border-[#4290E9] bg-[#EEEEEE] text-[14px] md:text-[14px] font-[600] text-[#4290E9] flex gap-[5px] justify-center items-center hover:text-[#fff] hover:bg-[#4290E9] font-raleway"
                      >
                        Customize
                      </Button>
                      <Button
                        // disabled={isLoading}
                        // onClick={() => {
                        //     setPendingAction1(() => handleSubmit);
                        //     setConfirmOpen1(true);
                        // }}
                        className="col-span-3 w-full md:w-full h-[32px] md:h-[32px] rounded-[3px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[14px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9] font-raleway "
                      >
                        Preview/Send
                      </Button>
                    </div>

                  </div> */}
                  <div className="col-span-2">
                    <label htmlFor="">Team Member <span className="text-red-500">*</span></label>
                    <Select
                      value={selectedVendors}
                      onValueChange={(value) => setselectedVendors(value)}
                    >
                      <SelectTrigger className="w-full  h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
                        <SelectValue placeholder="Select Team Member" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors?.map((vendor) => (
                          <SelectItem key={vendor.uuid} value={vendor.uuid}>
                            {`${vendor.first_name} ${vendor.last_name}`}
                          </SelectItem>
                        ))}

                      </SelectContent>
                    </Select>
                    {/* {fieldErrors.property_status && (
                                            <p className="text-red-500 text-[10px]">
                                                {fieldErrors.property_status[0]}
                                            </p>
                                        )} */}
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="">Property Website <span className="text-red-500">*</span></label>
                    <Input
                      value={property_website}
                      onChange={(e) => setProperty_website(e.target.value)}
                      placeholder="Enter Property Website URL"
                      className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                      type="text"
                    />
                    <div className='flex justify-end'>
                      <p className={`underline ${userType}-text text-[12px] w-fit cursor-pointer`}>Customize URL</p>

                    </div>
                    {/* {fieldErrors.heading && (
                                            <p className="text-red-500 text-[10px]">
                                                {fieldErrors.heading[0]}
                                            </p>
                                        )} */}
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="">MLS Property <span className="text-red-500">*</span></label>
                    <Input
                      value={mls_property}
                      onChange={(e) => setMls_property(e.target.value)}
                      placeholder="Enter MLS Property"
                      className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                      type="text"
                    />
                    {/* {fieldErrors.heading && (
                                            <p className="text-red-500 text-[10px]">
                                                {fieldErrors.heading[0]}
                                            </p>
                                        )} */}
                  </div>
                  <div className="col-span-2 flex flex-col gap-[16px]">
                    <Button
                      onClick={() => router.push(`/dashboard/file-manager/${orderData?.uuid}`)}
                      className={`col-span-3 w-full md:w-full h-[32px] md:h-[32px] rounded-[3px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[14px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg hover:opacity-85 font-raleway`}
                    >
                      Go To File Manager
                    </Button>
                    {(userType === 'admin' || userType === 'agent') && (
                      <div className='grid grid-cols-2 gap-[16px] font-[400] text-[#666666] text-[14px] justify-items-end'>
                        <p>Require payment before releasing materials</p>
                        <Switch className=' data-[state=checked]:bg-[#6BAE41]' />
                      </div>
                    )}
                  </div>
                  {userType === 'vendor' &&
                    <div className="col-span-2 flex flex-col gap-[16px] mt-[40px]">
                      <Button
                        onClick={() => setOpenEditPopup(true)}
                        className={`col-span-3 w-full md:w-full h-[32px] md:h-[32px] rounded-[3px] border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[14px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg hover:opacity-85 font-raleway`}
                      >
                        Upgrade/Downgrade Order
                      </Button>

                    </div>}
                </div>
              </div>


            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="additional">
          <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}>
            Order Details
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <div className="w-full flex flex-col items-center">
              <div className="w-full md:w-[410px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[48px] text-[#424242] text-[14px] font-[400]">
                <div className="flex justify-between gap-[12px]">
                  <div className="flex gap-[12px] items-center">
                    <TriangleAlert className={`${userType}-text h-[24px]w-[30px]  md:h-[36px] md:w-[40px]`} />
                    <p className={`${userType}-text text-[24px] md:text-[36px] font-[400]`}>
                      ORDER {orderData?.id}
                    </p>
                  </div>
                  {/* <div className='flex items-center gap-[12px]'>
                                        <Switch className=' data-[state=checked]:bg-[#6BAE41] ' />
                                        <p className='text-[#666666] text-[16px]'>Open</p>
                                    </div> */}
                </div>
                <div className="text-[#666666] flex gap-x-[20px]">
                  <div className="flex flex-col gap-y-[20px] w-1/2 text-wrap">
                    <p>{uniqueVendors?.length > 1 ? "Vendors" : "Vendor"}</p>
                    {uniqueVendors?.map((vendor) => (
                      <div key={vendor.uuid}>
                        <p>
                          {vendor.first_name} {vendor.last_name}
                        </p>
                        <p>{vendor.company?.company_name ?? "N/A"}</p>
                        <p>{vendor.email}</p>
                      </div>
                    ))}
                  </div>
                  <div className="w-1/2 text-wrap">
                    <p className="mb-[20px]">Customer</p>
                    <p>Realtor</p>
                    <p>
                      {orderData?.agent?.first_name}{" "}
                      {orderData?.agent?.last_name}
                    </p>
                    <p>{orderData?.agent?.company_name}</p>
                    <p>{orderData?.agent?.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-[18px] text-[#666666] text-[16px]">
                  <p className="text-[20px] text-[#666666] font-[700]">
                    Order Details
                  </p>
                  <p className="grid grid-cols-4 gap-[15px]">
                    <span className="col-span-3">Package</span>
                    <span className="col-span-1">
                      $
                      {orderData?.services
                        ?.reduce(
                          (total, service) =>
                            total + parseFloat(service.amount),
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </p>

                  <p className="grid grid-cols-4 gap-[15px]">
                    <span className="col-span-3">Items</span>
                    <span className="col-span-1">
                      {orderData?.services?.length}
                    </span>
                  </p>
                  <div className="grid gap-[15px]">
                    {orderData?.services?.map((service) => (
                      <p
                        key={service.id}
                        className="grid grid-cols-4 gap-[15px]"
                      >
                        <span className="col-span-3">
                          {service.service?.name ?? ""}
                        </span>
                        <span className="col-span-1">
                          ${parseFloat(service.amount).toFixed(2)}
                        </span>
                      </p>
                    ))}
                  </div>
                  <p className="grid grid-cols-4 gap-[15px]">
                    <span className="col-span-3">Discount</span>
                    <span className="col-span-1">
                      -${totalDiscountValue.toFixed(2)} ({discountPercent}%)
                    </span>
                  </p>
                  <p className="grid grid-cols-4 gap-[15px]">
                    <span className="col-span-3">GST/HST</span>
                    <span className="col-span-1">$0.00</span>
                  </p>
                  <p className="grid grid-cols-4 gap-[15px]">
                    <span className="col-span-3">PST/RST/QST</span>
                    <span className="col-span-1">$0.00</span>
                  </p>
                  <p className="grid grid-cols-4 gap-[15px]">
                    <span className="col-span-3">Subtotal</span>
                    <span className="col-span-1">${amount}</span>
                  </p>
                  <p className="grid grid-cols-4 gap-[15px] text-[20px] md:text-[24px] font-[500]">
                    <span className="col-span-3">Grand Total</span>
                    <span className="col-span-1">${amount}</span>
                  </p>
                  <Button className={`col-span-2 w-full rounded-[3px] md:w-full h-[32px] md:h-[32px]  border-[1px] ${userType}-border bg-[#EEEEEE] text-[14px] md:text-[14px] font-[600] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bgfont-raleway`}>
                    Awaiting Payment ${amount}
                  </Button>
                </div>
                <div>
                  <p className="text-[12px]">
                    Lorem ipsum dolor sit amet. Et minus internos rem culpa
                    ratione quo harum obcaecati ut minima quia. Eos aliquid
                    inventore et dicta sint quo autem ipsam ea officiis iste et
                    quia temporibus eum ratione sunt non dolorum cumque. Aut
                    quas optio cum dolorem voluptatibus ut quae culpa aut
                    repellat quod qui suscipit consequuntur. Qui explicabo
                    distinctio est eveniet dolorem sed voluptatem perspiciatis
                    eum Quis dolorum et voluptatem corporis cum minima ipsa.
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default Page;
