"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import type { Reservation, ApiMeta, ReservationStatus } from "@/lib/types";
import { ParticipantProtected } from "@/components/protected-route";
import SearchInput from "@/components/search-input";
import StatusFilter from "@/components/status-filter";
import Pagination from "@/components/pagination";
import Loading from "@/components/loading";
import EmptyState from "@/components/empty-state";
import StatusBadge from "@/components/status-badge";
import ConfirmModal from "@/components/confirm-modal";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusOptions = [
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Refused", value: "REFUSED" },
  { label: "Canceled", value: "CANCELED" },
];

function MyReservationsContent() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reservations", {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          status: status !== "ALL" ? status : undefined,
        },
      });
      // Backend returns { success, data: { data: [...], total, page, limit, totalPages }, meta }
      const result = data.data;
      setReservations(Array.isArray(result?.data) ? result.data : []);
      setMeta({
        ...data.meta,
        total: result?.total ?? 0,
        page: result?.page ?? 1,
        limit: result?.limit ?? 10,
        totalPages: result?.totalPages ?? 1,
      });
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleStatusChange(val: string) {
    setStatus(val);
    setPage(1);
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.put(`/reservations/${cancelTarget.id}/cancel`);
      toast.success("Reservation cancelled");
      setCancelTarget(null);
      fetchReservations();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  }

  async function handleDownloadTicket(reservationId: string) {
    try {
      const response = await api.get(`/reservations/${reservationId}/ticket`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${reservationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download ticket");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">My Reservations</h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={handleSearch} placeholder="Search reservations..." />
        </div>
        <StatusFilter
          value={status}
          onChange={handleStatusChange}
          options={statusOptions}
          placeholder="All statuses"
        />
      </div>

      {loading ? (
        <Loading />
      ) : reservations.length === 0 ? (
        <EmptyState message="No reservations found." />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.event?.title ?? r.eventId}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === "CONFIRMED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadTicket(r.id)}
                        >
                          <Download className="mr-1 h-3.5 w-3.5" />
                          Ticket
                        </Button>
                      )}
                      {(r.status === "PENDING" || r.status === "CONFIRMED") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelTarget(r)}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && (
        <Pagination
          page={page}
          totalPages={meta.totalPages ?? 1}
          onPageChange={setPage}
        />
      )}

      <ConfirmModal
        open={!!cancelTarget}
        title="Cancel reservation"
        description="Are you sure you want to cancel this reservation? This action cannot be undone."
        confirmLabel={cancelling ? "Cancelling..." : "Cancel reservation"}
        destructive
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}

export default function MyReservationsPage() {
  return (
    <ParticipantProtected>
      <MyReservationsContent />
    </ParticipantProtected>
  );
}
