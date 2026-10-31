import "./globals.css";
import { Providers } from "../context/Providers";
import TopNav from "../components/Sidebar";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Vridhi.ai — Predictive Credit Risk Analytics",
  description: "MSME credit-risk analytics platform with explainable AI, forecasting, and fairness analysis.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var storedTheme = localStorage.getItem('vridhi_theme') || 'light';
                document.documentElement.setAttribute('data-theme', storedTheme);
                if (storedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--surface-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                fontSize: "14px",
                borderRadius: "12px",
              },
              success: {
                iconTheme: {
                  primary: "#287657",
                  secondary: "#FFFFFF",
                },
              },
              error: {
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#FFFFFF",
                },
              },
            }}
          />
          {/* Fixed top navigation */}
          <TopNav />
          {/* Page content offset below nav */}
          <main className="min-h-screen pt-14">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
