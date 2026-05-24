'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useOnboarding } from '@/hooks/useOnboarding'
import { OnboardingCallout } from '@/components/OnboardingCallout'
import { useAuthStore } from '@/features/auth/store'

// steps 2-5 only make sense on /trips/new
// steps 6-9 only make sense on /trips/[tripId]
const NEW_PAGE_STEPS_END = 5
const TRIP_PAGE_STEPS_START = 6

export function OnboardingBanner() {
  const { user } = useAuthStore()
  const { hintStep, nextHint, skipHint, jumpToStep } = useOnboarding()
  const pathname = usePathname()

  useEffect(() => {
    if (!hintStep) return

    const isOnTripDetailPage = /^\/trips\/[^/]+$/.test(pathname) && pathname !== '/trips/new'

    // steps 2-5 are for trips/new — if user is already on tripId page, jump ahead to step 6
    if (isOnTripDetailPage && hintStep >= 2 && hintStep <= NEW_PAGE_STEPS_END) {
      jumpToStep(TRIP_PAGE_STEPS_START)
    }
  }, [pathname, hintStep, jumpToStep])

  if (!user || hintStep === 0) return null

  return <OnboardingCallout step={hintStep} onNext={nextHint} onSkip={skipHint} />
}
