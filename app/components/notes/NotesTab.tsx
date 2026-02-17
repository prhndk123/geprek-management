// ============================
// NotesTab – General Notes (non-financial)
// Features: date picker filter, clickable notes → full-page editor
// ============================

import { useState, useEffect } from "react";
import {
  StickyNote,
  Trash2,
  Plus,
  AlertCircle,
  Calendar as CalendarIcon,
  ArrowLeft,
  Save,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";

import type { GeneralNote } from "~/types/notes";
import { STORAGE_KEY_GENERAL } from "~/types/notes";
import { loadFromStorage, saveToStorage } from "~/lib/notes-utils";
import { generalNotesAPI } from "~/services/notesApi";

// ========================
// Component
// ========================

export const NotesTab = () => {
  // --- Form state (for adding new note) ---
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // --- Data ---
  const [notes, setNotes] = useState<GeneralNote[]>([]);

  // --- Date picker filters ---
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // --- Delete dialog ---
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Detail / Edit view ---
  const [viewingNote, setViewingNote] = useState<GeneralNote | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // --- Load from localStorage + API on mount ---
  useEffect(() => {
    setNotes(loadFromStorage<GeneralNote[]>(STORAGE_KEY_GENERAL, []));

    generalNotesAPI.list().then((remote) => {
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
    saveToStorage(STORAGE_KEY_GENERAL, notes);
  }, [notes]);

  // ========================
  // Handlers
  // ========================

  const handleAddNote = async () => {
    if (!title.trim()) {
      toast.error("Judul harus diisi");
      return;
    }
    if (!content.trim()) {
      toast.error("Isi catatan harus diisi");
      return;
    }

    const newNote: GeneralNote = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      title: title.trim(),
      content: content.trim(),
    };

    setNotes((prev) => [newNote, ...prev]);
    toast.success("Catatan disimpan!");
    setTitle("");
    setContent("");
    setIsFormOpen(false);
    generalNotesAPI.create(newNote);
  };

  const handleDeleteNote = async (note: GeneralNote) => {
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    toast.success("Catatan dihapus");
    setDeletingId(null);
    // If we're viewing the deleted note, go back to list
    if (viewingNote?.id === note.id) {
      setViewingNote(null);
      setIsEditing(false);
    }
    if (note.objectId) generalNotesAPI.delete(note.objectId);
  };

  // Open note detail view
  const handleOpenNote = (note: GeneralNote) => {
    setViewingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  };

  // Save edits
  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      toast.error("Judul tidak boleh kosong");
      return;
    }
    if (!editContent.trim()) {
      toast.error("Isi catatan tidak boleh kosong");
      return;
    }

    setNotes((prev) =>
      prev.map((n) =>
        n.id === viewingNote?.id
          ? {
              ...n,
              title: editTitle.trim(),
              content: editContent.trim(),
              timestamp: Date.now(), // Update timestamp on edit
            }
          : n,
      ),
    );

    // Update viewingNote state too
    setViewingNote((prev) =>
      prev
        ? {
            ...prev,
            title: editTitle.trim(),
            content: editContent.trim(),
            timestamp: Date.now(),
          }
        : null,
    );

    setIsEditing(false);
    toast.success("Catatan diperbarui!");
  };

  // ========================
  // Computed
  // ========================

  const filteredNotes = notes
    .filter((note) => {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (note.timestamp < start.getTime()) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (note.timestamp > end.getTime()) return false;
      }
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  // Date formatting helper
  const formatDateID = (date: Date) =>
    date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // ========================
  // DETAIL / EDIT VIEW
  // ========================

  if (viewingNote) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Header bar */}
        <div className="flex items-center gap-3 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-2 border-b border-border/50">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-muted"
            onClick={() => {
              setViewingNote(null);
              setIsEditing(false);
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold flex-1 truncate">
            {isEditing ? "Edit Catatan" : viewingNote.title}
          </h2>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5 rounded-full"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSaveEdit}
              className="gap-1.5 rounded-full"
            >
              <Save className="w-4 h-4" />
              Simpan
            </Button>
          )}
        </div>

        {/* Note content */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          {isEditing ? (
            /* Edit mode */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Judul</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Judul catatan..."
                  className="text-base font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label>Isi Catatan</Label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Tulis catatan Anda di sini..."
                  className="resize-none min-h-[250px] text-sm leading-relaxed"
                />
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="space-y-3">
              <h3 className="text-xl font-bold">{viewingNote.title}</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(viewingNote.timestamp).toLocaleString("id-ID", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
              <div className="border-t border-border pt-4">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {viewingNote.content}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Delete button at bottom */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 gap-1.5"
            onClick={() => setDeletingId(viewingNote.id)}
          >
            <Trash2 className="w-4 h-4" />
            Hapus Catatan
          </Button>
        </div>

        {/* Delete confirmation for detail view */}
        <AlertDialog
          open={deletingId === viewingNote.id}
          onOpenChange={(open) => !open && setDeletingId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Catatan Ini?</AlertDialogTitle>
              <AlertDialogDescription>
                Catatan "{viewingNote.title}" akan dihapus permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteNote(viewingNote)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Ya, Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ========================
  // LIST VIEW (default)
  // ========================

  return (
    <div className="space-y-6">
      {/* ====== ADD NOTE BUTTON ====== */}
      {!isFormOpen && (
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full py-5 rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <div className="p-3 bg-background rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold">Buat Catatan Baru</span>
        </button>
      )}

      {/* ====== ADD NOTE FORM ====== */}
      {isFormOpen && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <StickyNote className="w-5 h-5 text-primary" />
            Catatan Baru
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                placeholder="Judul catatan..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Isi Catatan</Label>
              <Textarea
                placeholder="Tulis catatan Anda di sini..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none min-h-[120px]"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleAddNote}>
                <StickyNote className="w-4 h-4 mr-2" />
                Simpan
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  setTitle("");
                  setContent("");
                }}
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DATE PICKER FILTER ====== */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Filter Tanggal</span>
        </div>
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
                {startDate ? formatDateID(startDate) : "Dari tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
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
                {endDate ? formatDateID(endDate) : "Sampai tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
              />
            </PopoverContent>
          </Popover>

          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* ====== NOTES LIST ====== */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada catatan.</p>
          <p className="text-xs opacity-60 mt-1">
            Ketuk tombol "Tambah Catatan Baru" untuk memulai.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-pointer active:scale-[0.99] group"
              onClick={() => handleOpenNote(note)}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full w-fit">
                      {new Date(note.timestamp).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors mb-1">
                    {note.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(note.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Delete confirmation */}
              <AlertDialog
                open={deletingId === note.id}
                onOpenChange={(open) => !open && setDeletingId(null)}
              >
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Catatan Ini?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Catatan "{note.title}" akan dihapus permanen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Ya, Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesTab;
