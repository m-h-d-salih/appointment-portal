"use client";

import React, { useState } from "react";
import { ConfigProvider, Empty, Spin } from "antd";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export interface Column<T> {
  title: string;
  key: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pageSize?: number;
  total?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis-start" | "ellipsis-end"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const firstVisiblePage = Math.floor((currentPage - 1) / 5) * 5 + 1;
  const lastVisiblePage = Math.min(firstVisiblePage + 4, totalPages);
  const items: Array<number | "ellipsis-start" | "ellipsis-end"> = [];

  if (firstVisiblePage > 1) {
    items.push(1, "ellipsis-start");
  }

  for (let page = firstVisiblePage; page <= lastVisiblePage; page += 1) {
    items.push(page);
  }

  if (lastVisiblePage < totalPages - 2) {
    items.push("ellipsis-end", totalPages - 1, totalPages);
  } else {
    for (let page = lastVisiblePage + 1; page <= totalPages; page += 1) {
      items.push(page);
    }
  }

  return items;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pageSize: initialPageSize = 10,
  total: serverTotal,
  currentPage: serverPage,
  onPageChange,
}: DataTableProps<T>) {
  const [localPage, setLocalPage] = useState(1);
  const [sizePerPage, setSizePerPage] = useState(initialPageSize);

  const isServerPaginated =
    serverTotal !== undefined && onPageChange !== undefined;

  const activePage = isServerPaginated
    ? serverPage || 1
    : Math.min(localPage, Math.ceil(data.length / sizePerPage) || 1);
  const totalItems = isServerPaginated ? serverTotal : data.length;
  const totalPages = Math.ceil(totalItems / sizePerPage) || 1;

  // Client-side: slice data. Server-side: data is already one page
  const startIndex = isServerPaginated ? 0 : (activePage - 1) * sizePerPage;
  const endIndex = isServerPaginated
    ? data.length
    : Math.min(startIndex + sizePerPage, data.length);
  const paginatedData = isServerPaginated
    ? data
    : data.slice(startIndex, endIndex);

  // Display indexes for "Showing X to Y of Z"
  const displayStart = isServerPaginated
    ? (activePage - 1) * sizePerPage + 1
    : startIndex + 1;
  const displayEnd = isServerPaginated
    ? (activePage - 1) * sizePerPage + data.length
    : endIndex;

  const handlePageChange = (page: number) => {
    if (isServerPaginated) {
      onPageChange(page);
    } else {
      setLocalPage(page);
    }
  };

  return (
    <div className="min-w-0">
      <div className="relative w-full overflow-x-auto overscroll-x-contain px-3 py-4 [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-5">
        <p className="mb-2 text-[11px] text-[#69746d] sm:hidden">
          Swipe sideways to see all columns
        </p>
        <table className="w-full min-w-170 border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-[#fafafa]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap border-b border-[#c1c9c0] px-3 py-3 font-semibold text-[#1a1c1a] sm:px-4 sm:py-3.5 ${col.className || ""}`}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  <ConfigProvider
                    theme={{ token: { colorPrimary: "#144229" } }}
                  >
                    <Spin size="large" aria-label="Loading" />
                  </ConfigProvider>
                </td>
              </tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="hover:bg-[#fafdfb]">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`border-b border-[#c1c9c0] px-3 py-3 text-[#1a1c1a] sm:px-4 sm:py-3.5 ${col.className || ""}`}
                    >
                      {col.render
                        ? col.render(
                            row,
                            (isServerPaginated
                              ? (activePage - 1) * sizePerPage
                              : startIndex) + rowIndex,
                          )
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className=" text-center text-[#414942]"
                >
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No records found"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <div className="flex flex-col gap-4 border-t border-[#c1c9c0] px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {!isServerPaginated && (
              <div className="flex items-center gap-1.5 text-xs text-[#414942]">
                <span>Show</span>
                <select
                  value={sizePerPage}
                  onChange={(e) => {
                    setSizePerPage(Number(e.target.value));
                    handlePageChange(1);
                  }}
                  className="h-8 cursor-pointer appearance-none rounded-md border border-[#c1c9c0] bg-white pr-7 pl-2 text-xs font-semibold text-[#414942] outline-none transition-colors hover:border-[#2d5a3f] focus:border-[#144229]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23414942' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.2' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: "right 0.35rem center",
                    backgroundSize: "1.25rem",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </select>
                <span>entries</span>
              </div>
            )}

            <span className="text-xs text-[#414942]">
              Showing{" "}
              <strong className="font-semibold text-[#1a1c1a]">
                {totalItems === 0 ? 0 : displayStart}
              </strong>{" "}
              to{" "}
              <strong className="font-semibold text-[#1a1c1a]">
                {displayEnd}
              </strong>{" "}
              of{" "}
              <strong className="font-semibold text-[#1a1c1a]">
                {totalItems}
              </strong>{" "}
              entries
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => handlePageChange(activePage - 1)}
                disabled={activePage === 1}
                className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#c1c9c0] bg-white text-[#414942] transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Previous Page"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>

              {getPaginationItems(activePage, totalPages).map((item) =>
                typeof item === "number" ? (
                  <button
                    key={item}
                    onClick={() => handlePageChange(item)}
                    className={`cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                      activePage === item
                        ? "bg-[#144229] text-white"
                        : "border border-[#c1c9c0] bg-white text-[#414942] hover:bg-neutral-50"
                    }`}
                  >
                    {item}
                  </button>
                ) : (
                  <span
                    key={item}
                    className="inline-flex h-8 w-5 items-center justify-center text-xs font-semibold text-[#69746d]"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ),
              )}

              <button
                onClick={() => handlePageChange(activePage + 1)}
                disabled={activePage === totalPages}
                className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#c1c9c0] bg-white text-[#414942] transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Next Page"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
