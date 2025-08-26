'use client';
import PublicRoute from '@/components/PublicRoute';
import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicRoute>
      {children}
    </PublicRoute>
  );
}