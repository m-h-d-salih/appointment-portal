"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterHeader } from "@/components/FilterHeader";
import dayjs, { type Dayjs } from "dayjs";
import { getApprovedClients } from "@/lib/actions/appointments";
import { FiDownload } from "react-icons/fi";
import ReportDownloadModal from "@/components/ReportDownloadModal";

type ClientRow = {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
  clientType: string;
  createdAt: string;
  totalAppointments: number;
  scheduledDate: string;
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
 const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs().startOf("day"), dayjs().endOf("day")]);
  const [reportClient, setReportClient] = useState<ClientRow | null>(null);

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
      clientType: selectedType !== 'all' ? selectedType : undefined,
      dateFrom: dateRange?.[0]?.format('YYYY-MM-DD') || undefined,
      dateTo: dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
    });
    setClients(data.map((c) => ({
      ...c,
      phone: `${c.countryCode} ${c.phone}`.trim(),
    })));
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
      render: (row) => <span className="font-medium">{row.totalAppointments}</span>,
    },
    { title: "Joined", key: "createdAt" },
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
        onStatusChange={(val) => { setSelectedType(val); setPage(1); }}
        statusOptions={TYPE_OPTIONS}
        dateRange={dateRange}
        onDateRangeChange={(val) => { setDateRange(val); setPage(1); }}
      />

      <section className="content-card">
    <DataTable columns={columns} data={clients} loading={loading} pageSize={pageSize} total={total} currentPage={page} onPageChange={setPage} />
      </section>

      <ReportDownloadModal
        key={reportClient ? `${reportClient.name}-${reportClient.clientType}` : "empty"}
        client={reportClient}
        open={Boolean(reportClient)}
        onClose={() => setReportClient(null)}
      />
    </>
  );
}
