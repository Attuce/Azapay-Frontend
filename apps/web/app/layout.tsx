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
        {children}
      </body>
    </html>
  )
}
