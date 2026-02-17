import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  StickyNote,
  ShoppingCart,
  Package,
  LogOut,
  LucideIcon,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useAuthStore } from "~/modules/auth/auth.store";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/notes", label: "Catatan", icon: StickyNote },
  { path: "/sales", label: "Penjualan", icon: ShoppingCart },
  { path: "/stock", label: "Stok", icon: Package },
];

interface NavContentProps {
  onItemClick?: () => void;
}

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavContent = ({ onItemClick }: NavContentProps) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative group">
            {/* Logo Accent / Glow */}
            <div className="absolute -inset-1 bg-gradient-primary rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center overflow-hidden shadow-sm">
              <img
                src="/icons/icon-app.png"
                alt="Logo Ayam Geprek Sriwedari"
                className="w-10 h-10 object-contain transform group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg text-foreground leading-tight">
              Ayam Geprek
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Sriwedari
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-card border-r border-border fixed left-0 top-0 z-40">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden shadow-sm">
              <img
                src="/icons/icon-app.png"
                alt="Logo"
                className="w-7 h-7 object-contain"
              />
            </div>
            <span className="font-heading font-bold text-foreground">
              Ayam Geprek Sriwedari
            </span>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full w-9 h-9 bg-primary/10 p-0 overflow-hidden"
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-primary">
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 mr-4" align="end">
              <div className="flex items-center gap-3 p-2 mb-2 border-b border-border">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {user?.name?.charAt(0)?.toUpperCase() || "A"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Administrator
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
                onClick={handleLogout}
              >
                <LogOut className="w-3 h-3 mr-2" />
                Keluar
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden mobile-nav">
        <div className="flex items-center justify-around py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`mobile-nav-item ${isActive ? "active" : ""}`}
              >
                <Icon className="w-5 h-5 transition-transform duration-200" />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
