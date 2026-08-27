import React from 'react';
import { AdminProductAdditionPage } from '../src/components/AdminProductAdditionPage';

/**
 * Standalone Admin Product Addition Page Component
 * Repository path: /pages/admin.js
 */
export default function AdminPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 flex items-center justify-center">
      <AdminProductAdditionPage />
    </div>
  );
}
