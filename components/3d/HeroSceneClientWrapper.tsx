'use client'

import dynamic from 'next/dynamic'

export const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), { ssr: false })
