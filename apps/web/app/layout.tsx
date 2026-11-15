import "@workspace/ui/globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { loadServerConfig } from "@/src/server/config"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const config = loadServerConfig()
  const clerkConfigured = Boolean(
    config?.clerkPublishableKey && config.clerkSecretKey
  )

  return (
    <html lang="en" className="antialiased">
      <body
        style={{ fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif' }}
      >
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white px-4 py-3 font-semibold text-[#172d31] shadow focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:outline-[#172d31]"
        >
          Skip to main content
        </a>
        {clerkConfigured && config?.clerkPublishableKey ? (
          <ClerkProvider
            publishableKey={config.clerkPublishableKey}
            signInUrl="/login"
            signUpUrl="/signup"
          >
            {children}
          </ClerkProvider>
        ) : children}
      </body>
    </html>
  )
}
