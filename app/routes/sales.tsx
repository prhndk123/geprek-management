import { useState, ChangeEvent } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Receipt,
  Loader2,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '~/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { ScrollArea } from '~/components/ui/scroll-area';
import { StatsCard, MiniStatsCard } from '~/components/stats-card';
import useStore, { PRODUCTS, formatRupiah, formatDate } from '~/store/useStore';
import { toast } from 'sonner';

const Sales = () => {
  const { sales, addSale, getTotalSalesToday, getItemsSoldToday } = useStore();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const selectedProductData = PRODUCTS.find(p => p.id === selectedProduct);
  const totalPrice = selectedProductData ? selectedProductData.price * quantity : 0;

  const handleAddSale = () => {
    if (!selectedProduct) {
      toast.error('Pilih produk terlebih dahulu');
      return;
    }
    if (quantity < 1) {
      toast.error('Jumlah minimal 1');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const product = PRODUCTS.find(p => p.id === selectedProduct);
      if (product) {
        addSale({
          productId: selectedProduct,
          productName: product.name,
          price: product.price,
          quantity: quantity,
        });

        toast.success('Penjualan berhasil dicatat!', {
          description: `${quantity}x ${product.name} - ${formatRupiah(totalPrice)}`,
        });
      }

      // Reset form
      setSelectedProduct('');
      setQuantity(1);
      setIsLoading(false);
    }, 300);
  };

  const todaySales = getTotalSalesToday();
  const itemsSold = getItemsSoldToday();

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
          icon={TrendingUp}
        />
        <StatsCard
          title="Item Terjual"
          value={`${itemsSold} item`}
          icon={Receipt}
          iconClassName="bg-secondary/10"
        />
        <StatsCard
          title="Total Transaksi"
          value={sales.length}
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
            <CardDescription>
              Pilih produk dan jumlah
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Pilih produk..." />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground ml-2">
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
                min={1}
                max={100}
                value={quantity}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(parseInt(e.target.value) || 1)}
                className="bg-background"
              />
            </div>

            {/* Price Display */}
            {selectedProduct && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Harga Satuan</span>
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
                    <span className="text-sm font-medium text-foreground">Total</span>
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
            <CardDescription>
              {sales.length} transaksi tercatat
            </CardDescription>
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
              <ScrollArea className="h-[400px] pr-4">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-medium">Tanggal</TableHead>
                      <TableHead className="text-xs font-medium">Produk</TableHead>
                      <TableHead className="text-xs font-medium text-center">Qty</TableHead>
                      <TableHead className="text-xs font-medium text-right">Harga</TableHead>
                      <TableHead className="text-xs font-medium text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id} className="table-row-hover">
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(sale.date)}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          {sale.productName}
                        </TableCell>
                        <TableCell className="text-sm text-center text-muted-foreground">
                          {sale.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-right text-muted-foreground">
                          {formatRupiah(sale.price)}
                        </TableCell>
                        <TableCell className="text-sm text-right font-semibold text-primary">
                          {formatRupiah(sale.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Price Reference */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Daftar Harga Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRODUCTS.map((product) => (
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
