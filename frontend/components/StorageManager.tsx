"use client";

import { useEffect, useState } from "react";
import { DatePicker, Modal } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { FiDatabase, FiTrash2, FiAlertTriangle, FiDownload } from "react-icons/fi";
import { getStorageUsage, deleteDataBeforeDate, getAllDataForExport } from "@/lib/actions/appointments";
import * as XLSX from "xlsx";

export default function StorageManager() {
  const [used, setUsed] = useState(0);
  const [limit] = useState(500); // 500 MB free tier
  const [loading, setLoading] = useState(true);
  const [deleteDate, setDeleteDate] = useState<Dayjs | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchUsage = async () => {
    setLoading(true);
    const data = await getStorageUsage();
    if (!data.error) setUsed(data.used);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const percentage = Math.min((used / limit) * 100, 100);
  const barColor =
    percentage > 80 ? "#dc2626" : percentage > 50 ? "#f59e0b" : "#2D5A3F";

  const handleDelete = async () => {
    if (!deleteDate) return;
    setDeleting(true);
    const res = await deleteDataBeforeDate(deleteDate.format("YYYY-MM-DD"));
    setDeleting(false);
    setConfirmOpen(false);

    if (res.error) {
      setResult(`Error: ${res.error}`);
    } else {
      setResult(`Deleted ${res.deleted} appointment(s) and related data.`);
      setDeleteDate(null);
      fetchUsage();
    }
  };

// =============================================
// REPLACE the handleExport function in StorageManager.tsx
// =============================================

const handleExport = async () => {
  setExporting(true);
  try {
    const { data, error } = await getAllDataForExport();
    if (error || !data) {
      alert(error || "Failed to export data");
      setExporting(false);
      return;
    }

    const wb = XLSX.utils.book_new();

    // Helper: get client info columns
    const clientInfo = (client: any) => ({
      "Name": client?.name || "",
      "Phone": client ? `${client.country_code || ""} ${client.phone}`.trim() : "",
      "Type": client?.client_type || "",
    });

    // ─── Key-to-label mappings (must match web form labels + indices) ───

    const studentIntakeLabels: Record<string, string> = {
      name_0: "Name",
      gender_1: "Gender",
      age_dob_2: "Age & DOB",
      name_of_school_place_3: "Name of school & Place",
      class_4: "Class",
      medium_5: "Medium",
      board_of_education_6: "Board of Education",
      father_mother_name_7: "Father & Mother Name",
      contact_number_8: "Contact Number",
      place_district_9: "Place & District",
      medical_problem_if_any__10: "Medical Problem (if any)",
      behavior_issues_11: "Behavior issues",
      psychological_issues_12: "Psychological issues",
      history_of_family_13: "History Of Family",
      special_talents_if_any__14: "Special Talents (if any)",
      areas_of_improvement_15: "Areas of improvement",
      type_of_learner_16: "Type of learner",
      non_academic_performance_17: "Non-academic performance",
      easy_subject_language_18: "Easy subject & language",
      tough_subject_language_19: "Tough Subject & language",
      pregnancy_history_20: "Pregnancy history",
      developmental_stages_21: "Developmental stages",
      attitude_of_father_22: "Attitude of Father",
      attitude_of_mother_23: "Attitude of Mother",
      family_24: "Family",
    };

    const parentsDetailsLabels: Record<string, string> = {
      father_s_name_0: "Father's Name",
      father_s_occupation_1: "Father's Occupation",
      father_s_contact_number_2: "Father's Contact Number",
      father_s_education_3: "Father's Education",
      father_s_address_4: "Father's Address",
      mother_s_name_5: "Mother's Name",
      mother_s_occupation_6: "Mother's Occupation",
      mother_s_contact_number_7: "Mother's Contact Number",
      mother_s_education_8: "Mother's Education",
      mother_s_address_9: "Mother's Address",
      type_of_family_10: "Type of family",
      type_of_house_11: "Type of House",
      child_living_with_12: "Child living with",
      number_of_brothers_13: "Number of brothers",
      number_of_sisters_14: "Number of sisters",
      age_difference_with_immediate_sibling_15: "Age difference with immediate sibling",
      note_16: "Note",
      assessed_by_17: "Assessed by",
      name_signature_18: "Name & Signature",
      date_19: "Date",
    };

const assessmentLabels: Record<string, string> = {
  // Current indices
  logical_thinking_0: "Logical Thinking",
  listening_following_verbal_instructions_1: "Listening & following verbal instructions",
  sequencing_of_numbers_2: "Sequencing of Numbers",
  sequencing_of_incidents_3: "Sequencing of incidents",
  reasoning_4: "Reasoning",
  number_concept_5: "Number concept",
  general_awareness_6: "General awareness",
  attention_8: "Attention",
  visual_memory_9: "Visual memory",
  verbal_memory_10: "Verbal memory",
  reading_level__11: "Reading (Level)",
  age_appropriate_colour_identification_21: "Age appropriate colour identification",

  // Old indices (before "Age appropriate" was added)
  attention_7: "Attention",
  visual_memory_8: "Visual memory",
  verbal_memory_9: "Verbal memory",
  reading_level__10: "Reading (Level)",
  general_reading_11: "General Reading",
  writing_12: "Writing",

  // General Reading section
  general_reading_transposition_22: "General Reading - Transposition",
  general_reading_reversal_23: "General Reading - Reversal",
  general_reading_omissions_24: "General Reading - Omissions",
  general_reading_substitutions_25: "General Reading - Substitutions",
  general_reading_insertions_26: "General Reading - Insertions",
  general_reading_pauses_27: "General Reading - Pauses",
  general_reading_inversion_28: "General Reading - Inversion",
  general_reading_comprehension_29: "General Reading - Comprehension",

  // Writing section
  writing_30: "Writing",
  writing_transposition_31: "Writing - Transposition",
  writing_reversal_32: "Writing - Reversal",
  writing_omissions_33: "Writing - Omissions",
  writing_substitutions_34: "Writing - Substitutions",
  writing_inversion_35: "Writing - Inversion",
  writing_self_correction_36: "Writing - Self-correction",
  writing_insertion_37: "Writing - Insertion",

  // Bottom fields
  mathematics_13: "Mathematics",
  family_history_if_any__14: "Family History (if any)",
  presented_problem_15: "Presented Problem",
  identified_problem_16: "Identified Problem",
  remarks_17: "Remarks",
  assessed_by_18: "Assessed by",
  name_signature_19: "Name & Signature",
  date_20: "Date",
};

    // Helper: convert form_data keys to readable labels
    const mapFormData = (formData: Record<string, string>, labelMap: Record<string, string>) => {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(formData)) {
        const label = labelMap[key] || key;
        result[label] = value;
      }
      return result;
    };

    // Helper: flatten mental status exam data
    const flattenMentalStatus = (formData: Record<string, any>) => {
      const result: Record<string, string> = {};

      if (formData.exam_date) result["Exam Date"] = formData.exam_date;

      const sectionNames: Record<string, string> = {
        observations: "Observations",
        mood: "Mood",
        cognition: "Cognition",
        perception: "Perception",
        thoughts: "Thoughts",
        behavior: "Behavior",
      };

      for (const [sectionKey, sectionLabel] of Object.entries(sectionNames)) {
        const sectionData = formData[sectionKey] as Record<string, string[]> | undefined;
        if (sectionData) {
          for (const [label, values] of Object.entries(sectionData)) {
            result[`${sectionLabel} - ${label}`] = (values || []).join(", ");
          }
        }
        const comments = formData[`${sectionKey}_comments`];
        if (comments) {
          result[`${sectionLabel} - Comments`] = comments;
        }
      }

      if (formData.insight_rating) {
        result["Insight"] = (formData.insight_rating as string[]).join(", ");
      }
      if (formData.insight) result["Insight Comments"] = formData.insight;
      if (formData.judgement_rating) {
        result["Judgement"] = (formData.judgement_rating as string[]).join(", ");
      }
      if (formData.judgement) result["Judgement Comments"] = formData.judgement;

      return result;
    };

    // ─── Sheet 1: Clients ───
    const clientRows = data.clients.map((c: any) => ({
      "Name": c.name,
      "Age": c.age,
      "Phone": `${c.country_code || ""} ${c.phone}`.trim(),
      "Type": c.client_type,
      "Relative": c.relative,
      "Address": c.address,
      "Created At": new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientRows.length ? clientRows : [{}]), "Clients");

    // ─── Sheet 2: Appointments ───
    const appointmentRows = data.appointments.map((a: any) => {
      const client = data.clients.find((c: any) => c.id === a.client_id);
      let timeFormatted = "";
        if (a.scheduled_time) {
    const [h, m] = a.scheduled_time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    timeFormatted = `${hour12}:${m} ${ampm}`;
  }
      return {
        ...clientInfo(client),
        "Status": a.status,
        "Scheduled Date": a.scheduled_date || "",
        "Scheduled Time": timeFormatted,
        "Created At": new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(appointmentRows.length ? appointmentRows : [{}]), "Appointments");

    // ─── Sheet 3: Application Forms ───
    const formRows = data.applicationForms.map((f: any) => {
      const apt = data.appointments.find((a: any) => a.id === f.appointment_id);
      const client = apt ? data.clients.find((c: any) => c.id === apt.client_id) : null;
      return {
        ...clientInfo(client),
        "Current Problem": f.current_problem || "",
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formRows.length ? formRows : [{}]), "Application Forms");

    // ─── Sheet 4: Student Intake ───
    const intakeRows = data.studentIntake.map((s: any) => {
      const client = data.clients.find((c: any) => c.id === s.client_id);
      return {
        ...clientInfo(client),
        ...mapFormData(s.form_data || {}, studentIntakeLabels),
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(intakeRows.length ? intakeRows : [{}]), "Student Intake");

    // ─── Sheet 5: Parents Details ───
    const parentRows = data.parentsDetails.map((p: any) => {
      const client = data.clients.find((c: any) => c.id === p.client_id);
      return {
        ...clientInfo(client),
        ...mapFormData(p.form_data || {}, parentsDetailsLabels),
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parentRows.length ? parentRows : [{}]), "Parents Details");

    // ─── Sheet 6: Assessment Reports ───
    const assessmentExcelRows = data.assessmentReports.map((a: any) => {
      const client = data.clients.find((c: any) => c.id === a.client_id);
      const mapped = mapFormData(a.form_data || {}, assessmentLabels);
      return {
        ...clientInfo(client),
        ...mapped,
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assessmentExcelRows.length ? assessmentExcelRows : [{}]), "Assessment Reports");

    // ─── Sheet 7: Mental Status Exams ───
    const mentalRows = data.mentalStatusExams.map((m: any) => {
      const apt = data.appointments.find((a: any) => a.id === m.appointment_id);
      const client = apt ? data.clients.find((c: any) => c.id === apt.client_id) : null;
      return {
        ...clientInfo(client),
        ...flattenMentalStatus(m.form_data || {}),
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mentalRows.length ? mentalRows : [{}]), "Mental Status Exams");

    // ─── Sheet 8: Remediation Entries ───
    const remRows = data.remediationEntries.map((r: any) => {
      const client = data.clients.find((c: any) => c.id === r.client_id);
      return {
        ...clientInfo(client),
        "Date": r.entry_date || "",
        "Remediation Given": r.remediation_given || "",
        "Improvement Seen": r.improvement_seen || "",
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(remRows.length ? remRows : [{}]), "Remediation Entries");

    // Download
    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `treasure-backup-${today}.xlsx`);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export data. Please try again.");
  } finally {
    setExporting(false);
  }
};
  return (
    <div className="flex flex-col gap-6">
      {/* Storage Meter */}
      <div className="rounded-lg border border-[#c1c9c0] bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#2D5A3F] text-white">
            <FiDatabase className="h-5 w-5" />
          </span>
          <div>
            <h3 className="m-0 text-base font-semibold text-[#1a1c1a]">
              Database Storage
            </h3>
            <p className="m-0 text-sm text-[#414942]">
              Supabase free tier — 500 MB limit
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#414942]">Loading usage...</p>
        ) : (
          <>
            <div className="mb-2 flex items-end justify-between">
              <span className="text-2xl font-bold text-[#1a1c1a]">
                {used} MB
              </span>
              <span className="text-sm text-[#414942]">
                of {limit} MB ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundColor: barColor }}
              />
            </div>
            <p className="mt-2 text-xs text-[#414942]">
  Includes system overhead. Your actual data usage is much smaller.
</p>
            {percentage > 80 && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
                <FiAlertTriangle className="h-4 w-4" />
                Storage running low — consider cleaning old data
              </p>
            )}
          </>
        )}
      </div>

      {/* Data Cleanup */}
      <div className="rounded-lg border border-[#c1c9c0] bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-600">
            <FiTrash2 className="h-5 w-5" />
          </span>
          <div>
            <h3 className="m-0 text-base font-semibold text-[#1a1c1a]">
              Clean Old Data
            </h3>
            <p className="m-0 text-sm text-[#414942]">
              Delete all appointments and related forms before a specific date
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#144229]">
              Delete data before
            </label>
            <DatePicker
              format="DD/MM/YYYY"
              value={deleteDate}
              onChange={setDeleteDate}
              disabledDate={(current) =>
                current && current > dayjs().subtract(30, "day")
              }
              placeholder="Select cutoff date"
              className="h-11! w-64!"
            />
            <span className="text-xs text-[#414942]">
              Only dates older than 30 days can be selected
            </span>
          </div>

          <button
            type="button"
            disabled={!deleteDate || deleting}
            onClick={() => setConfirmOpen(true)}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-md bg-red-600 px-5 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiTrash2 className="h-4 w-4" />
            Delete Old Data
          </button>
        </div>

        {result && (
          <p
            className={`mt-4 rounded-md px-4 py-3 text-sm ${
              result.startsWith("Error")
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-700"
            }`}
          >
            {result}
          </p>
        )}
      </div>
      {/* Data Backup */}
      <div className="rounded-lg border border-[#c1c9c0] bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#2D5A3F] text-white">
            <FiDownload className="h-5 w-5" />
          </span>
          <div>
            <h3 className="m-0 text-base font-semibold text-[#1a1c1a]">
              Data Backup
            </h3>
            <p className="m-0 text-sm text-[#414942]">
              Download all client and appointment data as an Excel file
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={exporting}
          onClick={handleExport}
          className="flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#2D5A3F] px-5 font-bold text-white transition hover:bg-[#16482b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiDownload className="h-4 w-4" />
          {exporting ? "Exporting..." : "Download Excel Backup"}
        </button>
        <p className="mt-3 text-xs text-[#414942]">
          Exports all clients, appointments, forms, assessments, and remediation entries into separate sheets.
        </p>
      </div>
      {/* Confirmation Modal */}
      <Modal
        title={
          <span className="flex items-center gap-2 text-red-600">
            <FiAlertTriangle /> Confirm Deletion
          </span>
        }
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onOk={handleDelete}
        okText={deleting ? "Deleting..." : "Yes, Delete"}
        okButtonProps={{
          danger: true,
          disabled: deleting,
          className: "h-11! font-semibold!",
        }}
        cancelButtonProps={{ className: "h-11!" }}
      >
        <p className="text-sm text-[#414942]">
          This will permanently delete all appointments and their related data
          (forms, assessments, remediation entries) created before{" "}
          <strong>
            {deleteDate?.format("DD MMM YYYY")}
          </strong>
          .
        </p>
        <p className="mt-2 text-sm font-semibold text-red-600">
          This action cannot be undone.
        </p>
        <p className="mt-2 text-sm text-[#414942]">
          Clients who have newer appointments will be kept. Only clients with no
          remaining appointments will be removed.
        </p>
      </Modal>
    </div>
  );
}
