import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'QuantumBot — AI Assistant',
  description:
    'General-purpose conversational AI assistant by Quantum AI. Technical problem solving, code generation, document analysis, and engineering intelligence.',
};

export default function QuantumBotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="quantumbot-root min-h-screen bg-[#030712] text-white overflow-hidden">
      {children}
    </div>
  );
}
