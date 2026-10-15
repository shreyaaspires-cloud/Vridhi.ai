"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  LogOut,
} from "lucide-react";

const sectionItems = [
  { href: "/#home",        label: "Home" },
  { href: "/#about",       label: "About" },
  { href: "/#features",    label: "Features" },
  { href: "/#how-it-works",label: "How it works" },
];

const borrowerNavItems = [
  { href: "/borrower", label: "My Score", icon: FileSearch },
  { href: "/borrower/simulator", label: "Simulator", icon: SlidersHorizontal },
  { href: "/borrower/chat", label: "Ask Vridhi", icon: MessageCircle },
];

const lenderNavItems = [
  { href: "/lender", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Users },
  { href: "/batch", label: "Batch Upload", icon: Upload },
  { href: "/fairness", label: "Fairness", icon: Scale },
];

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
  const [userName, setUserName] = useState("");

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("vridhi_user") || "{}");
      if (user.name) {
        setUserName(user.name);
      } else {
        setUserName("");
      }
    } catch {
      setUserName("");
    }
  }, [pathname]);

  const handlePortalClick = (role) => {
    try {
      const user = JSON.parse(localStorage.getItem("vridhi_user") || "{}");
      if (user.role === role) {
        router.push(role === "borrower" ? "/borrower" : "/lender");
      } else {
        router.push(role === "borrower" ? "/login/borrower" : "/login/lender");
      }
    } catch {
      router.push(role === "borrower" ? "/login/borrower" : "/login/lender");
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("vridhi_user");
    } catch {}
    setUserName("");
    router.push("/");
  };

  const isBorrowerPage = pathname.startsWith("/borrower");
  const isLenderPage = pathname.startsWith("/lender");
  const isLandingPage = pathname === "/" || pathname.startsWith("/#");

  let activeNavItems = [];
  if (isLandingPage) {
    activeNavItems = sectionItems;
  } else if (isBorrowerPage) {
    activeNavItems = borrowerNavItems;
  } else if (isLenderPage) {
    activeNavItems = lenderNavItems;
  } else {
    // Pages like /dashboard /portfolio /batch /fairness /simulator
    // redirect to lender portal since they are lender features
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
                ← Home
              </Link>
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

          {/* Right Side: Persistent Portal Switcher Pills & User Greeting */}
          <div className="flex items-center gap-2">
            {userName && (
              <div className="flex items-center gap-2 mr-1">
                <span className="hidden md:inline text-xs text-[#94A8C2]">
                  Hi, {userName}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1 rounded-md text-[#94A8C2] hover:text-[#FF5252] hover:bg-white/5 transition-colors flex items-center text-xs gap-1"
                >
                  <LogOut size={13} />
                  <span className="hidden lg:inline text-[11px]">Sign out</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => handlePortalClick("borrower")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-base ${
                isBorrowerPage
                  ? "bg-[#168BFF] text-white shadow-sm shadow-[#168BFF]/30"
                  : "bg-transparent text-[#EFF7FF] border border-[#168BFF]/40 hover:bg-[#168BFF]/10"
              }`}
            >
              <User size={13} />
              <span className="hidden sm:inline">Business Owner</span>
              <span className="sm:hidden">Borrower</span>
            </button>

            <button
              type="button"
              onClick={() => handlePortalClick("lender")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-base ${
                isLenderPage
                  ? "bg-[#168BFF] text-white shadow-sm shadow-[#168BFF]/30"
                  : "bg-transparent text-[#EFF7FF] border border-[#168BFF]/40 hover:bg-[#168BFF]/10"
              }`}
            >
              <Building2 size={13} />
              <span className="hidden sm:inline">Bank / Lender</span>
              <span className="sm:hidden">Lender</span>
            </button>

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
          <nav className="relative z-10 flex flex-col gap-1 p-5" aria-label="Mobile navigation">
            {!isLandingPage && (
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-[#94A8C2] hover:text-[#EFF7FF] hover:bg-white/5 transition-base mb-2 border-b border-white/5"
              >
                ← Home
              </Link>
            )}

            {isLandingPage
              ? sectionItems.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 rounded-xl text-base font-medium text-[#94A8C2] hover:text-[#EFF7FF] hover:bg-white/5 transition-base"
                  >
                    {label}
                  </a>
                ))
              : activeNavItems.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`px-4 py-3 rounded-xl text-base font-medium flex items-center gap-3 transition-base ${
                        isActive
                          ? "bg-[#168BFF]/15 text-[#EFF7FF] border border-[#168BFF]/30"
                          : "text-[#94A8C2] hover:text-[#EFF7FF] hover:bg-white/5"
                      }`}
                    >
                      {Icon && <Icon size={18} />}
                      {label}
                    </Link>
                  );
                })}
          </nav>
        </div>
      )}
    </>
  );
}
