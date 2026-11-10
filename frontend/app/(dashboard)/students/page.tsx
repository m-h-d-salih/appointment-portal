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
  getStudentAttendance,
  addStudentAttendance,
  deleteStudentAttendance,
  deletePaymentEntry,
  softDeleteClient,
  getClientDependencies,
} from "@/lib/actions/appointments";
import {
  FiCheckSquare,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiTrash2,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import AppointmentNotifyModal from "@/components/appointment/AppointmentNotifyModal";
import {
  toNotifyDetails,
  getWhatsAppNumber,
  type AppointmentNotifyDetails,
} from "@/components/appointment/AppointmentConfirmationPdf";
import ReportDownloadModal from "@/components/clientDetails/ReportDownloadModal";
import ClientPaymentModal, {
  type ClientPaymentConfig,
} from "@/components/clientDetails/ClientPaymentModal";
import StudentAttendanceModal, {
  type StudentAttendanceRecord,
} from "@/components/students/StudentAttendanceModal";
import { Select, ConfigProvider } from "antd";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { useRole } from "@/components/context/RoleContext";

type StudentRow = {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
  clientType: string;
  createdAt: string;
  age: string;
  totalAppointments: number;
  scheduledDate: string;
  scheduledTime: string;
  hasPayment: boolean;
  paymentSummary: { totalAmount: number; totalPaid: number } | null;
  attendanceCount: number;
  appointmentDays: string[];
  location?: string;
};

const ATTENDANCE_FILTER_OPTIONS = [
  { value: "all", label: "All Students" },
  { value: "marked", label: "Attendance Marked" },
  { value: "unmarked", label: "Not Marked Yet" },
];

const rupee = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function StudentsPage() {
  const router = useRouter();
  const role = useRole();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [reportStudent, setReportStudent] = useState<StudentRow | null>(null);
  const [paymentStudent, setPaymentStudent] = useState<StudentRow | null>(null);
  const [attendanceStudent, setAttendanceStudent] = useState<StudentRow | null>(
    null,
  );
  const [notifyDetails, setNotifyDetails] =
    useState<AppointmentNotifyDetails | null>(null);

  const [paymentConfigs, setPaymentConfigs] = useState<
    Record<string, ClientPaymentConfig>
  >({});
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, StudentAttendanceRecord[]>
  >({});

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [deleteStudent, setDeleteStudent] = useState<StudentRow | null>(null);
  const [deleteDeps, setDeleteDeps] = useState<{
    appointments: number;
    payments: number;
    attendance: number;
  } | null>(null);
  const DAY_OPTIONS = [
    { value: "Monday", label: "Mon" },
    { value: "Tuesday", label: "Tue" },
    { value: "Wednesday", label: "Wed" },
    { value: "Thursday", label: "Thu" },
    { value: "Friday", label: "Fri" },
    { value: "Saturday", label: "Sat" },
    { value: "Sunday", label: "Sun" },
  ];
  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const { clients: data, total: count } = await getApprovedClients({
          page,
          pageSize,
          search: searchQuery || undefined,
          clientType: "Student",
          dateFrom: dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
          dateTo: dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
        });
        setStudents(
          data.map((c) => ({
            ...c,
            age: c.age || "—",
            phone: `${c.countryCode} ${c.phone}`.trim(),
          })),
        );
        setTotal(count);
      } catch {
        setStudents([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [page, searchQuery, dateRange]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const visibleStudents = students.filter((student) => {
    const count =
      attendanceRecords[student.id]?.length ?? student.attendanceCount;
    if (attendanceFilter === "marked") return count > 0;
    if (attendanceFilter === "unmarked") return count === 0;
    if (selectedDays.length > 0) {
      const studentDays = student.appointmentDays || [];
      if (!selectedDays.some((d) => studentDays.includes(d))) return false;
    }
    return true;
  });

  const columns: Column<StudentRow>[] = [
    {
      title: "Sl No",
      key: "slNo",
      render: (_row, index) => index + 1,
    },
    {
      title: "Student",
      key: "name",
      className: "min-w-[100px]",
      render: (row) => (
        <span className="block min-w-25">
          <strong className="whitespace-nowrap">{row.name}</strong>
          <small className="table-sub whitespace-nowrap">{row.phone}</small>
        </span>
      ),
    },
    {
      title: "Age",
      key: "age",
      render: (row) => (
        <span className="font-semibold text-[#144229]">{row.age || "—"}</span>
      ),
    },
    {
      title: "Appointments",
      key: "totalAppointments",
      render: (row) => (
        <span className="font-semibold text-[#1a1c1a]">
          {row.totalAppointments}
        </span>
      ),
    },
    {
      title: "Attendance",
      key: "attendance",
      render: (row) => {
        const count = attendanceRecords[row.id]?.length ?? row.attendanceCount;
        return count > 0 ? (
          <span className="inline-block whitespace-nowrap rounded-full  px-2.5 py-0.5 text-xs font-bold">
            {count} marked
          </span>
        ) : (
          <span className="text-xs text-[#667362]">Unmarked</span>
        );
      },
    },
    {
      title: "Payment Status",
      key: "payment",
      render: (row) => {
const cfg = paymentConfigs[row.id];
const summary = cfg
  ? {
      totalAmount: cfg.totalAmount,
      totalPaid: cfg.tuitionPaid ?? cfg.payments.reduce((s, p) => s + p.amount, 0),
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
      title: "Days",
      key: "appointmentDays",
      render: (row) =>
        row.appointmentDays?.length
          ? row.appointmentDays.map((d: string) => d.slice(0, 3)).join(", ")
          : "—",
    },
    // {
    //   title: "View Details",
    //   key: "viewDetails",
    //   render: (row) => (
    //     <button
    //       type="button"
    //       className="view-button"
    //       onClick={() =>
    //         router.push(`/client/viewdetails?id=${row.id}&from=students`)
    //       }
    //     >
    //       View Details
    //     </button>
    //   ),
    // },
    {
      title: "Actions",
      key: "actions",
      render: (row) => {
        return (
          <div className="table-actions">
            {role === "admin" && (
              <button
                type="button"
                className="view-button"
                onClick={() =>
                  router.push(`/client/viewdetails?id=${row.id}&from=students`)
                }
              >
                View Details
              </button>
            )}

            <button
              className="border-[#25D366]! bg-[#25D366]! inline-flex items-center justify-center gap-1.5 px-2.5! text-xs! font-bold text-white!"
              title="Notify on WhatsApp"
              aria-label={`Notify ${row.name} on WhatsApp`}
              onClick={() => setNotifyDetails(toNotifyDetails(row))}
            >
              <FaWhatsapp />
              Notify
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap bg-[#e8f7ee] px-2.5! text-xs! font-bold text-[#2D5A3F]! hover:bg-[#d5f0df]!"
              title="Send payment alert on WhatsApp"
              aria-label={`Send payment alert to ${row.name} on WhatsApp`}
              onClick={() => {
                const message = [
                  "Treasure Counseling Center",
                  "",
                  "Payment balance reminder",
                  "",
                  `Name: ${row.name}`,
                  `Age: ${row.age || "—"}`,
                  "Amount :",
                  "",
                  "Thank you",
                ].join("\n");
                const phone = getWhatsAppNumber({
                  ...toNotifyDetails(row),
                  phone: row.phone,
                });
                window.open(
                  `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            >
              <FiDollarSign aria-hidden="true" />
              Payment Alert
            </button>

            <button
              type="button"
              className="cursor-pointer inline-flex h-8.5 items-center gap-1.5 whitespace-nowrap rounded-[5px] bg-[#2D5A3F] px-3 text-xs font-bold text-white hover:bg-[#16482b]"
              onClick={async () => {
                if (!attendanceRecords[row.id]) {
                  const { records } = await getStudentAttendance(row.id);
                  setAttendanceRecords((prev) => ({
                    ...prev,
                    [row.id]: records,
                  }));
                }
                setAttendanceStudent(row);
              }}
            >
              <FiCheckSquare aria-hidden="true" />
              {(attendanceRecords[row.id]?.length ?? row.attendanceCount) > 0
                ? `Attendance (${attendanceRecords[row.id]?.length ?? row.attendanceCount})`
                : "Mark Attendance"}
            </button>

            {role === "admin" && (
              <>
                <button
                  type="button"
                  className="cursor-pointer inline-flex h-8.5 items-center gap-1.5 whitespace-nowrap rounded-[5px] border border-[#2d5a3f] bg-white px-3 text-xs font-bold text-[#144229] hover:bg-[#e8f7ee]"
                  onClick={async () => {
                    if (!paymentConfigs[row.id]) {
                      const { config } = await getClientPaymentConfig(row.id);
                      if (config) {
                        setPaymentConfigs((prev) => ({
                          ...prev,
                          [row.id]: config,
                        }));
                      }
                    }
                    setPaymentStudent(row);
                  }}
                >
                  <FiCreditCard aria-hidden="true" />
                  {paymentConfigs[row.id] || row.hasPayment
                    ? "Payment History"
                    : "Set Payment"}
                </button>

                <button
                  type="button"
                  className="reportbtn"
                  onClick={() => setReportStudent(row)}
                >
                  <FiDownload aria-hidden="true" /> Report
                </button>

                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-red-200 bg-white p-1.5 text-red-500 hover:bg-red-50"
                  title="Delete student"
                  onClick={async () => {
                    const deps = await getClientDependencies(row.id);
                    setDeleteDeps(deps);
                    setDeleteStudent(row);
                  }}
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Students</h1>
          <p>
            Manage student sessions, digital attendance signatures, and fee
            payments.
          </p>
        </div>
      </div>

      <FilterHeader
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search student by name or phone"
        selectedStatus={attendanceFilter}
        onStatusChange={(val) => {
          setAttendanceFilter(val);
          setPage(1);
        }}
        statusOptions={ATTENDANCE_FILTER_OPTIONS}
        dateRange={dateRange}
        onDateRangeChange={(val) => {
          setDateRange(val);
          setPage(1);
        }}
      >
        <ConfigProvider theme={{ token: { controlHeight: 40 } }}>
          <Select
            mode="multiple"
            allowClear
            placeholder="Filter by days"
            value={selectedDays}
            onChange={setSelectedDays}
            maxTagCount="responsive"
            className="w-full sm:min-w-40 sm:flex-1 lg:w-40 lg:flex-none"
            options={DAY_OPTIONS}
            getPopupContainer={() => document.body}
            classNames={{
              popup: {
                root: "[&_.ant-select-item-option-active]:bg-[#e8f7ee]! [&_.ant-select-item-option-selected]:bg-[#bceecb]! [&_.ant-select-item-option-selected]:text-[#144229]! [&_.ant-select-item-option-selected]:font-semibold!",
              },
            }}
          />
        </ConfigProvider>
      </FilterHeader>
      <section className="content-card">
        <DataTable
          columns={columns}
          data={visibleStudents}
          loading={loading}
          pageSize={pageSize}
          total={total}
          currentPage={page}
          onPageChange={setPage}
        />
      </section>

      <AppointmentNotifyModal
        open={notifyDetails !== null}
        details={notifyDetails}
        onClose={() => setNotifyDetails(null)}
      />

      <StudentAttendanceModal
        open={Boolean(attendanceStudent)}
        student={attendanceStudent}
        records={
          attendanceStudent ? attendanceRecords[attendanceStudent.id] || [] : []
        }
        paymentConfigured={
          attendanceStudent
            ? Boolean(
                (paymentConfigs[attendanceStudent.id]?.totalAmount ?? 0) > 0 ||
                (attendanceStudent.paymentSummary?.totalAmount ?? 0) > 0,
              )
            : true
        }
        onClose={() => setAttendanceStudent(null)}
        onSaveRecord={async (nextRecord) => {
          if (!attendanceStudent) return;

          const result = await addStudentAttendance(attendanceStudent.id, {
            attendanceNo: nextRecord.attendanceNo,
            date: nextRecord.date,
            paidAmount: nextRecord.paidAmount,
            paymentMethod: nextRecord.paymentMethod,
            notes: nextRecord.notes,
          });

          if (result.error) {
            alert(result.error);
            return false;
          }

          setAttendanceRecords((prev) => ({
            ...prev,
            [attendanceStudent.id]: [
              { ...nextRecord, id: result.id! },
              ...(prev[attendanceStudent.id] || []),
            ],
          }));

          // If payment was made, re-fetch fresh payment config
          if (nextRecord.paidAmount > 0) {
            const { config } = await getClientPaymentConfig(
              attendanceStudent.id,
            );
            if (config) {
              setPaymentConfigs((prev) => ({
                ...prev,
                [attendanceStudent.id]: config,
              }));
            }
          }
          return true;
        }}
        onDeleteRecord={async (id) => {
          if (!attendanceStudent) return;
          const result = await deleteStudentAttendance(id);
          if (result.error) {
            alert(result.error);
            return;
          }
          // Remove from local state
          setAttendanceRecords((prev) => ({
            ...prev,
            [attendanceStudent.id]: (prev[attendanceStudent.id] || []).filter(
              (r) => r.id !== id,
            ),
          }));
          // Refresh payment config since transaction was voided
          const { config } = await getClientPaymentConfig(attendanceStudent.id);
          if (config) {
            setPaymentConfigs((prev) => ({
              ...prev,
              [attendanceStudent.id]: config,
            }));
          }
        }}
      />

      <ClientPaymentModal
        open={Boolean(paymentStudent)}
        client={paymentStudent}
        config={paymentStudent ? paymentConfigs[paymentStudent.id] : undefined}
        onClose={() => setPaymentStudent(null)}
        onSaveConfig={async (next) => {
          if (!paymentStudent) return;

          const clientId = paymentStudent.id;

          await saveClientPaymentConfig(
            clientId,
            next.totalAmount,
            next.notes || "",
          );

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

          const { config } = await getClientPaymentConfig(clientId);
          if (config) {
            setPaymentConfigs((prev) => ({ ...prev, [clientId]: config }));
          }
        }}
        onDeletePayment={async (paymentId) => {
          if (!paymentStudent) return;
          const result = await deletePaymentEntry(paymentId);
          if (result.error) {
            alert(result.error);
            return;
          }
          const { config } = await getClientPaymentConfig(paymentStudent.id);
          if (config) {
            setPaymentConfigs((prev) => ({
              ...prev,
              [paymentStudent.id]: config,
            }));
          }
        }}
      />

      <ReportDownloadModal
        key={
          reportStudent
            ? `${reportStudent.name}-${reportStudent.clientType}`
            : "empty"
        }
        client={reportStudent}
        open={Boolean(reportStudent)}
        onClose={() => setReportStudent(null)}
      />
      <DeleteConfirmationModal
        open={!!deleteStudent}
        title="Delete this student?"
        itemName={deleteStudent?.name}
        actionDescription={
          deleteDeps &&
          (deleteDeps.appointments > 0 ||
            deleteDeps.payments > 0 ||
            deleteDeps.attendance > 0)
            ? `This student has ${deleteDeps.appointments} appointment${deleteDeps.appointments !== 1 ? "s" : ""}, ${deleteDeps.payments} payment${deleteDeps.payments !== 1 ? "s" : ""}, and ${deleteDeps.attendance} attendance record${deleteDeps.attendance !== 1 ? "s" : ""}. Deleting will hide them from all lists. Data is preserved and can be restored.`
            : "Student will be hidden from all lists. Their data is preserved and can be restored."
        }
        onCancel={() => {
          setDeleteStudent(null);
          setDeleteDeps(null);
        }}
        onConfirm={async () => {
          if (!deleteStudent) return;
          const result = await softDeleteClient(deleteStudent.id);
          if (result.error) {
            alert(result.error);
          } else {
            setStudents((prev) =>
              prev.filter((s) => s.id !== deleteStudent.id),
            );
            setTotal((prev) => prev - 1);
          }
          setDeleteStudent(null);
          setDeleteDeps(null);
        }}
      />
    </>
  );
}
