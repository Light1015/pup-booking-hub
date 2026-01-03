import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Phone, CreditCard, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  booking_date: string;
  booking_time: string;
  pet_name: string;
  status: string;
  payment_proof_url: string | null;
}

interface AdminCalendarViewProps {
  bookings: Booking[];
  onSelectBooking?: (booking: Booking) => void;
}

export function AdminCalendarView({ bookings, onSelectBooking }: AdminCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((booking) => {
      const date = booking.booking_date;
      if (!map[date]) map[date] = [];
      map[date].push(booking);
    });
    return map;
  }, [bookings]);

  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return bookingsByDate[dateStr] || [];
  }, [selectedDate, bookingsByDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string, hasPaymentProof: boolean) => {
    if (!hasPaymentProof && status === "pending") {
      return <AlertCircle className="h-3 w-3 text-yellow-600" />;
    }
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (bookingsByDate[dateStr]?.length > 0) {
      setSelectedDate(date);
      setDayDialogOpen(true);
    }
  };

  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lịch đặt hẹn
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: vi })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Đã xác nhận</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Chờ xác nhận</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Đã hủy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Hoàn thành</span>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayBookings = bookingsByDate[dateStr] || [];
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "min-h-[80px] p-1 border rounded-lg cursor-pointer transition-colors",
                    !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                    isToday && "ring-2 ring-primary",
                    dayBookings.length > 0 && "hover:bg-accent/50"
                  )}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className={cn(
                          "text-xs px-1 py-0.5 rounded truncate text-white",
                          getStatusColor(booking.status)
                        )}
                        title={`${booking.booking_time} - ${booking.name}`}
                      >
                        {booking.booking_time.split(" - ")[0]}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayBookings.length - 3} khác
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day detail dialog */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Lịch hẹn ngày {selectedDate && format(selectedDate, "dd/MM/yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDateBookings
              .sort((a, b) => a.booking_time.localeCompare(b.booking_time))
              .map((booking) => (
                <Card 
                  key={booking.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    onSelectBooking?.(booking);
                    setDayDialogOpen(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{booking.booking_time}</span>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status === "confirmed" ? "Đã xác nhận" :
                             booking.status === "pending" ? "Chờ xác nhận" :
                             booking.status === "cancelled" ? "Đã hủy" : booking.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{booking.phone}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {booking.pet_name}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(booking.status, !!booking.payment_proof_url)}
                        {booking.payment_proof_url ? (
                          <CreditCard className="h-4 w-4 text-green-600" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
