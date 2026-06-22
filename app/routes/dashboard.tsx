import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  Send,
  TrendingUp,
  Clock,
  Drumstick,
  Activity,
  Flame,
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { StatsCard } from "~/components/stats-card";
import { StatusBadge, StatusDot } from "~/components/status-badge";
import { SalesChart } from "~/components/sales-chart";
import useStore, {
  formatRupiah,
  type Sale,
  type Stock,
} from "~/store/useStore";
import { Link } from "react-router";
import { useAuthStore } from "~/modules/auth/auth.store";
import { salesAPI, stockAPI, productsAPI } from "~/services/api";

// Helper untuk membuat filter where clause berdasarkan range waktu
const createDateFilter = (
  range: "today" | "month" | "year" | "all",
  month?: number,
  year?: number,
): string | undefined => {
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  if (range === "today") {
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
    return `transactionDate >= ${startOfDay} and transactionDate <= ${endOfDay}`;
  }
  if (range === "month") {
    const startOfMonth = new Date(targetYear, targetMonth, 1).getTime();
    const endOfMonth = new Date(
      targetYear,
      targetMonth + 1,
      0,
      23,
      59,
      59,
      999,
    ).getTime();
    return `transactionDate >= ${startOfMonth} and transactionDate <= ${endOfMonth}`;
  }
  if (range === "year") {
    const startOfYear = new Date(targetYear, 0, 1).getTime();
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999).getTime();
    return `transactionDate >= ${startOfYear} and transactionDate <= ${endOfYear}`;
  }
  return undefined; // all - no filter
};

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { autoPostStatus, stock: cachedStock, setStock } = useStore();
  const { user } = useAuthStore();

  const [viewMode, setViewMode] = useState<"today" | "month" | "year" | "all">(
    "today",
  );
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentSales, setCurrentSales] = useState<Sale[]>([]);

  // Stats state - initialized with zeros
  const [stats, setStats] = useState({
    todaySales: 0,
    itemsSold: 0,
    rawChicken: cachedStock.rawChicken,
    friedPlanning: cachedStock.friedPlanning,
    cookedChicken: cachedStock.cookedChicken,
    totalTransactions: 0,
  });

  // Calculate stats from sales data (used for server-fetched data)
  const calculateStatsFromSales = (salesList: Sale[]) => {
    const totalSales = salesList.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = salesList.reduce((sum, sale) => sum + sale.quantity, 0);
    return {
      todaySales: totalSales,
      itemsSold: totalItems,
      totalTransactions: salesList.length,
    };
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch stats from API based on current filter
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        // Create filter for sales query
        const whereClause = createDateFilter(viewMode, filterMonth, filterYear);

        // Fetch filtered sales, stock and products in parallel
        const [salesData, stockData, productsData] = await Promise.all([
          salesAPI.listAll(whereClause),
          stockAPI.get(),
          productsAPI.list()
        ]);
        
        useStore.getState().setProducts(productsData);

        // Calculate stats from fetched sales
        const calculatedStats = calculateStatsFromSales(salesData);
        
        setCurrentSales(salesData);

        setStats({
          todaySales: calculatedStats.todaySales,
          itemsSold: calculatedStats.itemsSold,
          totalTransactions: calculatedStats.totalTransactions,
          rawChicken: stockData.rawChicken,
          friedPlanning: stockData.friedPlanning,
          cookedChicken: stockData.cookedChicken,
        });

        // Update stock in store
        setStock(stockData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoadingStats(false);
        setIsInitialLoad(false);
      }
    };

    fetchStats();
  }, [viewMode, filterMonth, filterYear, setStock]);

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 19) return "Selamat Sore";
    return "Selamat Malam";
  };

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            {getGreeting()}, {user?.name || "Admin"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola bisnis Ayam Geprek Sriwedari Anda
          </p>
        </div>

        {/* Current Time Card */}
        <Card className="bg-linear-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground border-0 shadow-glow overflow-hidden relative group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-colors" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs opacity-80 font-medium">Waktu Sekarang</p>
                <p className="text-sm font-bold tracking-tight">
                  {formatTime(currentTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="premium-card bg-muted/30 border-none shadow-none">
        <CardContent className="p-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Button
                variant={viewMode === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("today")}
                className="rounded-full px-4"
              >
                Hari Ini
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
                className="rounded-full px-4"
              >
                Bulan Ini
              </Button>
              <Button
                variant={viewMode === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("year")}
                className="rounded-full px-4"
              >
                Tahun Ini
              </Button>
              <Button
                variant={viewMode === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("all")}
                className="rounded-full px-4"
              >
                Semua
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {(viewMode === "month" || viewMode === "year") && (
                <div className="flex items-center gap-2">
                  {viewMode === "month" && (
                    <select
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                      className="bg-white border border-border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {months.map((m, i) => (
                        <option key={m} value={i}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                    className="bg-white border border-border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="h-8 w-px bg-border hidden md:block" />
              <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Filter:{" "}
                <span className="text-foreground">
                  {viewMode === "today"
                    ? "Harian"
                    : viewMode === "month"
                      ? "Bulanan"
                      : viewMode === "year"
                        ? "Tahunan"
                        : "Semua"}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - Balanced Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Top Row: 2 cards, each col-span-3 */}
        <StatsCard
          title="Stok Ayam Matang"
          value={`${stats.cookedChicken} ekor`}
          numericValue={stats.cookedChicken}
          formatter={(val) => `${val} ekor`}
          subtitle="Tersedia untuk dijual"
          icon={Flame}
          iconClassName="bg-secondary/10 text-secondary"
          className="lg:col-span-3"
        />

        <StatsCard
          title="Stok Ayam Mentah"
          value={`${stats.rawChicken} ekor`}
          numericValue={stats.rawChicken}
          formatter={(val) => `${val} ekor`}
          subtitle={stats.rawChicken <= 10 ? "Stok menipis!" : "Stok mencukupi"}
          icon={Package}
          iconClassName={cn(
            "text-warning",
            stats.rawChicken <= 10
              ? "bg-destructive/10 text-destructive"
              : "bg-warning/10",
          )}
          className="lg:col-span-3"
        />

        {/* Bottom Row: 2 cards, each col-span-3 for symmetry */}
        <StatsCard
          title="Penjualan Hari Ini"
          value={formatRupiah(stats.todaySales)}
          numericValue={stats.todaySales}
          formatter={formatRupiah}
          subtitle={`${stats.itemsSold} item terjual`}
          icon={ShoppingCart}
          iconClassName="bg-primary/10 text-primary"
          trend={stats.todaySales > 0 ? 12 : undefined}
          className="lg:col-span-3"
        />

        <StatsCard
          title="Total Transaksi"
          value={stats.totalTransactions}
          numericValue={stats.totalTransactions}
          subtitle="Riwayat transaksi tercatat"
          icon={TrendingUp}
          iconClassName="bg-success/10 text-success"
          className="lg:col-span-3 sm:col-span-1"
        />
      </div>

      {/* Sales Chart Section */}
      <SalesChart 
        sales={currentSales} 
        viewMode={viewMode} 
        month={filterMonth} 
        year={filterYear} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stock Overview */}
        <Card className="premium-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Ringkasan Stok
            </CardTitle>
            <CardDescription>Status stok ayam saat ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-foreground">Ayam Mentah</span>
                <span
                  className={`text-sm font-semibold ${
                    stats.rawChicken <= 10 ? "text-destructive" : "text-primary"
                  }`}
                >
                  {stats.rawChicken} ekor
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
                <span className="text-sm text-foreground">Ayam Matang</span>
                <span className="text-sm font-semibold text-secondary">
                  {stats.cookedChicken} ekor
                </span>
              </div>

              <Link to="/stock">
                <Button className="w-full mt-2" variant="outline">
                  Kelola Stok
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
