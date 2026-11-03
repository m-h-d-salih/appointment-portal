"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  ConfigProvider,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiDollarSign,
  FiHash,
  FiPlus,
   FiTrash2,
} from "react-icons/fi";
import { paymentMethods } from "@/lib/accounts/constants";
import { toTitleCase } from "../helper/titlecase";

export type StudentAttendanceRecord = {
  id: string;
  attendanceNo: number;
  date: string;
  paidAmount: number;
  paymentMethod?: string;
  notes?: string;
};

const themeConfig = {
  token: {
    colorPrimary: "#2D5A3F",
    colorLink: "#144229",
    borderRadius: 6,
    controlHeight: 42,
    fontFamily: "var(--font-manrope), system-ui, sans-serif",
  },
  components: {
    Input: {
      colorBgContainer: "#ffffff",
      colorBorder: "#c1c9c0",
      hoverBorderColor: "#2D5A3F",
      activeBorderColor: "#144229",
      activeShadow: "0 0 0 2px rgba(45, 90, 63, 0.15)",
    },
    InputNumber: {
      colorBgContainer: "#ffffff",
      colorBorder: "#c1c9c0",
      hoverBorderColor: "#2D5A3F",
      activeBorderColor: "#144229",
      activeShadow: "0 0 0 2px rgba(45, 90, 63, 0.15)",
    },
    DatePicker: {
      colorBgContainer: "#ffffff",
      colorBorder: "#c1c9c0",
      hoverBorderColor: "#2D5A3F",
      activeBorderColor: "#144229",
    },
    Select: {
      colorBgContainer: "#ffffff",
      colorBorder: "#c1c9c0",
      hoverBorderColor: "#2D5A3F",
      activeBorderColor: "#144229",
      optionSelectedBg: "#bceecb",
      optionSelectedColor: "#144229",
      optionActiveBg: "#e8f7ee",
    },
  },
};

const selectPopupClassName =
  "[&_.ant-select-item-option-active]:bg-[#e8f7ee]! [&_.ant-select-item-option-selected]:bg-[#bceecb]! [&_.ant-select-item-option-selected]:text-[#144229]! [&_.ant-select-item-option-selected]:font-semibold!";

const fieldClass =
  "[&_.ant-form-item]:mb-3! [&_.ant-form-item-label]:pb-1! [&_.ant-form-item-label>label]:text-[13px]! [&_.ant-form-item-label>label]:font-medium! [&_.ant-form-item-label>label]:text-[#144229]!";

const rupee = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

type AttendanceFields = {
  attendanceNo: number;
  date: Dayjs;
  paidAmount?: number;
  paymentMethod?: string;
  notes?: string;
};

export default function StudentAttendanceModal({
  open,
  student,
  records,
  onClose,
  onSaveRecord,
  onDeleteRecord,
  paymentConfigured = true
}: {
  open: boolean;
  student: { id: string; name: string; phone?: string } | null;
  records: StudentAttendanceRecord[];
  onClose: () => void;
  onSaveRecord: (nextRecord: StudentAttendanceRecord) => void;
  onDeleteRecord?: (id: string) => void;
   paymentConfigured?: boolean;
}) {
  const [form] = Form.useForm<AttendanceFields>();
  const paidAmountValue = Form.useWatch("paidAmount", form);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(true);

  const nextAttendanceNo = records.length + 1;
  const totalPaid = records.reduce(
    (sum, item) => sum + (item.paidAmount || 0),
    0,
  );

  useEffect(() => {
    if (!open) return;
    setError("");
    setShowForm(true);
    form.setFieldsValue({
      attendanceNo: records.length + 1,
      date: dayjs(),
      paidAmount: undefined,
      paymentMethod: "Cash",
      notes: "",
    });
  }, [open, student, records.length, form]);

  const handleMarkAttendance = (values: AttendanceFields) => {
    setError("");
    const paid = Number(values.paidAmount || 0);

    onSaveRecord({
      id: `att-${Date.now()}`,
      attendanceNo: Number(values.attendanceNo || nextAttendanceNo),
      date: values.date.format("YYYY-MM-DD"),
      paidAmount: paid > 0 ? paid : 0,
      paymentMethod: paid > 0 ? values.paymentMethod || "Cash" : undefined,
      notes: values.notes?.trim() || "",
    });

    form.setFieldsValue({
      attendanceNo: records.length + 2,
      date: dayjs(),
      paidAmount: undefined,
      paymentMethod: "Cash",
      notes: "",
    });
    setShowForm(false);
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <Modal
        open={open}
        className="accounts-form px-3 sm:px-0"
        width="100%"
        style={{ maxWidth: 760, top: 14, paddingBottom: 0 }}
        styles={{
          body: {
            maxHeight: "76vh",
            overflowY: "auto",
            padding: "10px 16px 8px",
          },
        }}
        title={
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <span className="text-lg font-semibold tracking-wide text-[#144229]">
                Student Attendance
              </span>
              {student && (
                <p className="m-0 text-xs font-medium text-[#667362]">
                  {toTitleCase(student.name)}
                  {student.phone ? ` · ${student.phone}` : ""}
                </p>
              )}
            </div>
          </div>
        }
        onCancel={onClose}
        onOk={() => {
          if (showForm) form.submit();
          else onClose();
        }}
        okText={showForm ? "Mark Attendance" : "Done"}
        cancelText="Close"
        cancelButtonProps={{
          className:
            "h-11! border-[#c1c9c0]! text-[#414942]! hover:border-[#2D5A3F]! hover:text-[#2D5A3F]!",
        }}
        okButtonProps={{
          className:
            "h-11! bg-[#2D5A3F]! font-semibold! text-white! hover:bg-[#16482b]! hover:text-white!",
        }}
      >
        <div className="space-y-4">
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#34694a] via-[#2D5A3F] to-[#193d2a] p-3.5 text-white shadow-[0_6px_18px_rgba(45,90,63,0.18)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="m-0 text-xs font-semibold text-[#e3efdf]">
                    Total Attendance
                  </p>
                  <p className="m-0 mt-1 text-2xl font-bold tabular-nums">
                    {records.length}
                  </p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-[#f0dfb4]">
                  <FiCheckCircle className="h-4 w-4" />
                </span>
              </div>
              <span className="mt-2 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f0dfb4]">
                Next #{nextAttendanceNo}
              </span>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-[#dce4d8] bg-linear-to-br from-white to-[#f4f7f1] p-3.5 shadow-[0_3px_12px_rgba(20,66,41,0.05)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="m-0 text-xs font-semibold text-[#536350]">
                    Last Attendance
                  </p>
                  <p className="m-0 mt-1 text-base font-bold text-[#144229]">
                    {records[0]
                      ? dayjs(records[0].date).format("DD MMM YYYY")
                      : "Not marked yet"}
                  </p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5eddf] text-[#2D5A3F]">
                  <FiCalendar className="h-4 w-4" />
                </span>
              </div>
              <span className="mt-2 inline-block rounded-full bg-[#e5eddf] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#144229]">
                {records[0]
                  ? `Session #${records[0].attendanceNo}`
                  : "New Student"}
              </span>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-[#dce4d8] bg-linear-to-br from-white to-[#fcfaf4] p-3.5 shadow-[0_3px_12px_rgba(20,66,41,0.05)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="m-0 text-xs font-semibold text-[#536350]">
                    Paid in Sessions
                  </p>
                  <p className="m-0 mt-1 text-xl font-bold tabular-nums text-[#7a5a22]">
                    {rupee(totalPaid)}
                  </p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5ebd3] text-[#7a5a22]">
                  <FiDollarSign className="h-4 w-4" />
                </span>
              </div>
              <span className="mt-2 inline-block rounded-full bg-[#f5ebd3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7a5a22]">
                {records.filter((r) => r.paidAmount > 0).length} Paid Session
                {records.filter((r) => r.paidAmount > 0).length === 1
                  ? ""
                  : "s"}
              </span>
            </article>
          </div>

          {error && <Alert type="error" showIcon title={error} />}

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#dce4d8] bg-[#faf9f6] px-3.5 py-2.5">
            <span className="text-xs font-semibold text-[#144229]">
              {showForm
                ? `Register Session #${nextAttendanceNo}`
                : "Attendance & Payment Log"}
            </span>
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="cursor-pointer inline-flex h-8 items-center gap-1.5 rounded-md bg-[#2D5A3F] px-3 text-xs font-semibold text-white hover:bg-[#16482b]"
            >
              <FiPlus className="h-3.5 w-3.5" />
              {showForm ? "View Attendance History" : "New Attendance"}
            </button>
          </div>

          {showForm && (
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={handleMarkAttendance}
              className={`bg-white ${fieldClass}`}
            >
              <div className="grid min-w-0 grid-cols-1 gap-x-3 sm:grid-cols-2">
                <Form.Item
                  name="attendanceNo"
                  label="Attendance No"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <InputNumber
                    min={1}
                    max={999}
                    prefix={<FiHash className="text-[#667362]" />}
                    className="w-full! rounded-md!"
                  />
                </Form.Item>

                <Form.Item
                  name="date"
                  label="Attendance Date"
                  rules={[{ required: true, message: "Select date" }]}
                >
                  <DatePicker
                    format="DD MMM YYYY"
                    className="w-full! rounded-md!"
                  />
                </Form.Item>

              <Form.Item
  name="paidAmount"
  label="Amount Paid Today (₹) (optional)"
>
  <div className="group relative">
    <InputNumber
      min={0}
      max={100000000}
      precision={2}
      disabled={!paymentConfigured}
      placeholder={paymentConfigured ? "0.00 (leave blank if no payment)" : "Admin needs to set the amount"}
      className={`w-full! rounded-md! ${!paymentConfigured ? "cursor-not-allowed!" : ""}`}
    />
    {!paymentConfigured && (
      <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
        Admin needs to set the total fee first
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    )}
  </div>
</Form.Item>

                <Form.Item name="paymentMethod" label="Payment Method">
                  <Select
                    disabled={!paidAmountValue || Number(paidAmountValue) <= 0}
                    className="w-full [&_.ant-select-selector]:rounded-md!"
                    classNames={{ popup: { root: selectPopupClassName } }}
                    options={paymentMethods.map((value) => ({
                      value,
                      label: value,
                    }))}
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="notes"
                label="Session / Remarks (optional)"
                className="mb-0!"
              >
                <Input
                  maxLength={200}
                  placeholder="Optional topic covered or session note"
                  className="rounded-md!"
                />
              </Form.Item>
            </Form>
          )}

          <div className="overflow-hidden rounded-xl border border-[#c1c9c0] bg-white">
            <div className="flex items-center justify-between border-b border-[#e2e8dd] bg-[#faf9f6] px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#144229]">
                Attendance &amp; Payment History
              </span>
              <span className="text-xs font-medium text-[#667362]">
                {records.length} session{records.length === 1 ? "" : "s"}
              </span>
            </div>

            {records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-130 border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#c1c9c0] bg-[#fafafa] text-[#1a1c1a]">
                      <th className="px-3.5 py-2.5 font-semibold">Att. No</th>
                      <th className="px-3.5 py-2.5 font-semibold">Date</th>
                      <th className="px-3.5 py-2.5 font-semibold">
                        Paid Amount
                      </th>
                      <th className="px-3.5 py-2.5 font-semibold">Sign</th>
                      <th className="px-3.5 py-2.5 font-semibold">Remarks</th>
                      <th className="px-3.5 py-2.5 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec) => (
                      <tr
                        key={rec.id}
                        className="border-b border-[#eef1ec] last:border-b-0 hover:bg-[#fafdfb]"
                      >
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-bold text-[#144229]">
                          #{rec.attendanceNo}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-[#1a1c1a]">
                          {dayjs(rec.date).format("DD MMM YYYY")}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5">
                          {rec.paidAmount > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold tabular-nums text-[#144229]">
                                {rupee(rec.paidAmount)}
                              </span>
                              {rec.paymentMethod && (
                                <span className="status accepted">
                                  {rec.paymentMethod}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#667362]">No payment</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#bceecb] text-[#144229]"
                            title="Attendance signed"
                          >
                            <FiCheck className="h-4 w-4" strokeWidth={3} />
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-[#667362]">
                          {rec.notes || "—"}
                        </td>
                        <td className="px-3.5 py-2.5">
  {onDeleteRecord && (
    <button
      type="button"
      className="cursor-pointer rounded-md border border-red-200 bg-white p-1.5 text-red-500 hover:bg-red-50"
      title="Delete attendance"
      onClick={() => {
        if (confirm(`Delete attendance #${rec.attendanceNo}?`)) {
          onDeleteRecord(rec.id);
        }
      }}
    >
      <FiTrash2 className="h-3.5 w-3.5" />
    </button>
  )}
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No attendance marked yet"
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
}
