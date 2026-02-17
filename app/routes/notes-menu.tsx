// ============================
// Notes Menu Page
// Two tabs: Kalkulator (Calculator) & Catatan (Notes)
// Replaces the old auto-post.tsx page
// ============================

import { useState, useRef } from "react";
import { Calculator, StickyNote, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";

import { CalculatorTab } from "~/components/notes/CalculatorTab";
import { NotesTab } from "~/components/notes/NotesTab";

import type { FinancialNote, GeneralNote, CategoryConfig } from "~/types/notes";
import {
  STORAGE_KEY_FINANCIAL,
  STORAGE_KEY_GENERAL,
  STORAGE_KEY_CATEGORIES,
} from "~/types/notes";
import {
  exportNotesJSON,
  loadFromStorage,
  parseImportedJSON,
  saveToStorage,
} from "~/lib/notes-utils";

// Tab type
type TabKey = "calculator" | "notes";

const NotesMenu = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("calculator");
  const importRef = useRef<HTMLInputElement>(null);

  // ========================
  // Import / Export
  // ========================

  const handleExport = () => {
    const financialNotes = loadFromStorage<FinancialNote[]>(
      STORAGE_KEY_FINANCIAL,
      [],
    );
    const generalNotes = loadFromStorage<GeneralNote[]>(
      STORAGE_KEY_GENERAL,
      [],
    );
    const categories = loadFromStorage<Record<string, CategoryConfig>>(
      STORAGE_KEY_CATEGORIES,
      {},
    );
    exportNotesJSON(financialNotes, generalNotes, categories);
    toast.success("Data backup berhasil diekspor");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const parsed = parseImportedJSON(result);
      if (!parsed) {
        toast.error("Format file tidak valid");
        return;
      }

      // Handle financial notes
      if (parsed.financialNotes && Array.isArray(parsed.financialNotes)) {
        saveToStorage(STORAGE_KEY_FINANCIAL, parsed.financialNotes);
      } else if (parsed.notes && Array.isArray(parsed.notes)) {
        // Legacy format support
        saveToStorage(STORAGE_KEY_FINANCIAL, parsed.notes);
      }

      // Handle general notes
      if (parsed.generalNotes && Array.isArray(parsed.generalNotes)) {
        saveToStorage(STORAGE_KEY_GENERAL, parsed.generalNotes);
      }

      // Handle categories
      if (parsed.categories) {
        const existing = loadFromStorage<Record<string, CategoryConfig>>(
          STORAGE_KEY_CATEGORIES,
          {},
        );
        saveToStorage(STORAGE_KEY_CATEGORIES, {
          ...existing,
          ...parsed.categories,
        });
      }

      toast.success("Data berhasil diimpor! Refresh halaman untuk melihat.");
      // Reload to pick up changes
      window.location.reload();
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ========================
  // Tab config
  // ========================

  const tabs: { key: TabKey; label: string; icon: typeof Calculator }[] = [
    { key: "calculator", label: "Kalkulator", icon: Calculator },
    { key: "notes", label: "Catatan", icon: StickyNote },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-8">
      {/* ====== HEADER ====== */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
          <StickyNote className="w-7 h-7 text-primary" />
          Notes Menu
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Kalkulator keuangan & catatan harian Anda
        </p>
      </div>

      {/* ====== TAB SWITCHER ====== */}
      <div className="bg-muted/50 p-1 rounded-2xl flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ====== TAB CONTENT ====== */}
      <div className="animate-in fade-in duration-200">
        {activeTab === "calculator" ? <CalculatorTab /> : <NotesTab />}
      </div>

      {/* ====== BACKUP / RESTORE (paling bawah) ====== */}
      <div className="flex items-center justify-center gap-2 pt-4 border-t border-border">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Backup
        </Button>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="relative cursor-pointer"
            onClick={() => importRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Restore
          </Button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default NotesMenu;
