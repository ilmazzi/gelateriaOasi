import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { IceCreamCone, LayoutDashboard, Tag, Image, ShoppingBag, ArrowLeft, Sandwich, Store, Package, TabletSmartphone } from "lucide-react";

const adminLinks = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Gelati", path: "/admin/gelati", icon: IceCreamCone },
  { label: "Promozioni", path: "/admin/promozioni", icon: Tag },
  { label: "Foto", path: "/admin/foto", icon: Image },
  { label: "Prenotazioni", path: "/admin/prenotazioni", icon: ShoppingBag },
  { label: "Banco", path: "/admin/banco", icon: TabletSmartphone },
  { label: "Panini", path: "/admin/panini", icon: Sandwich },
  { label: "Negozio", path: "/admin/negozio", icon: Store },
  { label: "Categorie", path: "/admin/categorie", icon: Tag },
  { label: "Vaschette", path: "/admin/vaschette", icon: Package },
];

export default function AdminLayout() {
  const location = useLocation();
  const isFullWidth = location.pathname === "/admin/banco";

  return (
    <div className="min-h-screen font-body bg-background">
      {/* Top bar */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <IceCreamCone className="w-5 h-5 text-primary" />
              <span className="font-heading text-lg font-bold">Admin</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 border-r border-border min-h-[calc(100vh-3.5rem)] bg-card/50 p-4">
          <nav className="space-y-1">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden border-b border-border bg-card/50 fixed top-14 left-0 right-0 z-40 overflow-x-auto">
          <div className="flex px-2 py-2 gap-1">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <main className={`flex-1 ${isFullWidth ? "p-0 md:pt-0 pt-16" : "p-4 sm:p-6 lg:p-8 md:pt-6 pt-20"}`}>
          <div className={isFullWidth ? "w-full" : "max-w-6xl mx-auto"}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
