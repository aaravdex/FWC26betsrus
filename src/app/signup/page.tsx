import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { SignupForm } from "@/components/auth/SignupForm";
import { formatPoints } from "@/lib/points";
import { startingBalance } from "@/lib/env";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/matches");

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 mb-6 text-sm text-slate-400">
          Open signup — anyone can join. Pick a username and password; no email required. You’ll
          start with {formatPoints(startingBalance())} of play-money (no real money is involved).
        </p>
        <SignupForm />
      </div>

      <p className="mt-4 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
