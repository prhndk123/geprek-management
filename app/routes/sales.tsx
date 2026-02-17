import { useEffect, useState, useMemo } from "react";
import {
  ShoppingCart,
  Plus,
  Receipt,
  Loader2,
  CalendarDays,
  X,
  TrendingUp,
  Calendar as CalendarIcon,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ListFilter,
  ChevronLeft,
  ChevronRight,
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
import { cn } from "~/lib/utils";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { Check, Edit2 } from "lucide-react";

const Sales = () => {
  const {
    products: cachedProducts,
    sales: cachedSales,
    stock,
    setProducts,
    setSales: setGlobalSales,
    setStock,
  } = useStore();

  const [sales, setSales] = useState<Sale[]>(cachedSales);
  const [products, setProductsState] = useState<Product[]>(cachedProducts);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Tanggal transaksi manual (Feature 1)
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [isSaleDatePickerOpen, setIsSaleDatePickerOpen] = useState(false);

  const [viewMode, setViewMode] = useState<
    "today" | "all" | "month" | "year" | "custom"
  >("today");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Product filter for Rekap mode (Feature 3)
  const [recapProductFilter, setRecapProductFilter] = useState<string>("all");

  // Edit date state (Feature 2)
  const [editingDateId, setEditingDateId] = useState<string | null>(null);

  // Edit qty local state — allows clearing input to type new number
  const [editingQtyMap, setEditingQtyMap] = useState<Record<string, string>>(
    {},
  );
  const [displayMode, setDisplayMode] = useState<"detail" | "summary">(
    "detail",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setBy] = useState<"date" | "total">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination & Fetching state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const itemsPerPage = 10;

  // Stats state - terpisah dari table pagination
  const [periodStats, setPeriodStats] = useState({
    totalSales: 0,
    itemsSold: 0,
    transactionCount: 0,
  });

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Sync local state when global store changes
  useEffect(() => {
    setSales(cachedSales);
    setProductsState(cachedProducts);
  }, [cachedSales, cachedProducts]);

  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const totalPrice =
    selectedProductData && typeof quantity === "number"
      ? selectedProductData.price * quantity
      : 0;

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, stockData] = await Promise.all([
          productsAPI.list(),
          stockAPI.get(),
        ]);
        setProductsState(productsData);
        setProducts(productsData);
        setStock(stockData);
      } catch (error: any) {
        toast.error("Gagal memuat data");
      }
    };
    fetchData();
  }, [setProducts, setStock]);

  // Fetch period stats (terpisah dari table pagination)
  // Stats ini hanya berubah ketika filter periode (viewMode/month/year) berubah
  // Tidak terpengaruh oleh pagination, search, atau displayMode
  useEffect(() => {
    const fetchPeriodStats = async () => {
      try {
        // Build where clause untuk periode saja (tanpa search)
        let periodWhere: string | undefined;
        const now = new Date();

        if (viewMode === "today") {
          const startOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          ).getTime();
          const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
          periodWhere = `transactionDate >= ${startOfDay} AND transactionDate <= ${endOfDay}`;
        } else if (viewMode === "month") {
          const start = new Date(filterYear, filterMonth, 1).getTime();
          const end = new Date(
            filterYear,
            filterMonth + 1,
            0,
            23,
            59,
            59,
          ).getTime();
          periodWhere = `transactionDate >= ${start} AND transactionDate <= ${end}`;
        } else if (viewMode === "year") {
          const start = new Date(filterYear, 0, 1).getTime();
          const end = new Date(filterYear, 11, 31, 23, 59, 59).getTime();
          periodWhere = `transactionDate >= ${start} AND transactionDate <= ${end}`;
        } else if (viewMode === "custom" && dateRange?.from) {
          const start = new Date(
            dateRange.from.getFullYear(),
            dateRange.from.getMonth(),
            dateRange.from.getDate(),
          ).getTime();
          const end = dateRange.to
            ? new Date(
                dateRange.to.getFullYear(),
                dateRange.to.getMonth(),
                dateRange.to.getDate(),
                23,
                59,
                59,
              ).getTime()
            : start + 24 * 60 * 60 * 1000 - 1;
          periodWhere = `transactionDate >= ${start} AND transactionDate <= ${end}`;
        }
        // viewMode === "all" -> periodWhere tetap undefined (semua data)

        // Fetch semua data untuk periode ini untuk menghitung total stats
        const allSalesForPeriod = await salesAPI.listAll(periodWhere);

        // Hitung stats
        const totalSales = allSalesForPeriod.reduce(
          (sum, sale) => sum + sale.total,
          0,
        );
        const itemsSold = allSalesForPeriod.reduce(
          (sum, sale) => sum + sale.quantity,
          0,
        );

        setPeriodStats({
          totalSales,
          itemsSold,
          transactionCount: allSalesForPeriod.length,
        });
      } catch (error) {
        console.error("Failed to fetch period stats:", error);
      }
    };

    fetchPeriodStats();
  }, [viewMode, filterMonth, filterYear, dateRange]);

  // Fetch sales whenever pagination or filters change
  useEffect(() => {
    const fetchSalesData = async () => {
      setIsFetching(true);
      try {
        // Build where clause for Backendless
        let where: string | undefined;
        const now = new Date();

        if (viewMode === "today") {
          const startOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          ).getTime();
          const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
          where = `transactionDate >= ${startOfDay} AND transactionDate <= ${endOfDay}`;
        } else if (viewMode === "month") {
          const start = new Date(filterYear, filterMonth, 1).getTime();
          const end = new Date(
            filterYear,
            filterMonth + 1,
            0,
            23,
            59,
            59,
          ).getTime();
          where = `transactionDate >= ${start} AND transactionDate <= ${end}`;
        } else if (viewMode === "year") {
          const start = new Date(filterYear, 0, 1).getTime();
          const end = new Date(filterYear, 11, 31, 23, 59, 59).getTime();
          where = `transactionDate >= ${start} AND transactionDate <= ${end}`;
        } else if (viewMode === "custom" && dateRange?.from) {
          const start = new Date(
            dateRange.from.getFullYear(),
            dateRange.from.getMonth(),
            dateRange.from.getDate(),
          ).getTime();
          const end = dateRange.to
            ? new Date(
                dateRange.to.getFullYear(),
                dateRange.to.getMonth(),
                dateRange.to.getDate(),
                23,
                59,
                59,
              ).getTime()
            : start + 24 * 60 * 60 * 1000 - 1;
          where = `transactionDate >= ${start} AND transactionDate <= ${end}`;
        }

        if (debouncedSearchQuery) {
          const searchClause = `productName LIKE '%${debouncedSearchQuery}%'`;
          where = where ? `(${where}) AND ${searchClause}` : searchClause;
        }

        // Summary mode fetches all for the period to group client-side
        // Detail mode fetches with pagination
        const offset = (currentPage - 1) * itemsPerPage;

        const [salesData, countData] = await Promise.all([
          displayMode === "summary"
            ? salesAPI.listAll(where)
            : salesAPI.list(offset, itemsPerPage, where),
          salesAPI.count(where),
        ]);

        setSales(salesData);
        setTotalCount(countData);
        if (displayMode === "detail" && currentPage === 1) {
          // Update global cache only for full page 1 or when necessary
          // For now, let's just sync the fetched sales
          setGlobalSales(salesData);
        }
      } catch (error: any) {
        toast.error("Gagal memuat data penjualan");
      } finally {
        setIsFetching(false);
      }
    };

    fetchSalesData();
  }, [
    currentPage,
    viewMode,
    filterMonth,
    filterYear,
    dateRange,
    displayMode,
    debouncedSearchQuery,
    setGlobalSales,
  ]);

  // Filter & Sort Logic — wrapped in useMemo for performance
  const processedSales = useMemo(() => {
    let filtered = [...sales];

    // Text search filter
    if (searchQuery) {
      filtered = filtered.filter((sale) =>
        (sale.productName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      );
    }

    // Product filter for Rekap mode (Feature 3)
    if (displayMode === "summary" && recapProductFilter !== "all") {
      filtered = filtered.filter(
        (sale) => sale.productName === recapProductFilter,
      );
    }

    if (displayMode === "summary") {
      const grouped = filtered.reduce(
        (acc, sale) => {
          // Safe date parsing
          const parsedDate = new Date(sale.date);
          const dateKey = isNaN(parsedDate.getTime())
            ? "unknown"
            : parsedDate.toDateString();
          if (!acc[dateKey]) {
            acc[dateKey] = {
              id: `summary-${dateKey}`,
              date: sale.date,
              productName:
                recapProductFilter !== "all"
                  ? recapProductFilter
                  : "Rekap Harian",
              quantity: 0,
              price: 0,
              total: 0,
              isSummary: true,
            };
          }
          acc[dateKey].quantity += sale.quantity;
          acc[dateKey].total += sale.total;
          return acc;
        },
        {} as Record<string, any>,
      );
      filtered = Object.values(grouped);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === "asc" ? a.total - b.total : b.total - a.total;
      }
    });
  }, [sales, searchQuery, displayMode, recapProductFilter, sortBy, sortOrder]);

  // Calculate paginated sales
  // If displayMode is detail, sales are already paginated from server
  // If displayMode is summary, we paginate the grouped result client-side
  const processedToDisplay =
    displayMode === "summary"
      ? processedSales.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage,
        )
      : processedSales;

  const totalPages =
    displayMode === "summary"
      ? Math.ceil(processedSales.length / itemsPerPage)
      : Math.ceil(totalCount / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    viewMode,
    filterMonth,
    filterYear,
    dateRange,
    displayMode,
    recapProductFilter,
    searchQuery,
    sortBy,
    sortOrder,
  ]);

  const handleAddSale = async () => {
    if (!selectedProduct) {
      toast.error("Pilih produk terlebih dahulu");
      return;
    }
    if (typeof quantity !== "number" || quantity < 1) {
      toast.error("Jumlah minimal 1");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    if (product.useChicken && stock.cookedChicken < quantity) {
      toast.error("Stok ayam matang habis/kurang!", {
        description: `Stok tersedia: ${stock.cookedChicken} ekor. Mohon tambah stok matang dulu.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const product = products.find((p) => p.id === selectedProduct);
      if (!product) return;
      // Hitung transactionDate: gunakan saleDate dengan waktu sekarang
      const now = new Date();
      const txDate = new Date(
        saleDate.getFullYear(),
        saleDate.getMonth(),
        saleDate.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
      ).getTime();

      const created = await salesAPI.create({
        productId: selectedProduct,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        transactionDate: txDate,
      });
      setSales((prev) => [created, ...prev]);
      useStore.getState().setSales([created, ...cachedSales]);
      if (product.useChicken) {
        const { stock: currentStock, setStock } = useStore.getState();
        try {
          const updatedStock = await stockAPI.update({
            cookedChicken: Math.max(0, currentStock.cookedChicken - quantity),
          });
          setStock(updatedStock);
        } catch (e) {}
      }
      toast.success("Penjualan berhasil dicatat!");
      setSelectedProduct("");
      setQuantity(1);
      setSaleDate(new Date()); // Reset tanggal ke hari ini setelah simpan
    } catch (e) {
      toast.error("Gagal menyimpan penjualan");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler untuk update tanggal transaksi (Feature 2)
  const handleUpdateDate = async (id: string, newDate: Date) => {
    const originalSale = sales.find((s) => s.id === id);
    if (!originalSale) return;

    // Preserve waktu asli, hanya ubah tanggal
    const originalDate = new Date(originalSale.date);
    const updatedDate = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      originalDate.getHours(),
      originalDate.getMinutes(),
      originalDate.getSeconds(),
    );
    const txTimestamp = updatedDate.getTime();

    // Optimistic update - immutable
    const updatedSales = sales.map((s) =>
      s.id === id ? { ...s, date: updatedDate.toISOString() } : s,
    );
    setSales(updatedSales);
    setEditingDateId(null);

    try {
      await salesAPI.update(id, { transactionDate: txTimestamp } as any);
      toast.success("Tanggal berhasil diupdate");
    } catch (e) {
      setSales(sales); // Revert on error
      toast.error("Gagal update tanggal");
    }
  };

  const handleUpdateSale = async (
    id: string,
    field: "productId" | "quantity",
    value: string | number,
  ) => {
    const originalSale = sales.find((s) => s.id === id);
    if (!originalSale) return;

    // Optimistic update
    const updatedSales = sales.map((s) => {
      if (s.id === id) {
        if (field === "productId") {
          const newProduct = products.find((p) => p.id === value);
          if (newProduct) {
            return {
              ...s,
              productId: newProduct.id,
              productName: newProduct.name,
              price: newProduct.price,
              total: newProduct.price * s.quantity,
            };
          }
        }
        if (field === "quantity") {
          const qty = Number(value);
          return { ...s, quantity: qty, total: s.price * qty };
        }
      }
      return s;
    });
    setSales(updatedSales);

    try {
      let payload: any = {};
      if (field === "productId") {
        const newProduct = products.find((p) => p.id === value);
        if (newProduct) {
          payload = {
            productId: newProduct.id,
            productName: newProduct.name,
            price: newProduct.price,
            quantity: originalSale.quantity,
          };
        }
      } else {
        payload = {
          quantity: Number(value),
          price: originalSale.price,
        };
      }

      await salesAPI.update(id, payload);

      // Adjust stock if qty changed on a useChicken product
      if (field === "quantity") {
        // Fallback: cari by ID dulu, kalau tidak ketemu cari by name
        const product =
          products.find((p) => p.id === originalSale.productId) ||
          products.find((p) => p.name === originalSale.productName);
        if (product?.useChicken) {
          const oldQty = originalSale.quantity;
          const newQty = Number(value);
          const delta = oldQty - newQty; // positive = returning stock, negative = using more
          if (delta !== 0) {
            const { stock: currentStock, setStock } = useStore.getState();
            try {
              const updatedStock = await stockAPI.update({
                cookedChicken: Math.max(0, currentStock.cookedChicken + delta),
              });
              setStock(updatedStock);
            } catch (e) {
              toast.error("Gagal update stok setelah edit jumlah");
            }
          }
        }
      }

      toast.success("Data berhasil diupdate");
    } catch (e) {
      setSales(sales); // Revert
      toast.error("Gagal update data");
    }
  };

  // Commit qty edit — validates and calls handleUpdateSale
  const commitQtyEdit = (saleId: string) => {
    const rawVal = editingQtyMap[saleId];
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;

    // Validate: empty, 0, or non-positive
    const num = rawVal !== undefined ? Number(rawVal) : sale.quantity;
    if (!rawVal || rawVal.trim() === "" || isNaN(num) || num < 1) {
      toast.error("Jumlah harus minimal 1");
      // Revert to original value
      setEditingQtyMap((prev) => {
        const next = { ...prev };
        delete next[saleId];
        return next;
      });
      return;
    }

    // Only update if value actually changed
    if (num !== sale.quantity) {
      handleUpdateSale(saleId, "quantity", num);
    }

    // Clear editing state
    setEditingQtyMap((prev) => {
      const next = { ...prev };
      delete next[saleId];
      return next;
    });
  };

  const commitDeleteSale = async (id: string) => {
    setIsDeleting(id);
    // Simpan data sale sebelum dihapus (untuk adjust stock)
    const deletedSale = sales.find((s) => s.id === id);
    try {
      await salesAPI.delete(id);
      const updatedSales = sales.filter((s) => s.id !== id);
      setSales(updatedSales);
      useStore.getState().removeSale(id);

      // Return stock jika produk useChicken
      if (deletedSale) {
        const product =
          products.find((p) => p.id === deletedSale.productId) ||
          products.find((p) => p.name === deletedSale.productName);
        if (product?.useChicken && deletedSale.quantity > 0) {
          const { stock: currentStock, setStock } = useStore.getState();
          try {
            const updatedStock = await stockAPI.update({
              cookedChicken: currentStock.cookedChicken + deletedSale.quantity,
            });
            setStock(updatedStock);
          } catch (e) {
            toast.error("Penjualan dihapus, tapi gagal mengembalikan stok");
          }
        }
      }

      toast.success("Riwayat penjualan berhasil dihapus");
    } catch (e) {
      toast.error("Gagal menghapus riwayat penjualan");
    } finally {
      setIsDeleting(null);
    }
  };

  // Statistik menggunakan periodStats yang di-fetch terpisah
  // Stats ini menampilkan total keseluruhan periode, tidak terpengaruh pagination
  const displaySalesTotal = periodStats.totalSales;
  const displayItemsSold = periodStats.itemsSold;
  const displayTransactionCount = periodStats.transactionCount;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-primary" />
            Pencatatan Penjualan
          </h1>
          <p className="text-muted-foreground mt-1">
            Catat dan pantau riwayat penjualan Anda
          </p>
        </div>
        {/* Unified Filter Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Period tabs */}
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-full border">
              {(["today", "month", "year", "all"] as const).map((m) => (
                <Button
                  key={m}
                  variant={viewMode === m ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setViewMode(m);
                    setDateRange(undefined);
                  }}
                  className={cn(
                    "rounded-full h-7 px-3 text-xs font-medium",
                    viewMode === m && "shadow-sm",
                  )}
                >
                  {m === "today"
                    ? "Hari Ini"
                    : m === "all"
                      ? "Semua"
                      : m === "month"
                        ? "Bulan"
                        : "Tahun"}
                </Button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-border hidden sm:block" />

            {/* Date range picker */}
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={viewMode === "custom" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 gap-1.5 rounded-full text-xs font-medium px-3",
                    viewMode === "custom"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-white hover:bg-muted/50",
                  )}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  {viewMode === "custom" && dateRange?.from ? (
                    <span>
                      {dateRange.from.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                      {dateRange.to &&
                      dateRange.to.getTime() !== dateRange.from.getTime()
                        ? ` – ${dateRange.to.toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}`
                        : ""}
                    </span>
                  ) : (
                    <span>Pilih Tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    if (range?.from) {
                      setViewMode("custom");
                    }
                    if (range?.from && range?.to) {
                      setTimeout(() => setIsDatePickerOpen(false), 300);
                    }
                  }}
                  numberOfMonths={1}
                  disabled={{ after: new Date() }}
                  defaultMonth={dateRange?.from || new Date()}
                />
              </PopoverContent>
            </Popover>
            {viewMode === "custom" && dateRange?.from && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setDateRange(undefined);
                  setViewMode("today");
                }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Month/Year selector - shown inline when Bulan or Tahun is active */}
          {(viewMode === "month" || viewMode === "year") && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground text-xs">Periode:</span>
              {viewMode === "month" && (
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className="bg-white border rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "Mei",
                    "Jun",
                    "Jul",
                    "Agu",
                    "Sep",
                    "Okt",
                    "Nov",
                    "Des",
                  ].map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="bg-white border rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/20"
              >
                {Array.from({ length: 5 }, (_, i) => 2026 - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title={
            viewMode === "today"
              ? "Penjualan Hari Ini"
              : viewMode === "all"
                ? "Total Penjualan (Semua)"
                : "Total Penjualan"
          }
          value={formatRupiah(displaySalesTotal)}
          numericValue={displaySalesTotal}
          formatter={formatRupiah}
          icon={TrendingUp}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Item Terjual"
          value={`${displayItemsSold} item`}
          numericValue={displayItemsSold}
          formatter={(v) => `${v} item`}
          icon={Receipt}
          iconClassName="bg-secondary/10 text-secondary"
        />
        <StatsCard
          title="Total Transaksi"
          value={displayTransactionCount}
          numericValue={displayTransactionCount}
          icon={CalendarIcon}
          iconClassName="bg-success/10 text-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="premium-card h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Tambah Penjualan
            </CardTitle>
            <CardDescription>
              Pencatatan cepat menu yang terjual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Pilih Produk</Label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Pilih produk..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full pr-2">
                        <span>{product.name}</span>
                        <span className="text-xs font-semibold text-primary ml-2">
                          {formatRupiah(product.price)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Jumlah Porsi</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg h-11 w-11 shrink-0"
                  onClick={() =>
                    setQuantity((prev) =>
                      Math.max(1, (typeof prev === "number" ? prev : 1) - 1),
                    )
                  }
                >
                  -
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="bg-white h-11 text-center font-bold text-lg"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg h-11 w-11 shrink-0"
                  onClick={() =>
                    setQuantity(
                      (prev) => (typeof prev === "number" ? prev : 0) + 1,
                    )
                  }
                >
                  +
                </Button>
              </div>
            </div>

            {/* Tanggal Transaksi (Feature 1) */}
            <div className="space-y-2">
              <Label>Tanggal Transaksi</Label>
              <Popover
                open={isSaleDatePickerOpen}
                onOpenChange={setIsSaleDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal bg-white",
                      saleDate.toDateString() !== new Date().toDateString() &&
                        "border-primary text-primary font-medium",
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    {saleDate.toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={saleDate}
                    onSelect={(date) => {
                      if (date) {
                        setSaleDate(date);
                        setIsSaleDatePickerOpen(false);
                      }
                    }}
                    disabled={{ after: new Date() }}
                    defaultMonth={saleDate}
                  />
                </PopoverContent>
              </Popover>
              {saleDate.toDateString() !== new Date().toDateString() && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  ⚠️ Transaksi akan dicatat untuk tanggal{" "}
                  <strong>
                    {saleDate.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                    })}
                  </strong>
                </p>
              )}
            </div>

            {selectedProduct && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Harga Satuan
                  </span>
                  <span className="text-sm font-medium">
                    {formatRupiah(selectedProductData?.price || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Jumlah</span>
                  <span className="text-sm font-medium">x{quantity}</span>
                </div>
                <div className="h-px bg-primary/20 my-2" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-xl font-black text-primary">
                    {formatRupiah(totalPrice)}
                  </span>
                </div>
              </div>
            )}

            <Button
              className="w-full h-12 bg-gradient-primary hover:scale-[1.02] transition-transform text-primary-foreground font-bold shadow-glow"
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
                  Simpan Transaksi
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="premium-card lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Riwayat Penjualan
              </CardTitle>
              <CardDescription>
                {displayMode === "summary" ? processedSales.length : totalCount}{" "}
                baris ditemukan (Hal {currentPage} dari {totalPages || 1})
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm bg-muted/50 border-none focus-visible:ring-1"
                  />
                </div>
                <div className="flex items-center bg-muted/50 p-1 rounded-lg border h-9 shrink-0 gap-x-1">
                  <Button
                    variant={displayMode === "detail" ? "default" : "ghost"}
                    size="xs"
                    onClick={() => {
                      setDisplayMode("detail");
                      setRecapProductFilter("all");
                    }}
                    className="px-2"
                  >
                    Detail
                  </Button>
                  <Button
                    variant={displayMode === "summary" ? "default" : "ghost"}
                    size="xs"
                    onClick={() => setDisplayMode("summary")}
                    className="px-2"
                  >
                    Rekap
                  </Button>
                </div>
              </div>
              {/* Product filter for Rekap mode (Feature 3) */}
              {displayMode === "summary" && (
                <div className="flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Select
                    value={recapProductFilter}
                    onValueChange={setRecapProductFilter}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white w-full sm:w-48">
                      <SelectValue placeholder="Filter produk..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Produk</SelectItem>
                      {/* Unique product names from current sales data */}
                      {[
                        ...new Set(
                          sales.map((s) => s.productName).filter(Boolean),
                        ),
                      ]
                        .sort()
                        .map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {processedSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ListFilter className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  Data tidak ditemukan
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden bg-white/50">
                <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar">
                  <Table className="min-w-[550px]">
                    <TableHeader className="sticky top-0 bg-white z-20 shadow-sm">
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead
                          className="text-xs font-bold cursor-pointer"
                          onClick={() => {
                            if (sortBy === "date")
                              setSortOrder(
                                sortOrder === "asc" ? "desc" : "asc",
                              );
                            else {
                              setBy("date");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            Tanggal
                            {sortBy === "date" &&
                              (sortOrder === "asc" ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-bold">
                          Produk
                        </TableHead>
                        <TableHead className="text-xs font-bold text-center">
                          Qty
                        </TableHead>
                        {displayMode === "detail" && (
                          <TableHead className="text-xs font-bold text-center">
                            Harga
                          </TableHead>
                        )}
                        <TableHead
                          className="text-xs font-bold text-center cursor-pointer"
                          onClick={() => {
                            if (sortBy === "total")
                              setSortOrder(
                                sortOrder === "asc" ? "desc" : "asc",
                              );
                            else {
                              setBy("total");
                              setSortOrder("desc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Total
                            {sortBy === "total" &&
                              (sortOrder === "asc" ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              ))}
                          </div>
                        </TableHead>
                        {displayMode === "detail" && (
                          <TableHead className="text-xs font-bold text-center w-12">
                            Aksi
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={`skeleton-${i}`}>
                              <TableCell>
                                <Skeleton className="h-4 w-20" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-32" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-8 mx-auto" />
                              </TableCell>
                              {displayMode === "detail" && (
                                <TableCell>
                                  <Skeleton className="h-4 w-20 mx-auto" />
                                </TableCell>
                              )}
                              <TableCell>
                                <Skeleton className="h-4 w-24 mx-auto" />
                              </TableCell>
                              {displayMode === "detail" && (
                                <TableCell>
                                  <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        : processedToDisplay.map((sale) => (
                            <TableRow
                              key={sale.id}
                              className={cn(
                                "group transition-colors",
                                (sale as any).isSummary
                                  ? "bg-primary/5 font-semibold"
                                  : "hover:bg-muted/30",
                              )}
                            >
                              <TableCell className="text-xs text-muted-foreground py-3">
                                {displayMode === "detail" &&
                                !(sale as any).isSummary ? (
                                  <Popover
                                    open={editingDateId === sale.id}
                                    onOpenChange={(open) =>
                                      setEditingDateId(open ? sale.id : null)
                                    }
                                  >
                                    <PopoverTrigger asChild>
                                      <div className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 p-1 -m-1 rounded-md transition-colors group/date">
                                        <span>{formatDate(sale.date)}</span>
                                        <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover/date:opacity-100 transition-opacity" />
                                      </div>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-auto p-0"
                                      align="start"
                                    >
                                      <Calendar
                                        mode="single"
                                        selected={new Date(sale.date)}
                                        onSelect={(date) => {
                                          if (date)
                                            handleUpdateDate(sale.id, date);
                                        }}
                                        disabled={{ after: new Date() }}
                                        defaultMonth={new Date(sale.date)}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  formatDate(sale.date)
                                )}
                              </TableCell>
                              <TableCell className="text-sm py-3">
                                {displayMode === "detail" ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors group/edit">
                                        <span>{sale.productName}</span>
                                        <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                      </div>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="p-0"
                                      align="start"
                                    >
                                      <div className="p-2">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                                          Ubah Produk
                                        </p>
                                        <div className="space-y-1">
                                          {products.map((p) => (
                                            <div
                                              key={p.id}
                                              className={cn(
                                                "cursor-pointer text-sm p-2 rounded-md hover:bg-muted flex items-center justify-between",
                                                sale.productId === p.id &&
                                                  "bg-primary/10 text-primary font-medium",
                                              )}
                                              onClick={() =>
                                                handleUpdateSale(
                                                  sale.id,
                                                  "productId",
                                                  p.id,
                                                )
                                              }
                                            >
                                              {p.name}
                                              {sale.productId === p.id && (
                                                <Check className="w-3 h-3" />
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  sale.productName
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-center font-bold py-3">
                                {displayMode === "detail" ? (
                                  <input
                                    type="number"
                                    min={1}
                                    className="w-14 text-center bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={
                                      editingQtyMap[sale.id] !== undefined
                                        ? editingQtyMap[sale.id]
                                        : sale.quantity
                                    }
                                    onChange={(e) => {
                                      setEditingQtyMap((prev) => ({
                                        ...prev,
                                        [sale.id]: e.target.value,
                                      }));
                                    }}
                                    onBlur={() => commitQtyEdit(sale.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    onFocus={(e) => {
                                      e.target.select();
                                      setEditingQtyMap((prev) => ({
                                        ...prev,
                                        [sale.id]: String(sale.quantity),
                                      }));
                                    }}
                                  />
                                ) : (
                                  sale.quantity
                                )}
                              </TableCell>
                              {displayMode === "detail" && (
                                <TableCell className="text-sm text-center text-muted-foreground py-3">
                                  {formatRupiah(sale.price)}
                                </TableCell>
                              )}
                              <TableCell className="text-sm text-center font-bold text-primary py-3">
                                {formatRupiah(sale.total)}
                              </TableCell>
                              {displayMode === "detail" && (
                                <TableCell className="text-sm text-center py-3">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                        disabled={isDeleting === sale.id}
                                      >
                                        {isDeleting === sale.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Hapus data penjualan?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tindakan ini tidak dapat dibatalkan.
                                          Stok yang sudah terpotong{" "}
                                          <strong>TIDAK</strong> akan
                                          dikembalikan secara otomatis.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Batal
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                          onClick={() =>
                                            commitDeleteSale(sale.id)
                                          }
                                        >
                                          Ya, Hapus
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg h-9 px-2 sm:px-4"
                >
                  <ChevronLeft className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </Button>

                <div className="flex items-center gap-1 sm:order-0 justify-center">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="icon-sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg h-9 px-2 sm:px-4"
                >
                  <span className="hidden sm:inline">Berikutnya</span>
                  <ChevronRight className="w-4 h-4 sm:ml-1" />
                </Button>
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
