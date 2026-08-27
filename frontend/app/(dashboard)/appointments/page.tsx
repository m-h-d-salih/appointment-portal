"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterHeader } from "@/components/FilterHeader";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Checkbox, DatePicker } from "antd";
import {
  FiArrowLeft,
  FiCheck,
  FiDownload,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import AddAppointmentModal, {
  type AppointmentFormValues,
} from "@/components/AddAppointmentModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import ReportDownloadModal from "@/components/ReportDownloadModal";
import { downloadApplicationPdf } from "@/components/ApplicationPdf";
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  updateAppointmentDetails,
} from "@/lib/actions/appointments";

import {
  Field,
  FormSection,
  RepeatSection,
  TextGrid,
  AssessmentReportForm,
  type RemediationRow,
} from "@/components/ClientDetailSections";
import {
  saveClientInfo,
  saveApplicationForm,
  saveStudentIntake,
  saveParentsDetails,
  saveAssessmentReport,
  saveMentalStatusExam,
} from "@/lib/actions/appointments";
import { useRole } from "@/components/RoleContext";

type Status = "Pending" | "Accepted" | "Rejected";
export type ClientType = "Student" | "Client";
export type Appointment = {
  id: string; // changed from number to string
  name: string;
  age: string;
  relative: string;
  address: string;
  countryCode: string;
  phone: string;
  clientType: ClientType;
  status: Status;
  createdAt: string;
  clientId: string; // new — links to the client record
   scheduledDate?: string;
   scheduledTime?: string;
};

export function ClientDetails({
  appointment,
  clientData,
  onBack,
  backLabel = "Appointments",
}: {
  appointment: Appointment;
  clientData?: {
    client: any;
    appointment: any;
    applicationForm: any;
    studentIntake: any;
    parentsDetails: any;
    assessmentReport: any;
    mentalStatusExam: any;
    remediationEntries: any[];
    planEntries: any[];
  } | null;
  onBack: () => void;
  backLabel?: string;
}) {
  const [data, setData] = useState(appointment);
  const [currentProblem, setCurrentProblem] = useState(
    clientData?.applicationForm?.current_problem || "",
  );
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReportDownload, setShowReportDownload] = useState(false);

  // TextGrid values for each section
  const [studentIntakeValues, setStudentIntakeValues] = useState<
    Record<string, string>
  >(clientData?.studentIntake?.form_data || {});
  const [parentsDetailsValues, setParentsDetailsValues] = useState<
    Record<string, string>
  >(clientData?.parentsDetails?.form_data || {});
  const [assessmentReportValues, setAssessmentReportValues] = useState<
    Record<string, string>
  >(clientData?.assessmentReport?.form_data || {});

  // Mental status exam state
  const [mentalStatusValues, setMentalStatusValues] = useState<
    Record<string, any>
  >(clientData?.mentalStatusExam?.form_data || {});

  // Remediation entries
  const remediationEntries: RemediationRow[] = (
    clientData?.remediationEntries || []
  ).map((e: any) => ({
    id: e.id,
    entry_date: e.entry_date || "",
    remediation_given: e.remediation_given || "",
    improvement_seen: e.improvement_seen || "",
    sort_order: e.sort_order || 0,
  }));

  const [open, setOpen] = useState<string[]>([
    "Application Form",
    ...(appointment.clientType === "Student"
      ? [
          "Student Intake Form",
          "Remediation & Improvement",
          "Parents' Details",
          "Assessment Report",
        ]
      : ["Mental Status Exam", "Remediation & Improvement"]),
  ]);

  const navigationItems = [
    "Application Form",
    ...(data.clientType === "Student"
      ? [
          "Student Intake Form",
          "Parents' Details",
          "Assessment Report",
          "Remediation & Improvement",
        ]
      : ["Mental Status Exam", "Remediation & Improvement"]),
  ];

  const [editing, setEditing] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("Application Form");

  const toggle = (name: string) =>
    setOpen((items) =>
      items.includes(name) ? items.filter((x) => x !== name) : [...items, name],
    );
  const isEditing = (name: string) => editing === name;

  const set = (key: keyof Appointment, value: string) =>
    setData((d) => ({ ...d, [key]: value }));

  // ─── Save handlers ───
  const handleSave = async (section: string) => {
    setSaving(true);

    switch (section) {
      case "Application Form":
        await saveClientInfo(appointment.clientId, {
          name: data.name,
          age: data.age,
          relative: data.relative,
          address: data.address,
        });
        if (appointment.id) {
          await saveApplicationForm(appointment.id, currentProblem);
        }
        break;

      case "Student Intake Form":
        await saveStudentIntake(appointment.clientId, studentIntakeValues);
        break;

      case "Parents' Details":
        await saveParentsDetails(appointment.clientId, parentsDetailsValues);
        break;

      case "Assessment Report":
        await saveAssessmentReport(
          appointment.clientId,
          assessmentReportValues,
        );
        break;

      case "Mental Status Exam":
        if (appointment.id) {
          await saveMentalStatusExam(appointment.id, mentalStatusValues);
        }
        break;
    }

    setSaving(false);
    setEditing(null);
  };

  useEffect(() => {
    const observers = navigationItems.map((item) => {
      const element = document.getElementById(item);
      if (!element) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(item);
        },
        { rootMargin: "-18% 0px -65% 0px" },
      );
      observer.observe(element);
      return observer;
    });
    return () => observers.forEach((observer) => observer?.disconnect());
  }, [data.clientType]);

  return (
    <div className="client-workspace">
      <div className="details-toolbar">
        <button className="secondary-button" onClick={onBack}>
          <FiArrowLeft /> {backLabel}
        </button>
        <div></div>
      </div>
      <div className="details-layout block! xl:grid! xl:grid-cols-[220px_minmax(0,1fr)]!">
        <nav className="form-nav sticky top-4 hidden rounded-lg border border-[#c1c9c0] bg-white p-3 xl:block">
          <p className="m-0 mb-2 text-[10px] font-extrabold text-[#414942]">
            ON THIS PAGE
          </p>
          <div className="flex flex-col gap-1">
            {navigationItems.map((item) => (
              <button
                className={`block w-full rounded-md border-0 px-2 py-2.5 text-left transition ${
                  activeSection === item
                    ? "bg-[#bceecb] font-semibold text-[#144229]"
                    : "bg-transparent text-[#414942] hover:bg-[#bceecb] hover:text-[#144229]"
                }`}
                key={item}
                onClick={() => {
                  setOpen((x) => (x.includes(item) ? x : [...x, item]));
                  setActiveSection(item);
                  document
                    .getElementById(item)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </nav>

        <main className="print-area">
          <div className="print-header">
            <Image src="/logo.webp" alt="Treasure" width={42} height={42} />
            <div>
              <strong>TREASURE</strong>
              <small>FOR THE PEOPLE&apos;S WELLBEING</small>
            </div>
            <span>
              9061200099
              <br />
              7306941801
            </span>
          </div>

          <div className="client-title">
            <div className="min-w-0 flex-1">
              <h1 className="truncate" title={data.name}>
                {data.name}
              </h1>
              <p>
                {data.clientType} · Age {data.age}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className="reportbtn"
                onClick={() => setShowReportDownload(true)}
              >
                <FiDownload aria-hidden="true" />
                Report
              </button>
              {/* <span className="status accepted">Accepted</span> */}
            </div>
          </div>

          {/* ─── Application Form ─── */}
          <div id="Application Form" className="application-print">
            <FormSection
              title="Application Form"
              open={open.includes("Application Form")}
              onToggle={() => toggle("Application Form")}
              editing={isEditing("Application Form")}
              onEdit={() =>
                setEditing(
                  isEditing("Application Form") ? null : "Application Form",
                )
              }
              onSave={() => handleSave("Application Form")}
              saving={saving}
              onDownload={async () => {
                if (downloadingPdf) return;
                try {
                  setDownloadingPdf(true);
                  await downloadApplicationPdf({
                    name: data.name,
                    age: data.age,
                    relative: data.relative,
                    address: data.address,
                    phone: `${data.countryCode} ${data.phone}`.trim(),
                    currentProblem,
                  });
                } catch (error) {
                  console.error(error);
                  window.alert("Could not generate the PDF. Please try again.");
                } finally {
                  setDownloadingPdf(false);
                }
              }}
            >
              <div className="form-grid">
                <Field
                  label="Name"
                  value={data.name}
                  onChange={(v) => set("name", v)}
                  disabled={!isEditing("Application Form")}
                />
                <Field
                  label="Age"
                  value={data.age}
                  onChange={(v) => set("age", v)}
                  disabled={!isEditing("Application Form")}
                />
                <Field
                  label="Relative's name and phone"
                  value={data.relative}
                  onChange={(v) => set("relative", v)}
                  disabled={!isEditing("Application Form")}
                />
                <Field
                  label="Address"
                  value={data.address}
                  onChange={(v) => set("address", v)}
                  disabled={!isEditing("Application Form")}
                />
                <Field
                  label="Phone"
                  value={`${data.countryCode} ${data.phone}`}
                  disabled
                />
                <label className="full-width flex flex-col gap-1.5 text-[13px] text-[#144229]">
                  <span className="font-medium">Current problem</span>
                  <textarea
                    value={currentProblem}
                    maxLength={600}
                    onChange={(e) => setCurrentProblem(e.target.value)}
                    disabled={!isEditing("Application Form")}
                    className="min-h-24 w-full rounded-md border border-[#c1c9c0] bg-white p-3 text-sm text-[#1a1c1a] outline-none transition focus:border-[#2D5A3F] focus:ring-2 focus:ring-[#2D5A3F]/15 disabled:bg-[#f4f4f0] disabled:text-[#414942]"
                  />
                  {currentProblem.length >= 600 && (
                    <span className="text-xs font-medium text-[#c9252d]">
                      Maximum 600 characters reached.
                    </span>
                  )}
                </label>
              </div>
            </FormSection>
          </div>

          {/* ─── Student Intake Form ─── */}
          {data.clientType === "Student" && (
            <div id="Student Intake Form">
              <FormSection
                title="Student Intake Form"
                open={open.includes("Student Intake Form")}
                onToggle={() => toggle("Student Intake Form")}
                editing={isEditing("Student Intake Form")}
                onEdit={() =>
                  setEditing(
                    isEditing("Student Intake Form")
                      ? null
                      : "Student Intake Form",
                  )
                }
                onSave={() => handleSave("Student Intake Form")}
                saving={saving}
              >
                <TextGrid
                  editable={isEditing("Student Intake Form")}
                  values={studentIntakeValues}
                  onChange={setStudentIntakeValues}
                  maxLength={50}
                  labels={[
                    "Name",
                    "Gender",
                    "Age & DOB",
                    "Name of school & Place",
                    "Class",
                    "Medium",
                    "Board of Education",
                    "Father & Mother Name",
                    "Contact Number",
                    "Place & District",
                    "Medical Problem (if any)",
                    "Behavior issues",
                    "Psychological issues",
                    "History Of Family",
                    "Special Talents (if any)",
                    "Areas of improvement",
                    "Type of learner",
                    "Non-academic performance",
                    "Easy subject & language",
                    "Tough Subject & language",
                    "Pregnancy history",
                    "Developmental stages",
                    "Attitude of Father",
                    "Attitude of Mother",
                    "Family",
                  ]}
                />
              </FormSection>
            </div>
          )}

          {/* ─── Parents' Details ─── */}
          {data.clientType === "Student" && (
            <div id="Parents' Details">
              <FormSection
                title="Parents' Details"
                open={open.includes("Parents' Details")}
                onToggle={() => toggle("Parents' Details")}
                editing={isEditing("Parents' Details")}
                onEdit={() =>
                  setEditing(
                    isEditing("Parents' Details") ? null : "Parents' Details",
                  )
                }
                onSave={() => handleSave("Parents' Details")}
                saving={saving}
              >
                <TextGrid
                  editable={isEditing("Parents' Details")}
                  values={parentsDetailsValues}
                  onChange={setParentsDetailsValues}
                  labels={[
                    "Father's Name",
                    "Father's Occupation",
                    "Father's Contact Number",
                    "Father's Education",
                    "Father's Address",
                    "Mother's Name",
                    "Mother's Occupation",
                    "Mother's Contact Number",
                    "Mother's Education",
                    "Mother's Address",
                    "Type of family",
                    "Type of House",
                    "Child living with",
                    "Number of brothers",
                    "Number of sisters",
                    "Age difference with immediate sibling",
                    "Note",
                    "Assessed by",
                    "Name & Signature",
                    "Date",
                  ]}
                  dateLabels={["Date"]}
                  radioOptions={{ "Type of family": ["Joint", "Nuclear"] }}
                  maxLength={50}
                />
              </FormSection>
            </div>
          )}

          {/* ─── Assessment Report ─── */}
          {data.clientType === "Student" && (
            <div id="Assessment Report">
              <FormSection
                title="Assessment Report"
                open={open.includes("Assessment Report")}
                onToggle={() => toggle("Assessment Report")}
                editing={isEditing("Assessment Report")}
                onEdit={() =>
                  setEditing(
                    isEditing("Assessment Report") ? null : "Assessment Report",
                  )
                }
                onSave={() => handleSave("Assessment Report")}
                saving={saving}
              >
                <AssessmentReportForm
                  editable={isEditing("Assessment Report")}
                  values={assessmentReportValues}
                  onChange={setAssessmentReportValues}
                />
              </FormSection>
            </div>
          )}

          {/* ─── Mental Status Exam ─── */}
          {data.clientType === "Client" && (
            <div id="Mental Status Exam">
              <FormSection
                title="Mental Status Exam"
                open={open.includes("Mental Status Exam")}
                onToggle={() => toggle("Mental Status Exam")}
                editing={isEditing("Mental Status Exam")}
                onEdit={() =>
                  setEditing(
                    isEditing("Mental Status Exam")
                      ? null
                      : "Mental Status Exam",
                  )
                }
                onSave={() => handleSave("Mental Status Exam")}
                saving={saving}
              >
                <div className="flex flex-col gap-4">
                  <div className="form-grid">
                    <Field label="Client Name" value={data.name} disabled />
                    <label className="flex flex-col gap-1.5 text-[13px] text-[#144229]">
                      <span className="font-medium">Date</span>
                      <DatePicker
                        format="DD/MM/YYYY"
                        disabled={!isEditing("Mental Status Exam")}
                        className="h-11! w-full bg-white! [&.ant-picker-disabled]:bg-[#f4f4f0]!"
                        value={
                          mentalStatusValues.exam_date
                            ? dayjs(mentalStatusValues.exam_date)
                            : undefined
                        }
                        onChange={(date) =>
                          setMentalStatusValues((prev) => ({
                            ...prev,
                            exam_date: date ? date.format("YYYY-MM-DD") : "",
                          }))
                        }
                      />
                    </label>
                  </div>

                  {(
                    [
                      {
                        key: "observations",
                        title: "OBSERVATIONS",
                        rows: [
                          [
                            "Appearance",
                            [
                              "Neat",
                              "Dishevelled",
                              "Inappropriate",
                              "Bizarre",
                              "Other",
                            ],
                          ],
                          [
                            "Speech",
                            [
                              "Normal",
                              "Tangential",
                              "Pressured",
                              "Impoverished",
                              "Other",
                            ],
                          ],
                          [
                            "Eye Contact",
                            ["Normal", "Intense", "Avoidant", "Other"],
                          ],
                          [
                            "Motor Activity",
                            ["Normal", "Restless", "Tics", "Slowed", "Other"],
                          ],
                          [
                            "Affect",
                            ["Full", "Constricted", "Flat", "Labile", "Other"],
                          ],
                        ],
                      },
                      {
                        key: "mood",
                        title: "MOOD",
                        rows: [
                          [
                            "Mood",
                            [
                              "Euthymic",
                              "Anxious",
                              "Angry",
                              "Depressed",
                              "Euphoric",
                              "Irritable",
                              "Other",
                            ],
                          ],
                        ],
                      },
                      {
                        key: "cognition",
                        title: "COGNITION",
                        rows: [
                          [
                            "Orientation Impairment",
                            ["None", "Place", "Object", "Person", "Time"],
                          ],
                          [
                            "Memory Impairment",
                            ["None", "Short-Term", "Long-Term", "Other"],
                          ],
                          ["Attention", ["Normal", "Distracted", "Other"]],
                        ],
                      },
                      {
                        key: "perception",
                        title: "PERCEPTION",
                        rows: [
                          [
                            "Hallucinations",
                            ["None", "Auditory", "Visual", "Other"],
                          ],
                          [
                            "Other",
                            ["None", "Derealization", "Depersonalization"],
                          ],
                        ],
                      },
                      {
                        key: "thoughts",
                        title: "THOUGHTS",
                        rows: [
                          [
                            "Suicidality",
                            ["None", "Ideation", "Plan", "Intent", "Self-Harm"],
                          ],
                          [
                            "Homicidality",
                            ["None", "Aggressive", "Intent", "Plan"],
                          ],
                          [
                            "Delusions",
                            [
                              "None",
                              "Grandiose",
                              "Paranoid",
                              "Religious",
                              "Other",
                            ],
                          ],
                        ],
                      },
                      {
                        key: "behavior",
                        title: "BEHAVIOR",
                        rows: [
                          [
                            "Behavior",
                            [
                              "Cooperative",
                              "Guarded",
                              "Hyperactive",
                              "Agitated",
                              "Paranoid",
                              "Stereotyped",
                              "Aggressive",
                              "Bizarre",
                              "Withdrawn",
                              "Other",
                            ],
                          ],
                        ],
                      },
                    ] as const
                  ).map((section) => (
                    <div
                      key={section.title}
                      className="rounded-md border border-[#c1c9c0] bg-[#faf9f6] p-4"
                    >
                      <h4 className="m-0 mb-3 text-sm font-bold text-[#144229]">
                        {section.title}
                      </h4>
                      {section.rows.map(([label, options]) => (
                        <div
                          key={label}
                          className="grid grid-cols-1 gap-2 border-b border-[#e8e8e5] py-2.5 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)]"
                        >
                          <span className="text-sm font-semibold text-[#144229]">
                            {label}
                          </span>
                          <Checkbox.Group
                            disabled={!isEditing("Mental Status Exam")}
                            className="flex flex-wrap gap-x-4 gap-y-2"
                            options={options.map((o) => ({
                              label: o,
                              value: o,
                            }))}
                            value={
                              (
                                mentalStatusValues[section.key] as Record<
                                  string,
                                  string[]
                                >
                              )?.[label] || []
                            }
                            onChange={(checked) =>
                              setMentalStatusValues((prev) => ({
                                ...prev,
                                [section.key]: {
                                  ...((prev[section.key] as Record<
                                    string,
                                    string[]
                                  >) || {}),
                                  [label]: checked,
                                },
                              }))
                            }
                          />
                        </div>
                      ))}
                      <label className="mt-3 flex flex-col gap-1.5">
                        <span className="text-sm font-bold text-[#144229]">
                          Comments:
                        </span>
                        <textarea
                          disabled={!isEditing("Mental Status Exam")}
                          maxLength={400}
                          className="min-h-20 w-full rounded-md border border-[#c1c9c0] bg-white p-3 disabled:bg-[#f4f4f0]"
                          value={
                            (mentalStatusValues[
                              `${section.key}_comments`
                            ] as string) || ""
                          }
                          onChange={(e) =>
                            setMentalStatusValues((prev) => ({
                              ...prev,
                              [`${section.key}_comments`]: e.target.value,
                            }))
                          }
                        />
                        {String(
                          mentalStatusValues[`${section.key}_comments`] || "",
                        ).length >= 400 && (
                          <span className="text-xs font-medium text-[#c9252d]">
                            Maximum 400 characters reached.
                          </span>
                        )}
                      </label>
                    </div>
                  ))}

                  <div className="rounded-md border border-[#c1c9c0] bg-[#faf9f6] p-4">
                    <h4 className="m-0 mb-3 text-sm font-bold text-[#144229]">
                      INSIGHT & JUDGEMENT
                    </h4>
                    {(["insight", "judgement"] as const).map((row) => (
                      <div
                        key={row}
                        className="mb-3 grid grid-cols-1 gap-3 border-b border-[#e8e8e5] pb-3 last:mb-0 last:border-b-0 last:pb-0 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center"
                      >
                        <span className="text-sm font-bold text-[#144229]">
                          {row.toUpperCase()}
                        </span>
                        <Checkbox.Group
                          disabled={!isEditing("Mental Status Exam")}
                          className="flex flex-wrap gap-x-4 gap-y-2"
                          options={["Good", "Fair", "Poor"].map((o) => ({
                            label: o,
                            value: o,
                          }))}
                          value={
                            (mentalStatusValues[`${row}_rating`] as string[]) ||
                            []
                          }
                          onChange={(checked) =>
                            setMentalStatusValues((prev) => ({
                              ...prev,
                              [`${row}_rating`]: checked,
                            }))
                          }
                        />
                        <input
                          disabled={!isEditing("Mental Status Exam")}
                          placeholder="Comments"
                          maxLength={400}
                          className="h-11 rounded-md border border-[#c1c9c0] bg-white px-3 disabled:bg-[#f4f4f0]"
                          value={(mentalStatusValues[row] as string) || ""}
                          onChange={(e) =>
                            setMentalStatusValues((prev) => ({
                              ...prev,
                              [row]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </FormSection>
            </div>
          )}

          {/* ─── Remediation (shared by both Student & Client) ─── */}
          <div id="Remediation & Improvement">
            <RepeatSection
              id="remediation-section"
              title="Remediation & Improvement"
              labels={[
                "Date",
                "Remediation given",
                "Improvement seen",
                "Doctor / Counsellor Name & Signature",
              ]}
              clientId={appointment.clientId}
              initialEntries={remediationEntries}
            />
          </div>
        </main>
      </div>
      <ReportDownloadModal
        client={{
          id: appointment.clientId,
          name: appointment.name,
          phone: appointment.phone,
          clientType: appointment.clientType,
        }}
        open={showReportDownload}
        onClose={() => setShowReportDownload(false)}
      />
    </div>
  );
}

export default function AppointmentsPage() {
  const router = useRouter();
  const role = useRole();
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [submitting, setSubmitting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] =
    useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<Appointment | null>(null);
  const [appointmentToReject, setAppointmentToReject] =
    useState<Appointment | null>(null);
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const fetchAppointments = async () => {
    setLoading(true);
    const {
      appointments,
      total: count,
      error,
    } = await getAppointments({
      page,
      pageSize,
      search: query || undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      dateFrom: dateRange?.[0]?.format("YYYY-MM-DD") || undefined,
      dateTo: dateRange?.[1]?.format("YYYY-MM-DD") || undefined,
    });
    if (!error) {
      setRows(appointments);
      setTotal(count);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [page, query, selectedStatus, dateRange]);

  useEffect(() => {
    window.addEventListener("appointment-created", fetchAppointments);
    return () =>
      window.removeEventListener("appointment-created", fetchAppointments);
  },[]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput);
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const handleStatusChange = async (
    id: string,
    status: "Accepted" | "Rejected",
  ) => {
    const result = await updateAppointmentStatus(id, status);
    if (!result.error) fetchAppointments(); // refresh the list
  };

  const columns: Column<Appointment>[] = [
    {
      title: "Sl No",
      key: "slNo",
      render: (_row, index) => index + 1,
    },
    {
      title: "Client",
      key: "name",
      render: (row) => (
        <>
          <strong>{row.name}</strong>
          <small className="table-sub">{row.phone}</small>
        </>
      ),
    },
    { title: "Age", key: "age" },
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
    { title: "Date", key: "createdAt" },
{
  title: "Scheduled",
  key: "scheduledDate",
  render: (row) => {
    if (!row.scheduledDate) return "—";
    const date = new Date(row.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (!row.scheduledTime) return date;
    
    // Convert 24h to 12h with AM/PM
    const [h, m] = row.scheduledTime.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${date}, ${hour12}:${m} ${ampm}`;
  },
},
    {
      title: "Status",
      key: "status",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className={`status ${row.status.toLowerCase()}`}>
            {row.status}
          </span>
          {role === "admin" && row.status === "Pending" && (
            <>
              <button
                className="cursor-pointer flex items-center justify-center gap-1.5 rounded-md! border-[#4f8d63]! bg-[#b9e3c4]! px-2.5! py-1.5! text-xs! font-semibold text-[#174d2b]!"
                title="Accept"
                aria-label={`Accept appointment for ${row.name}`}
                onClick={() => handleStatusChange(row.id, "Accepted")}
              >
                <FiCheck />
                <span>Accept</span>
              </button>
              <button
                className="cursor-pointer flex items-center justify-center gap-1.5 rounded-md! border-[#d45a61]! bg-[#f3b9bd]! px-2.5! py-1.5! text-xs! font-semibold text-[#7b2027]!"
                title="Reject"
                aria-label={`Reject appointment for ${row.name}`}
                onClick={() => setAppointmentToReject(row)}
              >
                <FiX />
                <span>Reject</span>
              </button>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (row) => (
        <div className="table-actions">
          {/* Reserve the same space so Edit/Delete stay aligned in every row. */}
          <span className="view-slot">
            {role === "admin" && row.status === "Accepted" && (
              <button
                className="view-button"
                title="View details"
                aria-label={`View details for ${row.name}`}
                onClick={() =>
                  router.push(`/client/viewdetails?id=${row.clientId}`)
                }
              >
                View Details
              </button>
            )}
          </span>

          {/* Edit & Delete — both roles */}
          <button
            className="border-[#333936]! bg-[#333936]! flex items-center justify-center text-white! w-[34px] px-0!"
            title="Edit appointment"
            aria-label={`Edit appointment for ${row.name}`}
            onClick={() => setAppointmentToEdit(row)}
          >
            <FiEdit2 />
          </button>
          <button
            className="border-[#c9252d]! bg-[#c9252d]! flex items-center justify-center text-white! w-[34px] px-0!"
            title="Delete appointment"
            aria-label={`Delete appointment for ${row.name}`}
            onClick={() => setAppointmentToDelete(row)}
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];
  const handleCreateAppointment = async (form: AppointmentFormValues) => {
    setSubmitting(true);
    const result = await createAppointment(form);
    setSubmitting(false);

    if (result.error) {
      // handle error (alert or toast)
      alert(result.error);
      return;
    }

    setShowAdd(false);
    fetchAppointments(); // refresh the list
  };
  return (
    <>
      <div className="mb-5 mt-4 flex flex-col gap-4 sm:mb-6 sm:mt-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="m-0 font-(--font-source-serif) text-[1.6rem] tracking-[-.03em] sm:text-[30px]">
            Latest appointments
          </h1>
          <p className="mt-1 mb-0 text-sm text-[#414942] sm:text-base">
            Review and manage your upcoming schedule.
          </p>
        </div>
        <button
          className="cursor-pointer inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md bg-[#2D5A3F] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#16482b] sm:h-fit sm:w-auto"
          onClick={() => setShowAdd(true)}
        >
          <FiPlus /> Add Appointment
        </button>
      </div>
      <FilterHeader
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name or phone"
        selectedStatus={selectedStatus}
        onStatusChange={(val) => {
          setSelectedStatus(val);
          setPage(1);
        }}
        onDateRangeChange={(val) => {
          setDateRange(val);
          setPage(1);
        }}
        statusOptions={[
          { value: "all", label: "All Statuses" },
          { value: "Accepted", label: "Accepted" },
          { value: "Pending", label: "Pending" },
          { value: "Rejected", label: "Rejected" },
        ]}
        dateRange={dateRange}
      />
      <AddAppointmentModal
        open={showAdd || appointmentToEdit !== null}
        initialValues={
          appointmentToEdit
            ? {
                name: appointmentToEdit.name,
                age: appointmentToEdit.age,
                relative: appointmentToEdit.relative,
                address: appointmentToEdit.address,
                countryCode: appointmentToEdit.countryCode,
                phone: appointmentToEdit.phone,
                clientType: appointmentToEdit.clientType,
                 scheduledDate: appointmentToEdit.scheduledDate, 
                 scheduledTime: appointmentToEdit.scheduledTime,
              }
            : undefined
        }
        title={appointmentToEdit ? "Edit appointment" : "New appointment"}
        submitText={appointmentToEdit ? "Save Changes" : "Create Appointment"}
        onCancel={() => {
          setShowAdd(false);
          setAppointmentToEdit(null);
        }}
        onSubmit={async (form) => {
          setSubmitting(true);
          if (appointmentToEdit) {
            const result = await updateAppointmentDetails(
              appointmentToEdit.id,
              appointmentToEdit.clientId,
              form,
            );
            if (result.error) {
              alert(result.error);
            } else {
              fetchAppointments();
            }
          } else {
            await handleCreateAppointment(form);
          }
          setSubmitting(false);
          setShowAdd(false);
          setAppointmentToEdit(null);
        }}
        loading={submitting}
      />
      <DeleteConfirmationModal
        open={appointmentToDelete !== null}
        itemName={appointmentToDelete?.name}
        onCancel={() => setAppointmentToDelete(null)}
        onConfirm={async () => {
          if (appointmentToDelete) {
            await deleteAppointment(appointmentToDelete.id);
            fetchAppointments();
          }
          setAppointmentToDelete(null);
        }}
      />
      <DeleteConfirmationModal
        open={appointmentToReject !== null}
        itemName={appointmentToReject?.name}
        title="Reject appointment?"
        actionText="Reject"
        actionDescription="This appointment will be marked as rejected."
        onCancel={() => setAppointmentToReject(null)}
        onConfirm={async () => {
          if (appointmentToReject) {
            await handleStatusChange(appointmentToReject.id, "Rejected");
          }
          setAppointmentToReject(null);
        }}
      />

      <section className="content-card w-full overflow-hidden">
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          pageSize={pageSize}
          total={total}
          currentPage={page}
          onPageChange={setPage}
        />
      </section>
    </>
  );
}
