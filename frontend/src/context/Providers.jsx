"use client";
import { AuthProvider } from "./AuthContext";
import { AssessmentProvider } from "./AssessmentContext";
import { LanguageProvider } from "./LanguageContext";

export default function Providers({ children }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AssessmentProvider>
          {children}
        </AssessmentProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export { Providers };
