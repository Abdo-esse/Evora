import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/api-server";
import EventsList from "@/components/events-list";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    redirect("/login");
  }

  const sParams = await searchParams;
  const page = Number(sParams.page) || 1;
  const search = (sParams.search as string) || "";

  const response = await serverFetch("/events", {
    page,
    limit: 9,
    search: search || undefined,
  });

  if (!response || !response.success) {
    if (response?.error?.statusCode === 401) {
      redirect("/login");
    }
    return (
      <div className="py-12 text-center text-muted-foreground">
        Failed to load events.
      </div>
    );
  }

  return (
    <EventsList
      initialEvents={response.data || []}
      initialMeta={response.meta || null}
      search={search}
    />
  );
}
