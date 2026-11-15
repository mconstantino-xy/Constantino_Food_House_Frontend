
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"

export function useAuthGuard(requireAuth = true) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const authenticated = isAuthenticated()

    if (requireAuth && !authenticated) {
      router.replace("/login")
      return
    }

    if (!requireAuth && authenticated) {
      router.replace("/")
      return
    }

    setIsChecking(false)
  }, [requireAuth, router])

  return { isChecking }
}
