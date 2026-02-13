import { Eye } from "lucide-react";
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

const KanbanViewCard = ({ data, type = 'listing', onQuickView }: KanbanViewCardProps) => {
  const { userType } = useAppContext();

  let file_path = "";
  let addressLine = "";
  let href = "";

  if (type === 'tour') {
    const tourData = data as Tour;
    const featuredFile = tourData.files?.find((file: TourFile) => file.is_featured) || tourData.files?.[0];
    file_path = featuredFile?.thumbnail_url || featuredFile?.file_path || "";
    // If it's a full URL (thumbnail_url), we don't need to prepend API_URL later, but the current logic prepends it. 
    // We need to adjust the background image logic too.
    const address = tourData.orders?.property_address || tourData.orders?.property?.address || "N/A";
    const city = tourData.orders?.property?.city || "";
    addressLine = address + (city ? ", " + city : "");
    href = `/tour/${slugify(address)}/${tourData.orders?.uuid}`;
  } else {
    const listingData = data as Listings;
    const files = listingData.orders?.[0]?.tours?.[0]?.files;
    const featuredFile = files?.find((file: { is_featured?: boolean }) => file.is_featured) || files?.[0];
    file_path = featuredFile?.thumbnail_url || featuredFile?.file_path || "";
    addressLine = listingData.address + ", " + listingData.city;
    href = listingData.orders?.[0]?.uuid
      ? `/dashboard/file-manager/${listingData.orders?.[0]?.uuid}?listingId=${listingData.uuid}`
      : `/dashboard/listings/create/${listingData.uuid}`;
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (type === 'tour') {
      e.preventDefault();
      window.open(href, '_blank');
    }
  };

  const content = (
    <div className="flex flex-col w-full bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg overflow-hidden border border-gray-100">
      <div
        className="flex items-center justify-center gap-2 bg-[#D9D8D8] w-full h-[173px] cursor-pointer"
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
      </div>
      <div className="flex items-center justify-between gap-4 p-3">
        <div
          className="flex-1 cursor-pointer"
          onClick={handleCardClick}
        >
          <p title={addressLine} className={`${type === 'tour' ? 'text-[#4290E9]' : userType + '-text'} text-[13px] font-medium truncate max-w-[200px]`}>
            {addressLine}
          </p>
        </div>
        {type === 'listing' && (
          <Eye
            className="w-5 h-5 text-[#7D7D7D] cursor-pointer hover:text-blue-500 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView?.();
            }}
          />
        )}
      </div>
    </div>
  );

  return type === 'listing' ? (
    <Link href={href} className="w-full">
      {content}
    </Link>
  ) : (
    <div className="w-full">
      {content}
    </div>
  );
};

export default KanbanViewCard;
