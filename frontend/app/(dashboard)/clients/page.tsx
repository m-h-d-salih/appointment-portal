"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FilterHeader } from "@/components/ui/FilterHeader";
import type { Dayjs } from "dayjs";
import {
  getApprovedClients,
  getClientPaymentConfig,
  saveClientPaymentConfig,
  addPaymentEntry,
} from "@/lib/actions/appointments";
import { FiCreditCard, FiDownload } from "react-icons/fi";
import ReportDownloadModal from "@/components/clientDetails/ReportDownloadModal";
import ClientPaymentModal, {
  type ClientPaymentConfig,
} from "@/components/clientDetails/ClientPaymentModal";

type ClientRow = {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
  clientType: string;
  createdAt: string;
  totalAppointments: number;
  scheduledDate: string;
  scheduledTime: string;
  hasPayment: boolean;
  paymentSummary: { totalAmount: number; totalPaid: number } | null;
  location: string;
};

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "Student", label: "Student" },
  { value: "Client", label: "Client" },
];

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [selectedType, setSelectedType] = useState("all");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [reportClient, setReportClient] = useState<ClientRow | null>(null);
  const [paymentClient, setPaymentClient] = useState<ClientRow | null>(null);
  const [paymentConfigs, setPaymentConfigs] = useState<
    Record<string, ClientPaymentConfig>
  >({});

  const rupee = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const openReportModal = (client: ClientRow) => {
    setReportClient(client);
  };

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { clients: data, total: count } = await getApprovedClients({
        page,
        pageSize,
        search: searchQuery || undefined,
        clientType: selectedType !== "all" ? selectedType : undefined,
        dateFrom: dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
        dateTo: dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
      });
      const mapped = data.map((c) => ({
        ...c,
        phone: `${c.countryCode} ${c.phone}`.trim(),
      }));
      setClients(mapped);
      setTotal(count);
      setLoading(false);
    }
    fetch();
  }, [page, searchQuery, selectedType, dateRange]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const columns: Column<ClientRow>[] = [
    {
      title: "Sl No",
      key: "slNo",
      render: (_row, index) => index + 1,
    },
    {
      title: "Client",
      key: "name",
      render: (row) => (
        <span>
          <strong>{row.name}</strong>
          <small className="table-sub">{row.phone}</small>
        </span>
      ),
    },
    {
      title: "Type",
      key: "clientType",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            row.clientType === "Student"
              ? "bg-[#e6f0ff] text-[#1d4ed8]"
              : "bg-[#fff0d9] text-[#a15c00]"
          }`}
        >
          {row.clientType}
        </span>
      ),
    },
    {
      title: "Appointments",
      key: "totalAppointments",
      render: (row) => (
        <span className="font-medium">{row.totalAppointments}</span>
      ),
    },
    {
      title: "Payment Status",
      key: "payment",
      render: (row) => {
        const cfg = paymentConfigs[row.id];
        const summary = cfg
          ? {
              totalAmount: cfg.totalAmount,
              totalPaid: cfg.payments.reduce((s, p) => s + p.amount, 0),
            }
          : row.paymentSummary;

        if (
          !summary ||
          (summary.totalAmount === 0 && summary.totalPaid === 0)
        ) {
          return <span className="text-xs text-[#667362]">Not configured</span>;
        }

        const balance = Math.max(summary.totalAmount - summary.totalPaid, 0);

        return (
          <div className="flex min-w-28 flex-col gap-1 text-[11px] leading-4">
            <span className="inline-flex items-center justify-between gap-2 rounded-md bg-[#e8f7ee] px-2 py-1 font-bold text-[#144229]">
              <span className="font-semibold uppercase tracking-wide text-[#2D5A3F]">
                Paid
              </span>
              {rupee(summary.totalPaid)}
            </span>
            {summary.totalAmount > 0 && (
              <>
                <span className="inline-flex items-center justify-between gap-2 rounded-md bg-[#eef1ec] px-2 py-1 font-bold text-[#1a1c1a]">
                  <span className="font-semibold uppercase tracking-wide text-[#536350]">
                    Total
                  </span>
                  {rupee(summary.totalAmount)}
                </span>
                <span
                  className={`inline-flex items-center justify-between gap-2 rounded-md px-2 py-1 font-bold ${
                    balance === 0
                      ? "bg-[#bceecb] text-[#144229]"
                      : "bg-[#fff0c6] text-[#775a19]"
                  }`}
                >
                  <span className="font-semibold uppercase tracking-wide">
                    Bal
                  </span>
                  {rupee(balance)}
                </span>
              </>
            )}
          </div>
        );
      },
    },
    { title: "Joined", key: "createdAt" },
    {
      title: "Appointment",
      key: "scheduledDate",
      render: (row) => {
        if (!row.scheduledDate) return "—";
        const date = new Date(row.scheduledDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        if (!row.scheduledTime) return date;

        const [h, m] = row.scheduledTime.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${date}, ${hour12}:${m} ${ampm}`;
      },
    },
    {
      title: "Location",
      key: "location",
      render: (row) =>
        row.location === "Kodinhi Cheruppara, Malappuram"
          ? "Kodinhi"
          : row.location === "Zara Complex, Pantharangadi, Malappuram"
            ? "Zara Complex"
            : row.location || "—",
    },
    {
      title: "Actions",
      key: "actions",
      render: (row) => (
        <div className="table-actions">
          <button
            type="button"
            className="view-button"
            onClick={() =>
              router.push(`/client/viewdetails?id=${row.id}&from=clients`)
            }
          >
            View Details
          </button>
          <button
            type="button"
            className="reportbtn"
            onClick={() => openReportModal(row)}
          >
            <FiDownload aria-hidden="true" /> Report
          </button>
          <button
            type="button"
            className="cursor-pointer inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-[5px] border border-[#2d5a3f] bg-white px-3 text-xs font-bold text-[#144229] hover:bg-[#e8f7ee]"
            onClick={async () => {
              if (!paymentConfigs[row.id]) {
                const { config } = await getClientPaymentConfig(row.id);
                if (config) {
                  setPaymentConfigs((prev) => ({ ...prev, [row.id]: config }));
                }
              }
              setPaymentClient(row); // ← after fetch
            }}
          >
            <FiCreditCard aria-hidden="true" />
            {paymentConfigs[row.id] || row.hasPayment
              ? "Payment History"
              : "Set Payment"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Clients</h1>
          <p>Keep track of your client relationships and care history.</p>
        </div>
      </div>

      <FilterHeader
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name or phone"
        selectedStatus={selectedType}
        onStatusChange={(val) => {
          setSelectedType(val);
          setPage(1);
        }}
        statusOptions={TYPE_OPTIONS}
        dateRange={dateRange}
        onDateRangeChange={(val) => {
          setDateRange(val);
          setPage(1);
        }}
      />

      <section className="content-card">
        <DataTable
          columns={columns}
          data={clients}
          loading={loading}
          pageSize={pageSize}
          total={total}
          currentPage={page}
          onPageChange={setPage}
        />
      </section>

      <ReportDownloadModal
        key={
          reportClient
            ? `${reportClient.name}-${reportClient.clientType}`
            : "empty"
        }
        client={reportClient}
        open={Boolean(reportClient)}
        onClose={() => setReportClient(null)}
      />

      <ClientPaymentModal
        open={Boolean(paymentClient)}
        client={paymentClient}
        config={paymentClient ? paymentConfigs[paymentClient.id] : undefined}
        onClose={() => setPaymentClient(null)}
        onSaveConfig={async (next) => {
          if (!paymentClient) return; // or paymentStudent for students page

          const clientId = paymentClient.id; // or paymentStudent.id

          // Save total fee + notes
          await saveClientPaymentConfig(
            clientId,
            next.totalAmount,
            next.notes || "",
          );

          // Find new payments (temporary IDs start with "pay-")
          for (const payment of next.payments) {
            if (payment.id.startsWith("pay-")) {
              await addPaymentEntry(clientId, {
                date: payment.date,
                amount: payment.amount,
                category: payment.category,
                payment_method: payment.payment_method,
                reference: payment.reference,
                notes: payment.notes,
              });
            }
          }

          // Re-fetch fresh data from Supabase
          const { config } = await getClientPaymentConfig(clientId);
          if (config) {
            setPaymentConfigs((prev) => ({ ...prev, [clientId]: config }));
          }
        }}
      />
    </>
  );
}
