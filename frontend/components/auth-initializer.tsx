"use client";

import React from "react"

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { refreshThunk, fetchMeThunk } from "@/state/auth/authSlice";
import { getAccessToken } from "@/lib/auth";
import Loading from "./loading";

export default function AuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      // Try to refresh token on mount (cookie may still be valid)
      try {
        await dispatch(refreshThunk()).unwrap();
        await dispatch(fetchMeThunk()).unwrap();
      } catch {
        // not logged in, that's fine
      }
      setReady(true);
    }
    init();
  }, [dispatch]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  return <>{children}</>;
}
