"use client";
import React, { useState, useEffect } from 'react';
import { auth } from '@/firebase'; 
import { onAuthStateChanged, User } from 'firebase/auth'; 
import AuthScreen from '@/components/Auth'; 
import DashboardScreen from '@/components/Dashboard'; 

export default function Page() {
  // Define types for the state to satisfy TypeScript
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listens for login/logout events
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u); 
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Medical-Theme Loader
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 font-mono text-blue-500 animate-pulse tracking-[0.5em]">
      SYSTEM_INITIALIZING...
    </div>
  );

  // Switch between Dashboard and Auth based on user session
  return user ? <DashboardScreen /> : <AuthScreen />;
}