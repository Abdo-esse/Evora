"use client";

import Link from "next/link";
import type { Event, ApiMeta } from "@/lib/types";
import SearchInput from "@/components/search-input";
import Pagination from "@/components/pagination";
import EmptyState from "@/components/empty-state";
import StatusBadge from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface EventsListProps {
    initialEvents: Event[];
    initialMeta: ApiMeta | null;
    search: string;
}

export default function EventsList({ initialEvents, initialMeta, search }: EventsListProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function handleSearch(val: string) {
        const params = new URLSearchParams(searchParams);
        if (val) {
            params.set("search", val);
        } else {
            params.delete("search");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    }

    function handlePageChange(page: number) {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-foreground">Events</h1>
                <div className="w-full sm:w-72">
                    <SearchInput value={search} onChange={handleSearch} placeholder="Search events..." />
                </div>
            </div>

            {initialEvents.length === 0 ? (
                <EmptyState message="No events found." />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {initialEvents.map((event) => (
                        <Link key={event.id} href={`/events/${event.id}`}>
                            <Card className="h-full transition-colors hover:border-foreground/20">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base font-semibold leading-tight">
                                            {event.title}
                                        </CardTitle>
                                        <StatusBadge status={event.status} />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        <span>{format(new Date(event.startDate), "MMM d, yyyy")}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span>{event.location}</span>
                                    </div>
                                    {event.limit !== undefined && (
                                        <p className="mt-1 text-xs">
                                            {event.limit} seat{event.limit !== 1 ? "s" : ""} remaining
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {initialMeta && (
                <Pagination
                    page={initialMeta.page ?? 1}
                    totalPages={initialMeta.totalPages ?? 1}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
}
