import { Outlet, Navigate } from "react-router";
import { Navbar } from "~/components/navbar";
import { Toaster } from "~/components/ui/sonner";
import { useAuthStore } from "~/modules/auth/auth.store";
import { useOfflineQueue } from "~/services/offlineQueue";
import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "~/lib/utils";

export const Layout = () => {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { queue, processQueue, isProcessing } = useOfflineQueue();
  const [isOffline, setIsOffline] = useState(false); // Local state for UI only

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      processQueue();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    setIsOffline(!navigator.onLine);
    if (navigator.onLine) {
      processQueue(); // Try processing on mount if online
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [processQueue]);

  // Tunggu sampai Zustand rehydrate dari localStorage
  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />

      {/* Offline / Sync Indicator */}
      {(isOffline || queue.length > 0) && (
        <div
          className={cn(
            "fixed bottom-20 left-4 right-4 md:left-4 md:right-auto md:w-fit z-50 px-4 py-2 rounded-full shadow-lg flex items-center justify-center gap-2 text-sm font-medium transition-all",
            isOffline
              ? "bg-destructive text-destructive-foreground"
              : "bg-blue-600 text-white",
          )}
        >
          {isOffline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Offline Mode ({queue.length} pending)</span>
            </>
          ) : (
            <>
              <RefreshCw
                className={cn("w-4 h-4", isProcessing && "animate-spin")}
              />
              <span>
                {isProcessing
                  ? "Menyinkronkan data..."
                  : `${queue.length} data belum disinkronkan`}
              </span>
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top padding for mobile header */}
        <div className="pt-16 lg:pt-0 pb-20 lg:pb-0">
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>

      <Toaster position="top-right" richColors closeButton visibleToasts={1} />
    </div>
  );
};

export default Layout;
