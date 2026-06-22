import { useMemo } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import useStore, { formatRupiah, type Sale } from "~/store/useStore";

interface SalesChartProps {
  sales: Sale[];
  viewMode: "today" | "month" | "year" | "all";
  month: number;
  year: number;
}

export function SalesChart({ sales, viewMode, month, year }: SalesChartProps) {
  const { products } = useStore();

  const chartData = useMemo(() => {
    const isChickenSale = (sale: Sale) => {
      const product = products.find(p => p.id === sale.productId || p.code === sale.productId);
      if (product) return product.useChicken === true;
      // Fallback in case products are not loaded or product deleted
      const lowerName = sale.productName.toLowerCase();
      return lowerName.includes("ayam") || lowerName.includes("paket");
    };
    // Determine the type of grouping
    // If viewMode is "month" (or default Harian), group by Date (1 to 31)
    // If viewMode is "year" (or Bulanan), group by Month (Jan to Dec)
    // For "today", group by hour (0 to 23)
    // For "all", group by year
    
    if (viewMode === "year") {
      // Group by month
      const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
      ];
      
      const data = months.map((m) => ({
        period: m,
        totalRevenue: 0,
        totalChickenSold: 0,
      }));

      sales.forEach((sale) => {
        // Handle date or transactionDate based on backendless/local
        const dateStr = (sale as any).transactionDate || sale.date;
        const d = new Date(dateStr);
        const m = d.getMonth();
        if (m >= 0 && m < 12) {
          data[m].totalRevenue += sale.total;
          if (isChickenSale(sale)) {
            data[m].totalChickenSold += sale.quantity;
          }
        }
      });
      return data;

    } else if (viewMode === "month") {
      // Group by day of month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const data = Array.from({ length: daysInMonth }, (_, i) => ({
        period: `${i + 1}`,
        totalRevenue: 0,
        totalChickenSold: 0,
      }));

      sales.forEach((sale) => {
        const dateStr = (sale as any).transactionDate || sale.date;
        const d = new Date(dateStr);
        const dateObj = d.getDate();
        if (dateObj >= 1 && dateObj <= daysInMonth) {
          data[dateObj - 1].totalRevenue += sale.total;
          if (isChickenSale(sale)) {
            data[dateObj - 1].totalChickenSold += sale.quantity;
          }
        }
      });
      return data;
    } else if (viewMode === "today") {
      // Group by hour
      const data = Array.from({ length: 24 }, (_, i) => ({
        period: `${i.toString().padStart(2, '0')}:00`,
        totalRevenue: 0,
        totalChickenSold: 0,
      }));

      sales.forEach((sale) => {
        const dateStr = (sale as any).transactionDate || sale.date;
        const d = new Date(dateStr);
        const h = d.getHours();
        if (h >= 0 && h < 24) {
          data[h].totalRevenue += sale.total;
          if (isChickenSale(sale)) {
            data[h].totalChickenSold += sale.quantity;
          }
        }
      });
      return data;
    } else {
      // viewMode === "all" -> group by year
      const yearsMap: Record<string, { period: string, totalRevenue: number, totalChickenSold: number }> = {};
      sales.forEach((sale) => {
        const dateStr = (sale as any).transactionDate || sale.date;
        const y = new Date(dateStr).getFullYear().toString();
        if (!yearsMap[y]) {
          yearsMap[y] = { period: y, totalRevenue: 0, totalChickenSold: 0 };
        }
        yearsMap[y].totalRevenue += sale.total;
        if (isChickenSale(sale)) {
          yearsMap[y].totalChickenSold += sale.quantity;
        }
      });
      return Object.values(yearsMap).sort((a, b) => a.period.localeCompare(b.period));
    }
  }, [sales, viewMode, month, year, products]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border p-3 rounded-lg shadow-md">
          <p className="font-semibold mb-2 text-sm">Periode: {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === "Pendapatan" ? formatRupiah(entry.value) : `${entry.value} pcs`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getTitle = () => {
    switch (viewMode) {
      case "today": return "Grafik Penjualan Hari Ini";
      case "month": return `Grafik Penjualan Bulan ${month + 1}/${year}`;
      case "year": return `Grafik Penjualan Tahun ${year}`;
      case "all": return "Grafik Penjualan Keseluruhan";
    }
  };

  const getDescription = () => {
    return "Perbandingan total pendapatan (Rp) vs total ayam terjual (pcs)";
  };

  const getMinWidth = () => {
    if (viewMode === "month") return "700px"; // 28-31 items
    if (viewMode === "today") return "600px"; // 24 items
    if (viewMode === "year") return "500px";  // 12 items
    return "100%";
  };

  return (
    <Card className="premium-card col-span-1 lg:col-span-full mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-heading">{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full overflow-x-auto overflow-y-hidden pb-4">
          {chartData.length > 0 ? (
            <div style={{ minWidth: getMinWidth(), height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="period" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => `Rp${(value / 1000).toLocaleString('id-ID')}k`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar
                  yAxisId="left"
                  name="Pendapatan"
                  dataKey="totalRevenue"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                  barSize={viewMode === "month" ? 15 : 40}
                />
                <Line
                  yAxisId="right"
                  name="Ayam Terjual"
                  type="monotone"
                  dataKey="totalChickenSold"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Tidak ada data untuk periode ini
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
