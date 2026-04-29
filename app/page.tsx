"use client";
import React, { useState, useEffect } from 'react';
import { auth } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth'; // Added User type import
import AuthScreen from '@/components/Auth';
import DashboardScreen from '@/components/Dashboard';

export default function Page() {
  // FIXED: Explicitly defined types for the state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // onAuthStateChanged returns a User object or null
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u); // TypeScript now accepts 'u' because we defined the type above
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 font-mono text-blue-500 animate-pulse tracking-[0.5em]">
      SYSTEM_INITIALIZING...
    </div>
  );

  // Switch between Dashboard and Auth based on user state
  return user ? <DashboardScreen /> : <AuthScreen />;
}