'use client'

import { useOnboarding } from '@/hooks/useOnboarding'
import { OnboardingCallout } from '@/components/OnboardingCallout'
import { useAuthStore } from '@/features/auth/store'

export function OnboardingBanner() {
  const { user } = useAuthStore()
  const { hintStep, nextHint, skipHint } = useOnboarding()

  if (!user || hintStep === 0) return null

  return <OnboardingCallout step={hintStep} onNext={nextHint} onSkip={skipHint} />
}
