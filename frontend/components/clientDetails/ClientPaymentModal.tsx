"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  Skeleton
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiLayers,
  FiPlus,
  FiDollarSign,
  FiPrinter,
} from "react-icons/fi";
import { categories, paymentMethods } from "@/lib/accounts/constants";
import PaymentStatement, {
  printPaymentStatement,
} from "@/components/clientDetails/PaymentStatement";
import { toTitleCase } from "../helper/titlecase";

export type ClientPaymentEntry = {
  id: string;
  date: string;
  amount: number;
  category: string;
  payment_method: string;
  reference: string;
  notes: string;
};

export type ClientPaymentConfig = {
  totalAmount: number;
  notes?: string;
  payments: ClientPaymentEntry[];
};

const themeConfig = {
  token: {
    colorPrimary: "#2D5A3F",
    colorLink: "#144229",
    borderRadius: 6,
    controlHeight: 44,
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
    Button: {
      primaryColor: "#ffffff",
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

type SetupFormFields = {
  totalAmount: number;
  paidAmount?: number;
  date: Dayjs;
  category: string;
  payment_method: string;
  reference?: string;
  notes?: string;
};

type AddPaymentFormFields = {
  amount: number;
  date: Dayjs;
  category: string;
  payment_method: string;
  reference?: string;
  notes?: string;
};

export default function ClientPaymentModal({
  open,
  client,
  config,
  historyOnly = false,
  loading = false,
  onClose,
  onSaveConfig,
}: {
  open: boolean;
  client: {
    id: string;
    name: string;
    phone?: string;
   
    clientType?: string;
  } | null;
  config?: ClientPaymentConfig;
  loading?: boolean; 
  historyOnly?: boolean;
  onClose: () => void;
  onSaveConfig: (next: ClientPaymentConfig) => void;
}) {
  const [setupForm] = Form.useForm<SetupFormFields>();
  const [paymentForm] = Form.useForm<AddPaymentFormFields>();
  const [editingTotal, setEditingTotal] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");
  const statementRef = useRef<HTMLDivElement>(null);

  const isConfigured = Boolean(config && config.totalAmount > 0);
  const showSetupForm = !historyOnly && (!isConfigured || editingTotal);

  useEffect(() => {
    if (!open) return;
    setError("");
    setEditingTotal(false);
    setAddingPayment(false);
  }, [open, client?.id]);

  useEffect(() => {
    if (!open || !showSetupForm) return;

    if (config && config.totalAmount > 0) {
      setupForm.setFieldsValue({
        totalAmount: config.totalAmount,
        date: dayjs(),
        category: categories.income[0],
        payment_method: "Cash",
        reference: "",
        notes: config.notes || "",
      });
      return;
    }

    setupForm.setFieldsValue({
      totalAmount: undefined,
      paidAmount: undefined,
      date: dayjs(),
      category: categories.income[0],
      payment_method: "Cash",
      reference: "",
      notes: "",
    });
  }, [open, showSetupForm, config, setupForm]);

  useEffect(() => {
    if (!open || !addingPayment) return;
    paymentForm.setFieldsValue({
      amount: undefined,
      date: dayjs(),
      category: categories.income[0],
      payment_method: "Cash",
      reference: "",
      notes: "",
    });
  }, [open, addingPayment, paymentForm]);

  const paidTotal = (config?.payments || []).reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const totalFee = config?.totalAmount || 0;
  const balanceAmount = Math.max(totalFee - paidTotal, 0);

  const handleSaveSetup = (values: SetupFormFields) => {
    setError("");
    if (!values.totalAmount || values.totalAmount <= 0) {
      setError("Please enter a valid total fee amount.");
      return;
    }

    const existingPayments = config?.payments || [];
    const initialPaid = Number(values.paidAmount || 0);

    if (!isConfigured && initialPaid > values.totalAmount) {
      setError("Initial paid amount cannot be greater than total fee amount.");
      return;
    }

    const nextPayments =
      !isConfigured && initialPaid > 0
        ? [
            {
              id: `pay-${Date.now()}`,
              date: values.date.format("YYYY-MM-DD"),
              amount: initialPaid,
              category: values.category || categories.income[0],
              payment_method: values.payment_method || "Cash",
              reference: values.reference?.trim() || "Initial payment",
              notes: values.notes?.trim() || "",
            },
            ...existingPayments,
          ]
        : existingPayments;

    onSaveConfig({
      totalAmount: Number(values.totalAmount),
      notes: values.notes?.trim() || "",
      payments: nextPayments,
    });
    setEditingTotal(false);
  };

  const handleAddPayment = (values: AddPaymentFormFields) => {
    if (!config) return;
    setError("");

    if (!values.amount || values.amount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    const nextEntry: ClientPaymentEntry = {
      id: `pay-${Date.now()}`,
      date: values.date.format("YYYY-MM-DD"),
      amount: Number(values.amount),
      category: values.category,
      payment_method: values.payment_method,
      reference: values.reference?.trim() || "—",
      notes: values.notes?.trim() || "",
    };

    onSaveConfig({
      ...config,
      payments: [nextEntry, ...config.payments],
    });
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      date: dayjs(),
      category: categories.income[0],
      payment_method: "Cash",
    });
    setAddingPayment(false);
  };

  const handlePrintStatement = async () => {
    const paper =
      statementRef.current?.querySelector<HTMLElement>(".payment-statement");
    if (!paper || !client || !config) return;
    setPrinting(true);
    setError("");
    try {
      await printPaymentStatement(paper, `Payment Statement - ${client.name}`);
    } catch {
      setError("Could not open the payment PDF. Please try again.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <Modal
        open={open}
        className="accounts-form px-3 sm:px-0"
        width="100%"
        style={{ maxWidth: 740, top: 16, paddingBottom: 0 }}
        styles={{
          body: {
            maxHeight: "74vh",
            overflowY: "auto",
            padding: "10px 16px 6px",
          },
        }}
        title={
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <span className="text-lg font-semibold tracking-wide text-[#144229]">
                {showSetupForm
                  ? `${isConfigured ? "Update" : "Set"} Payment`
                  : "Payment History"}
              </span>
              {client && (
                <p className="m-0 text-xs font-medium text-[#667362]">
                  {toTitleCase(client.name)}
                  {client.phone ? ` · ${client.phone}` : ""}
                </p>
              )}
            </div>
          </div>
        }
        onCancel={onClose}
        onOk={() => {
          if (showSetupForm) {
            setupForm.submit();
          } else if (addingPayment) {
            paymentForm.submit();
          } else {
            onClose();
          }
        }}
        okText={
          showSetupForm
            ? "Save payment setup"
            : addingPayment
              ? "Save payment"
              : "Done"
        }
        cancelText={showSetupForm || addingPayment ? "Cancel" : "Close"}
        cancelButtonProps={{
          onClick: () => {
            if (editingTotal) {
              setEditingTotal(false);
              return;
            }
            if (addingPayment) {
              setAddingPayment(false);
              return;
            }
            onClose();
          },
          className:
            "h-11! border-[#c1c9c0]! text-[#414942]! hover:border-[#2D5A3F]! hover:text-[#2D5A3F]!",
        }}
        okButtonProps={{
          className:
            "h-11! bg-[#2D5A3F]! font-semibold! text-white! hover:bg-[#16482b]! hover:text-white!",
        }}
      >
        {error && (
          <Alert type="error" showIcon title={error} className="mb-3!" />
        )}
  
        {loading ? (
          <div className="space-y-5 py-4">
            <div className="flex gap-4">
              <Skeleton.Button active size="large" style={{ width: 200, height: 80, borderRadius: 12 }} />
              <Skeleton.Button active size="large" style={{ width: 200, height: 80, borderRadius: 12 }} />
              <Skeleton.Button active size="large" style={{ width: 200, height: 80, borderRadius: 12 }} />
            </div>
            <Skeleton active paragraph={{ rows: 1 }} title={false} />
            <Skeleton active paragraph={{ rows: 4 }} title={{ width: 160 }} />
          </div>
        ) :showSetupForm ? (
          <Form
            form={setupForm}
            layout="vertical"
            requiredMark={false}
            onFinish={handleSaveSetup}
            className={fieldClass}
          >
            <div className="mb-3 rounded-xl border border-[#dce4d8] bg-[#f5faf3] p-3.5">
              <p className="m-0 text-xs font-semibold uppercase tracking-wider text-[#2D5A3F]">
                Client Fee Configuration
              </p>
              <p className="m-0 mt-1 text-xs text-[#536350]">
                Set the total package or consultation fee for{" "}
                <strong>{client?.name || "this client"}</strong>. Once saved,
                you can view payment history, paid amount, and balance.
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-x-3 sm:grid-cols-2">
              <Form.Item
                name="totalAmount"
                label="Total fee amount (₹)"
                rules={[
                  {
                    required: true,
                    type: "number",
                    min: 1,
                    message: "Enter total fee amount",
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  max={100000000}
                  precision={2}
                  placeholder="e.g. 5000.00"
                  className="w-full! rounded-md!"
                />
              </Form.Item>

              {!isConfigured && (
                <Form.Item
                  name="paidAmount"
                  label="Initial paid amount (₹) (optional)"
                >
                  <InputNumber
                    min={0}
                    max={100000000}
                    precision={2}
                    placeholder="e.g. 1500.00"
                    className="w-full! rounded-md!"
                  />
                </Form.Item>
              )}

              {!isConfigured && (
                <>
                  <Form.Item
                    name="date"
                    label="Payment date"
                    rules={[{ required: true }]}
                  >
                    <DatePicker className="w-full! rounded-md!" />
                  </Form.Item>

                  <Form.Item
                    name="payment_method"
                    label="Payment method"
                    rules={[{ required: true }]}
                  >
                    <Select
                      className="w-full [&_.ant-select-selector]:rounded-md!"
                      classNames={{ popup: { root: selectPopupClassName } }}
                      options={paymentMethods.map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true }]}
                  >
                    <Select
                      className="w-full [&_.ant-select-selector]:rounded-md!"
                      classNames={{ popup: { root: selectPopupClassName } }}
                      options={categories.income.map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item name="reference" label="Receipt / reference">
                    <Input
                      maxLength={200}
                      placeholder="Optional receipt or UPI ref"
                      className="rounded-md!"
                    />
                  </Form.Item>
                </>
              )}
            </div>

            <Form.Item name="notes" label="Notes">
              <Input.TextArea
                rows={3}
                maxLength={2000}
                showCount
                placeholder="Package details, session count, or payment terms..."
                className="min-h-22! rounded-md! resize-y!"
              />
            </Form.Item>
          </Form>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards: Total Amount, Paid Amount, Balance Amount */}
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
              <article className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#34694a] via-[#2D5A3F] to-[#193d2a] p-4 text-white shadow-[0_6px_20px_rgba(45,90,63,0.18)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="m-0 text-xs font-semibold text-[#e3efdf]">
                      Total Amount
                    </p>
                    <p className="m-0 mt-1.5 text-xl font-bold tabular-nums">
                      {rupee(totalFee)}
                    </p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-[#f0dfb4]">
                    <FiLayers className="h-4 w-4" />
                  </span>
                </div>
                <span className="mt-2.5 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f0dfb4]">
                  Configured Fee
                </span>
              </article>

              <article className="relative overflow-hidden rounded-2xl border border-[#dce4d8] bg-linear-to-br from-white to-[#f4f7f1] p-4 shadow-[0_3px_12px_rgba(20,66,41,0.05)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="m-0 text-xs font-semibold text-[#536350]">
                      Paid Amount
                    </p>
                    <p className="m-0 mt-1.5 text-xl font-bold tabular-nums text-[#144229]">
                      {rupee(paidTotal)}
                    </p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5eddf] text-[#2D5A3F]">
                    <FiCheckCircle className="h-4 w-4" />
                  </span>
                </div>
                <span className="mt-2.5 inline-block rounded-full bg-[#e5eddf] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#144229]">
                  {config?.payments.length || 0} Payment
                  {(config?.payments.length || 0) === 1 ? "" : "s"}
                </span>
              </article>

              <article className="relative overflow-hidden rounded-2xl border border-[#dce4d8] bg-linear-to-br from-white to-[#fcfaf4] p-4 shadow-[0_3px_12px_rgba(20,66,41,0.05)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="m-0 text-xs font-semibold text-[#536350]">
                      Balance Amount
                    </p>
                    <p className="m-0 mt-1.5 text-xl font-bold tabular-nums text-[#7a5a22]">
                      {rupee(balanceAmount)}
                    </p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5ebd3] text-[#7a5a22]">
                    <FiClock className="h-4 w-4" />
                  </span>
                </div>
                <span
                  className={`mt-2.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    balanceAmount === 0
                      ? "bg-[#bceecb] text-[#144229]"
                      : "bg-[#fff0c6] text-[#775a19]"
                  }`}
                >
                  {balanceAmount === 0 ? "Settled" : "Pending Balance"}
                </span>
              </article>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#dce4d8] bg-[#faf9f6] px-3.5 py-2.5">
              <div className="text-xs text-[#536350]">
                {config?.notes ? (
                  <span>
                    <strong>Note:</strong> {config.notes}
                  </span>
                ) : (
                  <span>Record new client payments or adjust total fee</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintStatement}
                  disabled={printing}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-[#c1c9c0] bg-white px-2.5 text-xs font-semibold text-[#144229] hover:border-[#2D5A3F] disabled:cursor-wait disabled:opacity-60"
                >
                  <FiPrinter className="h-3.5 w-3.5" />
                  {printing ? "Preparing PDF…" : "Print PDF"}
                </button>
                {!historyOnly && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingPayment(false);
                        setEditingTotal(true);
                      }}
                      className="cursor-pointer inline-flex h-8 items-center gap-1.5 rounded-md border border-[#c1c9c0] bg-white px-2.5 text-xs font-semibold text-[#144229] hover:border-[#2D5A3F]"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                      Edit Total Fee
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingPayment((prev) => !prev)}
                      className="cursor-pointer inline-flex h-8 items-center gap-1.5 rounded-md bg-[#2D5A3F] px-3 text-xs font-semibold text-white hover:bg-[#16482b]"
                    >
                      <FiPlus className="h-3.5 w-3.5" />
                      {addingPayment ? "Hide Form" : "Add Payment"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Record a new installment / payment using same transaction modal style */}
            {addingPayment && (
              <div className="rounded-xl border border-[#c1c9c0] bg-white p-3.5">
                <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-[#144229]">
                  New Payment Entry
                </p>
                <Form
                  form={paymentForm}
                  layout="vertical"
                  requiredMark={false}
                  onFinish={handleAddPayment}
                  className={fieldClass}
                >
                  <div className="grid min-w-0 grid-cols-1 gap-x-3 sm:grid-cols-2">
                    <Form.Item
                      name="date"
                      label="Payment date"
                      rules={[{ required: true }]}
                    >
                      <DatePicker className="w-full! rounded-md!" />
                    </Form.Item>
                    <Form.Item
                      name="amount"
                      label="Amount received (₹)"
                      rules={[
                        {
                          required: true,
                          type: "number",
                          min: 0.01,
                          message: "Enter amount",
                        },
                      ]}
                    >
                      <InputNumber
                        min={0.01}
                        max={100000000}
                        precision={2}
                        placeholder={
                          balanceAmount > 0
                            ? `Balance: ${balanceAmount}`
                            : "0.00"
                        }
                        className="w-full! rounded-md!"
                      />
                    </Form.Item>
                    <Form.Item
                      name="category"
                      label="Category"
                      rules={[{ required: true }]}
                    >
                      <Select
                        className="w-full [&_.ant-select-selector]:rounded-md!"
                        classNames={{ popup: { root: selectPopupClassName } }}
                        options={categories.income.map((value) => ({
                          value,
                          label: value,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name="payment_method"
                      label="Payment method"
                      rules={[{ required: true }]}
                    >
                      <Select
                        className="w-full [&_.ant-select-selector]:rounded-md!"
                        classNames={{ popup: { root: selectPopupClassName } }}
                        options={paymentMethods.map((value) => ({
                          value,
                          label: value,
                        }))}
                      />
                    </Form.Item>
                  </div>
                  <Form.Item name="reference" label="Receipt / reference">
                    <Input maxLength={200} className="rounded-md!" />
                  </Form.Item>
                </Form>
              </div>
            )}

            {/* Payment history table */}
            <div className="overflow-hidden rounded-xl border border-[#c1c9c0] bg-white">
              <div className="flex items-center justify-between border-b border-[#e2e8dd] bg-[#faf9f6] px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#144229]">
                  <FiDollarSign className="h-3.5 w-3.5" />
                  Payments Received
                </span>
                <span className="text-xs font-medium text-[#667362]">
                  {config?.payments.length || 0} record
                  {(config?.payments.length || 0) === 1 ? "" : "s"}
                </span>
              </div>

              {config && config.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-120 border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#c1c9c0] bg-[#fafafa] text-[#1a1c1a]">
                        <th className="px-3.5 py-2.5 font-semibold">Date</th>
                        <th className="px-3.5 py-2.5 font-semibold">
                          Category
                        </th>
                        <th className="px-3.5 py-2.5 font-semibold">Method</th>
                        <th className="px-3.5 py-2.5 font-semibold">
                          Reference
                        </th>
                        <th className="px-3.5 py-2.5 text-right font-semibold">
                          Paid Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.payments.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-[#eef1ec] last:border-b-0 hover:bg-[#fafdfb]"
                        >
                          <td className="whitespace-nowrap px-3.5 py-2.5 text-[#1a1c1a]">
                            {dayjs(item.date).format("DD MMM YYYY")}
                          </td>
                          <td className="px-3.5 py-2.5 text-[#414942]">
                            {item.category}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="status accepted">
                              {item.payment_method}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-[#667362]">
                            {item.reference || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-bold tabular-nums text-[#144229]">
                            {rupee(item.amount)}
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
                    description="No payments recorded yet"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
      {open &&
      !showSetupForm &&
      client &&
      config &&
      typeof document !== "undefined"
        ? createPortal(
            <div
              ref={statementRef}
              className="payment-print-source"
              aria-hidden="true"
            >
              <PaymentStatement client={client} config={config} />
            </div>,
            document.body,
          )
        : null}
    </ConfigProvider>
  );
}
