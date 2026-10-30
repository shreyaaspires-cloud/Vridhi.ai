"use client";

import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(null);

export const TRANSLATIONS = {
  en: {
    // Navigation & Common
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
    app_name: "Vridhi.ai",
    powered_by: "Powered by Explainable AI",
    dismiss: "Dismiss",
    search: "Search",
    loading: "Loading...",
    all: "All",

    // Borrower Portal
    hero_title: "Check Your Credit Eligibility",
    hero_subtitle: "Get a transparent, AI-powered credit score based on your actual business performance — not just your CIBIL score.",
    assessment_title: "Business Credit Assessment",
    assessment_subtitle: "Fill in your business details to get your AI-powered credit score",
    submit_assessment: "Run Credit Assessment",
    submitting: "Analysing...",
    assess_btn: "Assess Credit Risk",
    analyzing_btn: "Analyzing...",
    model_inputs: "Model Inputs",
    model_inputs_sub: "These 8 features are used by the XGBoost model for credit-risk prediction.",
    metadata_inputs: "Metadata & Audit Inputs",
    metadata_inputs_sub: "These fields are used for segmentation, fairness analysis, and forecasting — NOT model inputs.",
    business_name: "Business Name",
    annual_income: "Annual Income (INR)",
    loan_amount: "Loan Amount (INR)",
    gst_compliance: "GST Compliance Rate (%)",
    monthly_upi: "Monthly UPI Volume (INR)",
    utility_delay: "Utility Delay Days",
    vendor_trust: "Vendor Trust Score",
    afhi_score: "AFHI Score",
    sector: "Sector Type",
    owner_gender: "Owner Gender",
    region: "Region",
    business_size: "Business Size",
    years_operation: "Years in Operation",
    employee_count: "Employee Count",
    revenue_history: "Revenue History (last 6–12 months, comma-separated)",
    previous_assessments: "Previous Assessments",
    clear_history: "Clear history",
    download_report: "Download Credit Report (PDF)",
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
    how_improve: "How to improve your score",
    improvement_tips: "Improvement Tips",
    ask_assistant: "Ask Vridhi Assistant",

    // Document Verification
    doc_verif_title: "Document Verification",
    doc_verif_sub: "Upload a GST return, bank statement, or ITR to verify your submitted data",
    upload_doc: "Upload Official Document",
    verify_btn: "Verify Document",
    verifying_btn: "Verifying...",
    verified_demo: "Verified (Demo Mode)",
    drag_drop_text: "Drag and drop your official document here, or click to browse",
    select_doc_type: "Select Document Type",

    // Bank / Lender Portal
    lender_badge: "For Banks & NBFCs",
    lender_hero_title: "Lender Intelligence Dashboard",
    lender_hero_sub: "Assess, segment, and manage MSME credit risk across your entire portfolio with explainable AI.",
    total_assessed: "Total Assessed",
    msme_apps: "MSME Applications",
    low_risk: "Low Risk",
    low_risk_sub: "Approved / Preferential Rate",
    medium_risk: "Medium Risk",
    medium_risk_sub: "Conditional Review",
    high_risk: "High Risk",
    high_risk_sub: "High Default Probability",
    batch_title: "Batch Assessment",
    batch_desc: "Upload a CSV file with multiple MSME applications and receive instant batch credit risk scores.",
    go_to_batch: "Go to Batch Scoring →",
    regulatory_fairness: "Regulatory Fairness Report",
    fairness_sub: "Demographic approval rate comparisons to monitor AI lending model equality.",
    rbi_compliance_title: "RBI Compliance & Demographic Fairness Monitor",
    rbi_compliance_desc: "All demographic sub-groups (gender, region, firm size) are within the acceptable variance threshold (<15% deviation). Model complies with fair lending standards.",
    approval_by_region: "Approval Rate by Region",
    approval_by_gender: "Approval Rate by Ownership Gender",
    lookup_title: "Look Up a Business",
    lookup_placeholder: "Enter Business Name or ID...",
    no_record_found: "No record found. Use the assessment form to add this business.",
    score_label: "Score",
    underwriting_notes: "Lender Underwriting Notes",

    // Portfolio Page
    portfolio_title: "Portfolio & Segmentation",
    portfolio_sub: "Risk distribution across the MSME portfolio",
    total_businesses: "Total Businesses",
    avg_score: "Avg Score",
    approval_rate: "Approval Rate",
    pct_of_portfolio: "% of portfolio",
    filter_sector: "Sector",
    filter_region: "Region",
    filter_size: "Business Size",
    filter_x: "X Axis",
    filter_y: "Y Axis",
    no_portfolio_data: "No portfolio data available for the selected filters.",
    download_portfolio_pdf: "Download Full Portfolio Report (PDF)",
    downloading_portfolio_pdf: "Generating Report...",
  },
  hi: {
    // Navigation & Common
    home: "होम",
    about: "हमारे बारे में",
    features: "विशेषताएँ",
    how_it_works: "यह कैसे काम करता है",
    my_score: "मेरा स्कोर",
    simulator: "सिम्युलेटर",
    ask_vridhi: "वृद्धि से पूछें",
    dashboard: "डैशबोर्ड",
    portfolio: "पोर्टफोलियो",
    batch_upload: "बैच अपलोड",
    fairness: "निष्पक्षता",
    business_owner: "व्यापार मालिक",
    bank_lender: "बैंक / ऋणदाता",
    sign_out: "साइन आउट",
    app_name: "वृद्धि.एआई",
    powered_by: "व्याख्यात्मक AI द्वारा संचालित",
    dismiss: "खारिज करें",
    search: "खोजें",
    loading: "लोड हो रहा है...",
    all: "सभी",

    // Borrower Portal
    hero_title: "अपनी ऋण पात्रता जांचें",
    hero_subtitle: "अपने वास्तविक व्यावसायिक प्रदर्शन के आधार पर पारदर्शी, AI-संचालित क्रेडिट स्कोर प्राप्त करें — केवल सिबिल स्कोर नहीं।",
    assessment_title: "व्यापार ऋण मूल्यांकन",
    assessment_subtitle: "अपना AI-आधारित क्रेडिट स्कोर पाने के लिए व्यापार विवरण भरें",
    submit_assessment: "क्रेडिट मूल्यांकन चलाएं",
    submitting: "विश्लेषण हो रहा है...",
    assess_btn: "क्रेडिट जोखिम का मूल्यांकन करें",
    analyzing_btn: "विश्लेषण हो रहा है...",
    model_inputs: "मॉडल इनपुट",
    model_inputs_sub: "ये 8 विशेषताएँ XGBoost मॉडल द्वारा क्रेडिट जोखिम पूर्वानुमान के लिए उपयोग की जाती हैं।",
    metadata_inputs: "मेटाडेटा और ऑडिट इनपुट",
    metadata_inputs_sub: "ये फ़ील्ड विभाजन, निष्पक्षता विश्लेषण और पूर्वानुमान के लिए हैं — मॉडल इनपुट नहीं।",
    business_name: "व्यापार का नाम",
    annual_income: "वार्षिक आय (रुपये)",
    loan_amount: "ऋण राशि (रुपये)",
    gst_compliance: "जीएसटी अनुपालन दर (%)",
    monthly_upi: "मासिक यूपीआई वॉल्यूम (रुपये)",
    utility_delay: "उपयोगिता बिल विलंब (दिन)",
    vendor_trust: "विक्रेता विश्वास स्कोर",
    afhi_score: "एएफएचआई स्कोर",
    sector: "क्षेत्र प्रकार",
    owner_gender: "मालिक का लिंग",
    region: "क्षेत्र / राज्य",
    business_size: "व्यवसाय का आकार",
    years_operation: "कार्यकाल (वर्ष)",
    employee_count: "कर्मचारियों की संख्या",
    revenue_history: "राजस्व इतिहास (पिछले 6-12 महीने, अल्पविराम से अलग)",
    previous_assessments: "पिछले मूल्यांकन",
    clear_history: "इतिहास साफ़ करें",
    download_report: "क्रेडिट रिपोर्ट डाउनलोड करें (PDF)",
    score_result_title: "आपका क्रेडिट मूल्यांकन परिणाम",
    score_low_msg: "शानदार खबर! आपका व्यवसाय मजबूत क्रेडिट योग्यता प्रदर्शित करता है।",
    score_medium_msg: "आपका व्यवसाय मध्यम जोखिम दर्शाता है। सुधार के सुझाव नीचे देखें।",
    score_high_msg: "आपके आवेदन में सुधार की आवश्यकता है। कृपया नीचे दिए गए सुझाव अपनाएं।",
    loan_recommendation: "ऋण अनुशंसा",
    eligible_amount: "पात्र ऋण राशि",
    suggested_rate: "अनुशंसित ब्याज दर",
    repayment_period: "चुकौती अवधि",
    key_drivers: "प्रमुख कारक",
    score_explanation_title: "आपको यह स्कोर क्यों मिला?",
    score_explanation_sub: "आपके स्कोर में योगदान देने वाले शीर्ष 5 कारक (SHAP TreeExplainer)। हरे बार ने स्कोर बढ़ाया, लाल बार ने घटाया।",
    how_improve: "अपना स्कोर कैसे सुधारें",
    improvement_tips: "सुधार सुझाव",
    ask_assistant: "वृद्धि सहायक से पूछें",

    // Document Verification
    doc_verif_title: "दस्तावेज़ सत्यापन",
    doc_verif_sub: "अपने सबमिट किए गए डेटा को सत्यापित करने के लिए जीएसटी रिटर्न, बैंक स्टेटमेंट या आईटीआर अपलोड करें",
    upload_doc: "आधिकारिक दस्तावेज़ अपलोड करें",
    verify_btn: "दस्तावेज़ सत्यापित करें",
    verifying_btn: "सत्यापन हो रहा है...",
    verified_demo: "सत्यापित (डेमो मोड)",
    drag_drop_text: "यहाँ अपना दस्तावेज़ खींचें और छोड़ें, या फ़ाइल चुनने के लिए क्लिक करें",
    select_doc_type: "दस्तावेज़ का प्रकार चुनें",

    // Bank / Lender Portal
    lender_badge: "बैंकों एवं एनबीएफसी हेतु",
    lender_hero_title: "ऋणदाता इंटेलिजेंस डैशबोर्ड",
    lender_hero_sub: "व्याख्यात्मक AI के साथ अपने संपूर्ण पोर्टफोलियो में एमएसएमई क्रेडिट जोखिम का मूल्यांकन, विभाजन और प्रबंधन करें।",
    total_assessed: "कुल मूल्यांकित",
    msme_apps: "एमएसएमई आवेदन",
    low_risk: "कम जोखिम",
    low_risk_sub: "स्वीकृत / अधिमान्य दर",
    medium_risk: "मध्यम जोखिम",
    medium_risk_sub: "सशर्त समीक्षा",
    high_risk: "उच्च जोखिम",
    high_risk_sub: "उच्च डिफ़ॉल्ट संभावना",
    batch_title: "बैच मूल्यांकन",
    batch_desc: "एकाधिक एमएसएमई अनुप्रयोगों के साथ एक सीएसवी फ़ाइल अपलोड करें और तत्काल बैच स्कोर प्राप्त करें।",
    go_to_batch: "बैच स्कोरिंग पर जाएं →",
    regulatory_fairness: "नियामक निष्पक्षता रिपोर्ट",
    fairness_sub: "AI ऋण मॉडल समानता की निगरानी के लिए जनसांख्यिकीय अनुमोदन दर तुलना।",
    rbi_compliance_title: "आरबीआई अनुपालन एवं जनसांख्यिकीय निष्पक्षता मॉनिटर",
    rbi_compliance_desc: "सभी जनसांख्यिकीय उप-समूह स्वीकार्य विचरण सीमा (<15% विचलन) के भीतर हैं। मॉडल निष्पक्ष ऋण मानकों का अनुपालन करता है।",
    approval_by_region: "क्षेत्रवार अनुमोदन दर",
    approval_by_gender: "स्वामित्व लिंग के आधार पर अनुमोदन दर",
    lookup_title: "व्यवसाय खोजें",
    lookup_placeholder: "व्यवसाय का नाम या आईडी दर्ज करें...",
    no_record_found: "कोई रिकॉर्ड नहीं मिला। इस व्यवसाय को जोड़ने के लिए मूल्यांकन फ़ॉर्म का उपयोग करें।",
    score_label: "स्कोर",
    underwriting_notes: "ऋणदाता अंडरराइटिंग नोट्स",

    // Portfolio Page
    portfolio_title: "पोर्टफोलियो और विभाजन",
    portfolio_sub: "एमएसएमई पोर्टफोलियो में जोखिम वितरण",
    total_businesses: "कुल व्यवसाय",
    avg_score: "औसत स्कोर",
    approval_rate: "अनुमोदन दर",
    pct_of_portfolio: "% पोर्टफोलियो का",
    filter_sector: "क्षेत्र",
    filter_region: "राज्य / क्षेत्र",
    filter_size: "व्यवसाय आकार",
    filter_x: "X अक्ष",
    filter_y: "Y अक्ष",
    no_portfolio_data: "चयनित फ़िल्टर के लिए कोई पोर्टफोलियो डेटा उपलब्ध नहीं है।",
    download_portfolio_pdf: "पूर्ण पोर्टफोलियो रिपोर्ट डाउनलोड करें (PDF)",
    downloading_portfolio_pdf: "रिपोर्ट तैयार हो रही है...",
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
