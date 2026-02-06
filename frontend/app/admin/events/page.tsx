"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { Event, ApiMeta } from "@/lib/types";
import { AdminProtected } from "@/components/protected-route";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Canceled", value: "CANCELED" },
];

function AdminEventsContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/events", {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          status: status !== "ALL" ? status : undefined,
        },
      });
      setEvents(data.data);
      setMeta(data.meta);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleStatusChange(val: string) {
    setStatus(val);
    setPage(1);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/events/${deleteTarget.id}`);
      toast.success("Event deleted");
      setDeleteTarget(null);
      fetchEvents();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Manage Events</h1>
        <Link href="/admin/events/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            New Event
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={handleSearch} placeholder="Search events..." />
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
      ) : events.length === 0 ? (
        <EmptyState message="No events found." />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(event.startDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {event.location}
                  </TableCell>
                  <TableCell className="text-sm">{event.maxAttendees}</TableCell>
                  <TableCell>
                    <StatusBadge status={event.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/events/${event.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(event)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
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
        open={!!deleteTarget}
        title="Delete event"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <AdminProtected>
      <AdminEventsContent />
    </AdminProtected>
  );
}
