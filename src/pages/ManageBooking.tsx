import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { vi } from "date-fns/locale";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarDays, Clock, User, Phone, Mail, AlertTriangle, CheckCircle, XCircle, Circle } from "lucide-react";
import LoadingDialog from "@/components/LoadingDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";

const timeSlots = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
  "18:00 - 19:00",
  "19:00 - 20:00",
];

const TOTAL_SLOTS = timeSlots.length;

const ManageBooking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleMode, setShowRescheduleMode] = useState(false);

  // Fetch booking details
  const { data: bookingData, isLoading, error, refetch } = useQuery({
    queryKey: ["manage-booking", token],
    queryFn: async () => {
      if (!token) throw new Error("Token không hợp lệ");
      
      const { data, error } = await supabase.functions.invoke("manage-booking", {
        body: { token, action: "get" }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.booking;
    },
    enabled: !!token,
    retry: false,
  });

  // Fetch monthly bookings for calendar
  const { data: monthlyBookings = [] } = useQuery({
    queryKey: ["monthly-bookings-manage", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(addMonths(currentMonth, 1));
      
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_date, booking_time")
        .gte("booking_date", format(start, "yyyy-MM-dd"))
        .lte("booking_date", format(end, "yyyy-MM-dd"))
        .in("status", ["pending", "confirmed"]);
      
      if (error) throw error;
      return data;
    },
    enabled: showRescheduleMode,
  });

  // Calculate bookings per day
  const bookingsByDay: Record<string, number> = {};
  monthlyBookings.forEach((booking: any) => {
    const date = booking.booking_date;
    bookingsByDay[date] = (bookingsByDay[date] || 0) + 1;
  });

  const getDayStatus = (date: Date): 'full' | 'partial' | 'free' => {
    const dateString = format(date, "yyyy-MM-dd");
    const bookedCount = bookingsByDay[dateString] || 0;
    if (bookedCount >= TOTAL_SLOTS) return 'full';
    if (bookedCount > 0) return 'partial';
    return 'free';
  };

  // Fetch booked slots for selected date
  const { data: bookedSlots = [] } = useQuery({
    queryKey: ["booked-slots-manage", selectedDate ? format(selectedDate, "yyyy-MM-dd") : null],
    queryFn: async () => {
      if (!selectedDate) return [];
      const dateString = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_time")
        .eq("booking_date", dateString)
        .in("status", ["pending", "confirmed"]);
      if (error) throw error;
      return data.map((b: any) => b.booking_time);
    },
    enabled: !!selectedDate && showRescheduleMode,
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-booking", {
        body: { token, action: "cancel" }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Đã hủy lịch thành công");
      setShowCancelDialog(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Không thể hủy lịch");
    },
  });

  // Reschedule booking mutation
  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime) throw new Error("Vui lòng chọn ngày và giờ");
      
      const { data, error } = await supabase.functions.invoke("manage-booking", {
        body: { 
          token, 
          action: "reschedule",
          newDate: format(selectedDate, "yyyy-MM-dd"),
          newTime: selectedTime
        }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Đã dời lịch thành công. Vui lòng đợi xác nhận từ studio.");
      setShowRescheduleMode(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Không thể dời lịch");
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link không hợp lệ</h1>
          <p className="text-muted-foreground mb-4">Link quản lý lịch đặt không hợp lệ hoặc đã hết hạn.</p>
          <Button onClick={() => navigate("/booking")}>Đặt lịch mới</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <LoadingDialog open={true} message="Đang tải thông tin lịch đặt..." />
        <Footer />
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Không tìm thấy lịch đặt</h1>
          <p className="text-muted-foreground mb-4">{(error as any)?.message || "Lịch đặt không tồn tại hoặc đã bị xóa."}</p>
          <Button onClick={() => navigate("/booking")}>Đặt lịch mới</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const bookingDate = new Date(bookingData.booking_date);
  const isPast = bookingDate < new Date();
  const isCancelled = bookingData.status === "cancelled";
  const canModify = !isPast && !isCancelled;

  const getStatusBadge = () => {
    switch (bookingData.status) {
      case "confirmed":
        return <Badge className="bg-green-500">Đã xác nhận</Badge>;
      case "pending":
        return <Badge variant="secondary">Chờ xác nhận</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{bookingData.status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <LoadingDialog open={cancelMutation.isPending || rescheduleMutation.isPending} message="Đang xử lý..." />
      
      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Xác nhận hủy lịch"
        description="Bạn có chắc chắn muốn hủy lịch đặt này? Hành động này không thể hoàn tác."
        confirmText="Hủy lịch"
        cancelText="Đóng"
        onConfirm={() => cancelMutation.mutate()}
        variant="destructive"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Quản lý lịch đặt</h1>
            <p className="text-muted-foreground">Xem, dời lịch hoặc hủy lịch đặt của bạn</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thông tin lịch đặt</CardTitle>
                {getStatusBadge()}
              </div>
              <CardDescription>
                Đặt ngày {format(new Date(bookingData.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Họ tên</p>
                    <p className="font-medium">{bookingData.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Điện thoại</p>
                    <p className="font-medium">{bookingData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{bookingData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày chụp</p>
                    <p className="font-medium">
                      {format(bookingDate, "EEEE, dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Giờ chụp</p>
                    <p className="font-medium">{bookingData.booking_time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 text-primary flex items-center justify-center">🐾</div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hạng mục</p>
                    <p className="font-medium">{bookingData.pet_name || bookingData.selected_category}</p>
                  </div>
                </div>
              </div>

              {bookingData.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Ghi chú</p>
                  <p>{bookingData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {!showRescheduleMode && canModify && (
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowRescheduleMode(true)}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Dời lịch
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Hủy lịch
              </Button>
            </div>
          )}

          {isPast && !isCancelled && (
            <Card className="bg-muted">
              <CardContent className="py-4 text-center">
                <p className="text-muted-foreground">
                  Lịch đặt này đã qua ngày chụp. Không thể thay đổi.
                </p>
              </CardContent>
            </Card>
          )}

          {isCancelled && (
            <Card className="bg-destructive/10 border-destructive/20">
              <CardContent className="py-4 text-center">
                <p className="text-destructive">
                  Lịch đặt này đã bị hủy.
                </p>
                <Button className="mt-4" onClick={() => navigate("/booking")}>
                  Đặt lịch mới
                </Button>
              </CardContent>
            </Card>
          )}

          {showRescheduleMode && (
            <Card>
              <CardHeader>
                <CardTitle>Chọn lịch mới</CardTitle>
                <CardDescription>Chọn ngày và giờ mới cho buổi chụp của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Chọn ngày mới</Label>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 mb-2">
                    <span className="flex items-center gap-1">
                      <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                      Còn trống
                    </span>
                    <span className="flex items-center gap-1">
                      <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      Còn ít chỗ
                    </span>
                    <span className="flex items-center gap-1">
                      <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                      Đã đầy
                    </span>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTime("");
                    }}
                    onMonthChange={setCurrentMonth}
                    disabled={(date) => {
                      if (date < new Date()) return true;
                      return getDayStatus(date) === 'full';
                    }}
                    className="rounded-md border pointer-events-auto"
                    modifiers={{
                      full: (date) => getDayStatus(date) === 'full',
                      partial: (date) => getDayStatus(date) === 'partial',
                      free: (date) => getDayStatus(date) === 'free' && date >= new Date(),
                    }}
                    modifiersClassNames={{
                      full: "bg-red-100 text-red-600 hover:bg-red-100",
                      partial: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
                      free: "bg-green-50 hover:bg-green-100",
                    }}
                  />
                </div>

                {selectedDate && (
                  <div>
                    <Label>Chọn giờ mới</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {timeSlots.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        return (
                          <Button
                            key={slot}
                            type="button"
                            variant={selectedTime === slot ? "default" : "outline"}
                            size="sm"
                            onClick={() => !isBooked && setSelectedTime(slot)}
                            disabled={isBooked}
                            className={cn(
                              isBooked && "opacity-50 cursor-not-allowed line-through bg-muted"
                            )}
                          >
                            {slot}
                            {isBooked && <span className="ml-1 text-xs">(Đã đặt)</span>}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowRescheduleMode(false);
                      setSelectedDate(undefined);
                      setSelectedTime("");
                    }}
                  >
                    Hủy bỏ
                  </Button>
                  <Button 
                    className="flex-1"
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => rescheduleMutation.mutate()}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Xác nhận dời lịch
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ManageBooking;
