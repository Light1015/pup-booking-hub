import { useState, useMemo, useEffect } from "react";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, MapPin, CreditCard, Clock, Circle, Search, Calculator } from "lucide-react";
import LoadingDialog from "@/components/LoadingDialog";
import { PaymentConfirmDialog } from "@/components/PaymentConfirmDialog";
import { BookingFAQ } from "@/components/BookingFAQ";
import { cn } from "@/lib/utils";

// Auto-fill storage key
const CUSTOMER_STORAGE_KEY = "snappup_customer_info";

// Validation schema
const bookingSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(100, "Tên quá dài (tối đa 100 ký tự)"),
  email: z.string().email("Email không hợp lệ").max(255, "Email quá dài"),
  phone: z.string().regex(/^[0-9+\-\s()]+$/, "Số điện thoại không hợp lệ").min(8, "Số điện thoại quá ngắn").max(20, "Số điện thoại quá dài"),
  selectedCategory: z.string().min(1, "Vui lòng chọn hạng mục chụp ảnh"),
  notes: z.string().max(500, "Ghi chú quá dài (tối đa 500 ký tự)").optional(),
});

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

const Booking = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    selectedCategory: "",
    notes: "",
  });
  
  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState("");

  // Load saved customer info
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          name: parsed.name || "",
          phone: parsed.phone || "",
          email: parsed.email || "",
        }));
      }
    } catch (error) {
      console.error("Error loading saved customer info:", error);
    }
  }, []);

  // Save customer info when form changes
  const saveCustomerInfo = () => {
    try {
      localStorage.setItem(
        CUSTOMER_STORAGE_KEY,
        JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        })
      );
    } catch (error) {
      console.error("Error saving customer info:", error);
    }
  };

  // Fetch bank config
  const { data: bankConfig } = useQuery({
    queryKey: ["bank-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_config")
        .select("*")
        .in("key", ["bank_account_name", "bank_account_number", "bank_name", "bank_qr_url"]);
      
      if (error) throw error;
      
      const config: Record<string, string> = {};
      data?.forEach((item) => {
        config[item.key] = item.value;
      });
      
      return {
        accountName: config.bank_account_name || "SnapPup Studio",
        accountNumber: config.bank_account_number || "19031267227016",
        bankName: config.bank_name || "Techcombank",
        qrUrl: config.bank_qr_url || "",
      };
    },
  });

  // Fetch categories for selection
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch albums with prices for estimated price display
  const { data: albums = [] } = useQuery({
    queryKey: ["albums-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photo_albums")
        .select("category_id, price, name")
        .not("price", "is", null);
      if (error) throw error;
      return data;
    },
  });

  // Calculate estimated price based on selected category
  const estimatedPrice = useMemo(() => {
    if (!formData.selectedCategory) return null;
    
    const category = categories.find((c: any) => c.name === formData.selectedCategory);
    if (!category) return null;

    const categoryAlbums = albums.filter((a: any) => a.category_id === category.id);
    if (categoryAlbums.length === 0) return { min: 300000, max: 500000 }; // Default range

    const prices = categoryAlbums
      .map((a: any) => {
        // Parse price string like "400K" to number
        const priceStr = a.price?.toLowerCase().replace(/[^0-9k]/g, "") || "0";
        if (priceStr.includes("k")) {
          return parseInt(priceStr.replace("k", "")) * 1000;
        }
        return parseInt(priceStr) || 0;
      })
      .filter((p: number) => p > 0);

    if (prices.length === 0) return { min: 300000, max: 500000 };

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [formData.selectedCategory, categories, albums]);

  // Fetch all bookings for the current month view (for calendar status)
  const { data: monthlyBookings = [] } = useQuery({
    queryKey: ["monthly-bookings", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(addMonths(currentMonth, 1)); // Fetch 2 months for smooth navigation
      
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_date, booking_time")
        .gte("booking_date", format(start, "yyyy-MM-dd"))
        .lte("booking_date", format(end, "yyyy-MM-dd"))
        .in("status", ["pending", "confirmed"]);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate booking count per day
  const bookingsByDay = useMemo(() => {
    const dayMap: Record<string, number> = {};
    monthlyBookings.forEach((booking) => {
      const date = booking.booking_date;
      dayMap[date] = (dayMap[date] || 0) + 1;
    });
    return dayMap;
  }, [monthlyBookings]);

  // Get day status: 'full' | 'partial' | 'free'
  const getDayStatus = (date: Date): 'full' | 'partial' | 'free' => {
    const dateString = format(date, "yyyy-MM-dd");
    const bookedCount = bookingsByDay[dateString] || 0;
    
    if (bookedCount >= TOTAL_SLOTS) return 'full';
    if (bookedCount > 0) return 'partial';
    return 'free';
  };

  // Fetch booked time slots for the selected date
  const { data: bookedSlots = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: ["booked-slots", selectedDate ? format(selectedDate, "yyyy-MM-dd") : null],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const dateString = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_time")
        .eq("booking_date", dateString)
        .in("status", ["pending", "confirmed"]);
      
      if (error) throw error;
      return data.map((b) => b.booking_time);
    },
    enabled: !!selectedDate,
  });

  // Check if a time slot is available
  const isTimeSlotBooked = (slot: string) => {
    return bookedSlots.includes(slot);
  };

  // Handle date selection - reset time when date changes
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(""); // Reset time selection when date changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error("Vui lòng chọn ngày và giờ");
      return;
    }

    // Validate form data
    try {
      bookingSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);

    try {
      // Get category label for display
      const selectedCategoryData = categories.find((c: any) => c.name === formData.selectedCategory);
      const categoryLabel = selectedCategoryData?.label || formData.selectedCategory;

      // Prepare IDs client-side to avoid SELECT after INSERT (RLS-safe)
      const bookingId = crypto.randomUUID();
      const manageToken = crypto.randomUUID();

      const { error: bookingError } = await supabase.from("bookings").insert([
        {
          id: bookingId,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          pet_name: categoryLabel,
          pet_type: formData.selectedCategory,
          selected_category: formData.selectedCategory,
          booking_date: format(selectedDate, "yyyy-MM-dd"),
          booking_time: selectedTime,
          notes: formData.notes,
          status: "pending",
          manage_token: manageToken,
        },
      ]);

      if (bookingError) throw bookingError;

      // Store booking ID and show payment dialog
      setCurrentBookingId(bookingId);
      setPaymentDialogOpen(true);

      // Get admin email
      const { data: config } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "admin_email")
        .maybeSingle();

      const adminEmail = config?.value || "admin@snappup.studio";
      
      // Generate manage booking URL
      const manageUrl = `${window.location.origin}/manage-booking?token=${manageToken}`;

      // Send email notification with full form data and manage link
      await supabase.functions.invoke("send-booking-email", {
        body: {
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          categoryName: categoryLabel,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
          notes: formData.notes,
          adminEmail: adminEmail,
          manageUrl: manageUrl,
        },
      });
    } catch (error: any) {
      toast.error("Đặt lịch thất bại: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Save customer info for auto-fill next time
    saveCustomerInfo();
    
    toast.success("Đặt lịch thành công! Vui lòng kiểm tra email để xác nhận.");
    setFormData({
      name: "",
      phone: "",
      email: "",
      selectedCategory: "",
      notes: "",
    });
    setSelectedDate(undefined);
    setSelectedTime("");
    setCurrentBookingId("");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ";
  };

  return (
    <div className="min-h-screen">
      <LoadingDialog open={isLoading} message="Đang xử lý đặt lịch..." />
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-display font-bold mb-4">Đặt lịch chụp hình</h1>
            <p className="text-xl text-muted-foreground">
              Quý khách có nhu cầu chụp hình, xin vui lòng đặt lịch hẹn
            </p>
          </div>

          {/* Process Steps */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-center">Quy trình 3 bước</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                    1
                  </div>
                  <h3 className="font-semibold">Đặt lịch</h3>
                  <p className="text-sm text-muted-foreground">
                    Điền thông tin và chọn thời gian phù hợp
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                    2
                  </div>
                  <h3 className="font-semibold">Đặt cọc</h3>
                  <p className="text-sm text-muted-foreground">
                    Chuyển khoản 300,000 VNĐ và upload ảnh xác nhận
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                    3
                  </div>
                  <h3 className="font-semibold">Xác nhận</h3>
                  <p className="text-sm text-muted-foreground">
                    Nhân viên gọi điện xác minh lịch chụp
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Booking Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin đặt lịch</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ và tên *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Hạng mục chụp ảnh *</Label>
                      <Select
                        value={formData.selectedCategory}
                        onValueChange={(value) =>
                          setFormData({ ...formData, selectedCategory: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn hạng mục chụp ảnh" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Estimated Price Display */}
                      {estimatedPrice && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg text-sm">
                          <Calculator className="h-4 w-4 text-primary" />
                          <div>
                            <span className="text-muted-foreground">Giá ước tính: </span>
                            <span className="font-semibold text-primary">
                              {estimatedPrice.min === estimatedPrice.max
                                ? formatPrice(estimatedPrice.min)
                                : `${formatPrice(estimatedPrice.min)} - ${formatPrice(estimatedPrice.max)}`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Ghi chú</Label>
                      <Textarea
                        id="notes"
                        rows={4}
                        placeholder="Những yêu cầu đặc biệt..."
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Chọn ngày *</Label>
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
                      </div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        onMonthChange={setCurrentMonth}
                        disabled={(date) => {
                          if (date < new Date()) return true;
                          // Disable fully booked days
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

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Chọn giờ *
                        {isLoadingSlots && <span className="text-xs text-muted-foreground">(Đang tải...)</span>}
                      </Label>
                      {selectedDate ? (
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map((slot) => {
                            const isBooked = isTimeSlotBooked(slot);
                            return (
                              <Button
                                key={slot}
                                type="button"
                                variant={selectedTime === slot ? "default" : "outline"}
                                size="sm"
                                onClick={() => !isBooked && setSelectedTime(slot)}
                                disabled={isBooked}
                                className={cn(
                                  isBooked && "opacity-50 cursor-not-allowed line-through bg-muted text-muted-foreground"
                                )}
                              >
                                {slot}
                                {isBooked && <span className="ml-1 text-xs">(Đã đặt)</span>}
                              </Button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">
                          Vui lòng chọn ngày trước để xem khung giờ trống
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? "Đang xử lý..." : "Đặt lịch"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Payment & Contact Info */}
            <div className="space-y-6">
              {/* Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Thông tin thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-accent/20 p-4 rounded-lg space-y-3">
                    <h4 className="font-semibold">Chuyển khoản ngân hàng</h4>
                    <div className="space-y-1 text-sm">
                      <p>Chủ tài khoản: <span className="font-semibold">{bankConfig?.accountName}</span></p>
                      <p>STK: <span className="font-semibold">{bankConfig?.accountNumber}</span></p>
                      <p>Ngân hàng: <span className="font-semibold">{bankConfig?.bankName}</span></p>
                      <p className="text-destructive font-medium mt-2">
                        Nội dung: Số điện thoại_Tên khách hàng
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium">Số tiền đặt cọc: 300,000 VNĐ</p>
                    <p className="text-xs text-muted-foreground">
                      Trường hợp có việc đột xuất cần dời lịch, vui lòng thông báo trước 1 ngày
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin liên hệ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Hotline</p>
                      <p className="text-sm text-muted-foreground">037.213.0010</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-sm text-muted-foreground">snappup@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Địa chỉ</p>
                      <p className="text-sm text-muted-foreground">
                        Cần Thơ, Việt Nam
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cancellation Policy */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Chính sách hủy / dời lịch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>Dời lịch miễn phí:</strong> Báo trước tối thiểu 24 giờ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>Hủy lịch:</strong> Hoàn tiền đặt cọc nếu báo trước 24 giờ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600">⚠</span>
                      <span><strong>Hủy muộn:</strong> Không hoàn tiền nếu hủy trong vòng 24 giờ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">ℹ</span>
                      <span>Sau khi đặt lịch, bạn sẽ nhận email với link quản lý để dời/hủy lịch</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Lưu ý</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
                    <li>Nên đặt lịch trước 1 tuần để đảm bảo có chỗ</li>
                    <li>Đảm bảo bé cưng được tắm rửa sạch sẽ trước khi chụp</li>
                    <li>Có thể mang theo đồ chơi yêu thích của bé</li>
                    <li>Thời gian chụp khoảng 1-2 giờ</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Lookup Link */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Search className="h-4 w-4" />
                      <span>Đã đặt lịch? Tra cứu trạng thái</span>
                    </div>
                    <Link to="/booking/confirmation">
                      <Button variant="outline" size="sm">
                        Tra cứu
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12">
            <BookingFAQ />
          </div>
        </div>
      </div>

      {/* Payment Confirmation Dialog */}
      {bankConfig && (
        <PaymentConfirmDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          bookingId={currentBookingId}
          customerPhone={formData.phone}
          customerName={formData.name}
          bankConfig={bankConfig}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <Footer />
    </div>
  );
};

export default Booking;