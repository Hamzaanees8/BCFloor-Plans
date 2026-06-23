import { Eye, FolderOpen, Calendar } from "lucide-react";
import React from "react";
import { useAppContext } from "@/app/context/AppContext";
import Link from "next/link";
import { Listings, Tour, TourFile } from "@/lib/types";

interface KanbanViewCardProps {
  data: Listings | Tour;
  type?: 'listing' | 'tour';
  onQuickView?: () => void;
}

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const getLatestOrder = (orders?: any[]) => {
  if (!orders || orders.length === 0) return null;
  return [...orders].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )[0];
};

const getProjectStatus = (orders?: any[]) => {
  const latestOrder = getLatestOrder(orders);
  if (!latestOrder) {
    return { label: "No Bookings", color: "bg-gray-100/90 text-gray-800 border-gray-200" };
  }

  const orderStatus = latestOrder.order_status;
  const paymentStatus = latestOrder.payment_status;

  if (orderStatus === "Completed") {
    if (paymentStatus === "PAID") {
      return { label: "Complete", color: "bg-green-100/90 text-green-800 border-green-200" };
    } else {
      return { label: "Ready for Payment", color: "bg-amber-100/90 text-amber-800 border-amber-200" };
    }
  }

  if (orderStatus === "Processing" || orderStatus === "In Progress" || orderStatus === "Pending") {
    return { label: "Scheduled", color: "bg-blue-100/90 text-blue-800 border-blue-200" };
  }

  if (orderStatus === "Cancelled") {
    return { label: "Cancelled", color: "bg-red-100/90 text-red-800 border-red-200" };
  }

  if (orderStatus === "On Hold") {
    return { label: "On Hold", color: "bg-orange-100/90 text-orange-800 border-orange-200" };
  }

  return { label: orderStatus || "N/A", color: "bg-gray-100/90 text-gray-800 border-gray-200" };
};

const getPaymentStatus = (orders?: any[]) => {
  const latestOrder = getLatestOrder(orders);
  if (!latestOrder) {
    return { label: "N/A", color: "bg-gray-100/90 text-gray-800 border-gray-200" };
  }

  const status = latestOrder.payment_status;
  if (status === "PAID") {
    return { label: "Paid", color: "bg-emerald-100/90 text-emerald-800 border-emerald-200" };
  } else if (status === "PARTIALLY_PAID") {
    return { label: "Partially Paid", color: "bg-amber-100/90 text-amber-800 border-amber-200" };
  } else {
    return { label: "Unpaid", color: "bg-rose-100/90 text-rose-800 border-rose-200" };
  }
};

const KanbanViewCard = ({ data, type = 'listing', onQuickView }: KanbanViewCardProps) => {
  const { userType } = useAppContext();

  let file_path = "";
  let addressLine = "";
  let href = "";
  let latestOrder: any = null;
  let projStatus = { label: "No Bookings", color: "bg-gray-100/90 text-gray-800 border-gray-200" };
  let payStatus = { label: "N/A", color: "bg-gray-100/90 text-gray-800 border-gray-200" };

  if (type === 'tour') {
    const tourData = data as Tour;
    const featuredFile = tourData.files?.find((file: TourFile) => file.is_featured) || tourData.files?.[0];
    file_path = featuredFile?.thumbnail_url || featuredFile?.file_path || "";
    const suite = tourData.orders?.property?.suite;
    const rawAddress = tourData.orders?.property_address || tourData.orders?.property?.address || "N/A";
    const address = suite ? `${suite} - ${rawAddress}` : rawAddress;
    const city = tourData.orders?.property?.city || "";
    addressLine = address + (city ? ", " + city : "");
    href = `/tour/${slugify(address)}/${tourData.orders?.uuid}`;
  } else {
    const listingData = data as Listings;
    const files = listingData.orders?.[0]?.tours?.[0]?.files;
    const featuredFile = files?.find((file: { is_featured?: boolean }) => file.is_featured) || files?.[0];
    file_path = featuredFile?.thumbnail_url || featuredFile?.file_path || "";
    const address = listingData.suite ? `${listingData.suite} - ${listingData.address}` : listingData.address;
    addressLine = address + (listingData.city ? ", " + listingData.city : "");
    latestOrder = getLatestOrder(listingData.orders);
    projStatus = getProjectStatus(listingData.orders);
    payStatus = getPaymentStatus(listingData.orders);

    const tour = latestOrder?.tours?.[0];
    const isPublished = tour?.is_publish;
    const addressSlug = listingData.suite ? `${listingData.suite} - ${listingData.address}` : listingData.address;
    href = latestOrder?.uuid
      ? `/dashboard/file-manager/${latestOrder.uuid}?listingId=${listingData.uuid}`
      : `/dashboard/listings/create/${listingData.uuid}`;

    // We store the public tour URL
    (KanbanViewCard as any).publicTourUrl = isPublished ? `/tour/${slugify(addressSlug)}/${latestOrder?.uuid}` : null;
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (type === 'tour') {
      e.preventDefault();
      window.open(href, '_blank');
    }
  };

  const content = (
    <div className="flex flex-col w-full bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg overflow-hidden border border-gray-100 group relative">
      <div
        className="flex items-center justify-center gap-2 bg-[#D9D8D8] w-full h-[173px] cursor-pointer relative overflow-hidden"
        style={{
          backgroundImage: file_path
            ? `url('${file_path.startsWith('http') ? file_path : process.env.NEXT_PUBLIC_FILES_API_URL + '/' + file_path}')`
            : 'none',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        onClick={handleCardClick}
      >
        {!file_path && (
          <p className="text-[12px] font-[500] text-[#666666]">
            No Thumbnail Available
          </p>
        )}

        {/* Badges Overlay */}
        {type === 'listing' && (
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold backdrop-blur-[2px] shadow-sm ${projStatus.color}`}>
              {projStatus.label}
            </span>
            {latestOrder && (
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold backdrop-blur-[2px] shadow-sm ${payStatus.color}`}>
                {payStatus.label}
              </span>
            )}
          </div>
        )}

        {/* Public Tour Link overlay badge */}
        {type === 'listing' && (KanbanViewCard as any).publicTourUrl && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 group/tourbtn z-20"
          >
            <a
              href={`${(KanbanViewCard as any).publicTourUrl}?type=branded`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black/60 hover:bg-emerald-600 text-white p-1.5 rounded-full backdrop-blur-md shadow-sm border border-white/20 transition-all flex items-center justify-center cursor-pointer"
              title="Open Branded Tour (or hover for more options)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </a>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-[130px] bg-white rounded-md shadow-lg border border-gray-100 opacity-0 invisible group-hover/tourbtn:opacity-100 group-hover/tourbtn:visible transition-all duration-200 overflow-hidden flex flex-col">
              <a 
                href={`${(KanbanViewCard as any).publicTourUrl}?type=branded`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-[11px] font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border-b border-gray-50"
              >
                Branded Tour
              </a>
              <a 
                href={`${(KanbanViewCard as any).publicTourUrl}?type=unbranded`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-[11px] font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                Unbranded Tour
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col p-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex-1 cursor-pointer"
            onClick={handleCardClick}
          >
            <p title={addressLine} className={`${type === 'tour' ? 'text-[#4290E9]' : userType + '-text'} text-[13px] font-medium truncate max-w-[210px]`}>
              {addressLine}
            </p>
            {type === 'listing' && (userType === 'admin' || userType === 'vendor') && (data as Listings).agent && (
              <p className="text-[11px] text-gray-500 mt-1">
                <span className="font-semibold text-gray-600">Agent:</span> {(data as Listings).agent?.first_name} {(data as Listings).agent?.last_name || 'N/A'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      {type === 'listing' && (
        <div className="flex border-t border-gray-100 bg-gray-50/50 justify-between items-center p-1.5 text-gray-500 text-[11px]">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView?.();
            }}
            className="flex flex-1 justify-center items-center gap-1.5 py-1 hover:text-blue-600 hover:bg-white rounded transition-all font-medium"
            title="Quick View"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>

          <div className="w-[1px] h-4 bg-gray-200"></div>

          <Link
            href={href}
            className="flex flex-1 justify-center items-center gap-1.5 py-1 hover:text-emerald-600 hover:bg-white rounded transition-all font-medium text-center"
            title="Manage Files / Edit"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Manage</span>
          </Link>

          {userType !== 'vendor' && (
            <>
              <div className="w-[1px] h-4 bg-gray-200"></div>
              <Link
                href={latestOrder?.uuid ? `/dashboard/orders/create/${latestOrder.uuid}?isEdit=true` : "/dashboard/orders/create"}
                className="flex flex-1 justify-center items-center gap-1.5 py-1 hover:text-indigo-600 hover:bg-white rounded transition-all font-medium text-center"
                title={latestOrder?.uuid ? "Update Booking" : "New Booking"}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Booking</span>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );

  return type === 'listing' ? (
    <Link href={href} className="w-full block">
      {content}
    </Link>
  ) : (
    <div className="w-full">
      {content}
    </div>
  );
};

export default KanbanViewCard;
