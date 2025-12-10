import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Menu } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  storeOpen?: boolean;
  onToggleStore?: () => void;
  establishment?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
  } | null;
}

const DashboardLayout = ({ 
  children, 
  title, 
  storeOpen = true, 
  onToggleStore,
  establishment 
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30 flex w-full overflow-hidden">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        storeOpen={storeOpen}
        onToggleStore={onToggleStore}
        establishment={establishment}
      />

      <main className="flex-1 lg:ml-64 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6 overflow-x-auto">
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
