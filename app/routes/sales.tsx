import { useEffect, useState, ChangeEvent } from "react";
import {
  ShoppingCart,
  Plus,
  Receipt,
  Loader2,
  TrendingUp,
  Calendar,
  Trash2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { ScrollArea } from "~/components/ui/scroll-area";
import { StatsCard } from "~/components/stats-card";
import useStore, {
  formatRupiah,
  formatDate,
  type Sale,
  type Product,
} from "~/store/useStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { toast } from "sonner";
import { productsAPI, salesAPI, stockAPI } from "~/services/api";

const Sales = () => {
  const {
    products: cachedProducts,
    sales: cachedSales,
    setProducts,
    setSales: setGlobalSales,
  } = useStore();

  const [sales, setSales] = useState<Sale[]>(cachedSales);
  const [products, setProductsState] = useState<Product[]>(cachedProducts);

  // Sync local state when global store changes (for navigation caching)
  useEffect(() => {
    setSales(cachedSales);
    setProductsState(cachedProducts);
  }, [cachedSales, cachedProducts]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const totalPrice = selectedProductData
    ? selectedProductData.price * (typeof quantity === "number" ? quantity : 0)
    : 0;

  // Fetch daftar penjualan dari API saat halaman dibuka
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, salesData] = await Promise.all([
          productsAPI.list(),
          salesAPI.list(),
        ]);

        setProductsState(productsData);
        setSales(salesData);

        // Sync to global store (cache)
        setProducts(productsData);
        setGlobalSales(salesData);
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Gagal memuat data penjualan";
        toast.error(message);
      }
    };

    fetchData();
  }, [setProducts, setGlobalSales]);

  const handleAddSale = async () => {
    if (!selectedProduct) {
      toast.error("Pilih produk terlebih dahulu");
      return;
    }
    if (typeof quantity !== "number" || quantity < 1) {
      toast.error("Jumlah minimal 1");
      return;
    }

    setIsLoading(true);

    try {
      const product = products.find((p) => p.id === selectedProduct);
      if (!product) return;

      const created = await salesAPI.create({
        productId: selectedProduct, // objectId dari products
        productName: product.name,
        price: product.price,
        quantity: typeof quantity === "number" ? quantity : 0,
      });

      // Update list lokal & global
      setSales((prev) => [created, ...prev]);
      useStore.getState().setSales([created, ...cachedSales]);

      // Kurangi stok ayam matang jika produk menggunakan ayam
      if (product.useChicken) {
        const { stock: currentStock, setStock } = useStore.getState();
        try {
          const updatedStock = await stockAPI.update({
            cookedChicken: Math.max(
              0,
              currentStock.cookedChicken -
                (typeof quantity === "number" ? quantity : 0),
            ),
          });
          setStock(updatedStock);
        } catch (stockError) {
          console.error("Gagal update stok:", stockError);
          // Kita tidak membatalkan penjualan jika stok gagal diupdate,
          // tapi beri info di log
        }
      }

      toast.success("Penjualan berhasil dicatat!", {
        description: `${quantity}x ${product.name} - ${formatRupiah(totalPrice)}`,
      });

      // Reset form
      setSelectedProduct("");
      setQuantity(1);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Gagal menyimpan penjualan";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const commitDeleteSale = async (id: string) => {
    setIsDeleting(id);
    try {
      await salesAPI.delete(id);

      // Update local & global state
      const updatedSales = sales.filter((s) => s.id !== id);
      setSales(updatedSales);
      useStore.getState().removeSale(id);

      toast.success("Riwayat penjualan berhasil dihapus");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Gagal menghapus riwayat penjualan";
      toast.error(message);
    } finally {
      setIsDeleting(null);
    }
  };

  // Untuk sementara, gunakan helper existing untuk menghitung
  // total hari ini & item terjual berdasarkan list `sales` lokal.
  const today = new Date().toDateString();
  const todaySalesList = sales.filter(
    (sale) => new Date(sale.date).toDateString() === today,
  );
  const todaySales = todaySalesList.reduce((sum, sale) => sum + sale.total, 0);
  const itemsSold = todaySalesList.reduce(
    (sum, sale) => sum + sale.quantity,
    0,
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
          <ShoppingCart className="w-7 h-7 text-primary" />
          Pencatatan Penjualan
        </h1>
        <p className="text-muted-foreground mt-1">
          Catat penjualan ayam geprek harian
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Penjualan Hari Ini"
          value={formatRupiah(todaySales)}
          numericValue={todaySales}
          formatter={formatRupiah}
          icon={TrendingUp}
        />
        <StatsCard
          title="Item Terjual"
          value={`${itemsSold} item`}
          numericValue={itemsSold}
          formatter={(v) => `${v} item`}
          icon={Receipt}
          iconClassName="bg-secondary/10"
        />
        <StatsCard
          title="Total Transaksi"
          value={sales.length}
          numericValue={sales.length}
          icon={Calendar}
          iconClassName="bg-accent/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Sale Form */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Tambah Penjualan
            </CardTitle>
            <CardDescription>Pilih produk dan jumlah</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Pilih produk..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground group-focus:text-white ml-2 transition-colors">
                          {formatRupiah(product.price)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Jumlah</Label>
              <Input
                id="quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={quantity}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  if (value === "") {
                    setQuantity("");
                    return;
                  }
                  const parsed = Number(value);
                  if (!Number.isNaN(parsed)) {
                    setQuantity(parsed);
                  }
                }}
                className="bg-background"
              />
            </div>

            {/* Price Display */}
            {selectedProduct && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Harga Satuan
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatRupiah(selectedProductData?.price || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Jumlah</span>
                  <span className="text-sm font-medium text-foreground">
                    x{quantity}
                  </span>
                </div>
                <div className="border-t border-primary/20 my-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Total
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatRupiah(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full h-12 bg-gradient-primary text-primary-foreground hover:opacity-90 btn-primary"
              onClick={handleAddSale}
              disabled={!selectedProduct || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Tambah Penjualan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sales History */}
        <Card className="premium-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Riwayat Penjualan
            </CardTitle>
            <CardDescription>{sales.length} transaksi tercatat</CardDescription>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Receipt className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Belum ada penjualan tercatat
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Mulai catat penjualan pertama Anda
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <div className="max-h-[450px] overflow-y-auto overflow-x-auto custom-scrollbar">
                  <Table className="min-w-[700px] relative">
                    <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="text-xs font-medium py-3">
                          Tanggal
                        </TableHead>
                        <TableHead className="text-xs font-medium py-3">
                          Produk
                        </TableHead>
                        <TableHead className="text-xs font-medium text-center py-3">
                          Qty
                        </TableHead>
                        <TableHead className="text-xs font-medium text-center py-3">
                          Harga
                        </TableHead>
                        <TableHead className="text-xs font-medium text-center py-3">
                          Total
                        </TableHead>
                        <TableHead className="text-xs font-medium text-center py-3">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow
                          key={sale.id}
                          className="table-row-hover border-b last:border-0"
                        >
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-4">
                            {formatDate(sale.date)}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-foreground whitespace-nowrap py-4">
                            {sale.productName}
                          </TableCell>
                          <TableCell className="text-sm text-center text-muted-foreground py-4">
                            {sale.quantity}
                          </TableCell>
                          <TableCell className="text-sm text-center text-muted-foreground whitespace-nowrap py-4">
                            {formatRupiah(sale.price)}
                          </TableCell>
                          <TableCell className="text-sm text-center font-semibold text-primary whitespace-nowrap py-4">
                            {formatRupiah(sale.total)}
                          </TableCell>
                          <TableCell className="text-sm text-center py-4">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  disabled={isDeleting === sale.id}
                                >
                                  {isDeleting === sale.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Hapus Riwayat Penjualan?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus penjualan{" "}
                                    <span className="font-semibold text-foreground">
                                      {sale.productName}
                                    </span>{" "}
                                    ini? Tindakan ini akan menghapus data secara
                                    permanen dari sistem.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => commitDeleteSale(sale.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Price Reference */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-lg font-heading">
            Daftar Harga Produk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-4 rounded-xl bg-muted/50 border border-border"
              >
                <p className="text-sm font-medium text-foreground mb-1">
                  {product.name}
                </p>
                <p className="text-lg font-bold text-primary">
                  {formatRupiah(product.price)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;
