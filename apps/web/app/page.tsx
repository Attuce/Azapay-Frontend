"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import HomePage from "../components/HomePage"

const AUTH_KEY = "aza-pay-auth"

export default function Page() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_KEY) === "true"
    setIsAuthenticated(storedAuth)
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    localStorage.setItem(AUTH_KEY, String(isAuthenticated))
  }, [isAuthenticated, isReady])

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isReady, isAuthenticated, router])

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem(AUTH_KEY)
    router.push("/login")
  }

  if (!isReady) {
    return null
  }

  return isAuthenticated ? <HomePage onLogout={handleLogout} /> : null
}