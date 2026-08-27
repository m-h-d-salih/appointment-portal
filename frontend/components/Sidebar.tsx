"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiBell,
  FiCalendar,
  FiGrid,
  FiLogOut,
  FiPlus,
  FiSettings,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { logout } from "@/lib/actions/auth";
import AddAppointmentModal, {
  type AppointmentFormValues,
} from "@/components/AddAppointmentModal";
import { createAppointment } from "@/lib/actions/appointments";

type UserRole = "admin" | "staff";
type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles: UserRole[];
};
const navigation:NavItem[] = [
  { href: "/dashboard", icon: FiGrid, label: "Dashboard", roles: ["admin", "staff"] },
  { href: "/appointments", icon: FiCalendar, label: "Appointments", roles: ["admin", "staff"] },
  { href: "/clients", icon: FiUsers, label: "Clients List", roles: ["admin"] },
  // { href: "/notification", icon: FiBell, label: "Notifications", roles: ["admin"] },
  // { href: "/profile", icon: FiUser, label: "My profile", roles: ["admin"] },
  { href: "/settings", icon: FiSettings, label: "Settings", roles: ["admin"] },
] as const;


type SidebarProps = {
  role: UserRole;
  mobile?: boolean;
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export default function Sidebar({
  role,
  mobile = false,
  mobileOpen = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const visibleNav = navigation.filter((item) => item.roles.includes(role));

  const current =
    visibleNav.find((item) => pathname.startsWith(item.href))?.href ??
    "/dashboard";

  const handleCreateAppointment = async (values: AppointmentFormValues) => {
    setSubmitting(true);
    const result = await createAppointment(values);
    setSubmitting(false);

    if (result.error) {
      window.alert(result.error);
      return;
    }

    setShowAdd(false);
    window.dispatchEvent(new Event("appointment-created"));
    if (pathname !== "/appointments") router.push("/appointments");
  };

  return (
    <>
      <aside
      className={`flex h-dvh w-60 shrink-0 flex-col border-r border-[#e5e7eb] bg-[#edede8] px-4 py-6 transition-transform duration-200 ${
        mobile
          ? `fixed inset-y-0 left-0 z-1001 shadow-xl ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`
          : "sticky top-0"
      }`}
      aria-label="Main navigation"
    >
      <div className="mb-8 flex justify-center items-center px-2 gap-2">
        <Image
          src="/logo.webp"
          alt="Treasure Counseling Center"
          width={72}
          height={72}
          className="h-14 w-14 object-contain"
          priority
        />
        <p className="bg-linear-to-b from-[#f1d28b] via-[#a86d22] to-[#6f3f12] bg-clip-text font-serif text-[18px] font-semibold uppercase leading-none tracking-[0.14em] text-transparent drop-shadow-[0_1px_1px_rgba(93,53,13,0.3)] sm:text-[22px]">Treasure</p>

      </div>

      <button
        type="button"
        onClick={() => {
          setShowAdd(true);
          onNavigate?.();
        }}
        className="cursor-pointer mb-8 flex items-center justify-center gap-2 rounded-md bg-[#2D5A3F] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#16482b]"
      >
        <FiPlus className="h-4 w-4 shrink-0" />
        New Appointment
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {visibleNav.map(({ href, icon: Icon, label }) => {
          const active = current === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`relative flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-white text-[#2D5A3F] shadow-sm"
                  : "text-gray-600 hover:bg-white/70 hover:text-[#2D5A3F]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-11 w-1 -translate-y-1/2 rounded-r-lg bg-[#2D5A3F]" />
              )}
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={logout}>
        <button
          type="submit"
          className="cursor-pointer mt-auto flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-white/70 hover:text-[#2D5A3F]"
        >
          <FiLogOut className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </form>
      </aside>
      <AddAppointmentModal
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        onSubmit={handleCreateAppointment}
        loading={submitting}
      />
    </>
  );
}
