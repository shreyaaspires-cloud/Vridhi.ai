"use client";
import { AuthProvider } from "./AuthContext";
import { AssessmentProvider } from "./AssessmentContext";
import { LanguageProvider } from "./LanguageContext";
import { ThemeProvider } from "./ThemeContext";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AssessmentProvider>
            {children}
          </AssessmentProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export { Providers };
