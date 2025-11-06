import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, CheckCircle, XCircle } from "lucide-react";

interface BookingCalendarProps {
  bookings: any[];
}

export const BookingCalendar = ({ bookings }: BookingCalendarProps) => {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [newBooking, setNewBooking] = useState({
    name: "",
    email: "",
    phone: "",
    pet_name: "",
    pet_type: "",
    pet_age: "",
    booking_date: "",
    booking_time: "",
    notes: "",
    status: "confirmed"
  });

  // Group bookings by date
  const bookingsByDate = bookings.reduce((acc: any, booking: any) => {
    const date = booking.booking_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {});

  const confirmedBookings = bookings.filter(b => b.status === "confirmed");
  const confirmedByDate = confirmedBookings.reduce((acc: any, booking: any) => {
    const date = booking.booking_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {});

  // Check if time slot is available
  const isTimeSlotAvailable = (date: string, time: string) => {
    const confirmedBookingsOnDate = confirmedByDate[date] || [];
    return !confirmedBookingsOnDate.some((b: any) => b.booking_time === time);
  };

  const createBooking = useMutation({
    mutationFn: async (booking: any) => {
      // Check if time slot is available
      if (!isTimeSlotAvailable(booking.booking_date, booking.booking_time)) {
        throw new Error("Khung giờ này đã được đặt");
      }

      const { error } = await supabase.from("bookings").insert([booking]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Đã tạo lịch đặt!");
      setCreateDialogOpen(false);
      setNewBooking({
        name: "",
        email: "",
        phone: "",
        pet_name: "",
        pet_type: "",
        pet_age: "",
        booking_date: "",
        booking_time: "",
        notes: "",
        status: "confirmed"
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const confirmBooking = useMutation({
    mutationFn: async (id: string) => {
      const booking = bookings.find(b => b.id === id);
      if (!isTimeSlotAvailable(booking.booking_date, booking.booking_time)) {
        throw new Error("Khung giờ này đã được đặt bởi lịch khác");
      }
      
      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Đã xác nhận lịch!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const cancelBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Đã hủy lịch!");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Lịch đặt</h3>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo lịch mới
        </Button>
      </div>

      <div className="grid gap-4">
        {Object.keys(bookingsByDate).sort().reverse().map(date => (
          <Card key={date}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {new Date(date).toLocaleDateString('vi-VN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
              <CardDescription>
                {bookingsByDate[date].length} lịch đặt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookingsByDate[date].map((booking: any) => (
                  <div 
                    key={booking.id}
                    className={`p-4 border rounded-lg ${
                      booking.status === 'confirmed' ? 'bg-green-50 border-green-200' : 
                      booking.status === 'cancelled' ? 'bg-red-50 border-red-200' : 
                      'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{booking.booking_time}</p>
                        <p className="text-sm mt-1">{booking.name} - {booking.pet_name} ({booking.pet_type})</p>
                        <p className="text-sm text-muted-foreground">{booking.phone} | {booking.email}</p>
                        {booking.notes && (
                          <p className="text-sm mt-2 italic">{booking.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => confirmBooking.mutate(booking.id)}
                              disabled={!isTimeSlotAvailable(booking.booking_date, booking.booking_time)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => cancelBooking.mutate(booking.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <span className="text-xs text-green-600 font-semibold px-2 py-1 bg-green-100 rounded">
                            Đã xác nhận
                          </span>
                        )}
                        {booking.status === 'cancelled' && (
                          <span className="text-xs text-red-600 font-semibold px-2 py-1 bg-red-100 rounded">
                            Đã hủy
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Booking Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo lịch đặt mới</DialogTitle>
            <DialogDescription>
              Tạo lịch đặt và tự động xác nhận
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tên khách hàng *</Label>
                <Input
                  value={newBooking.name}
                  onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newBooking.email}
                  onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Số điện thoại *</Label>
              <Input
                value={newBooking.phone}
                onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tên thú cưng *</Label>
                <Input
                  value={newBooking.pet_name}
                  onChange={(e) => setNewBooking({ ...newBooking, pet_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Loại thú cưng *</Label>
                <Select
                  value={newBooking.pet_type}
                  onValueChange={(value) => setNewBooking({ ...newBooking, pet_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chó">Chó</SelectItem>
                    <SelectItem value="Mèo">Mèo</SelectItem>
                    <SelectItem value="Thỏ">Thỏ</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tuổi thú cưng</Label>
              <Input
                value={newBooking.pet_age}
                onChange={(e) => setNewBooking({ ...newBooking, pet_age: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ngày đặt *</Label>
                <Input
                  type="date"
                  value={newBooking.booking_date}
                  onChange={(e) => setNewBooking({ ...newBooking, booking_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Giờ đặt *</Label>
                <Select
                  value={newBooking.booking_time}
                  onValueChange={(value) => setNewBooking({ ...newBooking, booking_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giờ" />
                  </SelectTrigger>
                  <SelectContent>
                    {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => {
                      const available = isTimeSlotAvailable(newBooking.booking_date, time);
                      return (
                        <SelectItem key={time} value={time} disabled={!available}>
                          {time} {!available && '(Đã đặt)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Ghi chú</Label>
              <Textarea
                rows={3}
                value={newBooking.notes}
                onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={() => createBooking.mutate(newBooking)}
                disabled={!newBooking.name || !newBooking.email || !newBooking.phone || 
                         !newBooking.pet_name || !newBooking.pet_type || 
                         !newBooking.booking_date || !newBooking.booking_time}
              >
                Tạo lịch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
