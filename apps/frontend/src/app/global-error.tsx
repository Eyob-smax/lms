'use client';

import * as React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title key="title">System Error | LMS Enterprise</title>
        <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-[#f9f9ff] text-[#111c2d] font-sans min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100 font-bold text-2xl">
            !
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">System Error</h1>
            <p className="text-sm text-slate-500">
              An unexpected application error occurred. Please refresh the page or return to the dashboard.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-[#4d44e3] hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
