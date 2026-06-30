'use client';
import PublicRoute from '@/components/PublicRoute';
import React from 'react';
import { WhiteLabelProvider } from '@/app/context/Whitelabel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicRoute>
      <WhiteLabelProvider>
        {children}
      </WhiteLabelProvider>
    </PublicRoute>
  );
}