import React from 'react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import CustomCursor from '@/components/layout/CustomCursor'
import ClientLayout from '@/components/layout/ClientLayout'
import { getOrganizationSchema, getWebSiteSchema } from '@/lib/seo'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const orgSchema = getOrganizationSchema()
  const webSiteSchema = getWebSiteSchema()

  return (
    <>
      <CustomCursor />
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
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
