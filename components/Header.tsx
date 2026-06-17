"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WhitelabelLogo from "./WhitelabelLogo";

const Header: React.FC = () => {
  const pathname = usePathname();

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

  // const aboutHref = slug ? `/about/${slug}` : "/about";
  const toursHref = slug ? `/tours/${slug}` : "/tours";
  const bookNowHref = slug ? `/book-now/${slug}` : "/book-now";

  return (
    <header
      className="sticky top-0 left-0 w-full h-[104px] flex items-center justify-center z-[100] font-alexandria"
      style={{ backgroundColor: "var(--org-primary, #4290E9)" }}
    >
      {/* Logo (Left) */}
      <div className="absolute left-6 flex items-center">
        <Link href="/">
          <WhitelabelLogo width={160} height={60} />
        </Link>
      </div>

      {/* Centered Navigation */}
      <nav className="flex space-x-8 text-white text-[15px]">
        {/* <Link
          href="/about"
          className={`hover:underline ${pathname === "/about" || pathname === "/agent/about" ? "underline " : ""
            }`}
        >
          About
        </Link> */}

        <Link
          href={toursHref}
          className={`hover:underline ${parts.includes('tours') || parts.includes('tour') ? "underline " : ""}`}
        >
          Tours
        </Link>

        <Link
          href={bookNowHref}
          className={`hover:underline ${parts.includes('book-now') ? "underline font-semibold" : ""}`}
        >
          BOOK NOW
        </Link>
      </nav>
    </header>
  );
};

export default Header;
