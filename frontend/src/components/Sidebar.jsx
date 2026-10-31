"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import {
  FileSearch, LayoutDashboard, Users, SlidersHorizontal,
  Scale, Upload, Menu, X, MessageCircle, Building2, User, Languages,
  Sun, Moon,
} from "lucide-react";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme, mounted } = useTheme();

  const handleSignOut = async () => { await signOut(); router.push("/"); };

  const handlePortalClick = (role) => {
    router.push(user
      ? (role === "borrower" ? "/borrower" : "/lender")
      : (role === "borrower" ? "/login/borrower" : "/login/lender")
    );
  };

  const isBorrower  = pathname.startsWith("/borrower");
  const isLender    = pathname.startsWith("/lender");
  const isLanding   = pathname === "/" || pathname.startsWith("/#");

  const sectionItems = [
    { href: "/#home",         label: t("home") },
    { href: "/#about",        label: t("about") },
    { href: "/#features",     label: t("features") },
    { href: "/#how-it-works", label: t("how_it_works") },
  ];

  const borrowerItems = [
    { href: "/borrower",           label: t("my_score"),    icon: FileSearch },
    { href: "/borrower/simulator", label: t("simulator"),   icon: SlidersHorizontal },
    { href: "/borrower/chat",      label: t("ask_vridhi"),  icon: MessageCircle },
  ];

  const lenderItems = [
    { href: "/lender",    label: t("dashboard"),    icon: LayoutDashboard },
    { href: "/portfolio", label: t("portfolio"),    icon: Users },
    { href: "/batch",     label: t("batch_upload"), icon: Upload },
    { href: "/fairness",  label: t("fairness"),     icon: Scale },
  ];

  const activeItems = isLanding ? sectionItems : isBorrower ? borrowerItems : lenderItems;
  const isActive = (href) => href.includes("#") ? false : pathname === href || (href !== "/borrower" && href !== "/lender" && pathname.startsWith(href));

  const isDark = theme === "dark";

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16 transition-colors duration-200"
        style={{
          background: isDark
            ? "rgba(17, 26, 22, 0.94)"
            : isLanding
            ? "rgba(247, 246, 240, 0.94)"
            : "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: isDark
            ? "1px solid rgba(196, 174, 120, 0.16)"
            : "1px solid rgba(180, 154, 99, 0.20)",
        }}
      >
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Vridhi.ai home" className="flex-shrink-0 flex items-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/vridhi-logo.svg" alt="Vridhi.ai" style={{ height: 28, width: "auto" }} />
            </Link>
            {!isLanding && (
              <Link
                href="/"
                className="hidden sm:inline-flex items-center text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--brand-emerald)] transition-colors"
              >
                ← {t("home")}
              </Link>
            )}
            {user && profile && (
              <span className="hidden lg:inline text-xs text-[var(--text-muted)]">
                Hi, {profile.full_name || user.email?.split("@")[0]}
              </span>
            )}
          </div>

          {/* Centre nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {isLanding
              ? sectionItems.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className="px-3.5 py-1.5 rounded-md text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--brand-emerald)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    {label}
                  </a>
                ))
              : activeItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                      isActive(href)
                        ? "bg-[var(--brand-emerald)] text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    {Icon && <Icon size={16} />}
                    {label}
                  </Link>
                ))
            }
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border transition-all text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--brand-emerald)] hover:bg-[var(--surface-hover)]"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light Mode / लाइट मोड" : "Dark Mode / डार्क मोड"}
            >
              {mounted && isDark ? (
                <Sun size={15} className="text-[#C4AE78] hover:rotate-45 transition-transform" />
              ) : (
                <Moon size={15} className="text-[#287657] hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Lang toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--brand-emerald)] hover:bg-[var(--surface-hover)]"
              title="Change Language / भाषा बदलें"
            >
              <Languages size={13} className="text-[var(--brand-emerald)]" />
              <span>{lang === "en" ? "हिंदी" : "English"}</span>
            </button>

            {/* Business Owner (Borrower) Action */}
            <button
              onClick={() => handlePortalClick("borrower")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isBorrower
                  ? "bg-[var(--brand-primary)] text-white shadow-sm"
                  : "border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--brand-emerald)] hover:text-[var(--brand-emerald)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <User size={13} />
              <span className="hidden sm:inline">{t("business_owner")}</span>
              <span className="sm:hidden">Borrower</span>
            </button>

            {/* Bank / Lender Action */}
            <button
              onClick={() => handlePortalClick("lender")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isLender
                  ? "bg-[var(--brand-emerald)] text-white font-bold"
                  : "bg-[var(--brand-deep)] text-[#F7F6F0] hover:bg-[var(--brand-primary)] hover:shadow-md"
              }`}
            >
              <Building2 size={13} />
              <span className="hidden sm:inline">{t("bank_lender")}</span>
              <span className="sm:hidden">Lender</span>
            </button>

            {user && (
              <button
                onClick={handleSignOut}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                {t("sign_out")}
              </button>
            )}

            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              className="md:hidden p-2 rounded-lg transition-colors ml-1 text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div
            className="md:hidden border-b px-4 py-4 space-y-2 animate-in slide-in-from-top-2"
            style={{
              background: "var(--surface-card)",
              borderColor: "var(--border-default)",
            }}
          >
            {isLanding
              ? sectionItems.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  >
                    {label}
                  </a>
                ))
              : activeItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  >
                    {Icon && <Icon size={16} />}
                    {label}
                  </Link>
                ))
            }
          </div>
        )}
      </header>
    </>
  );
}
