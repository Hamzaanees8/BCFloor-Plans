"use client";

import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-10 max-w-md">
        <h1 className="text-3xl font-bold text-blue-500 mb-4">
          Payment Successful 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you! Your payment has been received successfully.
        </p>
        <Link
          href="/dashboard"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
