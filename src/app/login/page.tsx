import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/matches");

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-1 mb-6 text-sm text-slate-400">
          Log in with your username and password. This game is played entirely with points — no real
          money is ever involved.
        </p>
        <LoginForm />
      </div>

      <p className="mt-4 text-center text-sm text-slate-400">
        New here?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
