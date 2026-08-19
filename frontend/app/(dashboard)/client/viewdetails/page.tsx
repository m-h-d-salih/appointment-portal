"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientDetails } from "../../appointments/page";
import { getClientDetails } from "@/lib/actions/appointments";
import type { Appointment } from "../../appointments/page";
import { ConfigProvider, Skeleton } from "antd";

function ClientDetailsSkeleton() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#2D5A3F" } }}>
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border border-[#c1c9c0] bg-white p-4">
          <Skeleton.Button active size="large" />
          <Skeleton.Input active size="small" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
          <div className="hidden rounded-lg border border-[#c1c9c0] bg-white p-4 xl:block">
            <Skeleton active paragraph={{ rows: 5 }} title={false} />
          </div>

          <div className="rounded-lg border border-[#c1c9c0] bg-white p-5">
            <Skeleton active avatar paragraph={{ rows: 2 }} />
            <div className="mt-6 space-y-5">
              <Skeleton active paragraph={{ rows: 3 }} title />
              <Skeleton active paragraph={{ rows: 4 }} title />
              <Skeleton active paragraph={{ rows: 3 }} title />
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

function ClientDetailsRoute() {
  const router = useRouter();
  const params = useSearchParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [clientData, setClientData] = useState<Awaited<ReturnType<typeof getClientDetails>>["data"]>(null);
  const [loading, setLoading] = useState(true);

  const from = params.get("from");
  const backHref = from === "clients" ? "/clients" : "/appointments";
  const backLabel = from === "clients" ? "Clients" : "Appointments";

  useEffect(() => {
    async function fetch() {
      const id = params.get("id");
      if (!id) {
        setLoading(false);
        return;
      }

      const result = await getClientDetails(id);

      if (result.data) {
        const { client, appointment: apt } = result.data;

        setAppointment({
          id: apt?.id || "",
          name: client.name,
          age: client.age || "",
          relative: client.relative || "",
          address: client.address || "",
          countryCode: client.country_code || "+91",
          phone: client.phone,
          clientType: client.client_type as "Student" | "Client",
          status: (apt?.status as "Pending" | "Accepted" | "Rejected") || "Accepted",
          createdAt: new Date(client.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          clientId: client.id,
        });

        setClientData(result.data);
      }

      setLoading(false);
    }
    fetch();
  }, [params]);

  if (loading) {
    return <ClientDetailsSkeleton />;
  }

  if (!appointment) {
    return (
      <div className="rounded-lg border border-[#c1c9c0] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl text-[#1a1c1a]">Client not found</h2>
        <button
          className="inline-flex items-center rounded-md border border-[#c1c9c0] bg-white px-3.5 py-2.5 font-bold text-[#144229]"
          onClick={() => router.push(backHref)}
        >
          Back to {backLabel.toLowerCase()}
        </button>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#2D5A3F" },
        components: {
          DatePicker: {
            activeBorderColor: "#2D5A3F",
            hoverBorderColor: "#2D5A3F",
            activeShadow: "0 0 0 2px rgba(45, 90, 63, 0.15)",
          },
        },
      }}
    >
      <ClientDetails
        appointment={appointment}
        clientData={clientData}
        onBack={() => router.push(backHref)}
        backLabel={backLabel}
      />
    </ConfigProvider>
  );
}

export default function ClientViewDetailsPage() {
  return (
    <Suspense
      fallback={
        <ClientDetailsSkeleton />
      }
    >
      <ClientDetailsRoute />
    </Suspense>
  );
}
