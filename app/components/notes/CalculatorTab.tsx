// ============================
// CalculatorTab – iPhone-style Calculator
// with Financial Notes, History & Reconciliation
// ============================

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Trash2,
  RefreshCw,
  Filter,
  History,
  DollarSign,
  Plus,
  AlertCircle,
  Calendar as CalendarIcon,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";

import type {
  FinancialNote,
  CategoryType,
  CategoryConfig,
} from "~/types/notes";
import {
  DEFAULT_CATEGORIES,
  STORAGE_KEY_FINANCIAL,
  STORAGE_KEY_CATEGORIES,
} from "~/types/notes";
import {
  evaluateExpression,
  formatNumberID,
  formatRupiahLocal,
  loadFromStorage,
  saveToStorage,
} from "~/lib/notes-utils";
import { financialNotesAPI } from "~/services/notesApi";

// ========================
// Component
// ========================

export const CalculatorTab = () => {
  // --- Calculator State ---
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const [activeOp, setActiveOp] = useState<string | null>(null);

  // --- Save Sheet State ---
  const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false);
  const [category, setCategory] = useState<CategoryType>("Penjualan");
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");

  // --- Data ---
  const [notes, setNotes] = useState<FinancialNote[]>([]);
  const [categories, setCategories] =
    useState<Record<string, CategoryConfig>>(DEFAULT_CATEGORIES);

  // --- Filters ---
  const [filterCategory, setFilterCategory] = useState<CategoryType | "All">(
    "All",
  );
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  // Date range filter for financial history
  const [historyStartDate, setHistoryStartDate] = useState<Date | undefined>();
  const [historyEndDate, setHistoryEndDate] = useState<Date | undefined>();

  // --- Reconciliation ---
  const [realCash, setRealCash] = useState("");

  // --- Delete dialog ---
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Edit financial note ---
  const [editingNote, setEditingNote] = useState<FinancialNote | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryType>("Penjualan");
  const [editSubCategory, setEditSubCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editResult, setEditResult] = useState("");

  // --- Category add dialog ---
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // --- Button press animation ---
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

  // --- Load from localStorage on mount ---
  useEffect(() => {
    setNotes(loadFromStorage<FinancialNote[]>(STORAGE_KEY_FINANCIAL, []));
    const saved = loadFromStorage<Record<string, CategoryConfig>>(
      STORAGE_KEY_CATEGORIES,
      {},
    );
    setCategories({ ...DEFAULT_CATEGORIES, ...saved });

    // Try fetching from API
    financialNotesAPI.list().then((remote) => {
      if (remote && remote.length > 0) {
        setNotes((local) => {
          const localIds = new Set(local.map((n) => n.id));
          const newRemote = remote.filter((r) => !localIds.has(r.id));
          return [...local, ...newRemote].sort(
            (a, b) => b.timestamp - a.timestamp,
          );
        });
      }
    });
  }, []);

  // --- Auto-save ---
  useEffect(() => {
    saveToStorage(STORAGE_KEY_FINANCIAL, notes);
  }, [notes]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_CATEGORIES, categories);
  }, [categories]);

  // ========================
  // iPhone Calculator Logic
  // ========================

  const showC = display !== "0" || expression !== "";

  const inputDigit = useCallback(
    (digit: string) => {
      if (hasResult) {
        setDisplay(digit);
        setExpression(digit);
        setHasResult(false);
        setWaitingForOperand(false);
        return;
      }
      if (waitingForOperand) {
        setDisplay(digit);
        setExpression((prev) => prev + digit);
        setWaitingForOperand(false);
      } else {
        const newDisplay = display === "0" ? digit : display + digit;
        setDisplay(newDisplay);
        setExpression((prev) => (prev === "0" ? digit : prev + digit));
      }
      setActiveOp(null);
    },
    [display, waitingForOperand, hasResult],
  );

  const inputDot = useCallback(() => {
    if (hasResult) {
      setDisplay("0.");
      setExpression("0.");
      setHasResult(false);
      setWaitingForOperand(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay("0.");
      setExpression((prev) => prev + "0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
      setExpression((prev) => prev + ".");
    }
  }, [display, waitingForOperand, hasResult]);

  const performOperation = useCallback(
    (nextOp: string) => {
      const inputValue = parseFloat(display);
      const opMap: Record<string, string> = {
        "+": "+",
        "−": "-",
        "×": "*",
        "÷": "/",
      };

      if (hasResult) {
        setPreviousValue(inputValue);
        setOperator(nextOp);
        setWaitingForOperand(true);
        setExpression(display + opMap[nextOp]);
        setHasResult(false);
        setActiveOp(nextOp);
        return;
      }

      if (previousValue === null) {
        setPreviousValue(inputValue);
      } else if (operator && !waitingForOperand) {
        const result = evaluateExpression(expression);
        if (result !== null) {
          setDisplay(String(result));
          setPreviousValue(result);
        }
      }

      setOperator(nextOp);
      setWaitingForOperand(true);
      setActiveOp(nextOp);

      if (!waitingForOperand) {
        setExpression((prev) => prev + opMap[nextOp]);
      } else {
        setExpression((prev) => prev.slice(0, -1) + opMap[nextOp]);
      }
    },
    [
      display,
      previousValue,
      operator,
      waitingForOperand,
      hasResult,
      expression,
    ],
  );

  const handleEquals = useCallback(() => {
    const result = evaluateExpression(expression);
    if (result !== null) {
      setDisplay(String(result));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(false);
      setHasResult(true);
      setActiveOp(null);
    } else {
      toast.error("Ekspresi tidak valid");
    }
  }, [expression]);

  const handleClear = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHasResult(false);
    setActiveOp(null);
  }, []);

  const handleToggleSign = useCallback(() => {
    const num = parseFloat(display);
    if (num !== 0) {
      const toggled = String(-num);
      setDisplay(toggled);
      if (hasResult) setExpression(toggled);
    }
  }, [display, hasResult]);

  const handlePercent = useCallback(() => {
    const num = parseFloat(display);
    const result = num / 100;
    setDisplay(String(result));
    if (hasResult) setExpression(String(result));
  }, [display, hasResult]);

  // ========================
  // Save / Delete / Add Category
  // ========================

  const handleSaveNote = async () => {
    const result = parseFloat(display);
    if (isNaN(result)) {
      toast.error("Tidak ada hasil untuk disimpan");
      return;
    }
    if (!subCategory.trim()) {
      toast.error("Sub-kategori harus diisi");
      return;
    }

    const newNote: FinancialNote = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      expression: expression || display,
      result,
      category,
      subCategory: subCategory.trim(),
      description: description.trim(),
    };

    setNotes((prev) => [newNote, ...prev]);
    toast.success("Catatan keuangan disimpan!");
    setSubCategory("");
    setDescription("");
    setIsSaveSheetOpen(false);
    financialNotesAPI.create(newNote);
  };

  const handleDeleteNote = async (note: FinancialNote) => {
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    toast.success("Catatan dihapus");
    setDeletingId(null);
    if (note.objectId) financialNotesAPI.delete(note.objectId);
  };

  // Open edit sheet for a financial note
  const handleOpenEdit = (note: FinancialNote) => {
    setEditingNote(note);
    setEditCategory(note.category as CategoryType);
    setEditSubCategory(note.subCategory);
    setEditDescription(note.description || "");
    setEditResult(String(note.result));
    setIsEditSheetOpen(true);
  };

  // Save edited financial note
  const handleSaveEdit = () => {
    if (!editingNote) return;
    if (!editSubCategory.trim()) {
      toast.error("Sub-kategori harus diisi");
      return;
    }
    const parsedResult = parseFloat(editResult);
    if (isNaN(parsedResult)) {
      toast.error("Nilai hasil tidak valid");
      return;
    }

    setNotes((prev) =>
      prev.map((n) =>
        n.id === editingNote.id
          ? {
              ...n,
              category: editCategory,
              subCategory: editSubCategory.trim(),
              description: editDescription.trim(),
              result: parsedResult,
              timestamp: Date.now(),
            }
          : n,
      ),
    );
    setIsEditSheetOpen(false);
    setEditingNote(null);
    toast.success("Catatan keuangan diperbarui!");
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories[name]) {
      toast.error("Kategori sudah ada");
      return;
    }
    setCategories((prev) => ({
      ...prev,
      [name]: {
        name,
        color: "bg-slate-500 hover:bg-slate-600",
        variant: "secondary",
      },
    }));
    setCategory(name);
    setNewCategoryName("");
    setIsAddingCategory(false);
    toast.success(`Kategori "${name}" ditambahkan`);
  };

  // ========================
  // Computed
  // ========================

  const filteredNotes = notes.filter((note) => {
    const matchCat =
      filterCategory === "All" || note.category === filterCategory;
    const min = minAmount ? parseFloat(minAmount) : -Infinity;
    const max = maxAmount ? parseFloat(maxAmount) : Infinity;
    const matchRange = note.result >= min && note.result <= max;

    // Date range filter
    let matchDate = true;
    if (historyStartDate) {
      const start = new Date(historyStartDate);
      start.setHours(0, 0, 0, 0);
      if (note.timestamp < start.getTime()) matchDate = false;
    }
    if (historyEndDate) {
      const end = new Date(historyEndDate);
      end.setHours(23, 59, 59, 999);
      if (note.timestamp > end.getTime()) matchDate = false;
    }

    return matchCat && matchRange && matchDate;
  });

  // Reconciliation
  const totalSalesToday = (() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return notes
      .filter(
        (n) =>
          n.category === "Penjualan" && n.timestamp >= startOfDay.getTime(),
      )
      .reduce((sum, n) => sum + n.result, 0);
  })();

  const realCashNum = parseFloat(realCash) || 0;
  const selisih = realCashNum - totalSalesToday;

  // Audio context for click sound
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    // Init audio context on first user interaction to comply with autoplay policy
    const initAudio = () => {
      if (!audioContext) {
        setAudioContext(
          new (window.AudioContext || (window as any).webkitAudioContext)(),
        );
      }
    };
    window.addEventListener("click", initAudio, { once: true });
    return () => window.removeEventListener("click", initAudio);
  }, [audioContext]);

  const playClickSound = () => {
    if (!audioContext) return;
    try {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        300,
        audioContext.currentTime + 0.05,
      );

      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.05,
      );

      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.05);
    } catch (e) {
      // Ignore audio errors
    }
  };

  // Button press helper
  const handleBtnPress = (id: string, action: () => void) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10); // Short tick
    }

    // Sound feedback
    playClickSound();

    setPressedBtn(id);
    action();
    setTimeout(() => setPressedBtn(null), 120);
  };

  const formatDisplay = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (val.endsWith(".")) return val;
    if (val.includes(".") && val.endsWith("0") && !hasResult) return val;
    return formatNumberID(num);
  };

  // Date formatting helper
  const formatDateID = (date: Date) =>
    date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // ========================
  // Button styles
  // ========================

  const btnBase =
    "rounded-full aspect-square text-xl font-medium flex items-center justify-center select-none transition-transform duration-100";
  const btnNumber = `${btnBase} bg-[#333333] text-white hover:bg-[#5a5a5a] active:bg-[#5a5a5a]`;
  const btnFunction = `${btnBase} bg-[#a5a5a5] text-black hover:bg-[#c8c8c8] active:bg-[#c8c8c8]`;
  const btnOperator = (op: string) =>
    `${btnBase} ${
      activeOp === op
        ? "bg-white text-[#ff9f0a]"
        : "bg-[#ff9f0a] text-white hover:bg-[#ffb340] active:bg-[#ffb340]"
    }`;
  const btnZero =
    "rounded-full h-full text-xl font-medium flex items-center justify-start pl-7 select-none bg-[#333333] text-white hover:bg-[#5a5a5a] active:bg-[#5a5a5a] transition-transform duration-100 col-span-2";
  const btnEquals = `${btnBase} bg-[#ff9f0a] text-white hover:bg-[#ffb340] active:bg-[#ffb340]`;

  const scaleClass = (id: string) =>
    pressedBtn === id ? "scale-90" : "scale-100";

  // ========================
  // Render
  // ========================

  return (
    <div className="space-y-6">
      {/* ====== CALCULATOR ====== */}
      <div className="bg-black rounded-3xl p-5 max-w-sm mx-auto shadow-2xl">
        {/* Display */}
        <div className="text-right px-2 pb-4 min-h-[100px] flex flex-col justify-end">
          <div className="text-[#999] text-sm font-mono overflow-x-auto whitespace-nowrap scrollbar-hide mb-1">
            {expression || "\u00A0"}
          </div>
          <div
            className="text-white font-light overflow-x-auto whitespace-nowrap scrollbar-hide"
            style={{
              fontSize:
                display.length > 9
                  ? display.length > 12
                    ? "28px"
                    : "36px"
                  : "48px",
            }}
          >
            {formatDisplay(display)}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3">
          {/* Row 1 */}
          <button
            className={`${btnFunction} ${scaleClass("ac")}`}
            onClick={() => handleBtnPress("ac", handleClear)}
          >
            {showC ? "C" : "AC"}
          </button>
          <button
            className={`${btnFunction} ${scaleClass("sign")}`}
            onClick={() => handleBtnPress("sign", handleToggleSign)}
          >
            ⁺∕₋
          </button>
          <button
            className={`${btnFunction} ${scaleClass("pct")}`}
            onClick={() => handleBtnPress("pct", handlePercent)}
          >
            %
          </button>
          <button
            className={`${btnOperator("÷")} ${scaleClass("div")}`}
            onClick={() => handleBtnPress("div", () => performOperation("÷"))}
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            className={`${btnNumber} ${scaleClass("7")}`}
            onClick={() => handleBtnPress("7", () => inputDigit("7"))}
          >
            7
          </button>
          <button
            className={`${btnNumber} ${scaleClass("8")}`}
            onClick={() => handleBtnPress("8", () => inputDigit("8"))}
          >
            8
          </button>
          <button
            className={`${btnNumber} ${scaleClass("9")}`}
            onClick={() => handleBtnPress("9", () => inputDigit("9"))}
          >
            9
          </button>
          <button
            className={`${btnOperator("×")} ${scaleClass("mul")}`}
            onClick={() => handleBtnPress("mul", () => performOperation("×"))}
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            className={`${btnNumber} ${scaleClass("4")}`}
            onClick={() => handleBtnPress("4", () => inputDigit("4"))}
          >
            4
          </button>
          <button
            className={`${btnNumber} ${scaleClass("5")}`}
            onClick={() => handleBtnPress("5", () => inputDigit("5"))}
          >
            5
          </button>
          <button
            className={`${btnNumber} ${scaleClass("6")}`}
            onClick={() => handleBtnPress("6", () => inputDigit("6"))}
          >
            6
          </button>
          <button
            className={`${btnOperator("−")} ${scaleClass("sub")}`}
            onClick={() => handleBtnPress("sub", () => performOperation("−"))}
          >
            −
          </button>

          {/* Row 4 */}
          <button
            className={`${btnNumber} ${scaleClass("1")}`}
            onClick={() => handleBtnPress("1", () => inputDigit("1"))}
          >
            1
          </button>
          <button
            className={`${btnNumber} ${scaleClass("2")}`}
            onClick={() => handleBtnPress("2", () => inputDigit("2"))}
          >
            2
          </button>
          <button
            className={`${btnNumber} ${scaleClass("3")}`}
            onClick={() => handleBtnPress("3", () => inputDigit("3"))}
          >
            3
          </button>
          <button
            className={`${btnOperator("+")} ${scaleClass("add")}`}
            onClick={() => handleBtnPress("add", () => performOperation("+"))}
          >
            +
          </button>

          {/* Row 5 */}
          <button
            className={`${btnZero} ${scaleClass("0")}`}
            onClick={() => handleBtnPress("0", () => inputDigit("0"))}
          >
            0
          </button>
          <button
            className={`${btnNumber} ${scaleClass("dot")}`}
            onClick={() => handleBtnPress("dot", inputDot)}
          >
            .
          </button>
          <button
            className={`${btnEquals} ${scaleClass("eq")}`}
            onClick={() => handleBtnPress("eq", handleEquals)}
          >
            =
          </button>
        </div>

        {/* Save button after "=" */}
        {hasResult && (
          <button
            onClick={() => setIsSaveSheetOpen(true)}
            className="mt-4 w-full py-3 rounded-2xl bg-[#ff9f0a] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#ffb340] transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <Save className="w-5 h-5" />
            Simpan ke Catatan Keuangan
          </button>
        )}
      </div>

      {/* ====== SAVE SHEET ====== */}
      <Sheet open={isSaveSheetOpen} onOpenChange={setIsSaveSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" />
              Simpan Catatan Keuangan
            </SheetTitle>
            <SheetDescription className="text-center">
              Masukkan detail transaksi untuk disimpan.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 py-6 px-6">
            {/* Amount Display */}
            <div className="bg-muted/40 p-6 rounded-2xl text-center border border-border/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Nilai
              </span>
              <div className="text-3xl font-bold text-foreground mt-1 font-mono">
                {formatRupiahLocal(parseFloat(display) || 0)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Kategori
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={category}
                    onValueChange={(val: CategoryType) => setCategory(val)}
                  >
                    <SelectTrigger className="flex-1 h-12 bg-muted/20 border-border/60 focus:ring-primary/20">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(categories).map((cat) => (
                        <SelectItem key={cat.name} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0 border-border/60 hover:bg-muted/50"
                    onClick={() => setIsAddingCategory(true)}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Item / Keterangan
                </Label>
                <Input
                  className="h-12 bg-muted/20 border-border/60 focus-visible:ring-primary/20"
                  placeholder="Contoh: Geprek Original, Beli Ayam..."
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Catatan Tambahan
                </Label>
                <Textarea
                  placeholder="Opsional..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none min-h-[80px] bg-muted/20 border-border/60 focus-visible:ring-primary/20"
                />
              </div>
            </div>
            <Button
              className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl"
              onClick={handleSaveNote}
            >
              <Save className="w-5 h-5 mr-2" />
              Simpan Data
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ====== ADD CATEGORY DIALOG ====== */}
      <AlertDialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tambah Kategori Baru</AlertDialogTitle>
            <AlertDialogDescription>
              Buat kategori baru untuk mengelompokkan catatan keuangan Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label>Nama Kategori</Label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Contoh: Hutang, Investasi..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddCategory}>
              Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ====== EDIT FINANCIAL NOTE SHEET ====== */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Edit Catatan Keuangan
            </SheetTitle>
            <SheetDescription>
              Ubah detail catatan keuangan Anda.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 py-6 px-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nilai (Rp)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground font-semibold">
                    Rp
                  </span>
                  <Input
                    type="number"
                    value={editResult}
                    onChange={(e) => setEditResult(e.target.value)}
                    placeholder="0"
                    className="h-12 pl-10 text-lg font-mono font-bold bg-muted/20 border-border/60 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Kategori
                </Label>
                <Select
                  value={editCategory}
                  onValueChange={(val: CategoryType) => setEditCategory(val)}
                >
                  <SelectTrigger className="w-full h-12 bg-muted/20 border-border/60 focus:ring-primary/20">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(categories).map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Item / Keterangan
                </Label>
                <Input
                  value={editSubCategory}
                  onChange={(e) => setEditSubCategory(e.target.value)}
                  placeholder="Contoh: Geprek Original..."
                  className="h-12 bg-muted/20 border-border/60 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Catatan Tambahan
                </Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Opsional..."
                  className="resize-none min-h-[80px] bg-muted/20 border-border/60 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <Button
              className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl"
              onClick={handleSaveEdit}
            >
              <Save className="w-5 h-5 mr-2" />
              Simpan Perubahan
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ====== FINANCIAL HISTORY (MOVED ABOVE RECONCILIATION) ====== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Riwayat Keuangan
          </h3>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Select
              value={filterCategory}
              onValueChange={(val: CategoryType | "All") =>
                setFilterCategory(val)
              }
            >
              <SelectTrigger className="w-[130px] h-9">
                <Filter className="w-3.5 h-3.5 mr-1 opacity-50" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Semua</SelectItem>
                {Object.values(categories).map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 bg-background border rounded-lg px-2 h-9">
              <span className="text-xs text-muted-foreground">Rp</span>
              <Input
                placeholder="Min"
                className="w-16 h-7 text-xs border-0 p-0 focus-visible:ring-0 shadow-none"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">-</span>
              <Input
                placeholder="Max"
                className="w-16 h-7 text-xs border-0 p-0 focus-visible:ring-0 shadow-none"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Start date picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {historyStartDate
                  ? formatDateID(historyStartDate)
                  : "Dari tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={historyStartDate}
                onSelect={setHistoryStartDate}
              />
            </PopoverContent>
          </Popover>

          <span className="text-xs text-muted-foreground">—</span>

          {/* End date picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {historyEndDate
                  ? formatDateID(historyEndDate)
                  : "Sampai tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={historyEndDate}
                onSelect={setHistoryEndDate}
              />
            </PopoverContent>
          </Popover>

          {(historyStartDate || historyEndDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground"
              onClick={() => {
                setHistoryStartDate(undefined);
                setHistoryEndDate(undefined);
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Belum ada catatan keuangan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => {
              const catConfig =
                categories[note.category] || DEFAULT_CATEGORIES.Lainnya;
              return (
                <div
                  key={note.id}
                  className="bg-card rounded-xl border border-border p-4 relative overflow-hidden hover:shadow-md transition-all cursor-pointer active:scale-[0.99] group"
                  onClick={() => handleOpenEdit(note)}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${catConfig.color}`}
                  />
                  <div className="pl-4 flex justify-between items-start gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors">
                          {note.subCategory}
                        </h4>
                        <Badge
                          variant={catConfig.variant}
                          className={`text-[10px] ${catConfig.variant === "default" && note.category === "Operasional" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                        >
                          {note.category}
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded w-fit">
                        {note.expression}
                      </p>
                      {note.description && (
                        <p className="text-xs text-muted-foreground italic">
                          "{note.description}"
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(note.timestamp).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-lg font-bold font-mono">
                        {formatRupiahLocal(note.result)}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(note);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(note.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <AlertDialog
                    open={deletingId === note.id}
                    onOpenChange={(open) => !open && setDeletingId(null)}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Catatan Ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Catatan {note.subCategory} sebesar{" "}
                          {formatRupiahLocal(note.result)} akan dihapus
                          permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteNote(note)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Ya, Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====== DAILY RECONCILIATION (MOVED BELOW HISTORY) ====== */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <RefreshCw className="w-5 h-5 text-primary" />
          Rekonsiliasi Harian
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <span className="text-sm font-medium">
              Total Penjualan Hari Ini
            </span>
            <span className="text-lg font-bold text-green-600">
              {formatRupiahLocal(totalSalesToday)}
            </span>
          </div>
          <div className="space-y-2">
            <Label>Uang Tunai Riil (Hari Ini)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                type="number"
                placeholder="0"
                className="pl-9"
                value={realCash}
                onChange={(e) => setRealCash(e.target.value)}
              />
            </div>
          </div>
          <div
            className={`p-4 rounded-xl border flex flex-col items-center gap-1 ${
              selisih === 0
                ? "bg-green-500/10 border-green-500/30 text-green-600"
                : selisih > 0
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-600"
                  : "bg-red-500/10 border-red-500/30 text-red-600"
            }`}
          >
            <span className="text-sm font-medium">Selisih</span>
            <span className="text-2xl font-bold">
              {selisih > 0 ? "+" : ""}
              {formatRupiahLocal(selisih)}
            </span>
            <span className="text-xs opacity-80">
              {selisih === 0
                ? "Klop! Data sesuai."
                : selisih > 0
                  ? "Uang tunai berlebih"
                  : "Uang tunai kurang"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorTab;
