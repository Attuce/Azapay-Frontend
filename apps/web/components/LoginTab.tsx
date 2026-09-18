"use client"

import React, { useState } from "react"
import SignUp from "./SignUp"
import SignIn from "./SignIn"

type AuthPageProps = {
  onAuthenticated: () => void
  initialTab?: "signup" | "signin"
}

export default function AuthPage({ onAuthenticated, initialTab = "signin" }: AuthPageProps) {
  const [tab, setTab] = useState<"signup" | "signin">(initialTab)

  return (
    <div className="min-h-svh bg-background p-6">
      <div className="mx-auto w-full max-w-md">
        {tab === "signup" ? (
          <SignUp onSwitch={setTab} onAuthenticated={onAuthenticated} />
        ) : (
          <SignIn onSwitch={setTab} onAuthenticated={onAuthenticated} />
        )}
      </div>
    </div>
  )
}
