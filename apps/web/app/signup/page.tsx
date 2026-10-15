import { AuthForm } from "@/components/auth-form"

export const metadata = { title: "Create account | AzaPay" }

export default function SignupPage() {
  return <AuthForm mode="register" />
}
