import { Nunito } from "next/font/google"
import "@workspace/ui/globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${nunito.variable} antialiased`}>
      <body style={{ fontFamily: "var(--font-nunito), system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[100] rounded-full bg-[var(--cd)] px-4 py-3 font-bold text-[#14224f] shadow focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:outline-[#2764ff] dark:bg-[#151922] dark:text-[#e8ecff]"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
