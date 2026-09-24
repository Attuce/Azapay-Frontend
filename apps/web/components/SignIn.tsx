"use client"

import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { dummyData } from "../dummyData"

type Props = {
  onSwitch?: (tab: "signup" | "signin") => void
  onAuthenticated?: () => void
}

export default function SignIn({ onSwitch, onAuthenticated }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const fillSampleData = () => {
    const user = dummyData[Math.floor(Math.random() * dummyData.length)]
    if (!user) return
    setFormData({
      email: user.email,
      password: user.password,
    })
  }

  const handleSubmit = () => {
    // TODO: Replace this mock success with the real API call once it is available.
    onAuthenticated?.()
  }

  return (
    <div className="w-full max-w-md">
      <div className="p-0">
        <div className="mb-5">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#EB9E30]">Sign In</h1>
          <p className="mt-2 text-base text-muted-foreground">Don’t have an account? <button type="button" onClick={() => onSwitch?.("signup")} className="text-[#EB9E30] underline">Create one</button></p>
        </div>

        <form className="mt-4 grid gap-4">
          <Input
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            type="email"
            className="h-14 rounded-full border-2 border-[#d8d8d8] bg-[#f2f2f2] px-5 text-lg placeholder:text-[#5d5d5d]"
          />

          <div className="relative">
            <Input
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              className="h-14 rounded-full border-2 border-[#d8d8d8] bg-[#f2f2f2] pr-12 pl-5 text-lg placeholder:text-[#5d5d5d]"
            />
            <button
              type="button"
              aria-label="toggle password"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <Button
            type="button"
            onClick={fillSampleData}
            className="mt-1 h-11 rounded-full border border-[#EB9E30] bg-transparent text-sm font-medium text-[#EB9E30] hover:bg-[#EB9E30]/5"
          >
            Use sample data
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            className="mt-2 h-14 w-full rounded-full bg-[#f4a13b] text-xl font-medium text-white shadow-sm hover:bg-[#e8922a]"
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}
