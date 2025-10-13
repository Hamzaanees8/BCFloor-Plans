"use client";

import Link, { LinkProps } from "next/link";
import { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUnsaved } from "@/app/context/UnsavedContext";

interface SafeLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
}

export default function SafeLink({ href, children, className, ...props }: SafeLinkProps) {
  const router = useRouter();
  const { confirmNavigation } = useUnsaved();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    confirmNavigation(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(typeof href === "string" ? href : (href as any).toString());
    }, {
      title: "Unsaved Changes",
      description: "You have unsaved changes. Leave without saving?"
    });
  };

  return (
    <Link href={href} {...props} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
