"use client";

import type { Event } from "@/lib/types";
import StatusBadge from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, MapPin, Users, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

interface EventDetailProps {
    initialEvent: Event;
}

export default function EventDetail({ initialEvent }: EventDetailProps) {
    const router = useRouter();
    const [event, setEvent] = useState<Event>(initialEvent);
    const [reserving, setReserving] = useState(false);

    async function handleReserve() {
        setReserving(true);
        try {
            await api.post("/reservations", { eventId: event.id });
            toast.success("Reservation created!");
            // Refresh event to update limit (using client-side api here for immediate feedback)
            const { data } = await api.get(`/events/${event.id}`);
            setEvent(data.data);
        } catch (err: any) {
            const msg = err.response?.data?.error?.message;
            toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to reserve");
        } finally {
            setReserving(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl">
            <Button
                variant="ghost"
                size="sm"
                className="mb-4"
                onClick={() => router.back()}
            >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <StatusBadge status={event.status} />
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {event.description}
                    </p>

                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <span>
                                {format(new Date(event.startDate), "MMM d, yyyy HH:mm")} -{" "}
                                {format(new Date(event.endDate), "MMM d, yyyy HH:mm")}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>Max attendees: {event.maxAttendees}</span>
                        </div>
                    </div>

                    {event.limit !== undefined && (
                        <p className="text-sm font-medium">
                            {event.limit > 0
                                ? `${event.limit} seat${event.limit !== 1 ? "s" : ""} remaining`
                                : "No seats remaining"}
                        </p>
                    )}

                    <Button
                        onClick={handleReserve}
                        disabled={reserving || (event.limit !== undefined && event.limit <= 0)}
                        className="w-full sm:w-auto"
                    >
                        {reserving ? "Reserving..." : "Reserve a seat"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
