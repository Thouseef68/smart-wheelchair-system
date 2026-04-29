"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import AuthScreen from "@/components/Auth";
import DashboardScreen from "@/components/Dashboard";

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 font-mono text-blue-500 animate-pulse tracking-[0.5em]">
        SYSTEM_INITIALIZING...
      </div>
    );
  }

  return user ? <DashboardScreen /> : <AuthScreen />;
}