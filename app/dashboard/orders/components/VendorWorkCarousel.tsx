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
                                                src={img.image_url || "/placeholder.png"}
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
