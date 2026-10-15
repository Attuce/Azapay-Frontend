import "@workspace/ui/globals.css"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
        {children}
      </body>
    </html>
  )
}
