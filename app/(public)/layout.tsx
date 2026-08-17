import React from 'react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import CustomCursor from '@/components/layout/CustomCursor'
import ClientLayout from '@/components/layout/ClientLayout'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomCursor />
      <div className="public-layout">
        <ClientLayout>
          <Navigation companyName="QUANTUM AI" />
          {children}
          <Footer
            companyName="QUANTUM AI"
            tagline="Intelligent software for a connected world."
            email="hello@quantumai.dev"
          />
        </ClientLayout>
      </div>
    </>
  )
}
