"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { VendorPortfolioImage } from "../../vendors/create/page";
import { useAppContext } from "@/app/context/AppContext";

interface VendorWorkCarouselProps {
    open: boolean;
    setOpen: (val: boolean) => void;
    images: VendorPortfolioImage[];
    title?: string;
}

const cleanImageUrl = (url: string, type?: string) => {
    if (!url) return "/placeholder.png";

    // 1. If it's already a working cloud URL, blob, data URL, or local public asset, return it directly.
    if (url.includes("amazonaws.com") || url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    if (url.startsWith("/") && !url.startsWith("/storage/")) {
      return url;
    }

    // 2. Determine environment-based S3 bucket domain
    const s3BaseUrl = "https://bcf-media.s3.amazonaws.com";

    // 3. If it is a relative path (doesn't start with http/https)
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      let path = url;
      if (path.startsWith("/storage/")) {
        path = path.substring(8);
      }
      if (path.startsWith("/")) {
        path = path.substring(1);
      }
      return `${s3BaseUrl}/${path}`;
    }

    // 4. If it's a local storage URL (e.g. https://api-stage.bcfloorplans.com/storage/...)
    if (type === "tour_reference" || url.includes("/storage/tours/") || url.includes("/storage/orders/")) {
      try {
        const parsed = new URL(url);
        let pathname = parsed.pathname;
        if (pathname.startsWith("/storage/")) {
          pathname = pathname.substring(8);
        }
        if (pathname.startsWith("/")) {
          pathname = pathname.substring(1);
        }
        return `${s3BaseUrl}/${pathname}`;
      } catch (e) {
        console.error("Failed to clean image URL:", url, e);
      }
    }

    return url;
};

export default function VendorWorkCarousel({
    open,
    setOpen,
    images,
    title = "Gallery",
}: VendorWorkCarouselProps) {
    const { userType } = useAppContext();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-3xl overflow-hidden px-4 pt-4 pb-2">
                <DialogHeader className="pb-2 border-b border-b-gray-300">
                    <DialogTitle className={`text-xl font-semibold ${userType}-text`}>
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="relative w-full">
                    {images && images.length > 0 ? (
                        <Carousel className="w-full">
                            <CarouselContent>
                                {images.map((img, index) => (
                                    <CarouselItem key={index} className="flex justify-center">
                                        <div className="relative w-full h-[400px] md:h-[500px]">
                                            <Image
                                                unoptimized
                                                src={cleanImageUrl(img.image_url, img.image_type)}
                                                alt="carousel-image"
                                                fill
                                                className="object-contain rounded-md"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>

                            <CarouselPrevious className="left-2 border-gray-400" />
                            <CarouselNext className="right-2 border-gray-400" />
                        </Carousel>
                    ) : (
                        <div className="w-full h-[400px] flex items-center justify-center text-gray-500 text-lg">
                            No Vendor Work Available
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
