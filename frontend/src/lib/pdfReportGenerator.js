/**
 * High-quality client-side PDF document generator for Vridhi.ai.
 * Emits strictly compliant PDF-1.4 documents without requiring bulky external dependencies.
 */

function escapePdfText(str) {
  return String(str || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " "); // Replace non-ascii with space for WinAnsi Helvetica
}

/**
 * Low-level PDF-1.4 builder
 * @param {Array<Array<Object>>} pagesData - Array of page command arrays
 * @returns {Uint8Array} raw PDF binary buffer
 */
export function buildPdfDocument(pagesData) {
  const catalogIdx = 1;
  const pagesIdx = 2;
  const fontHelvIdx = 3;
  const fontBoldIdx = 4;

  const pageCount = pagesData.length;
  const pageObjIds = [];
  const contentObjIds = [];

  for (let i = 0; i < pageCount; i++) {
    pageObjIds.push(5 + i * 2);
    contentObjIds.push(6 + i * 2);
  }

  const catalogObj = "<< /Type /Catalog /Pages 2 0 R >>";
  const pagesObj =
    "<< /Type /Pages /Kids [" +
    pageObjIds.map((id) => id + " 0 R").join(" ") +
    "] /Count " +
    pageCount +
    " >>";
  const fontHelv =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  const fontBold =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  const allObjs = [catalogObj, pagesObj, fontHelv, fontBold];

  for (let i = 0; i < pageCount; i++) {
    const pageObj =
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " +
      contentObjIds[i] +
      " 0 R >>";
    allObjs.push(pageObj);

    let stream = "";
    const commands = pagesData[i] || [];
    for (const cmd of commands) {
      if (cmd.type === "rect") {
        const [r, g, b] = cmd.color || [0, 0, 0];
        stream += `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg\n`;
        stream += `${cmd.x.toFixed(2)} ${cmd.y.toFixed(2)} ${cmd.w.toFixed(
          2
        )} ${cmd.h.toFixed(2)} re\nf\n`;
      } else if (cmd.type === "line") {
        const [r, g, b] = cmd.color || [0, 0, 0];
        stream += `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG\n`;
        stream += `${(cmd.w || 1).toFixed(2)} w\n`;
        stream += `${cmd.x1.toFixed(2)} ${cmd.y1.toFixed(2)} m\n`;
        stream += `${cmd.x2.toFixed(2)} ${cmd.y2.toFixed(2)} l\nS\n`;
      } else if (cmd.type === "text") {
        const [r, g, b] = cmd.color || [0, 0, 0];
        const fontName = cmd.bold ? "/F2" : "/F1";
        const size = cmd.size || 10;
        stream += "BT\n";
        stream += `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg\n`;
        stream += `${fontName} ${size.toFixed(2)} Tf\n`;
        stream += `1 0 0 1 ${cmd.x.toFixed(2)} ${cmd.y.toFixed(2)} Tm\n`;
        stream += `(${escapePdfText(cmd.text)}) Tj\nET\n`;
      }
    }

    const streamBytes = new TextEncoder().encode(stream);
    const contentObj = `<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`;
    allObjs.push(contentObj);
  }

  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  let body = "";
  const offsets = [];

  let currentOffset = new TextEncoder().encode(header).length;
  for (let i = 0; i < allObjs.length; i++) {
    offsets.push(currentOffset);
    const objStr = `${i + 1} 0 obj\n${allObjs[i]}\nendobj\n`;
    body += objStr;
    currentOffset += new TextEncoder().encode(objStr).length;
  }

  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${allObjs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < offsets.length; i++) {
    const off = String(offsets[i]).padStart(10, "0");
    xref += `${off} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${
    allObjs.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const fullPdfStr = header + body + xref + trailer;
  return new TextEncoder().encode(fullPdfStr);
}

/**
 * Triggers a browser download for a PDF file
 */
export function downloadPdfBlob(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Formats a currency number into INR string
 */
function formatInr(val) {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  return "INR " + Number(val).toLocaleString("en-IN");
}

/**
 * Generates and downloads the Borrower Credit Risk Assessment PDF Report
 */
export function generateBorrowerCreditReportPdf(prediction) {
  if (!prediction) return;

  const rec = prediction.recommendation || {};
  const businessName = prediction.business_name || "MSME Business";
  const assessmentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const page = [];

  // 1. Header Banner
  page.push({ type: "rect", x: 0, y: 760, w: 595.28, h: 82, color: [0.047, 0.11, 0.208] });
  page.push({ type: "text", text: "VRIDHI.AI", x: 40, y: 805, size: 20, bold: true, color: [0.333, 0.851, 1.0] });
  page.push({ type: "text", text: "CREDIT RISK ASSESSMENT REPORT", x: 155, y: 805, size: 13, bold: true, color: [0.937, 0.969, 1.0] });
  page.push({ type: "text", text: "Explainable MSME Alternative-Data Credit Scoring Engine", x: 40, y: 785, size: 9, bold: false, color: [0.58, 0.659, 0.761] });
  page.push({ type: "text", text: `Generated: ${assessmentDate}`, x: 380, y: 785, size: 8, bold: false, color: [0.58, 0.659, 0.761] });

  // 2. Business & Score Summary Card
  page.push({ type: "rect", x: 40, y: 645, w: 515, h: 100, color: [0.96, 0.98, 1.0] });
  page.push({ type: "line", x1: 40, y1: 745, x2: 555, y2: 745, w: 1, color: [0.086, 0.545, 1.0] });
  page.push({ type: "line", x1: 40, y1: 645, x2: 555, y2: 645, w: 1, color: [0.85, 0.9, 0.95] });

  page.push({ type: "text", text: "ASSESSMENT SUMMARY", x: 55, y: 725, size: 10, bold: true, color: [0.086, 0.545, 1.0] });
  page.push({ type: "text", text: `Business Name: ${businessName}`, x: 55, y: 705, size: 12, bold: true, color: [0.05, 0.1, 0.18] });
  page.push({ type: "text", text: `Sector: ${prediction.sector_type || "N/A"}   |   Business Size: ${prediction.business_size || "MSME"}   |   Region: ${prediction.region || "All India"}`, x: 55, y: 685, size: 9, bold: false, color: [0.35, 0.45, 0.55] });
  page.push({ type: "text", text: `Model Confidence: ${prediction.confidence !== undefined ? (prediction.confidence * 100).toFixed(1) + "%" : "High"}   |   Default Probability: ${prediction.default_probability !== undefined ? (prediction.default_probability * 100).toFixed(1) + "%" : "N/A"}`, x: 55, y: 665, size: 9, bold: false, color: [0.35, 0.45, 0.55] });

  // Score Pill on the right
  const isLow = prediction.risk_label === "LOW";
  const isMed = prediction.risk_label === "MEDIUM";
  const badgeColor = isLow ? [0.063, 0.725, 0.506] : isMed ? [0.961, 0.62, 0.043] : [0.937, 0.267, 0.267];

  page.push({ type: "rect", x: 420, y: 660, w: 120, h: 70, color: [1.0, 1.0, 1.0] });
  page.push({ type: "text", text: "CREDIT SCORE", x: 435, y: 712, size: 8, bold: true, color: [0.4, 0.5, 0.6] });
  page.push({ type: "text", text: `${prediction.risk_score} / 100`, x: 435, y: 690, size: 16, bold: true, color: [0.05, 0.1, 0.2] });
  page.push({ type: "text", text: `Risk: ${prediction.risk_label || "N/A"}`, x: 435, y: 672, size: 9, bold: true, color: badgeColor });

  // 3. Loan Recommendation Box
  page.push({ type: "text", text: "LOAN RECOMMENDATION & TERMS", x: 40, y: 620, size: 11, bold: true, color: [0.05, 0.1, 0.2] });
  page.push({ type: "line", x1: 40, y1: 612, x2: 555, y2: 612, w: 1, color: [0.85, 0.9, 0.95] });

  page.push({ type: "rect", x: 40, y: 530, w: 250, h: 72, color: [0.97, 0.98, 1.0] });
  page.push({ type: "text", text: "ELIGIBLE LOAN AMOUNT", x: 50, y: 582, size: 8, bold: true, color: [0.4, 0.5, 0.6] });
  page.push({ type: "text", text: rec.suggested_amount ? formatInr(rec.suggested_amount) : "Under Assessment", x: 50, y: 560, size: 13, bold: true, color: [0.086, 0.545, 1.0] });
  page.push({ type: "text", text: `Recommended limit based on revenue & UPI health`, x: 50, y: 542, size: 7.5, bold: false, color: [0.45, 0.55, 0.65] });

  page.push({ type: "rect", x: 305, y: 530, w: 250, h: 72, color: [0.97, 0.98, 1.0] });
  page.push({ type: "text", text: "INTEREST RATE & TENURE", x: 315, y: 582, size: 8, bold: true, color: [0.4, 0.5, 0.6] });
  page.push({ type: "text", text: `${rec.interest_rate_range || "Competitive Market Rate"}`, x: 315, y: 560, size: 12, bold: true, color: [0.05, 0.1, 0.2] });
  page.push({ type: "text", text: `Suggested Tenure: ${rec.repayment_period_months ? rec.repayment_period_months + " Months" : "12-36 Months"}`, x: 315, y: 542, size: 8.5, bold: false, color: [0.45, 0.55, 0.65] });

  // 4. Key Risk Drivers (SHAP Explainability)
  page.push({ type: "text", text: "KEY RISK DRIVERS & EXPLAINABILITY (SHAP ANALYSIS)", x: 40, y: 500, size: 11, bold: true, color: [0.05, 0.1, 0.2] });
  page.push({ type: "line", x1: 40, y1: 492, x2: 555, y2: 492, w: 1, color: [0.85, 0.9, 0.95] });

  const factors = (prediction.factors || []).slice(0, 5);
  let curY = 472;
  if (factors.length === 0) {
    page.push({ type: "text", text: "Comprehensive factor analysis available in portal dashboard.", x: 40, y: curY, size: 9, bold: false, color: [0.4, 0.5, 0.6] });
    curY -= 20;
  } else {
    for (const f of factors) {
      const isPos = f.direction === "positive" || (f.impact_points !== undefined ? f.impact_points >= 0 : (f.shap_value || 0) >= 0);
      const impactPts = f.impact_points !== undefined ? f.impact_points : Math.round((f.shap_value || 0) * 10) / 10;
      const featName = (f.feature || "Factor").replace(/_/g, " ").toUpperCase();
      const ptColor = isPos ? [0.063, 0.725, 0.506] : [0.937, 0.267, 0.267];

      page.push({ type: "rect", x: 40, y: curY - 5, w: 515, h: 26, color: [0.98, 0.99, 1.0] });
      page.push({ type: "text", text: `* ${featName}:`, x: 50, y: curY + 4, size: 8.5, bold: true, color: [0.1, 0.15, 0.25] });
      page.push({ type: "text", text: `${isPos ? "+" : ""}${impactPts} pts`, x: 230, y: curY + 4, size: 8.5, bold: true, color: ptColor });
      page.push({ type: "text", text: f.plain_english ? f.plain_english.slice(0, 55) : "", x: 285, y: curY + 4, size: 8, bold: false, color: [0.35, 0.45, 0.55] });
      curY -= 30;
    }
  }

  // 5. Improvement Recommendations
  page.push({ type: "text", text: "ACTIONABLE SCORE IMPROVEMENT RECOMMENDATIONS", x: 40, y: curY - 5, size: 11, bold: true, color: [0.05, 0.1, 0.2] });
  page.push({ type: "line", x1: 40, y1: curY - 13, x2: 555, y2: curY - 13, w: 1, color: [0.85, 0.9, 0.95] });
  curY -= 30;

  const tips = [
    { title: "Automate Monthly GST Filings", desc: "Maintaining a 90%+ on-time GST filing rate boosts risk scores by up to 15 points." },
    { title: "Route Commercial Sales Through UPI", desc: "Digital payment consistency provides continuous proof of turnover and customer trust." },
    { title: "Minimize Utility Delay Periods", desc: "Resolving electricity and municipal utility dues on time proves reliable operational cash flows." },
  ];

  for (const tip of tips) {
    page.push({ type: "text", text: `> ${tip.title}:`, x: 40, y: curY, size: 8.5, bold: true, color: [0.086, 0.545, 1.0] });
    page.push({ type: "text", text: tip.desc, x: 200, y: curY, size: 8, bold: false, color: [0.3, 0.4, 0.5] });
    curY -= 20;
  }

  // 6. Regulatory Disclaimer & Footer
  page.push({ type: "line", x1: 40, y1: 85, x2: 555, y2: 85, w: 0.5, color: [0.8, 0.85, 0.9] });
  page.push({ type: "text", text: "DISCLAIMER: This report is generated by Vridhi.ai using AI alternative-data credit assessment for demonstration and", x: 40, y: 70, size: 7, bold: false, color: [0.5, 0.55, 0.6] });
  page.push({ type: "text", text: "analytical purposes only. It does not constitute a formal loan sanction or binding commercial credit commitment.", x: 40, y: 58, size: 7, bold: false, color: [0.5, 0.55, 0.6] });
  page.push({ type: "text", text: "Page 1 of 1   *   Confidential MSME Credit Report   *   (c) Vridhi.ai", x: 40, y: 44, size: 7.5, bold: false, color: [0.4, 0.5, 0.6] });

  const safeName = businessName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Vridhi_Credit_Report_${safeName}.pdf`;

  const pdfBytes = buildPdfDocument([page]);
  downloadPdfBlob(pdfBytes, filename);
}

/**
 * Generates and downloads the Multi-Page Lender Portfolio PDF Report
 */
export function generatePortfolioReportPdf({
  portfolioData,
  filters = {},
}) {
  const points = portfolioData?.points || [];
  const total = portfolioData?.total ?? points.length;
  const avgScore = portfolioData?.average_score ?? 0;
  const lowCount = portfolioData?.LOW ?? 0;
  const medCount = portfolioData?.MEDIUM ?? 0;
  const highCount = portfolioData?.HIGH ?? 0;
  const approvalRate = portfolioData?.approval_rate ?? 0;

  const dateStr = new Date().toISOString().slice(0, 10);
  const genDateTime = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const appliedFiltersStr = `Sector: ${filters.sector || "All"}  |  Region: ${filters.region || "All"}  |  Business Size: ${filters.size || "All"}`;

  const pages = [];
  const rowsPerPage = 26;
  const totalPages = Math.max(1, Math.ceil(points.length / rowsPerPage));

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = [];

    // Header
    page.push({ type: "rect", x: 0, y: 770, w: 595.28, h: 72, color: [0.047, 0.11, 0.208] });
    page.push({ type: "text", text: "VRIDHI.AI", x: 40, y: 810, size: 18, bold: true, color: [0.333, 0.851, 1.0] });
    page.push({ type: "text", text: "LENDER PORTFOLIO RISK & AUDIT REPORT", x: 145, y: 810, size: 12, bold: true, color: [0.937, 0.969, 1.0] });
    page.push({ type: "text", text: `Applied Filters: ${appliedFiltersStr}`, x: 40, y: 790, size: 8, bold: false, color: [0.58, 0.659, 0.761] });
    page.push({ type: "text", text: `Generated: ${genDateTime}`, x: 380, y: 790, size: 8, bold: false, color: [0.58, 0.659, 0.761] });

    let curY = 745;

    // Show KPI block on Page 1
    if (pageNum === 1) {
      page.push({ type: "rect", x: 40, y: 685, w: 515, h: 50, color: [0.96, 0.98, 1.0] });
      page.push({ type: "line", x1: 40, y1: 735, x2: 555, y2: 735, w: 1, color: [0.086, 0.545, 1.0] });

      page.push({ type: "text", text: "PORTFOLIO SUMMARY METRICS", x: 50, y: 722, size: 8.5, bold: true, color: [0.086, 0.545, 1.0] });
      page.push({ type: "text", text: `Total Businesses: ${total}`, x: 50, y: 700, size: 9, bold: true, color: [0.05, 0.1, 0.2] });
      page.push({ type: "text", text: `Avg Score: ${avgScore}`, x: 160, y: 700, size: 9, bold: true, color: [0.05, 0.1, 0.2] });
      page.push({ type: "text", text: `Low Risk: ${lowCount}`, x: 250, y: 700, size: 9, bold: true, color: [0.063, 0.725, 0.506] });
      page.push({ type: "text", text: `Medium: ${medCount}`, x: 330, y: 700, size: 9, bold: true, color: [0.961, 0.62, 0.043] });
      page.push({ type: "text", text: `High: ${highCount}`, x: 400, y: 700, size: 9, bold: true, color: [0.937, 0.267, 0.267] });
      page.push({ type: "text", text: `Approval: ${approvalRate}%`, x: 460, y: 700, size: 9, bold: true, color: [0.086, 0.545, 1.0] });

      curY = 665;
    }

    // Table Header
    page.push({ type: "rect", x: 40, y: curY - 5, w: 515, h: 20, color: [0.1, 0.15, 0.25] });
    page.push({ type: "text", text: "BUSINESS NAME", x: 48, y: curY + 2, size: 8, bold: true, color: [1.0, 1.0, 1.0] });
    page.push({ type: "text", text: "SECTOR", x: 210, y: curY + 2, size: 8, bold: true, color: [1.0, 1.0, 1.0] });
    page.push({ type: "text", text: "REGION", x: 295, y: curY + 2, size: 8, bold: true, color: [1.0, 1.0, 1.0] });
    page.push({ type: "text", text: "SIZE", x: 360, y: curY + 2, size: 8, bold: true, color: [1.0, 1.0, 1.0] });
    page.push({ type: "text", text: "SCORE", x: 425, y: curY + 2, size: 8, bold: true, color: [1.0, 1.0, 1.0] });
    page.push({ type: "text", text: "RISK LEVEL", x: 485, y: curY + 2, size: 8, bold: true, color: [1.0, 1.0, 1.0] });
    curY -= 20;

    // Table Rows
    const startIdx = (pageNum - 1) * rowsPerPage;
    const pageRows = points.slice(startIdx, startIdx + rowsPerPage);

    if (pageRows.length === 0) {
      page.push({ type: "text", text: "No portfolio businesses match the selected filters.", x: 48, y: curY - 10, size: 9, bold: false, color: [0.45, 0.55, 0.65] });
    } else {
      let rIdx = 0;
      for (const row of pageRows) {
        const bg = rIdx % 2 === 0 ? [0.98, 0.99, 1.0] : [1.0, 1.0, 1.0];
        page.push({ type: "rect", x: 40, y: curY - 5, w: 515, h: 18, color: bg });

        const bName = (row.business || "MSME").slice(0, 28);
        const sector = (row.sector || "N/A").slice(0, 14);
        const region = (row.region || "N/A").slice(0, 10);
        const size = (row.size || "N/A").slice(0, 10);
        const score = Number(row.risk_score || row.y || 0).toFixed(1);
        const riskLabel = row.risk_label || (score >= 60 ? "LOW" : score >= 40 ? "MEDIUM" : "HIGH");
        const rColor = riskLabel === "LOW" ? [0.063, 0.725, 0.506] : riskLabel === "MEDIUM" ? [0.961, 0.62, 0.043] : [0.937, 0.267, 0.267];

        page.push({ type: "text", text: bName, x: 48, y: curY + 1, size: 8, bold: false, color: [0.05, 0.1, 0.2] });
        page.push({ type: "text", text: sector, x: 210, y: curY + 1, size: 8, bold: false, color: [0.35, 0.45, 0.55] });
        page.push({ type: "text", text: region, x: 295, y: curY + 1, size: 8, bold: false, color: [0.35, 0.45, 0.55] });
        page.push({ type: "text", text: size, x: 360, y: curY + 1, size: 8, bold: false, color: [0.35, 0.45, 0.55] });
        page.push({ type: "text", text: score, x: 430, y: curY + 1, size: 8, bold: true, color: [0.05, 0.1, 0.2] });
        page.push({ type: "text", text: riskLabel, x: 490, y: curY + 1, size: 8, bold: true, color: rColor });

        curY -= 19;
        rIdx++;
      }
    }

    // Footer
    page.push({ type: "line", x1: 40, y1: 50, x2: 555, y2: 50, w: 0.5, color: [0.8, 0.85, 0.9] });
    page.push({
      type: "text",
      text: `Vridhi.ai Institutional Portfolio Intelligence  *  Confidential  *  Page ${pageNum} of ${totalPages}`,
      x: 40,
      y: 38,
      size: 7.5,
      bold: false,
      color: [0.4, 0.5, 0.6],
    });

    pages.push(page);
  }

  const filename = `Vridhi_Portfolio_Report_${dateStr}.pdf`;
  const pdfBytes = buildPdfDocument(pages);
  downloadPdfBlob(pdfBytes, filename);
}
