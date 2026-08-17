'use client'

import dynamic from 'next/dynamic'

export const LoadingScreen = dynamic(() => import('@/components/layout/LoadingScreen'), { ssr: false })
