import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Calendar, MessageSquare, CreditCard, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Notification {
  id: string;
  type: "booking" | "contact" | "payment";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface AdminNotificationBellProps {
  onNotificationClick?: (notification: Notification) => void;
}

export function AdminNotificationBell({ onNotificationClick }: AdminNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const queryClient = useQueryClient();

  // Fetch unread bookings
  const { data: unreadBookings = [] } = useQuery({
    queryKey: ["unread-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread contacts
  const { data: unreadContacts = [] } = useQuery({
    queryKey: ["unread-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch pending payments (bookings without payment proof)
  const { data: pendingPayments = [] } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .is("payment_proof_url", null)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Build notifications list
  useEffect(() => {
    const newNotifications: Notification[] = [];

    unreadBookings.forEach((booking) => {
      newNotifications.push({
        id: `booking-${booking.id}`,
        type: "booking",
        title: "Lịch đặt mới",
        message: `${booking.name} - ${booking.booking_date} ${booking.booking_time}`,
        timestamp: new Date(booking.created_at),
        read: false,
        data: booking,
      });
    });

    unreadContacts.forEach((contact) => {
      newNotifications.push({
        id: `contact-${contact.id}`,
        type: "contact",
        title: "Liên hệ mới",
        message: `${contact.name}: ${contact.message.substring(0, 50)}...`,
        timestamp: new Date(contact.created_at),
        read: false,
        data: contact,
      });
    });

    // Sort by timestamp
    newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setNotifications(newNotifications);
  }, [unreadBookings, unreadContacts]);

  const unreadCount = notifications.filter((n) => !n.read).length + pendingPayments.length;

  const markAsRead = async (notification: Notification) => {
    if (notification.type === "booking") {
      await supabase
        .from("bookings")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notification.data.id);
      queryClient.invalidateQueries({ queryKey: ["unread-bookings"] });
    } else if (notification.type === "contact") {
      await supabase
        .from("contacts")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notification.data.id);
      queryClient.invalidateQueries({ queryKey: ["unread-contacts"] });
    }

    onNotificationClick?.(notification);
    setOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-4 w-4 text-primary" />;
      case "contact":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "payment":
        return <CreditCard className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Thông báo</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} mới</Badge>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 && pendingPayments.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Không có thông báo mới
            </div>
          ) : (
            <div className="divide-y">
              {/* Pending payments section */}
              {pendingPayments.length > 0 && (
                <div className="p-3 bg-yellow-50">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-yellow-700">
                    <CreditCard className="h-4 w-4" />
                    Chờ thanh toán ({pendingPayments.length})
                  </div>
                  {pendingPayments.slice(0, 3).map((booking) => (
                    <div 
                      key={booking.id}
                      className="text-xs text-yellow-600 py-1 cursor-pointer hover:underline"
                      onClick={() => {
                        onNotificationClick?.({
                          id: `payment-${booking.id}`,
                          type: "payment",
                          title: "Chờ thanh toán",
                          message: booking.name,
                          timestamp: new Date(booking.created_at),
                          read: false,
                          data: booking,
                        });
                        setOpen(false);
                      }}
                    >
                      {booking.name} - {booking.booking_date}
                    </div>
                  ))}
                </div>
              )}

              {/* Regular notifications */}
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => markAsRead(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.timestamp, {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
