import { Outlet, Navigate } from "react-router";
import { Navbar } from "~/components/navbar";
import { Toaster } from "~/components/ui/sonner";
import { useAuthStore } from "~/modules/auth/auth.store";

export const Layout = () => {
  const { isAuthenticated, hasHydrated } = useAuthStore();

  // Tunggu sampai Zustand rehydrate dari localStorage
  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top padding for mobile header */}
        <div className="pt-16 lg:pt-0 pb-20 lg:pb-0">
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
};

export default Layout;
