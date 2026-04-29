"use client";
import React, { useState, useEffect } from 'react';
import { auth } from '@/firebase'; // Points to your firebase.js configuration
import { onAuthStateChanged, User } from 'firebase/auth'; 
import AuthScreen from '@/components/Auth'; // Patient Registration/Login Component
import DashboardScreen from '@/components/Dashboard'; // Medical Monitoring Dashboard

export default function Page() {
  // TypeScript generics to allow the state to hold a User object or null
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listener that detects when a user logs in or out
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Professional Medical-Theme Loading Screen
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 font-mono text-blue-500 animate-pulse tracking-[0.5em]">
        SYSTEM_INITIALIZING...
      </div>
    );
  }

  // Routing Logic: Show Dashboard if logged in, otherwise show Auth screen
  return user ? <DashboardScreen /> : <AuthScreen />;
}