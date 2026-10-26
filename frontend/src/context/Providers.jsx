"use client";
import { AuthProvider } from "./AuthContext";
import { AssessmentProvider } from "./AssessmentContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <AssessmentProvider>
        {children}
      </AssessmentProvider>
    </AuthProvider>
  );
}

export { Providers };
