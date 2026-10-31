"use client";

import { useMemo, useState } from "react";
import { Input, Tag } from "antd";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { money } from "@/lib/accounts/formatters";
import ClientPaymentModal, {
  type ClientPaymentConfig,
} from "@/components/clientDetails/ClientPaymentModal";
import {
  addPaymentEntry,
  getClientPaymentConfig,
  saveClientPaymentConfig,
} from "@/lib/actions/appointments";
import { FiCreditCard } from "react-icons/fi";

export type PendingPaymentClient = {
  id: string;
  name: string;
  phone: string;
  totalPaise: number;
  paidPaise: number;
  pendingPaise: number;
};

export default function PendingPaymentsTable({
  rows,
  loading = false,
  onUpdated,
}: {
  rows: PendingPaymentClient[];
  loading?: boolean;
  onUpdated?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedClient, setSelectedClient] =
    useState<PendingPaymentClient | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<
    ClientPaymentConfig | undefined
  >(undefined);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      `${row.name} ${row.phone}`.toLowerCase().includes(query),
    );
  }, [rows, search]);

  const columns: Column<PendingPaymentClient>[] = [
    { key: "name", title: "Client" },
    { key: "phone", title: "Phone", render: (row) => row.phone || "—" },
    {
      key: "totalPaise",
      title: "Total fee",
      render: (row) => money(row.totalPaise),
    },
    { key: "paidPaise", title: "Paid", render: (row) => money(row.paidPaise) },
    {
      key: "pendingPaise",
      title: "Pending",
      render: (row) => <Tag color="gold">{money(row.pendingPaise)}</Tag>,
    },
    {
  key: "actions",
  title: "Action",
  render: (row) => (
    <button
      type="button"
      className="cursor-pointer inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-[5px] border border-[#2d5a3f] bg-white px-3 text-xs font-bold text-[#144229] hover:bg-[#e8f7ee]"
      onClick={async () => {
        setPaymentLoading(true);
        setSelectedClient(row);
        const { config } = await getClientPaymentConfig(row.id);
        setPaymentConfig(config || undefined);
        setPaymentLoading(false);
      }}
    >
      <FiCreditCard aria-hidden="true" />
      Payment History
    </button>
  ),
},
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <p className="m-0 text-sm text-gray-500">
          Clients with an outstanding balance based on recorded payments.
        </p>
        <Input.Search
          aria-label="Search pending payments"
          placeholder="Search name, phone"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 260 }}
        />
      </div>
      <DataTable
        columns={columns}
        data={filteredRows}
        loading={loading}
        pageSize={10}
      />
      <ClientPaymentModal
        open={Boolean(selectedClient)}
        client={
          selectedClient
            ? {
                id: selectedClient.id,
                name: selectedClient.name,
                phone: selectedClient.phone,
              }
            : null
        }
        config={paymentConfig}
        historyOnly
         loading={paymentLoading}
        onClose={() => {
          setSelectedClient(null);
          setPaymentConfig(undefined);
        }}
        onSaveConfig={async (next) => {
          if (!selectedClient) return;
          await saveClientPaymentConfig(
            selectedClient.id,
            next.totalAmount,
            next.notes || "",
          );
          for (const payment of next.payments) {
            if (payment.id.startsWith("pay-")) {
              await addPaymentEntry(selectedClient.id, {
                date: payment.date,
                amount: payment.amount,
                category: payment.category,
                payment_method: payment.payment_method,
                reference: payment.reference,
                notes: payment.notes,
              });
            }
          }
          const { config } = await getClientPaymentConfig(selectedClient.id);
          setPaymentConfig(config || undefined);
          onUpdated?.();
        }}
      />
    </>
  );
}
