"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { logoutThunk } from "@/state/auth/authSlice";
import { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  async function handleLogout() {
    await dispatch(logoutThunk());
    router.push("/login");
  }

  if (!user) return null;

  const isAdmin = user.role === Role.ADMIN_ORG;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={isAdmin ? "/admin/events" : "/events"} className="text-lg font-bold text-foreground">
            Evora
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {isAdmin ? (
              <>
                <Link href="/admin/events" className="text-muted-foreground hover:text-foreground transition-colors">
                  Events
                </Link>
                <Link href="/admin/reservations" className="text-muted-foreground hover:text-foreground transition-colors">
                  Reservations
                </Link>
              </>
            ) : (
              <>
                <Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors">
                  Events
                </Link>
                <Link href="/my-reservations" className="text-muted-foreground hover:text-foreground transition-colors">
                  My Reservations
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {user.firstName} {user.lastName}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-1 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
