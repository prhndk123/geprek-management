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
import useStore, {
  formatRupiah,
  type Sale,
  type Stock,
} from "~/store/useStore";
import { Link } from "react-router";
import { useAuthStore } from "~/modules/auth/auth.store";
import { salesAPI, stockAPI } from "~/services/api";

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const {
    autoPostStatus,
    stock: cachedStock,
    sales: cachedSales,
    setSales,
    setStock,
    getSalesToday,
  } = useStore();
  const { user } = useAuthStore();

  // Helper to calculate stats from a sales list
  const calculateStats = (salesList: Sale[]) => {
    const today = new Date().toDateString();
    const todaySalesList = salesList.filter(
      (sale) => new Date(sale.date).toDateString() === today,
    );
    const todaySalesTotal = todaySalesList.reduce(
      (sum, sale) => sum + sale.total,
      0,
    );
    const itemsSoldTotal = todaySalesList.reduce(
      (sum, sale) => sum + sale.quantity,
      0,
    );
    return {
      todaySales: todaySalesTotal,
      itemsSold: itemsSoldTotal,
      totalTransactions: salesList.length,
    };
  };

  // Initial stats from cache
  const initialCalculated = calculateStats(cachedSales);
  const [stats, setStats] = useState({
    todaySales: initialCalculated.todaySales,
    itemsSold: initialCalculated.itemsSold,
    rawChicken: cachedStock.rawChicken,
    friedPlanning: cachedStock.friedPlanning,
    cookedChicken: cachedStock.cookedChicken,
    totalTransactions: initialCalculated.totalTransactions,
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real data from API and sync to store
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesData, stockData] = await Promise.all([
          salesAPI.list(),
          stockAPI.get(),
        ]);

        // Sync to global store (cache)
        setSales(salesData);
        setStock(stockData);

        const newStats = calculateStats(salesData);
        setStats({
          todaySales: newStats.todaySales,
          itemsSold: newStats.itemsSold,
          rawChicken: stockData.rawChicken,
          friedPlanning: stockData.friedPlanning,
          cookedChicken: stockData.cookedChicken,
          totalTransactions: newStats.totalTransactions,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    fetchData();
  }, [setSales, setStock]);

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

      {/* Stats Grid - Balanced Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Top Row: 3 cards, each col-span-2 */}
        <StatsCard
          title="Stok Ayam Matang"
          value={`${stats.cookedChicken} ekor`}
          numericValue={stats.cookedChicken}
          formatter={(val) => `${val} ekor`}
          subtitle="Tersedia untuk dijual"
          icon={Flame}
          iconClassName="bg-secondary/10 text-secondary"
          className="lg:col-span-2"
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
          className="lg:col-span-2"
        />

        <StatsCard
          title="Rencana Goreng"
          value={`${stats.friedPlanning} ekor`}
          numericValue={stats.friedPlanning}
          formatter={(val) => `${val} ekor`}
          subtitle="Ayam siap digoreng"
          icon={Drumstick}
          iconClassName="bg-accent/10 text-accent-foreground"
          className="lg:col-span-2"
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

      {/* Quick Actions & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Auto Post Status */}
        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Status Auto Post
              </CardTitle>
              <StatusBadge status={autoPostStatus} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <StatusDot status={autoPostStatus} size="md" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Telegram Bot
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {autoPostStatus === "RUNNING"
                      ? "Berjalan dan mengirim postingan"
                      : "Bot tidak aktif"}
                  </p>
                </div>
              </div>

              <Link to="/autopost">
                <Button className="w-full" variant="outline">
                  Kelola Auto Post
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Sales */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Penjualan Cepat
            </CardTitle>
            <CardDescription>Akses cepat ke halaman penjualan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-foreground">Hari ini</span>
                <span className="text-sm font-semibold text-primary">
                  {formatRupiah(stats.todaySales)}
                </span>
              </div>

              <Link to="/sales">
                <Button className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                  Catat Penjualan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stock Overview */}
        <Card className="premium-card">
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

              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5">
                <span className="text-sm text-foreground">Rencana Goreng</span>
                <span className="text-sm font-semibold text-accent-foreground">
                  {stats.friedPlanning} ekor
                </span>
              </div>

              <Link to="/stock">
                <Button className="w-full" variant="outline">
                  Kelola Stok
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bot Info Summary */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Informasi Bot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Platform</p>
              <p className="text-sm font-medium text-foreground">Telegram</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Backend</p>
              <p className="text-sm font-medium text-foreground">
                FastAPI + Telethon
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">
                Status Koneksi
              </p>
              <div className="flex items-center gap-2">
                <StatusDot status={true} size="sm" />
                <span className="text-sm font-medium text-success">
                  Terhubung
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
