import { AuthForm } from "@/components/auth-form"
import { loadServerConfig } from "@/src/server/config"

export const metadata = { title: "Sign in | AzaPay" }

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    readonly status?: string
    readonly redirect_url?: string
  }>
}) {
  const { status, redirect_url: redirectUrl } = await searchParams
  const config = loadServerConfig()
  const notice = status === "deactivated"
    ? "Your account has been deactivated and your sessions revoked."
    : undefined

  return (
    <AuthForm
      mode="login"
      configured={Boolean(config?.clerkPublishableKey && config.clerkSecretKey)}
      notice={notice}
      redirectUrl={redirectUrl}
    />
  )
}
