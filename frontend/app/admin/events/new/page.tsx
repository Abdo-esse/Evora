"use client";

import { AdminProtected } from "@/components/protected-route";
import EventForm from "@/components/event-form";

function NewEventContent() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Create New Event</h1>
      <EventForm mode="create" />
    </div>
  );
}

export default function NewEventPage() {
  return (
    <AdminProtected>
      <NewEventContent />
    </AdminProtected>
  );
}
