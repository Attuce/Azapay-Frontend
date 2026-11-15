import { AuthForm } from "@/components/auth-form"
import { loadServerConfig } from "@/src/server/config"

export const metadata = { title: "Create account | AzaPay" }

export default function SignupPage() {
  const config = loadServerConfig()

  return (
    <AuthForm
      mode="register"
      configured={Boolean(config?.clerkPublishableKey && config.clerkSecretKey)}
    />
  )
}
