"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Event, EventStatus } from "@/lib/types";
import { extractErrorMessages } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface EventFormProps {
  event?: Event;
  mode: "create" | "edit";
}

function toDateTimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    startDate: event ? toDateTimeLocal(event.startDate) : "",
    endDate: event ? toDateTimeLocal(event.endDate) : "",
    location: event?.location ?? "",
    maxAttendees: event?.maxAttendees?.toString() ?? "",
    status: event?.status ?? "DRAFT",
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!form.title.trim()) errs.push("Title is required");
    if (!form.startDate) errs.push("Start date is required");
    if (!form.endDate) errs.push("End date is required");
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      errs.push("End date must be after start date");
    }
    if (!form.location.trim()) errs.push("Location is required");
    const attendees = parseInt(form.maxAttendees, 10);
    if (!form.maxAttendees || isNaN(attendees) || attendees <= 0) {
      errs.push("Max attendees must be a positive integer");
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientErrors = validate();
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors([]);
    setSubmitting(true);

    const payload = {
      title: form.title,
      description: form.description,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      location: form.location,
      maxAttendees: parseInt(form.maxAttendees, 10),
      status: form.status,
    };

    try {
      if (mode === "create") {
        await api.post("/events", payload);
        toast.success("Event created");
      } else {
        await api.put(`/events/${event!.id}`, payload);
        toast.success("Event updated");
      }
      router.push("/admin/events");
    } catch (err) {
      const { general, fields } = extractErrorMessages(err);
      if (fields.length > 0) {
        setErrors(fields);
      } else {
        setErrors([general]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maxAttendees">Max Attendees</Label>
          <Input
            id="maxAttendees"
            type="number"
            min="1"
            value={form.maxAttendees}
            onChange={(e) => update("maxAttendees", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select value={form.status} onValueChange={(v) => update("status", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="CANCELED">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3">
          {errors.map((msg, i) => (
            <p key={i} className="text-sm text-destructive">
              {msg}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
              ? "Create Event"
              : "Update Event"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/events")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
