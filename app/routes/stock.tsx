import { useState, ChangeEvent } from 'react';
import { 
  Package, 
  Plus, 
  Minus,
  Drumstick,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Flame
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Progress } from '~/components/ui/progress';
import { StockBadge } from '~/components/status-badge';
import useStore from '~/store/useStore';
import { toast } from 'sonner';

const Stock = () => {
  const { stock, increaseRawStock, decreaseRawStock, resetFriedPlanning } = useStore();
  const [addAmount, setAddAmount] = useState(10);
  const [fryAmount, setFryAmount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'add' | 'fry' | 'reset' | null>(null);

  const handleIncreaseStock = () => {
    if (addAmount < 1) {
      toast.error('Jumlah minimal 1');
      return;
    }

    setIsLoading(true);
    setLoadingAction('add');

    setTimeout(() => {
      increaseRawStock(addAmount);
      toast.success('Stok berhasil ditambah!', {
        description: `+${addAmount} ekor ayam mentah`,
      });
      setAddAmount(10);
      setIsLoading(false);
      setLoadingAction(null);
    }, 300);
  };

  const handleDecreaseStock = () => {
    if (fryAmount < 1) {
      toast.error('Jumlah minimal 1');
      return;
    }

    if (fryAmount > stock.rawChicken) {
      toast.error('Stok tidak mencukupi', {
        description: `Stok tersedia: ${stock.rawChicken} ekor`,
      });
      return;
    }

    setIsLoading(true);
    setLoadingAction('fry');

    setTimeout(() => {
      decreaseRawStock(fryAmount);
      toast.success('Rencana goreng ditambah!', {
        description: `${fryAmount} ekor ayam akan digoreng`,
      });
      setFryAmount(5);
      setIsLoading(false);
      setLoadingAction(null);
    }, 300);
  };

  const handleResetPlanning = () => {
    setIsLoading(true);
    setLoadingAction('reset');

    setTimeout(() => {
      resetFriedPlanning();
      toast.success('Rencana goreng direset');
      setIsLoading(false);
      setLoadingAction(null);
    }, 300);
  };

  // Calculate stock percentage (assuming max 100 for visual)
  const stockPercentage = Math.min((stock.rawChicken / 100) * 100, 100);
  const isLowStock = stock.rawChicken <= 10;
  const isMediumStock = stock.rawChicken <= 25 && stock.rawChicken > 10;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
          <Package className="w-7 h-7 text-primary" />
          Manajemen Stok
        </h1>
        <p className="text-muted-foreground mt-1">
          Kelola stok ayam mentah dan perencanaan
        </p>
      </div>

      {/* Low Stock Warning */}
      {isLowStock && (
        <Alert className="border-destructive/30 bg-destructive/10">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>Peringatan:</strong> Stok ayam mentah menipis! Segera tambah stok.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Chicken Stock Card */}
        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Drumstick className="w-5 h-5 text-primary" />
                  Stok Ayam Mentah
                </CardTitle>
                <CardDescription>
                  Jumlah ayam mentah tersedia
                </CardDescription>
              </div>
              <StockBadge level={stock.rawChicken} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stock Display */}
            <div className="text-center py-6">
              <div className="relative inline-flex items-center justify-center">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                  isLowStock 
                    ? 'bg-destructive/10 border-4 border-destructive/30' 
                    : isMediumStock
                    ? 'bg-warning/10 border-4 border-warning/30'
                    : 'bg-primary/10 border-4 border-primary/30'
                }`}>
                  <div className="text-center">
                    <p className={`text-4xl font-bold ${
                      isLowStock ? 'text-destructive' : 'text-primary'
                    }`}>
                      {stock.rawChicken}
                    </p>
                    <p className="text-xs text-muted-foreground">ekor</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Level Stok</span>
                <span className="font-medium text-foreground">{Math.round(stockPercentage)}%</span>
              </div>
              <Progress 
                value={stockPercentage} 
                className={`h-3 ${
                  isLowStock 
                    ? '[&>div]:bg-destructive' 
                    : isMediumStock
                    ? '[&>div]:bg-warning'
                    : '[&>div]:bg-primary'
                }`}
              />
            </div>

            {/* Add Stock Form */}
            <div className="space-y-3 pt-4 border-t border-border">
              <Label className="text-sm font-medium">Tambah Stok</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={addAmount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setAddAmount(parseInt(e.target.value) || 1)}
                  className="bg-background"
                  disabled={isLoading}
                />
                <Button
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 btn-primary"
                  onClick={handleIncreaseStock}
                  disabled={isLoading}
                >
                  {isLoading && loadingAction === 'add' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fried Planning Card */}
        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Flame className="w-5 h-5 text-secondary" />
                  Rencana Goreng
                </CardTitle>
                <CardDescription>
                  Ayam yang akan digoreng hari ini
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Planning Display */}
            <div className="text-center py-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-secondary/10 border-4 border-secondary/30 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-secondary">
                      {stock.friedPlanning}
                    </p>
                    <p className="text-xs text-muted-foreground">ekor</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20">
              <p className="text-sm text-muted-foreground text-center">
                Ayam ini akan dipindahkan dari stok mentah ke rencana penggorengan
              </p>
            </div>

            {/* Add to Planning Form */}
            <div className="space-y-3 pt-4 border-t border-border">
              <Label className="text-sm font-medium">Tambah ke Rencana Goreng</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={stock.rawChicken}
                  value={fryAmount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFryAmount(parseInt(e.target.value) || 1)}
                  className="bg-background"
                  disabled={isLoading || stock.rawChicken === 0}
                />
                <Button
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  onClick={handleDecreaseStock}
                  disabled={isLoading || stock.rawChicken === 0}
                >
                  {isLoading && loadingAction === 'fry' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Minus className="w-4 h-4 mr-1" />
                      Goreng
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Stok tersedia: {stock.rawChicken} ekor
              </p>
            </div>

            {/* Reset Planning */}
            {stock.friedPlanning > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResetPlanning}
                disabled={isLoading}
              >
                {isLoading && loadingAction === 'reset' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Reset Rencana Goreng
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Aksi Cepat</CardTitle>
          <CardDescription>
            Tombol cepat untuk mengelola stok
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => { setAddAmount(5); handleIncreaseStock(); }}
              disabled={isLoading}
            >
              <Plus className="w-5 h-5 text-primary" />
              <span className="text-xs">+5 Ayam</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => { setAddAmount(10); handleIncreaseStock(); }}
              disabled={isLoading}
            >
              <Plus className="w-5 h-5 text-primary" />
              <span className="text-xs">+10 Ayam</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => { setFryAmount(5); handleDecreaseStock(); }}
              disabled={isLoading || stock.rawChicken < 5}
            >
              <Flame className="w-5 h-5 text-secondary" />
              <span className="text-xs">Goreng 5</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => { setFryAmount(10); handleDecreaseStock(); }}
              disabled={isLoading || stock.rawChicken < 10}
            >
              <Flame className="w-5 h-5 text-secondary" />
              <span className="text-xs">Goreng 10</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stock;
