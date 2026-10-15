"use client";

import { AssessmentProvider } from "../context/AssessmentContext";

export function Providers({ children }) {
  return <AssessmentProvider>{children}</AssessmentProvider>;
}
