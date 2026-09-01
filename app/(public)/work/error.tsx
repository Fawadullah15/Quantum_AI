'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function WorkError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Work Page Error:', error);
  }, [error]);

  return (
    <div className="relative min-h-[70vh] bg-[#030712] text-white flex flex-col items-center justify-center px-8 text-center pt-32">
      <div className="font-mono text-sm tracking-widest text-[#ef4444] mb-4 uppercase">System Alert</div>
      <h2 className="text-3xl lg:text-4xl font-bold mb-6 tracking-[-0.02em]">Unable to load project data.</h2>
      <p className="text-[#94A3B8] max-w-lg mx-auto mb-10 leading-relaxed">
        We encountered a temporary connection issue while retrieving our case studies. Our monitoring systems have logged the interruption.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center px-6 py-3 text-xs font-semibold tracking-widest text-white uppercase transition-all duration-300 bg-white/10 hover:bg-white/20 rounded-full"
        >
          TRY AGAIN
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 text-xs font-semibold tracking-widest text-[#38BDF8] uppercase transition-all duration-300 bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 rounded-full"
        >
          RETURN HOME
        </Link>
      </div>
      
      {/* Dev-only trace block (normally hidden in production UI but preserved in DOM/console) */}
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-12 p-4 bg-red-950/30 text-red-400 text-left text-xs overflow-auto max-w-2xl rounded border border-red-500/20">
          {error.message || 'Unknown error'}
          {'\n'}{error.stack}
        </pre>
      )}
    </div>
  );
}
