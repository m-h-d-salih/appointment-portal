"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { Collapse, DatePicker } from "antd";
import {
  FiDownload,
  FiEdit2,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import dayjs from "dayjs";
import {
  addRemediationEntry,
  updateRemediationEntry,
  deleteRemediationEntry,
} from "@/lib/actions/appointments";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

/* ─── Field ─── */
export function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] text-[#144229]">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-11 rounded-md border border-[#c1c9c0] bg-white px-3 text-sm text-[#1a1c1a] outline-none transition focus:border-[#2D5A3F] focus:ring-2 focus:ring-[#2D5A3F]/15 disabled:bg-[#f4f4f0] disabled:text-[#414942]"
      />
    </label>
  );
}

/* ─── FormSection (with Save / Cancel when editing) ─── */
export function FormSection({
  title,
  children,
  open,
  onToggle,
  editing,
  onEdit,
  onSave,
  saving,
  onDownload,
}: {
  title: string;
  children: ReactNode;
  open: boolean;
  onToggle: () => void;
  editing: boolean;
  onEdit: () => void;
  onSave?: () => void;
  saving?: boolean;
  onDownload?: () => void;
}) {
  return (
    <Collapse
      className="mt-5! overflow-hidden rounded-lg border border-[#c1c9c0] bg-white [&_.ant-collapse-header]:items-center! [&_.ant-collapse-header]:py-4! [&_.ant-collapse-header-text]:text-[#144229]!"
      activeKey={open ? ["section"] : []}
      onChange={onToggle}
      items={[
        {
          key: "section",
          label: <strong>{title}</strong>,
          extra: (
            <div className="flex items-center gap-1">
              {editing ? (
                <>
                  <button
                    type="button"
                    className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-[#2D5A3F] px-3 text-xs font-bold text-white disabled:opacity-50"
                    disabled={saving}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSave?.();
                    }}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-[#c1c9c0] px-3 text-xs font-bold text-[#414942]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center text-[#144229]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  aria-label={`Edit ${title}`}
                >
                  <FiEdit2 />
                </button>
              )}
              {onDownload && !editing && (
                <button
                  type="button"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center text-[#144229]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  aria-label={`Download ${title}`}
                >
                  <FiDownload />
                </button>
              )}
            </div>
          ),
          children: <div className="p-1">{children}</div>,
        },
      ]}
    />
  );
}

export function TextGrid({
  labels,
  editable,
  values,
  onChange,
  textareaLabels = [],
  dateLabels = [],
  radioOptions = {},
  maxLength,
}: {
  labels: string[];
  editable: boolean;
  values?: Record<string, string>;
  onChange?: (values: Record<string, string>) => void;
  textareaLabels?: string[];
  dateLabels?: string[];
  radioOptions?: Record<string, string[]>;
  maxLength?: number;
}) {
  const handleChange = (key: string, value: string) => {
    onChange?.({ ...values, [key]: value });
  };

  return (
    <div className="text-grid">
      {labels.map((label, index) => {
        const key = labelToKey(label, index);
        return (
          <label key={`${label}-${index}`}>
            <span>{label}</span>
            {dateLabels.includes(label) ? (
              <DatePicker
                disabled={!editable}
                className="assessment-date-picker mx-1! h-10! w-[calc(100%-0.5rem)]! rounded-md! border-[#c1c9c0]! bg-white! px-3! [&.ant-picker-disabled]:bg-[#f4f4f0]!"
                format="DD/MM/YYYY"
                value={values?.[key] ? dayjs(values[key]) : undefined}
                onChange={(date) =>
                  handleChange(key, date ? date.format("YYYY-MM-DD") : "")
                }
              />
            ) : radioOptions[label] ? (
              <div
                className={`flex min-h-10 items-center gap-5 px-3 py-2 ${
                  editable ? "bg-white" : "bg-[#f4f4f0]"
                }`}
              >
                {radioOptions[label].map((option) => (
                  <label
                    key={option}
                    className={`radio-option flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#144229] transition ${
                      values?.[key] === option
                        ? "bg-[#e8f7ee] font-semibold"
                        : "hover:bg-[#e8f7ee]"
                    } ${!editable ? "cursor-default" : ""}`}
                  >
                    <input
                      type="radio"
                      name={key}
                      value={option}
                      checked={values?.[key] === option}
                      disabled={!editable}
                      onChange={() => handleChange(key, option)}
                      className="h-4 w-4 accent-[#2D5A3F]"
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : textareaLabels.includes(label) ? (
              <textarea
                disabled={!editable}
                value={values?.[key] || ""}
                maxLength={maxLength}
                onChange={(e) => handleChange(key, e.target.value)}
                className="min-h-16! resize-y! border-0! bg-white! p-3! disabled:bg-[#f4f4f0]!"
              />
            ) : (
              <input
                disabled={!editable}
                value={values?.[key] || ""}
                maxLength={maxLength}
                onChange={(e) => handleChange(key, e.target.value)}
                className="bg-white! disabled:bg-[#f4f4f0]!"
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

export function AssessmentReportForm({
  editable,
  values = {},
  onChange,
}: {
  editable: boolean;
  values?: Record<string, string>;
  onChange?: (values: Record<string, string>) => void;
}) {
  const assessmentRows = [
    "Logical Thinking",
    "Listening & following verbal instructions",
    "Sequencing of Numbers",
    "Sequencing of incidents",
    "Reasoning",
    "Number concept",
    "General awareness",
    "Age appropriate colour identification",
    "Attention",
    "Visual memory",
    "Verbal memory",
    "Reading (Level)",
  ];
  const readingRows = [
    "Transposition",
    "Reversal",
    "Omissions",
    "Substitutions",
    "Insertions",
    "Pauses",
    "Inversion",
    "Comprehension",
  ];
  const writingRows = [
    "Transposition",
    "Reversal",
    "Omissions",
    "Substitutions",
    "Inversion",
    "Self-correction",
    "Insertion",
  ];
  const key = (label: string, index: number) => labelToKey(label, index);
  const update = (label: string, index: number, value: string) =>
    onChange?.({ ...values, [key(label, index)]: value });
  const input = (
    label: string,
    index: number,
    textarea = false,
    date = false,
    maxLength?: number,
  ) => {
    const fieldKey = key(label, index);
    if (date) {
      return (
        <DatePicker
          disabled={!editable}
          format="DD/MM/YYYY"
           className="h-10! w-[260px]! max-w-full! rounded-md! border-[#c1c9c0]! bg-white! px-3! [&.ant-picker-disabled]:bg-[#f4f4f0]!"
          value={values[fieldKey] ? dayjs(values[fieldKey]) : undefined}
          onChange={(value) =>
            update(label, index, value ? value.format("YYYY-MM-DD") : "")
          }
        />
      );
    }
    return textarea ? (
      <textarea
        disabled={!editable}
        value={values[fieldKey] || ""}
        maxLength={maxLength}
        onChange={(event) => update(label, index, event.target.value)}
         className="min-h-24 w-full resize-y border-0 bg-white p-3 text-sm outline-none disabled:bg-[#f4f4f0]"
      />
    ) : (
      <input
        disabled={!editable}
        value={values[fieldKey] || ""}
        onChange={(event) => update(label, index, event.target.value)}
         className="h-10 w-full border-0 bg-white px-3 text-sm outline-none disabled:bg-[#f4f4f0]"
      />
    );
  };
  return (
    <div className="space-y-5 rounded-md border border-[#c1c9c0] bg-[#faf9f6] p-3 sm:p-4">
      <div className="overflow-hidden rounded-md border border-[#c1c9c0] bg-white">
        <div className="hidden grid-cols-[42px_minmax(0,1fr)_minmax(0,1fr)] bg-[#f4f4f0] text-xs font-bold text-[#144229] xl:grid">
          <div className="border-r border-[#c1c9c0] p-3">Sl</div>
          <div className="border-r border-[#c1c9c0] p-3">
            Type of Assessment
          </div>
          <div className="p-3">Score</div>
        </div>
        {assessmentRows.map((label, rowIndex) => {
          const index = label.startsWith("Age appropriate") ? 21 : rowIndex;
          return (
            <div
              key={label}
              className="grid grid-cols-1 border-t border-[#c1c9c0] text-sm text-[#144229] first:border-t-0 xl:grid-cols-[42px_minmax(0,1fr)_minmax(0,1fr)] xl:first:border-t"
            >
              <div className="hidden border-r border-[#c1c9c0] p-3 xl:block">
                {rowIndex + 1}
              </div>
              <div className="border-b border-[#c1c9c0] bg-white p-3 font-medium xl:border-r xl:border-b-0 xl:font-normal">
                {label}
              </div>
              <div className={editable ? "bg-white" : "bg-[#f4f4f0]"}>
                {input(label, index)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="overflow-hidden rounded-md border border-[#c1c9c0] bg-white">
        <div className="grid grid-cols-1 bg-[#f4f4f0] text-xs font-bold text-[#144229] xl:grid-cols-2">
          <div className="p-3 xl:border-r xl:border-[#c1c9c0]">
            General Reading
          </div>
          <div className="hidden p-3 xl:block">Score</div>
        </div>
        {readingRows.map((label, rowIndex) => {
          const fullLabel = `General Reading - ${label}`;
          return (
            <div
              key={label}
              className="grid grid-cols-1 border-t border-[#c1c9c0] text-sm text-[#144229] xl:grid-cols-2"
            >
              <div className="border-b border-[#c1c9c0] bg-white p-3 font-medium xl:border-r xl:border-b-0 xl:font-normal">
                {label}
              </div>
              <div className={editable ? "bg-white" : "bg-[#f4f4f0]"}>
                {input(fullLabel, rowIndex + 22)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 overflow-hidden rounded-md border border-[#c1c9c0] bg-white text-sm text-[#144229]">
        <div className="flex border-r border-[#c1c9c0]">
          <div className="w-10 shrink-0 border-r border-[#c1c9c0] p-3">13</div>
          <div className="p-3 font-medium">Writing</div>
        </div>
        <div className={editable ? "bg-white" : "bg-[#f4f4f0]"}>
          {input("Writing", 30)}
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-[#c1c9c0] bg-white">
        <div className="grid grid-cols-1 bg-[#f4f4f0] text-xs font-bold text-[#144229] xl:grid-cols-2">
          <div className="p-3 xl:border-r xl:border-[#c1c9c0]">
            Writing (Check notebook writing for the last 6 months. Select 6
            pages randomly)
          </div>
          <div className="hidden p-3 xl:block">Score</div>
        </div>
        {writingRows.map((label, rowIndex) => {
          const fullLabel = `Writing - ${label}`;
          return (
            <div
              key={`writing-${label}`}
              className="grid grid-cols-1 border-t border-[#c1c9c0] text-sm text-[#144229] xl:grid-cols-2"
            >
              <div className="border-b border-[#c1c9c0] bg-white p-3 font-medium xl:border-r xl:border-b-0 xl:font-normal">
                {label}
              </div>
              <div className={editable ? "bg-white" : "bg-[#f4f4f0]"}>
                {input(fullLabel, rowIndex + 31)}
              </div>
            </div>
          );
        })}
      </div>
       <div className="grid items-start overflow-hidden rounded-md border border-[#c1c9c0] bg-[#f4f4f0] xl:grid-cols-2">
        {[
           ["Mathematics", 13, true],
          ["Family History (if any)", 14, true],
          ["Presented Problem", 15, true],
          ["Identified Problem", 16, true],
          ["Remarks", 17, true],
          ["Assessed by", 18, false],
          ["Name & Signature", 19, false],
          ["Date", 20, false],
        ].map(([label, index, textarea]) => (
           <label
             key={String(label)}
             className={`border-b border-[#c1c9c0] text-sm text-[#144229] odd:xl:border-r ${
               editable ? "bg-white" : "bg-[#f4f4f0]"
             } ${
               label === "Name & Signature" ? "[&>input]:h-16!" : ""
             }`}
           >
            <span className="block border-b border-[#c1c9c0] bg-white p-3 font-medium">
              {label}
            </span>
            {label === "Date" ? (
               <div className="bg-[#f4f4f0] p-3 disabled:bg-[#f4f4f0]">
                {input(String(label), Number(index), false, true)}
              </div>
            ) : (
              input(
                String(label),
                Number(index),
                Boolean(textarea),
                false,
                textarea ? 400 : undefined,
              )
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

// Convert label to a consistent key for storing values
function labelToKey(label: string, index: number): string {
  return `${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${index}`;
}

// Helper to convert label array to key array (for mapping DB fields)
export function labelsToKeys(labels: string[]): string[] {
  return labels.map((label, index) => labelToKey(label, index));
}

/* ─── RepeatSection (Supabase-wired, shared by Student & Client) ─── */
export type RemediationRow = {
  id?: string;
  entry_date: string;
  remediation_given: string;
  improvement_seen: string;
  sort_order: number;
  isNew?: boolean;
};

export function RepeatSection({
  id,
  title,
  labels,
  clientId,
  initialEntries,
  onEntriesChange,
}: {
  id: string;
  title: string;
  labels: string[];
  clientId: string;
  initialEntries?: RemediationRow[];
  onEntriesChange?: () => void;
}) {
  const [rows, setRows] = React.useState<RemediationRow[]>(
    initialEntries && initialEntries.length > 0
      ? initialEntries
      : [
          {
            entry_date: "",
            remediation_given: "",
            improvement_seen: "",
            sort_order: 0,
            isNew: true,
          },
        ],
  );
  const [open, setOpen] = React.useState(true);
  const [rowToDelete, setRowToDelete] = React.useState<number | null>(null);

  const [saving, setSaving] = React.useState(false);

  // Update rows when initialEntries change
  React.useEffect(() => {
    if (initialEntries && initialEntries.length > 0) {
      setRows(initialEntries);
    }
  }, [initialEntries]);

  const updateRow = (index: number, field: string, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        entry_date: "",
        remediation_given: "",
        improvement_seen: "",
        sort_order: prev.length,
        isNew: true,
      },
    ]);
  };

  const handleDeleteRow = async (index: number) => {
    const row = rows[index];
    if (row.id) {
      await deleteRemediationEntry(row.id);
      onEntriesChange?.();
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRow = async (index: number) => {
    const row = rows[index];
    setSaving(true);

    if (row.id) {
      await updateRemediationEntry(row.id, {
        entry_date: row.entry_date || undefined,
        remediation_given: row.remediation_given,
        improvement_seen: row.improvement_seen,
      });
    } else {
      const result = await addRemediationEntry(clientId, {
        entry_date: row.entry_date || undefined,
        remediation_given: row.remediation_given,
        improvement_seen: row.improvement_seen,
        sort_order: row.sort_order,
      });
      if (result.id) {
        setRows((prev) =>
          prev.map((r, i) =>
            i === index ? { ...r, id: result.id, isNew: false } : r,
          ),
        );
      }
    }

    setSaving(false);
    onEntriesChange?.();
  };

  const responsiveColumns =
    title === "Plans" || title === "Remediation & Improvement";

  return (
    <div id={id}>
      <Collapse
        className="mt-5! overflow-hidden rounded-lg border border-[#c1c9c0] bg-white [&_.ant-collapse-header]:items-center! [&_.ant-collapse-header]:py-4! [&_.ant-collapse-header-text]:text-[#144229]!"
        activeKey={open ? ["section"] : []}
        onChange={() => setOpen((v) => !v)}
        items={[
          {
            key: "section",
            label: <strong>{title}</strong>,
            children: (
              <div className="p-1">
                <div className="overflow-x-auto border border-[#c1c9c0]">
                  {rows.map((row, index) => (
                    <div key={row.id || `new-${index}`}>
                      <div className="flex items-center justify-between border-b border-[#c1c9c0] bg-[#bceecb] px-3 py-2 text-sm font-bold text-[#144229]">
                        <span>Session {index + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="cursor-pointer rounded bg-[#2D5A3F] px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50"
                            disabled={saving}
                            onClick={() => handleSaveRow(index)}
                          >
                            {saving ? "..." : row.id ? "Update" : "Save"}
                          </button>
                          <button
                            type="button"
                            className="cursor-pointer rounded p-1.5 text-[#9b3022]! hover:bg-white"
                            onClick={() => setRowToDelete(index)}
                            aria-label={`Delete session ${index + 1}`}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div
                        className={`grid border-b border-[#c1c9c0] last:border-b-0 ${responsiveColumns ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-3"}`}
                      >
                        <label className="flex min-w-0 flex-col gap-2 border-r border-[#c1c9c0]">
                          <span className="bg-[#f4f4f0] px-2 py-2 font-bold text-[#144229]">
                            Date
                          </span>
                          <DatePicker
                            className="repeat-date-picker mx-1! h-10! w-[calc(100%-0.5rem)]! max-w-full! px-3!"
                            format="DD/MM/YYYY"
                            value={
                              row.entry_date ? dayjs(row.entry_date) : undefined
                            }
                            onChange={(date) =>
                              updateRow(
                                index,
                                "entry_date",
                                date ? date.format("YYYY-MM-DD") : "",
                              )
                            }
                          />
                        </label>
                        <label className="flex min-w-0 flex-col gap-2 border-r border-[#c1c9c0]">
                          <span className="bg-[#f4f4f0] px-2 py-2 font-bold text-[#144229]">
                            {labels[1] || "Remediation given"}
                          </span>
                          <textarea
                            className="min-h-18.5! w-full! resize-y! border-0! p-3!"
                            value={row.remediation_given}
                            maxLength={600}
                            onChange={(e) =>
                              updateRow(
                                index,
                                "remediation_given",
                                e.target.value,
                              )
                            }
                          />
                          {row.remediation_given.length >= 600 && (
                            <span className="bg-white px-3 pb-2 text-xs font-medium text-[#c9252d]">
                              Maximum 600 characters reached.
                            </span>
                          )}
                        </label>
                        <label className="flex min-w-0 flex-col gap-2">
                          <span className="bg-[#f4f4f0] px-2 py-2 font-bold text-[#144229]">
                            {labels[2] || "Improvement seen"}
                          </span>
                          <textarea
                            className="min-h-18.5! w-full! resize-y! border-0! p-3!"
                            value={row.improvement_seen}
                            maxLength={600}
                            onChange={(e) =>
                              updateRow(
                                index,
                                "improvement_seen",
                                e.target.value,
                              )
                            }
                          />
                          {row.improvement_seen.length >= 600 && (
                            <span className="bg-white px-3 pb-2 text-xs font-medium text-[#c9252d]">
                              Maximum 600 characters reached.
                            </span>
                          )}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border-0 bg-[#24593f] px-4 py-2.5 font-bold text-white"
                  onClick={handleAddRow}
                >
                  <FiPlus /> Add Session
                </button>
              </div>
            ),
          },
        ]}
      />
      <DeleteConfirmationModal
        open={rowToDelete !== null}
        itemName={
          rowToDelete !== null ? `Session ${rowToDelete + 1}` : undefined
        }
        title="Delete session?"
        actionDescription="This session and its saved details will be permanently deleted."
        onCancel={() => setRowToDelete(null)}
        onConfirm={async () => {
          if (rowToDelete !== null) {
            await handleDeleteRow(rowToDelete);
          }
          setRowToDelete(null);
        }}
      />
    </div>
  );
}
