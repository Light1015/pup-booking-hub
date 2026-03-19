import { 
  Calendar, 
  MessageSquare, 
  Settings, 
  FolderOpen, 
  Mail, 
  LayoutDashboard, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Users,
  Briefcase,
  ImageIcon,
  DollarSign,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadBookings?: number;
  unreadContacts?: number;
}

const menuGroups = [
  {
    title: "Tổng quan",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "revenue", label: "Doanh thu", icon: DollarSign },
      { id: "reports", label: "Báo cáo", icon: BarChart3 },
    ]
  },
  {
    title: "Quản lý khách hàng",
    items: [
      { id: "bookings", label: "Lịch đặt", icon: Calendar, badge: "bookings" },
      { id: "calendar", label: "Xem lịch", icon: Calendar },
      { id: "contacts", label: "Liên hệ", icon: MessageSquare, badge: "contacts" },
      { id: "replies", label: "Lịch sử phản hồi", icon: Mail },
    ]
  },
  {
    title: "Nội dung",
    items: [
      { id: "gallery", label: "Thư viện ảnh", icon: ImageIcon },
      { id: "albums", label: "Bộ ảnh", icon: FolderOpen },
      { id: "categories", label: "Danh mục", icon: FolderOpen },
      { id: "services", label: "Dịch vụ", icon: Briefcase },
      { id: "team", label: "Thành viên", icon: Users },
    ]
  },
  {
    title: "Hệ thống",
    items: [
      { id: "settings", label: "Cài đặt", icon: Settings },
    ]
  }
];

const SidebarContent = ({ 
  activeTab, 
  onTabChange, 
  collapsed, 
  setCollapsed, 
  unreadBookings = 0, 
  unreadContacts = 0,
  showToggle = true 
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  unreadBookings?: number;
  unreadContacts?: number;
  showToggle?: boolean;
}) => {
  const getBadgeCount = (badgeKey?: string) => {
    if (badgeKey === "bookings") return unreadBookings;
    if (badgeKey === "contacts") return unreadContacts;
    return 0;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full">
        {/* Logo & Toggle */}
        <div className={cn(
          "h-16 border-b flex items-center px-4 flex-shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SP</span>
              </div>
              <span className="font-bold text-lg">SnapPup</span>
            </div>
          )}
          {showToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.title} className={cn("px-3", groupIndex > 0 && "mt-4")}>
              {!collapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </p>
              )}
              {collapsed && groupIndex > 0 && <Separator className="my-2" />}
              
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const badgeCount = getBadgeCount((item as any).badge);
                  
                  const button = (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 relative",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "hover:bg-accent/10 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                      {!collapsed && (
                        <span className="font-medium text-sm flex-1">{item.label}</span>
                      )}
                      {!collapsed && badgeCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] font-bold">
                          {badgeCount}
                        </Badge>
                      )}
                      {collapsed && badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          {button}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                          {badgeCount > 0 && <span className="ml-1 text-destructive">({badgeCount})</span>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return button;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t flex-shrink-0">
            <div className="px-3 py-2 rounded-lg bg-primary/5 text-center">
              <p className="text-xs text-muted-foreground">SnapPup Studio</p>
              <p className="text-xs text-muted-foreground">Admin Panel v2.0</p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export const AdminSidebar = ({ activeTab, onTabChange, unreadBookings = 0, unreadContacts = 0 }: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    if (isMobile) setMobileOpen(false);
  };

  // Mobile: Sheet sidebar
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-50 lg:hidden h-10 w-10 bg-card shadow-md border">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent
            activeTab={activeTab}
            onTabChange={handleTabChange}
            collapsed={false}
            setCollapsed={() => {}}
            unreadBookings={unreadBookings}
            unreadContacts={unreadContacts}
            showToggle={false}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Standard sidebar
  return (
    <aside 
      className={cn(
        "min-h-screen bg-card border-r flex flex-col transition-all duration-300 flex-shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent
        activeTab={activeTab}
        onTabChange={onTabChange}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        unreadBookings={unreadBookings}
        unreadContacts={unreadContacts}
      />
    </aside>
  );
};

export const MobileSidebarTrigger = () => null; // Kept for compatibility
