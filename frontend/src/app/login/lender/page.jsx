"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { formatAuthError, isValidEmail } from "../../../lib/authErrorUtils";
import toast from "react-hot-toast";

export default function LenderLogin() {
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
            data: { role: "lender" }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        // If a session was already established upon signup (auto-confirm enabled)
        if (signUpData?.session) {
          toast.success("Account created successfully!");
          router.push("/lender");
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
        router.push("/lender");
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
    <div className="min-h-screen flex items-center justify-center bg-[#070910] px-4">
      <div
        className="w-full max-w-md p-10 rounded-2xl"
        style={{ background: "#0C1C35", border: "1px solid rgba(22,139,255,0.15)" }}
      >
        <div className="text-center mb-8">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/25">
            Bank / Lender Portal
          </span>
          <h1 className="text-2xl font-bold text-[#EFF7FF] mt-4">
            {isSignUp ? "Create Account" : "Lender Intelligence Portal"}
          </h1>
          <p className="text-sm text-[#94A8C2] mt-2">
            {isSignUp
              ? "Sign up to access lender dashboard"
              : "Sign in to access portfolio analytics and batch assessment tools"}
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
            className="w-full px-4 py-3 rounded-xl text-sm text-[#EFF7FF] bg-[#070910] border border-[rgba(22,139,255,0.2)] focus:border-[#168BFF] outline-none transition-colors disabled:opacity-50"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl text-sm text-[#EFF7FF] bg-[#070910] border border-[rgba(22,139,255,0.2)] focus:border-[#168BFF] outline-none transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#168BFF] hover:bg-[#1278e0] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>
        <div className="text-center mt-6 space-y-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-[#94A8C2] hover:text-[#168BFF] transition-colors block w-full disabled:opacity-50"
          >
            {isSignUp ? "Already have an account? Sign in" : "New here? Create account"}
          </button>
          <p className="text-xs text-[#4A6080]">
            Are you a Business Owner?{" "}
            <a href="/login/borrower" className="text-[#168BFF] hover:underline">
              Sign in here →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
