import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/api-server";
import EventDetail from "@/components/event-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    redirect("/login");
  }

  const { id } = await params;
  const response = await serverFetch(`/events/${id}`);

  if (!response || !response.success) {
    if (response?.error?.statusCode === 401) {
      redirect("/login");
    }
    return (
      <div className="py-12 text-center text-muted-foreground">
        Event not found.
      </div>
    );
  }

  return <EventDetail initialEvent={response.data} />;
}
