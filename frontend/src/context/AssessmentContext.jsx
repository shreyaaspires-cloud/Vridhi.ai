"use client";

import { createContext, useContext, useState, useCallback } from "react";

const AssessmentContext = createContext(null);

export function AssessmentProvider({ children }) {
  const [prediction, setPrediction] = useState(null);
  const [formData, setFormData] = useState(null);
  const [lastFormPayload, setLastFormPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatContext, setChatContext] = useState({});

  const submitPrediction = useCallback((result, formData = null) => {
    setPrediction(result);
    setFormData(formData);
    if (result) {
      setChatContext({
        business_name: result.business_name,
        risk_score: result.risk_score,
        risk_label: result.risk_label,
        confidence: result.confidence,
        default_probability: result.default_probability,
        factors: result.factors,
        recommendation: result.recommendation,
        revenue_history: formData?.revenue_history || [],
      });
    }
  }, []);

  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setFormData(null);
    setLastFormPayload(null);
    setError(null);
    setChatContext({});
  }, []);

  return (
    <AssessmentContext.Provider
      value={{
        prediction,
        formData,
        lastFormPayload,
        loading,
        error,
        chatContext,
        setFormData,
        setLastFormPayload,
        setLoading,
        setError,
        setPrediction,
        submitPrediction,
        clearPrediction,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) {
    throw new Error("useAssessment must be used within AssessmentProvider");
  }
  return ctx;
}
