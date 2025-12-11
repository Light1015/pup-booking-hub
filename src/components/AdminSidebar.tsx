import { Calendar, MessageSquare, Image, Settings, FileText, FolderOpen, Mail, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "bookings", label: "Quản lý lịch đặt", icon: Calendar },
  { id: "calendar", label: "Lịch", icon: Calendar },
  { id: "contacts", label: "Quản lý liên hệ", icon: MessageSquare },
  { id: "replies", label: "Lịch sử phản hồi", icon: Mail },
  { id: "gallery", label: "Thư viện ảnh", icon: Image },
  { id: "albums", label: "Bộ ảnh", icon: FolderOpen },
  { id: "categories", label: "Danh mục", icon: FolderOpen },
  { id: "services", label: "Dịch vụ", icon: FileText },
  { id: "settings", label: "Cài đặt", icon: Settings },
];

export const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  return (
    <aside className="w-64 min-h-screen bg-card border-r">
      <div className="p-6">
        <h2 className="text-xl font-bold text-primary">Admin Panel</h2>
      </div>
      <nav className="px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
