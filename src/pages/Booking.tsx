import { useState } from "react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, MapPin, CreditCard } from "lucide-react";

const Booking = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    petName: "",
    petType: "",
    notes: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error("Vui lòng chọn ngày và giờ");
      return;
    }

    try {
      const { error } = await supabase.from("bookings").insert([{
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        pet_name: formData.petName,
        pet_type: formData.petType,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        booking_time: selectedTime,
        notes: formData.notes,
      }]);

      if (error) throw error;

      toast.success("Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm.");
    
      setFormData({
        name: "",
        phone: "",
        email: "",
        petName: "",
        petType: "",
        notes: "",
      });
      setSelectedDate(undefined);
      setSelectedTime("");
    } catch (error: any) {
      toast.error("Đặt lịch thất bại: " + error.message);
    }
  };

  return (
    <div className="min-h-screen">
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
                    Chuyển khoản 300,000 VNĐ để giữ chỗ
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
                      <Label htmlFor="petName">Tên bé cưng *</Label>
                      <Input
                        id="petName"
                        required
                        value={formData.petName}
                        onChange={(e) =>
                          setFormData({ ...formData, petName: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="petType">Loại thú cưng *</Label>
                      <Input
                        id="petType"
                        required
                        placeholder="Ví dụ: Chó Golden, Mèo Ba Tư..."
                        value={formData.petType}
                        onChange={(e) =>
                          setFormData({ ...formData, petType: e.target.value })
                        }
                      />
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

                    <div className="space-y-2">
                      <Label>Chọn ngày *</Label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Chọn giờ *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((slot) => (
                          <Button
                            key={slot}
                            type="button"
                            variant={selectedTime === slot ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(slot)}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      Đặt lịch
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
                      <p>Chủ tài khoản: <span className="font-semibold">SnapPup Studio</span></p>
                      <p>STK: <span className="font-semibold">19031267227016</span></p>
                      <p>Ngân hàng: <span className="font-semibold">Techcombank - Chi nhánh Phú Mỹ Hưng</span></p>
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
                      <p className="text-sm text-muted-foreground">Hà Nội, Việt Nam</p>
                    </div>
                  </div>
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
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Booking;
