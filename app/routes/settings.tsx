import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Save,
  Plus,
  Trash2,
  Send,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { toast } from "sonner";
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
import useStore, { type Product, type AutoPostConfig } from "~/store/useStore";
import { productsAPI, autoPostAPI } from "~/services/api";

const defaultNewProducts = [
  // ── Paket (Ayam + Nasi)
  { name: "Paket Dada",       price: 12000, code: "paket-dada",       useChicken: true  },
  { name: "Paket Paha Atas",  price: 12000, code: "paket-paha-atas",  useChicken: true  },
  { name: "Paket Paha Bawah", price: 10000, code: "paket-paha-bawah", useChicken: true  },
  { name: "Paket Sayap",      price: 12000, code: "paket-sayap",      useChicken: true  },
  // ── Ayam Only
  { name: "Ayam Dada",       price: 10000, code: "ayam-dada",        useChicken: true  },
  { name: "Ayam Paha Atas",  price: 10000, code: "ayam-paha-atas",   useChicken: true  },
  { name: "Ayam Paha Bawah", price: 8000,  code: "ayam-paha-bawah",  useChicken: true  },
  { name: "Ayam Sayap",      price: 10000, code: "ayam-sayap",       useChicken: true  },
  // ── Addon (nama sesuai dengan DB Backendless yang sudah ada)
  { name: "Nasi Aja",        price: 3000,  code: "rice_only",        useChicken: false },
  { name: "Tambah Nasi",     price: 3000,  code: "tambah-nasi",      useChicken: false },
  { name: "Extra Sambal",    price: 2000,  code: "sambal_extra",     useChicken: false },
  { name: "Nasi + Ayam",     price: 10000, code: "chicken_geprek",   useChicken: true  },
];

export default function Settings() {
  const { products, setProducts, autoPostConfig, setAutoPostConfig } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Confirm dialog state — covers both seed & disable actions
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // Local state for products editing
  const [editingProducts, setEditingProducts] = useState<Product[]>([]);

  // Local state for auto post editing
  const [editingAutoPost, setEditingAutoPost] = useState<AutoPostConfig>(autoPostConfig);

  useEffect(() => {
    setEditingProducts(products);
    setEditingAutoPost(autoPostConfig);
  }, [products, autoPostConfig]);

  const handleProductChange = (
    index: number,
    field: keyof Product,
    value: string | number | boolean,
  ) => {
    const newProds = [...editingProducts];
    newProds[index] = { ...newProds[index], [field]: value };
    setEditingProducts(newProds);
  };

  const handleSaveProducts = async () => {
    setIsLoading(true);
    try {
      for (const ep of editingProducts) {
        const orig = products.find((p) => p.id === ep.id);
        if (
          !orig ||
          orig.price !== ep.price ||
          orig.name !== ep.name ||
          orig.useChicken !== ep.useChicken
        ) {
          if (ep.id.startsWith("temp-")) {
            await productsAPI.create({
              name: ep.name,
              price: ep.price,
              code: ep.code || ep.name.toLowerCase().replace(/\s+/g, "-"),
              useChicken: ep.useChicken,
              isActive: true,
            });
          } else {
            await productsAPI.update(ep.id, {
              name: ep.name,
              price: ep.price,
              useChicken: ep.useChicken,
            });
          }
        }
      }

      const refreshed = await productsAPI.list();
      setProducts(refreshed);
      toast.success("Pengaturan menu berhasil disimpan");
    } catch (e) {
      toast.error("Gagal menyimpan menu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProducts([
      ...editingProducts,
      {
        id: `temp-${Date.now()}`,
        name: "",
        price: 0,
        code: `new-${Date.now()}`,
        useChicken: false,
      },
    ]);
  };

  // Ask confirmation then disable a product
  const handleDisableProduct = (id: string) => {
    if (id.startsWith("temp-")) {
      setEditingProducts(editingProducts.filter((p) => p.id !== id));
      return;
    }
    setConfirmDialog({
      open: true,
      title: "Nonaktifkan Menu",
      description:
        "Menu ini akan disembunyikan dari daftar penjualan. Anda dapat mengaktifkannya kembali kapan saja.",
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await productsAPI.update(id, { isActive: false });
          const refreshed = await productsAPI.list();
          setProducts(refreshed);
          toast.success("Menu berhasil dinonaktifkan");
        } catch (e) {
          toast.error("Gagal menonaktifkan menu");
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // Small delay helper for rate-limit avoidance
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Ask confirmation then seed default products
  const handleSeedProducts = () => {
    setConfirmDialog({
      open: true,
      title: "Init Menu Baru",
      description:
        "Ini akan menambahkan produk default (Paket, Ayam, Nasi, Sambal, dsb) yang belum ada. Produk yang sudah ada tidak akan diubah. Lanjutkan?",
      onConfirm: async () => {
        setIsSeeding(true);
        let added = 0;
        let skipped = 0;
        let failed = 0;
        try {
          // Fetch latest products fresh from server (in case local cache is stale)
          let latestProducts = products;
          try {
            latestProducts = await productsAPI.list();
          } catch (_) { /* use cached */ }

          for (const dp of defaultNewProducts) {
            // Match by BOTH name (case-insensitive) AND code to avoid duplicates
            const existsByName = latestProducts.find(
              (p) => p.name.toLowerCase() === dp.name.toLowerCase(),
            );
            const existsByCode = latestProducts.find(
              (p) => p.code?.toLowerCase() === dp.code?.toLowerCase(),
            );

            if (existsByName || existsByCode) {
              skipped++;
              continue;
            }

            try {
              await productsAPI.create({
                name: dp.name,
                price: dp.price,
                code: dp.code,
                useChicken: dp.useChicken,
                isActive: true,
              });
              added++;
              // Small delay between creates to avoid Backendless rate-limit
              await delay(300);
            } catch (itemErr: any) {
              const body = itemErr?.response?.data;
              console.warn(
                `Gagal tambah "${dp.name}":`,
                body?.message || body || itemErr,
              );
              failed++;
            }
          }
          const refreshed = await productsAPI.list();
          setProducts(refreshed);
          if (failed === 0 && added === 0) {
            toast.success("Semua produk default sudah ada ✅");
          } else if (failed === 0) {
            toast.success(`${added} produk ditambahkan, ${skipped} sudah ada`);
          } else {
            toast.warning(
              `${added} ditambahkan, ${skipped} sudah ada, ${failed} gagal — cek konsol`,
            );
          }
        } catch (e) {
          toast.error("Gagal menambahkan produk default");
        } finally {
          setIsSeeding(false);
        }
      },
    });
  };

  const handleSaveAutoPost = async () => {
    setAutoPostConfig(editingAutoPost);
    try {
      await autoPostAPI.start(editingAutoPost);
      toast.success("Konfigurasi Auto Post berhasil disimpan & di-apply");
    } catch (e) {
      toast.success("Konfigurasi disimpan secara lokal (Bot API offline)");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* ── Shared confirm dialog ── */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((d) => ({ ...d, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDialog((d) => ({ ...d, open: false }));
                confirmDialog.onConfirm();
              }}
            >
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-primary" />
            Pengaturan Sistem
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola harga menu, akun, dan konfigurasi otomatisasi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menu & Prices Section */}
        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-heading">Harga Menu</CardTitle>
                <CardDescription>Atur daftar menu dan harga jual</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedProducts}
                disabled={isSeeding}
              >
                {isSeeding ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Init Menu Baru
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-md flex items-start gap-2 mb-4 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Harga paket diasumsikan = Harga Ayam + Nasi. Pastikan Anda
                mengupdate produk sesuai dengan kesepakatan terbaru.
              </p>
            </div>

            <div className="space-y-3">
              {editingProducts.map((p, i) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="flex-1 space-y-1 w-full">
                    <Label className="text-xs">Nama Menu</Label>
                    <Input
                      value={p.name}
                      onChange={(e) =>
                        handleProductChange(i, "name", e.target.value)
                      }
                      placeholder="Contoh: Ayam Dada"
                    />
                  </div>
                  <div className="w-full sm:w-32 space-y-1">
                    <Label className="text-xs">Harga (Rp)</Label>
                    <Input
                      type="number"
                      value={p.price}
                      onChange={(e) =>
                        handleProductChange(i, "price", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4 sm:mt-0 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.useChicken}
                        onCheckedChange={(checked) =>
                          handleProductChange(i, "useChicken", checked)
                        }
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                        Pakai Ayam?
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDisableProduct(p.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleAddProduct}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Menu
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveProducts}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Simpan Menu
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Auto Post Config Section */}
        <div className="space-y-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">
                Auto Post (Telegram)
              </CardTitle>
              <CardDescription>
                Konfigurasi jadwal broadcast laporan ke Telegram
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Caption Postingan</Label>
                <Input
                  placeholder="Contoh: Update Penjualan Ayam Geprek Sriwedari!"
                  value={editingAutoPost.caption}
                  onChange={(e) =>
                    setEditingAutoPost({
                      ...editingAutoPost,
                      caption: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Interval (Menit)</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingAutoPost.interval}
                  onChange={(e) =>
                    setEditingAutoPost({
                      ...editingAutoPost,
                      interval: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jam Mulai</Label>
                  <Input
                    type="time"
                    value={editingAutoPost.startTime}
                    onChange={(e) =>
                      setEditingAutoPost({
                        ...editingAutoPost,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jam Berakhir</Label>
                  <Input
                    type="time"
                    value={editingAutoPost.endTime}
                    onChange={(e) =>
                      setEditingAutoPost({
                        ...editingAutoPost,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Link Group Telegram</Label>
                <Input
                  placeholder="https://t.me/joinchat/..."
                  value={editingAutoPost.groupLink}
                  onChange={(e) =>
                    setEditingAutoPost({
                      ...editingAutoPost,
                      groupLink: e.target.value,
                    })
                  }
                />
              </div>

              <Button className="w-full mt-4" onClick={handleSaveAutoPost}>
                <Send className="w-4 h-4 mr-2" />
                Simpan & Terapkan Konfigurasi
              </Button>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Akun & Sistem</CardTitle>
              <CardDescription>
                Pengaturan akun administratif (Akan datang)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
                Fitur ganti password dan manajemen user sedang dalam
                pengembangan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
