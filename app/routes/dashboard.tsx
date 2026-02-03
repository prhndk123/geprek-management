import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Send, 
  TrendingUp,
  Clock,
  Drumstick,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { StatsCard } from '~/components/stats-card';
import { StatusBadge, StatusDot } from '~/components/status-badge';
import useStore, { formatRupiah } from '~/store/useStore';
import { Link } from 'react-router';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { 
    autoPostStatus, 
    getTotalSalesToday, 
    getItemsSoldToday,
    stock,
    sales,
    user 
  } = useStore();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const todaySales = getTotalSalesToday();
  const itemsSold = getItemsSoldToday();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            Selamat Datang, {user?.username || 'Admin'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola bisnis Ayam Geprek Sriwedari Anda
          </p>
        </div>
        
        {/* Current Time Card */}
        <Card className="bg-gradient-primary text-primary-foreground border-0 shadow-glow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-xs opacity-80">Waktu Sekarang</p>
                <p className="text-sm font-medium">{formatTime(currentTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Penjualan Hari Ini"
          value={formatRupiah(todaySales)}
          subtitle={`${itemsSold} item terjual`}
          icon={ShoppingCart}
          trend={todaySales > 0 ? 12 : undefined}
        />
        
        <StatsCard
          title="Stok Ayam Mentah"
          value={`${stock.rawChicken} ekor`}
          subtitle={stock.rawChicken <= 10 ? 'Stok menipis!' : 'Stok mencukupi'}
          icon={Package}
          iconClassName={stock.rawChicken <= 10 ? 'bg-destructive/10' : undefined}
        />
        
        <StatsCard
          title="Rencana Goreng"
          value={`${stock.friedPlanning} ekor`}
          subtitle="Ayam siap digoreng"
          icon={Drumstick}
          iconClassName="bg-secondary/10"
        />
        
        <StatsCard
          title="Total Transaksi"
          value={sales.length}
          subtitle="Sepanjang waktu"
          icon={TrendingUp}
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
                    {autoPostStatus === 'RUNNING' 
                      ? 'Berjalan dan mengirim postingan' 
                      : 'Bot tidak aktif'}
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
            <CardDescription>
              Akses cepat ke halaman penjualan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-foreground">Hari ini</span>
                <span className="text-sm font-semibold text-primary">
                  {formatRupiah(todaySales)}
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
            <CardDescription>
              Status stok ayam saat ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-foreground">Ayam Mentah</span>
                <span className={`text-sm font-semibold ${
                  stock.rawChicken <= 10 ? 'text-destructive' : 'text-primary'
                }`}>
                  {stock.rawChicken} ekor
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
                <span className="text-sm text-foreground">Rencana Goreng</span>
                <span className="text-sm font-semibold text-secondary">
                  {stock.friedPlanning} ekor
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
              <p className="text-sm font-medium text-foreground">FastAPI + Telethon</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Status Koneksi</p>
              <div className="flex items-center gap-2">
                <StatusDot status={true} size="sm" />
                <span className="text-sm font-medium text-success">Terhubung</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
