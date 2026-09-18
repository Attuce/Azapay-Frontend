"use client"

import { Button } from "@workspace/ui/components/button"

type HomePageProps = {
  onLogout: () => void
}

export default function HomePage({ onLogout }: HomePageProps) {
  return (
    <main className="min-h-svh bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#EB9E30]">Aza Pay</p>
            <h1 className="mt-2 text-4xl font-semibold">Welcome back</h1>
          </div>

          <Button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-[#EB9E30] bg-transparent text-[#EB9E30] hover:bg-[#EB9E30]/5"
          >
            Log out
          </Button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg backdrop-blur-sm">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="mt-3 text-base text-muted-foreground">
            You are signed in and can now access the homepage.
          </p>
        </div>
      </div>
    </main>
  )
}
