"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  FileSearch,
  LayoutDashboard,
  Users,
  SlidersHorizontal,
  Scale,
  Upload,
  Menu,
  X,
  MessageCircle,
  Building2,
  User,
  Languages,
} from "lucide-react";

function VridhiLogo({ className = "" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/vridhi-logo.svg"
      alt="Vridhi.ai"
      className={className}
      style={{ height: 28, width: "auto", display: "block" }}
    />
  );
}

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handlePortalClick = (role) => {
    if (user) {
      router.push(role === "borrower" ? "/borrower" : "/lender");
    } else {
      router.push(role === "borrower" ? "/login/borrower" : "/login/lender");
    }
  };

  const isBorrowerPage = pathname.startsWith("/borrower");
  const isLenderPage = pathname.startsWith("/lender");
  const isLandingPage = pathname === "/" || pathname.startsWith("/#");

  const sectionItems = [
    { href: "/#home",        label: t("home") },
    { href: "/#about",       label: t("about") },
    { href: "/#features",    label: t("features") },
    { href: "/#how-it-works",label: t("how_it_works") },
  ];

  const borrowerNavItems = [
    { href: "/borrower", label: t("my_score"), icon: FileSearch },
    { href: "/borrower/simulator", label: t("simulator"), icon: SlidersHorizontal },
    { href: "/borrower/chat", label: t("ask_vridhi"), icon: MessageCircle },
  ];

  const lenderNavItems = [
    { href: "/lender", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/portfolio", label: t("portfolio"), icon: Users },
    { href: "/batch", label: t("batch_upload"), icon: Upload },
    { href: "/fairness", label: t("fairness"), icon: Scale },
  ];

  let activeNavItems = [];
  if (isLandingPage) {
    activeNavItems = sectionItems;
  } else if (isBorrowerPage) {
    activeNavItems = borrowerNavItems;
  } else if (isLenderPage) {
    activeNavItems = lenderNavItems;
  } else {
    activeNavItems = lenderNavItems;
  }

  const isActive = (href) => {
    if (href.includes("#")) {
      return pathname === href.split("#")[0];
    }
    return pathname === href || (href !== "/borrower" && href !== "/lender" && pathname.startsWith(href));
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16"
        style={{
          background: "rgba(7,9,16,0.92)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(22,139,255,0.12)",
        }}
      >
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-4">
          {/* Logo & Back to Home */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              aria-label="Vridhi.ai home"
              className="flex-shrink-0 flex items-center"
            >
              <VridhiLogo className="h-7 w-auto" />
            </Link>

            {!isLandingPage && (
              <Link
                href="/"
                className="hidden sm:inline-flex items-center text-xs font-medium text-[#94A8C2] hover:text-[#EFF7FF] transition-base"
              >
                ← {t("home")}
              </Link>
            )}

            {user && profile && (
              <span className="hidden lg:inline text-xs text-[#94A8C2]">
                Hi, {profile.full_name || user.email?.split("@")[0]}
              </span>
            )}
          </div>

          {/* Center Desktop nav */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
            {isLandingPage
              ? sectionItems.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#94A8C2] hover:text-[#EFF7FF] hover:bg-white/5 transition-base"
                  >
                    {label}
                  </a>
                ))
              : activeNavItems.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-base ${
                        active
                          ? "bg-[#168BFF]/15 text-[#EFF7FF] border border-[#168BFF]/30"
                          : "text-[#94A8C2] hover:text-[#EFF7FF] hover:bg-white/5"
                      }`}
                    >
                      {Icon && <Icon size={16} />}
                      {label}
                    </Link>
                  );
                })}
          </nav>

          {/* Right Side: Language Switcher, Portal Switcher Pills & User Greeting */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-base border border-white/15 hover:border-white/30 text-[#EFF7FF] bg-[#0C1C35]"
              title="Change Language / भाषा बदलें"
            >
              <Languages size={13} className="text-[#55D9FF]" />
              <span>{lang === "en" ? "हिंदी" : "English"}</span>
            </button>
            <button
              onClick={() => handlePortalClick("borrower")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-base ${
                isBorrowerPage
                  ? "bg-[#168BFF] text-white shadow-sm shadow-[#168BFF]/30"
                  : "bg-transparent text-[#EFF7FF] border border-[#168BFF]/40 hover:bg-[#168BFF]/10"
              }`}
            >
              <User size={13} />
              <span className="hidden sm:inline">{t("business_owner")}</span>
              <span className="sm:hidden">Borrower</span>
            </button>

            <button
              onClick={() => handlePortalClick("lender")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-base ${
                isLenderPage
                  ? "bg-[#168BFF] text-white shadow-sm shadow-[#168BFF]/30"
                  : "bg-transparent text-[#EFF7FF] border border-[#168BFF]/40 hover:bg-[#168BFF]/10"
              }`}
            >
              <Building2 size={13} />
              <span className="hidden sm:inline">{t("bank_lender")}</span>
              <span className="sm:hidden">Lender</span>
            </button>

            {user && (
              <button
                onClick={handleSignOut}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-[#94A8C2] border border-white/10 hover:text-[#EFF7FF] hover:border-white/20 transition-base"
              >
                {t("sign_out")}
              </button>
            )}

            {/* Mobile burger */}
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="md:hidden p-2 rounded-lg text-[#94A8C2] hover:text-[#EFF7FF] hover:bg-white/5 transition-base ml-1"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          id="mobile-nav"
          className="fixed inset-0 top-16 z-40 flex flex-col overflow-y-auto"
          style={{
            background: "rgba(7,9,16,0.98)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative p-6 space-y-4">
            <nav className="flex flex-col gap-2">
              {activeNavItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-base font-medium text-[#94A8C2] hover:text-[#EFF7FF] hover:bg-white/5 flex items-center gap-3 transition-base"
                >
                  {Icon && <Icon size={18} />}
                  {label}
                </Link>
              ))}
            </nav>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <button
                onClick={() => {
                  setLang(lang === "en" ? "hi" : "en");
                  setOpen(false);
                }}
                className="w-full py-2.5 rounded-xl border border-white/15 text-sm font-medium text-[#EFF7FF] flex items-center justify-center gap-2"
              >
                <Languages size={15} className="text-[#55D9FF]" />
                {lang === "en" ? "हिंदी में बदलें" : "Switch to English"}
              </button>
              {user && (
                <button
                  onClick={() => {
                    setOpen(false);
                    handleSignOut();
                  }}
                  className="w-full py-2.5 rounded-xl border border-white/10 text-sm font-medium text-[#94A8C2] hover:text-[#EFF7FF]"
                >
                  {t("sign_out")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
