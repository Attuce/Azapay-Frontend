import { AuthForm } from "@/components/auth-form"

export const metadata = { title: "Sign in | AzaPay" }

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly status?: string }>
}) {
  const { status } = await searchParams
  const notice = status === "deactivated" ? "Your account has been deactivated and your sessions revoked." : undefined
  return <AuthForm mode="login" notice={notice} />
}
