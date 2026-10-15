"use client";

import { useAssessment } from "../../../context/AssessmentContext";
import Chatbot from "../../../components/Chatbot";
import { MessageCircle } from "lucide-react";

export default function BorrowerChatPage() {
  const { chatContext } = useAssessment();

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-[#168BFF]" />
          <h1 className="text-3xl font-bold text-[#EFF7FF]" style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}>
            Ask Vridhi Assistant
          </h1>
        </div>
        <p className="text-sm text-[#94A8C2] mt-1">
          Have questions about your credit score, financial health, or loan options? Chat with our AI advisor.
        </p>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-2xl border border-[#168BFF]/20">
        <Chatbot context={chatContext} title="Vridhi Assistant" embedded={true} />
      </div>
    </div>
  );
}
