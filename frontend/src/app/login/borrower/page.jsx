"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { formatAuthError, isValidEmail } from "../../../lib/authErrorUtils";
import toast from "react-hot-toast";

export default function BorrowerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleAuth = async (e) => {
    e.preventDefault();

    if (isSubmittingRef.current || loading) {
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      if (isSignUp) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { role: "borrower" }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        // If a session was already established upon signup (auto-confirm enabled)
        if (signUpData?.session) {
          toast.success("Account created successfully!");
          router.push("/borrower");
          return;
        }

        // If user was created but no session returned, email confirmation is required
        if (signUpData?.user && !signUpData?.session) {
          toast.success("Account created! Please check your email inbox to confirm your account before signing in.", {
            duration: 6000,
          });
          setIsSignUp(false);
          return;
        }

        toast.success("Account created! You can now sign in.");
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password
        });
        if (signInError) throw signInError;
        toast.success("Welcome back!");
        router.push("/borrower");
      }
    } catch (err) {
      const friendlyMessage = formatAuthError(err);
      toast.error(friendlyMessage);
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] px-4 transition-colors">
      <div
        className="w-full max-w-md p-10 rounded-2xl shadow-xl transition-colors bg-[var(--surface-card)] border border-[var(--border-default)]"
      >
        <div className="text-center mb-8">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-sage)] text-[var(--brand-primary)] border border-[var(--border-default)]">
            Business Owner Portal
          </span>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-4">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {isSignUp
              ? "Sign up to track your credit score"
              : "Sign in to check your credit score and improvement tips"}
          </p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--brand-emerald)] focus:ring-2 focus:ring-[var(--focus-ring)] placeholder-[var(--input-placeholder)] outline-none transition-colors disabled:opacity-50"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--brand-emerald)] focus:ring-2 focus:ring-[var(--focus-ring)] placeholder-[var(--input-placeholder)] outline-none transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-[var(--btn-primary-text)] bg-[var(--brand-primary)] hover:bg-[var(--brand-deep)] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>
        <div className="text-center mt-6 space-y-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-emerald)] transition-colors block w-full disabled:opacity-50"
          >
            {isSignUp ? "Already have an account? Sign in" : "New here? Create account"}
          </button>
          <p className="text-xs text-[var(--text-muted)]">
            Are you a Bank or Lender?{" "}
            <a href="/login/lender" className="text-[var(--brand-emerald)] hover:underline font-medium">
              Sign in here →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
