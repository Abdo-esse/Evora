"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { registerThunk, clearError } from "@/state/auth/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(clearError());

    try {
      await dispatch(registerThunk(form)).unwrap();
      toast.success("Account created. Please sign in.");
      router.push("/login");
    } catch {
      // error in state
    }
  }

  const errors = Array.isArray(error) ? error : error ? [error] : [];

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-foreground">Create your account</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Join Evora to discover and manage events
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              required
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              required
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
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
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
