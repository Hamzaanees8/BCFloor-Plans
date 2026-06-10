"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BCFLogo } from "./Icons";

const Header: React.FC = () => {
  const pathname = usePathname();

  return (
    <header 
      className="sticky top-0 left-0 w-full h-[104px] flex items-center justify-center z-[100] font-alexandria"
      style={{ backgroundColor: "var(--org-primary, #4290E9)" }}
    >
      {/* Logo (Left) */}
      <div className="absolute left-6 flex items-center">
        <BCFLogo />
      </div>

      {/* Centered Navigation */}
      <nav className="flex space-x-8 text-white text-[15px]">
        <Link
          href="/about"
          className={`hover:underline ${pathname === "/about" || pathname === "/agent/about" ? "underline " : ""
            }`}
        >
          About
        </Link>

        <Link
          href="/tours"
          className={`hover:underline ${pathname === "/tours" || pathname === "/agent/tours" ? "underline " : ""
            }`}
        >
          Tours
        </Link>

        <Link href="#services" className="hover:underline">
          Services
        </Link>

        <Link href="#testimonials" className="hover:underline">
          Testimonials
        </Link>

        <Link
          href="/book-now"
          className={`hover:underline ${pathname === "/book-now" || pathname === "/agent/book-now" ? "underline font-semibold" : ""
            }`}
        >
          BOOK NOW
        </Link>
      </nav>
    </header>
  );
};

export default Header;
