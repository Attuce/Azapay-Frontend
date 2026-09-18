"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import LoginTab from "../../components/LoginTab"

const AUTH_KEY = "aza-pay-auth"

export default function LoginPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_KEY) === "true"
    if (storedAuth) {
      router.replace("/")
    }
    setIsAuthenticated(storedAuth)
  }, [router])

  const handleAuthenticated = () => {
    // TODO: Replace this mock authentication with the real API response once it is available.
    localStorage.setItem(AUTH_KEY, "true")
    setIsAuthenticated(true)
    router.replace("/")
  }

  if (isAuthenticated) {
    return null
  }

  return <LoginTab onAuthenticated={handleAuthenticated} initialTab="signin" />
}
