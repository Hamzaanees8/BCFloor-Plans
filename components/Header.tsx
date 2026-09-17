"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WhitelabelLogo from "./WhitelabelLogo";
import { useIsMobile } from "@/hooks/use-mobile";
import { isTourDomain } from "@/lib/config/domains";
import { getAppHostname } from "@/lib/utils";

const Header: React.FC = () => {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isToursPortal, setIsToursPortal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsToursPortal(isTourDomain(getAppHostname()));
    }
  }, []);

  const parts = pathname.split('/').filter(Boolean);
  let slug = "";
  const routesToCheck = ['about', 'tours', 'tour', 'book-now'];

  for (const route of routesToCheck) {
    const index = parts.indexOf(route);
    if (index !== -1 && index + 1 < parts.length) {
      slug = parts[index + 1];
      break;
    }
  }

  // If on tours portal with /:slug (e.g. /bcfloorplans)
  if (!slug && isToursPortal && parts.length === 1 && parts[0] !== 'tours' && parts[0] !== 'tour') {
    slug = parts[0];
  }

  // const aboutHref = slug ? `/about/${slug}` : "/about";
  const toursHref = isToursPortal
    ? (slug ? `/${slug}` : "/tours")
    : (slug ? `/tours/${slug}` : "/tours");
  const bookNowHref = slug ? `/book-now/${slug}` : "/book-now";
  const isToursActive = parts.includes('tours') || parts.includes('tour') || (isToursPortal && parts.length === 1);

  return (
    <header
      className="sticky top-0 left-0 w-full h-[64px] md:h-[104px] flex items-center justify-between md:justify-center px-4 md:px-0 z-[100] font-alexandria"
      style={{ backgroundColor: "var(--org-primary, #4290E9)" }}
    >
      {/* Logo */}
      <div className="flex items-center md:absolute md:left-6">
        <Link href={isToursPortal ? toursHref : "/"}>
          <WhitelabelLogo width={isMobile ? 120 : 160} height={isMobile ? 40 : 50} className="mx-0" />
        </Link>
      </div>

      {/* Centered Navigation */}
      <nav className="flex space-x-4 md:space-x-8 text-white text-[13px] md:text-[15px] font-medium">
        {/* <Link
          href="/about"
          className={`hover:underline ${pathname === "/about" || pathname === "/agent/about" ? "underline " : ""
            }`}
        >
          About
        </Link> */}

        <Link
          href={toursHref}
          className={`hover:underline ${isToursActive ? "underline " : ""}`}
        >
          Tours
        </Link>

        {!isToursPortal && (
          <Link
            href={bookNowHref}
            className={`hover:underline ${parts.includes('book-now') ? "underline font-semibold" : ""}`}
          >
            BOOK NOW
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;

