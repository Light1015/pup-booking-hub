import { 
  Calendar, 
  MessageSquare, 
  Image, 
  Settings, 
  FileText, 
  FolderOpen, 
  Mail, 
  LayoutDashboard, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Users,
  Briefcase,
  ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuGroups = [
  {
    title: "Tổng quan",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "reports", label: "Báo cáo", icon: BarChart3 },
    ]
  },
  {
    title: "Quản lý khách hàng",
    items: [
      { id: "bookings", label: "Lịch đặt", icon: Calendar },
      { id: "calendar", label: "Xem lịch", icon: Calendar },
      { id: "contacts", label: "Liên hệ", icon: MessageSquare },
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
    ]
  },
  {
    title: "Hệ thống",
    items: [
      { id: "settings", label: "Cài đặt", icon: Settings },
    ]
  }
];

export const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "min-h-screen bg-card border-r flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo & Toggle */}
        <div className={cn(
          "h-16 border-b flex items-center px-4",
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
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
                  
                  const button = (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "hover:bg-accent/10 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                      {!collapsed && (
                        <span className="font-medium text-sm">{item.label}</span>
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
          <div className="p-4 border-t">
            <div className="px-3 py-2 rounded-lg bg-primary/5 text-center">
              <p className="text-xs text-muted-foreground">SnapPup Studio</p>
              <p className="text-xs text-muted-foreground">Admin Panel v2.0</p>
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
};
