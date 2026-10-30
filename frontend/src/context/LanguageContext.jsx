"use client";

import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(null);

export const TRANSLATIONS = {
  en: {
    // TopNav & Navigation
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

    // General / Branding
    app_name: "Vridhi.ai",
    powered_by: "Powered by Explainable AI",
    dismiss: "Dismiss",
    before: "Before",
    after: "After",

    // Assessment Hero & Headers
    hero_title: "Check Your Credit Eligibility",
    hero_subtitle: "Get a transparent, AI-powered credit score based on your actual business performance — not just your CIBIL score.",
    assessment_title: "Business Credit Assessment",
    assessment_subtitle: "Fill in your business details to get your AI-powered credit score",
    submit_assessment: "Run Credit Assessment",
    submitting: "Analysing...",
    assess_btn: "Assess Credit Risk",
    analyzing_btn: "Analyzing...",

    // Form Sections & Descriptions
    model_inputs: "Model Inputs",
    model_inputs_sub: "These 8 features are used by the XGBoost model for credit-risk prediction.",
    model_inputs_title: "Model Inputs",
    model_inputs_desc: "These 8 features are used by the XGBoost model for credit-risk prediction.",
    metadata_inputs: "Metadata & Audit Inputs",
    metadata_inputs_sub: "These fields are used for segmentation, fairness analysis, and forecasting — NOT model inputs.",

    // Form Field Labels
    business_name: "Business Name",
    annual_income: "Annual Income (INR)",
    loan_amount: "Loan Amount (INR)",
    gst_compliance: "GST Compliance Rate (%)",
    monthly_upi: "Monthly UPI Volume (INR)",
    upi_volume: "Monthly UPI Volume (₹)",
    utility_delay: "Utility Delay Days",
    vendor_trust: "Vendor Trust Score",
    afhi_score: "AFHI Score",
    sector: "Sector Type",
    sector_type: "Sector Type",
    afhi: "AFHI Score (0-100)",
    owner_gender: "Owner Gender",
    region: "Region",
    business_size: "Business Size",
    years_operation: "Years in Operation",
    employee_count: "Employee Count",
    revenue_history: "Revenue History (last 6–12 months, comma-separated)",
    rev_history_title: "12-Month Revenue History (Cash Flow Forecasting Only)",
    revenue_hint: "Used for cash-flow forecasting only — does not directly affect your credit score.",

    // Score History & Actions
    previous_assessments: "Previous Assessments",
    clear_history: "Clear history",
    download_report: "Download Report",

    // Score Results & Breakdown
    score_result_title: "Your Credit Assessment Result",
    score_low_msg: "Great news! Your business shows strong creditworthiness.",
    score_medium_msg: "Your business shows moderate risk. See tips below to improve.",
    score_high_msg: "Your application needs improvement. Follow the tips below.",
    loan_recommendation: "Loan Recommendation",
    eligible_amount: "Eligible Amount",
    suggested_rate: "Suggested Interest Rate",
    repayment_period: "Repayment Period",
    key_drivers: "Key Drivers",
    score_explanation_title: "Why did you get this score?",
    score_explanation_sub: "Top 5 factors contributing to your score breakdown (SHAP TreeExplainer). Green bars boosted your score, red bars reduced it.",
    why_score: "Why did you get this score?",
    how_improve: "How to improve your score",
    improvement_tips: "Improvement Tips",
    ask_assistant: "Ask Vridhi Assistant",

    // Score Change Notifications
    score_change_improved: "Score Improved!",
    score_change_decreased: "Score Decreased",
    score_changed_from: "Score changed from",
    score_changed_to: "to",

    // Document Verification
    doc_verif_title: "Document Verification",
    doc_verif_sub: "Upload a GST return, bank statement, or ITR to verify your submitted data",
    upload_doc: "Upload Official Document",
    verify_btn: "Verify Document",

    // Simulator
    simulator_title: "Scenario Simulator",
    simulator_sub: "Adjust business parameters and macro scenarios to see how credit scores change.",
    run_simulation: "Run Simulation",
    simulating: "Simulating…",
    simulation_results: "Simulation Results",
    applied_values: "Applied Values",
    income_change: "Income Change",
    loan_change: "Loan Amount Change",
    gst_change: "GST Compliance Change",
    utility_change: "Utility Delay Change",
    upi_change: "UPI Volume Change",
    vendor_change: "Vendor Trust Change",
    macro_scenario: "Macro Scenario",
  },
  hi: {
    // TopNav & Navigation
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

    // General / Branding
    app_name: "वृद्धि.एआई",
    powered_by: "एक्सप्लेनेबल AI द्वारा संचालित",
    dismiss: "बंद करें",
    before: "पहले",
    after: "बाद में",

    // Assessment Hero & Headers
    hero_title: "अपनी क्रेडिट पात्रता जांचें",
    hero_subtitle: "अपने वास्तविक व्यापार प्रदर्शन पर आधारित पारदर्शी, AI-आधारित क्रेडिट स्कोर पाएं — केवल CIBIL स्कोर नहीं।",
    assessment_title: "व्यापार ऋण मूल्यांकन",
    assessment_subtitle: "अपना AI-आधारित क्रेडिट स्कोर पाने के लिए व्यापार विवरण भरें",
    submit_assessment: "क्रेडिट मूल्यांकन चलाएं",
    submitting: "विश्लेषण हो रहा है...",
    assess_btn: "क्रेडिट जोखिम का मूल्यांकन करें",
    analyzing_btn: "विश्लेषण जारी है...",

    // Form Sections & Descriptions
    model_inputs: "मॉडल इनपुट",
    model_inputs_sub: "ये 8 विशेषताएँ XGBoost मॉडल द्वारा क्रेडिट जोखिम पूर्वानुमान के लिए उपयोग की जाती हैं।",
    model_inputs_title: "मॉडल इनपुट",
    model_inputs_desc: "ये 8 मेट्रिक्स मशीन लर्निंग मॉडल द्वारा क्रेडिट स्कोर निर्धारित करने में उपयोग किए जाते हैं।",
    metadata_inputs: "मेटाडेटा और ऑडिट इनपुट",
    metadata_inputs_sub: "ये फ़ील्ड विभाजन, निष्पक्षता विश्लेषण और पूर्वानुमान के लिए हैं — मॉडल इनपुट नहीं।",

    // Form Field Labels
    business_name: "व्यापार का नाम",
    annual_income: "वार्षिक आय (₹)",
    loan_amount: "ऋण राशि (₹)",
    gst_compliance: "जीएसटी अनुपालन दर (%)",
    monthly_upi: "मासिक UPI मात्रा (₹)",
    upi_volume: "मासिक यूपीआई लेनदेन (₹)",
    utility_delay: "उपयोगिता विलंब दिन",
    vendor_trust: "विक्रेता विश्वास स्कोर",
    afhi_score: "AFHI स्कोर",
    sector: "क्षेत्र प्रकार",
    sector_type: "क्षेत्र प्रकार",
    afhi: "एएफएचआई वित्तीय स्वास्थ्य (0-100)",
    owner_gender: "मालिक का लिंग",
    region: "क्षेत्र",
    business_size: "व्यापार का आकार",
    years_operation: "संचालन वर्ष",
    employee_count: "कर्मचारी संख्या",
    revenue_history: "राजस्व इतिहास (पिछले 6-12 माह, अल्पविराम से अलग)",
    rev_history_title: "12-महीने का राजस्व इतिहास (केवल नकदी प्रवाह पूर्वानुमान हेतु)",
    revenue_hint: "केवल नकदी प्रवाह पूर्वानुमान के लिए — क्रेडिट स्कोर पर सीधा प्रभाव नहीं।",

    // Score History & Actions
    previous_assessments: "पिछले मूल्यांकन",
    clear_history: "इतिहास साफ़ करें",
    download_report: "रिपोर्ट डाउनलोड करें",

    // Score Results & Breakdown
    score_result_title: "आपका क्रेडिट मूल्यांकन परिणाम",
    score_low_msg: "बढ़िया! आपका व्यापार मजबूत ऋण पात्रता दर्शाता है।",
    score_medium_msg: "आपका व्यापार मध्यम जोखिम दिखाता है। सुधार के लिए नीचे सुझाव देखें।",
    score_high_msg: "आपके आवेदन में सुधार की आवश्यकता है। नीचे दिए सुझाव देखें।",
    loan_recommendation: "ऋण अनुशंसा",
    eligible_amount: "पात्र राशि",
    suggested_rate: "सुझावित ब्याज दर",
    repayment_period: "पुनर्भुगतान अवधि",
    key_drivers: "मुख्य कारण",
    score_explanation_title: "यह स्कोर क्यों मिला?",
    score_explanation_sub: "आपके स्कोर में योगदान देने वाले शीर्ष 5 कारक (SHAP TreeExplainer)। हरे बार ने स्कोर बढ़ाया, लाल बार ने घटाया।",
    why_score: "आपको यह स्कोर क्यों मिला?",
    how_improve: "अपना स्कोर कैसे सुधारें",
    improvement_tips: "सुधार सुझाव",
    ask_assistant: "वृद्धि सहायक से पूछें",

    // Score Change Notifications
    score_change_improved: "स्कोर में सुधार!",
    score_change_decreased: "स्कोर में कमी",
    score_changed_from: "स्कोर बदला",
    score_changed_to: "से",

    // Document Verification
    doc_verif_title: "दस्तावेज़ सत्यापन",
    doc_verif_sub: "अपने डेटा को सत्यापित करने के लिए GST रिटर्न, बैंक स्टेटमेंट या ITR अपलोड करें",
    upload_doc: "आधिकारिक दस्तावेज़ अपलोड करें",
    verify_btn: "दस्तावेज़ सत्यापित करें",

    // Simulator
    simulator_title: "परिदृश्य सिमुलेटर",
    simulator_sub: "क्रेडिट स्कोर बदलाव देखने के लिए व्यापार मापदंड और व्यापक परिदृश्य समायोजित करें।",
    run_simulation: "सिमुलेशन चलाएं",
    simulating: "सिमुलेशन हो रहा है…",
    simulation_results: "सिमुलेशन परिणाम",
    applied_values: "लागू मूल्य",
    income_change: "आय परिवर्तन",
    loan_change: "ऋण राशि परिवर्तन",
    gst_change: "GST अनुपालन परिवर्तन",
    utility_change: "उपयोगिता विलंब परिवर्तन",
    upi_change: "UPI मात्रा परिवर्तन",
    vendor_change: "विक्रेता विश्वास परिवर्तन",
    macro_scenario: "व्यापक परिदृश्य",
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
