"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CgProfile } from "react-icons/cg";
import { FiLogOut, FiUser } from "react-icons/fi";
import { toTitleCase } from "@/components/helper/titlecase";

type ProfileMenuProps = {
  email: string;
  role: "admin" | "staff";
};

export default function ProfileMenu({ email, role }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex cursor-pointer items-center justify-center rounded-full border-0 bg-[#2D5A3F] font-semibold"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        <CgProfile className="h-8 w-8 text-white" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-md border border-[#c1c9c0] bg-white shadow-[0_12px_32px_rgba(23,32,42,0.12)]">
          <div className="border-b border-[#e5e7eb] px-4 py-3">
            <p className="m-0 text-sm font-semibold text-[#1a1c1a]">{email}</p>
            <p className="m-0 mt-0.5 text-xs text-[#144229] font-bold">
              {toTitleCase(role)}
            </p>
          </div>

          <div className="p-1.5">
            {/* <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-[#414942] transition hover:bg-[#f4f4f0] hover:text-[#2D5A3F]"
            >
              <FiUser className="h-4 w-4 shrink-0" />
              My profile
            </Link> */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/login");
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-[#414942] transition hover:bg-[#f4f4f0] hover:text-[#2D5A3F]"
            >
              <FiLogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
