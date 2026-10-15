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
    <html lang="en">
      <body>
        <Providers>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0C1C35",
                color: "#EFF7FF",
                border: "1px solid rgba(22,139,255,0.25)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                fontSize: "14px",
                borderRadius: "12px",
              },
              success: {
                iconTheme: {
                  primary: "#10B981",
                  secondary: "#0C1C35",
                },
              },
              error: {
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#0C1C35",
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
