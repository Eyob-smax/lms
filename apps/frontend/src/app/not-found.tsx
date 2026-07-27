import * as React from 'react';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="bg-[#f9f9ff] text-[#111c2d] font-sans min-h-screen flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-50 text-[#4d44e3] rounded-full flex items-center justify-center mx-auto border border-indigo-100 font-bold text-2xl">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Page Not Found</h1>
          <p className="text-sm text-slate-500">
            The requested resource or page could not be found. Please check the URL or return home.
          </p>
        </div>
        <a
          href="/"
          className="block w-full py-3 bg-[#4d44e3] hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
