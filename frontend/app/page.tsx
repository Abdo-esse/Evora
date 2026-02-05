"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/state/hooks";
import { Role } from "@/lib/types";
import Loading from "@/components/loading";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role === Role.ADMIN_ORG) {
      router.replace("/admin/events");
    } else {
      router.replace("/events");
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loading />
    </div>
  );
}
