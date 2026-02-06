"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { loginThunk, clearError } from "@/state/auth/authSlice";
import { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(clearError());

    try {
      const user = await dispatch(loginThunk({ email, password })).unwrap();
      toast.success("Logged in successfully");
      if (user.role === Role.ADMIN_ORG) {
        router.push("/admin/events");
      } else {
        router.push("/events");
      }
    } catch {
      // error is in state
    }
  }

  const errors = Array.isArray(error) ? error : error ? [error] : [];

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-foreground">Sign in to Evora</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Enter your credentials to continue
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
