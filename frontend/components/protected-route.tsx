"use client";

import React from "react"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/state/hooks";
import { Role } from "@/lib/types";
import Loading from "./loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    } else if (!loading && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate home
      if (user.role === Role.ADMIN_ORG) {
        router.replace("/admin/events");
      } else {
        router.replace("/events");
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading || !user || !allowedRoles.includes(user.role)) {
    return <Loading />;
  }

  return <>{children}</>;
}

export function ParticipantProtected({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={[Role.PARTICIPANT]}>
      {children}
    </ProtectedRoute>
  );
}

export function AdminProtected({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN_ORG]}>
      {children}
    </ProtectedRoute>
  );
}
