"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import type { Event } from "@/lib/types";
import { AdminProtected } from "@/components/protected-route";
import EventForm from "@/components/event-form";
import Loading from "@/components/loading";

function EditEventContent() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/events/${params.id}`);
        setEvent(data.data);
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) return <Loading />;
  if (!event) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Event not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Edit Event</h1>
      <EventForm event={event} mode="edit" />
    </div>
  );
}

export default function EditEventPage() {
  return (
    <AdminProtected>
      <EditEventContent />
    </AdminProtected>
  );
}
