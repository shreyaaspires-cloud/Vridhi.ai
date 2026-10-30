import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { StickyNote, Send, Clock, Trash2, ShieldAlert, UserCheck } from "lucide-react";

export default function LenderNotesPanel({ businessName, scoreHistoryId = null }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!businessName) return;
    setLoading(true);
    try {
      let query = supabase
        .from("lender_notes")
        .select("id, note_text, created_at, lender_user_id")
        .eq("borrower_business_name", businessName)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.warn("Could not fetch lender notes from Supabase:", error.message);
        // Fallback to local storage
        const saved = JSON.parse(localStorage.getItem(`vridhi_notes_${businessName}`) || "[]");
        setNotes(saved);
      } else {
        setNotes(data || []);
      }
    } catch (e) {
      console.warn("Lender notes fetch error:", e);
      const saved = JSON.parse(localStorage.getItem(`vridhi_notes_${businessName}`) || "[]");
      setNotes(saved);
    } finally {
      setLoading(false);
    }
  }, [businessName]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSubmitting(true);
    const newNoteObj = {
      id: crypto.randomUUID(),
      lender_user_id: user?.id || "demo-lender",
      score_history_id: scoreHistoryId,
      borrower_business_name: businessName,
      note_text: noteText.trim(),
      created_at: new Date().toISOString(),
    };

    try {
      if (user) {
        const { error } = await supabase.from("lender_notes").insert({
          lender_user_id: user.id,
          score_history_id: scoreHistoryId,
          borrower_business_name: businessName,
          note_text: noteText.trim(),
        });
        if (error) {
          throw error;
        }
      } else {
        // Fallback save locally
        const existing = JSON.parse(localStorage.getItem(`vridhi_notes_${businessName}`) || "[]");
        localStorage.setItem(`vridhi_notes_${businessName}`, JSON.stringify([newNoteObj, ...existing]));
      }

      setNoteText("");
      toast.success("Note saved successfully.");
      await loadNotes();
    } catch (err) {
      console.warn("Supabase note insert fallback:", err);
      // Fallback save locally
      const existing = JSON.parse(localStorage.getItem(`vridhi_notes_${businessName}`) || "[]");
      const updated = [newNoteObj, ...existing];
      localStorage.setItem(`vridhi_notes_${businessName}`, JSON.stringify(updated));
      setNotes(updated);
      setNoteText("");
      toast.success("Note saved locally.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm("Delete this lender note?")) return;
    try {
      if (user) {
        await supabase.from("lender_notes").delete().eq("id", noteId);
      }
      const existing = JSON.parse(localStorage.getItem(`vridhi_notes_${businessName}`) || "[]");
      const filtered = existing.filter((n) => n.id !== noteId);
      localStorage.setItem(`vridhi_notes_${businessName}`, JSON.stringify(filtered));
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted.");
    } catch (e) {
      toast.error("Failed to delete note.");
    }
  };

  return (
    <div className="rounded-xl bg-[#070910] border border-[rgba(22,139,255,0.2)] p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-[#55D9FF]" />
          <h4 className="text-sm font-bold text-[#EFF7FF]">
            Internal Lender Underwriting Notes
          </h4>
        </div>
        <span className="text-[11px] font-semibold text-[#168BFF] bg-[#168BFF]/10 border border-[#168BFF]/25 px-2 py-0.5 rounded-full flex items-center gap-1">
          <ShieldAlert size={12} /> Confidential • Lenders Only
        </span>
      </div>

      <p className="text-xs text-[#94A8C2]">
        Add confidential underwriting observations, covenants, or follow-up items for{" "}
        <strong className="text-[#EFF7FF]">{businessName}</strong>. These notes are restricted to authorized lender accounts.
      </p>

      {/* Note submission input */}
      <form onSubmit={handleAddNote} className="space-y-2">
        <textarea
          rows={3}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={`Enter underwriting note for ${businessName}...`}
          className="w-full bg-[#0C1C35] border border-white/10 text-xs text-[#EFF7FF] placeholder-[#4A6080] rounded-xl p-3 focus:outline-none focus:border-[#168BFF]"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !noteText.trim()}
            className="px-4 py-2 rounded-lg bg-[#168BFF] hover:bg-[#1278e0] text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Send size={12} /> {submitting ? "Saving..." : "Save Note"}
          </button>
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-2 pt-1">
        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-[#4A6080]">
          Existing Notes ({notes.length})
        </h5>

        {loading ? (
          <p className="text-xs text-[#4A6080]">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-xs text-[#4A6080] italic">No notes recorded yet for this borrower.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {notes.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-lg bg-[#0C1C35] border border-white/5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-[#4A6080]">
                  <span className="flex items-center gap-1 text-[#94A8C2]">
                    <Clock size={11} />
                    {new Date(n.created_at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(n.id)}
                    className="text-red-400 hover:text-red-300 p-0.5 rounded transition-colors"
                    title="Delete note"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-xs text-[#EFF7FF] leading-relaxed whitespace-pre-wrap">
                  {n.note_text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}