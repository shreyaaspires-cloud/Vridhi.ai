"use client";

import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(null);

export const TRANSLATIONS = {
  en: {
    // TopNav
    home: "Home",
    about: "About",
    features: "Features",
    how_it_works: "How it works",
    my_score: "My Score",
    simulator: "Simulator",
    ask_vridhi: "Ask Vridhi",
    dashboard: "Dashboard",
    portfolio: "Portfolio",
    batch_upload: "Batch Upload",
    fairness: "Fairness",
    business_owner: "Business Owner",
    bank_lender: "Bank / Lender",
    sign_out: "Sign out",

    // Assessment Page
    assessment_title: "Business Credit Assessment",
    assessment_subtitle: "Fill in your operational business details below to calculate your credit risk score instantly.",
    model_inputs_title: "Model Inputs",
    model_inputs_desc: "These 8 features are used by the XGBoost model for credit-risk prediction.",
    business_name: "Business Name",
    annual_income: "Annual Income (₹)",
    loan_amount: "Requested Loan Amount (₹)",
    gst_compliance: "GST Compliance Rate (%)",
    upi_volume: "Monthly UPI Volume (₹)",
    utility_delay: "Utility Payment Delay (Days)",
    vendor_trust: "Vendor Trust Score (0-100)",
    sector: "Sector Type",
    afhi: "AFHI Score (0-100)",
    rev_history_title: "12-Month Revenue History (Cash Flow Forecasting Only)",
    assess_btn: "Assess Credit Risk",
    analyzing_btn: "Analyzing...",

    // Document Verification
    doc_verif_title: "Document Verification Pipeline",
    doc_verif_sub: "Upload official bank statements, GST filings, or certificates to independently cross-verify your reported figures.",
    upload_doc: "Upload Official Document",
    verify_btn: "Verify Document",

    // Results & Improvement
    score_change_improved: "🎉 Your credit score improved!",
    score_change_decreased: "⚠ Your credit score decreased.",
    why_score: "Why did you get this score?",
    how_improve: "How to improve your score",
    ask_assistant: "Ask Vridhi Assistant",
  },
  hi: {
    // TopNav
    home: "मुख्य पृष्ठ",
    about: "परिचय",
    features: "विशेषताएं",
    how_it_works: "यह कैसे काम करता है",
    my_score: "मेरा क्रेडिट स्कोर",
    simulator: "सिम्युलेटर",
    ask_vridhi: "वृद्धि सहायक",
    dashboard: "डैशबोर्ड",
    portfolio: "पोर्टफोलियो",
    batch_upload: "बैच अपलोड",
    fairness: "समानता रिपोर्ट",
    business_owner: "व्यवसाय स्वामी",
    bank_lender: "बैंक / ऋणदाता",
    sign_out: "लॉग आउट",

    // Assessment Page
    assessment_title: "व्यवसाय क्रेडिट जोखिम मूल्यांकन",
    assessment_subtitle: "तुरंत क्रेडिट स्कोर प्राप्त करने के लिए अपने व्यावसायिक वित्तीय विवरण दर्ज करें।",
    model_inputs_title: "मॉडल इनपुट",
    model_inputs_desc: "ये 8 मेट्रिक्स मशीन लर्निंग मॉडल द्वारा क्रेडिट स्कोर निर्धारित करने में उपयोग किए जाते हैं।",
    business_name: "व्यवसाय का नाम",
    annual_income: "वार्षिक आय (₹)",
    loan_amount: "ऋण राशि (₹)",
    gst_compliance: "जीएसटी अनुपालन दर (%)",
    upi_volume: "मासिक यूपीआई लेनदेन (₹)",
    utility_delay: "बिल भुगतान विलंब (दिन)",
    vendor_trust: "विक्रेता विश्वास स्कोर (0-100)",
    sector: "व्यवसाय क्षेत्र",
    afhi: "एएफएचआई वित्तीय स्वास्थ्य (0-100)",
    rev_history_title: "12-महीने का राजस्व इतिहास (केवल नकदी प्रवाह पूर्वानुमान हेतु)",
    assess_btn: "क्रेडिट जोखिम का मूल्यांकन करें",
    analyzing_btn: "विश्लेषण जारी है...",

    // Document Verification
    doc_verif_title: "दस्तावेज़ सत्यापन पाइपलाइन",
    doc_verif_sub: "अपने दर्ज आंकड़ों के स्वतंत्र सत्यापन के लिए बैंक स्टेटमेंट या जीएसटी रिटर्न अपलोड करें।",
    upload_doc: "आधिकारिक दस्तावेज़ अपलोड करें",
    verify_btn: "दस्तावेज़ सत्यापित करें",

    // Results & Improvement
    score_change_improved: "🎉 आपके क्रेडिट स्कोर में सुधार हुआ!",
    score_change_decreased: "⚠ आपके क्रेडिट स्कोर में कमी आई है।",
    why_score: "आपको यह स्कोर क्यों मिला?",
    how_improve: "अपना स्कोर कैसे सुधारें",
    ask_assistant: "वृद्धि सहायक से पूछें",
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vridhi_lang");
      if (saved && (saved === "en" || saved === "hi")) {
        setLang(saved);
      }
    } catch {}
  }, []);

  const changeLanguage = (newLang) => {
    if (newLang === "en" || newLang === "hi") {
      setLang(newLang);
      try {
        localStorage.setItem("vridhi_lang", newLang);
      } catch {}
    }
  };

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => {},
      t: (k) => TRANSLATIONS.en[k] || k,
    };
  }
  return ctx;
}