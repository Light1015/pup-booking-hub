import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Calendar, Clock, Upload, Loader2, Search, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PaymentConfirmDialog } from "@/components/PaymentConfirmDialog";

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

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

  // Fetch booking by token
  const { data: tokenBooking, isLoading: loadingToken, refetch: refetchToken } = useQuery({
    queryKey: ["booking-token", token],
    queryFn: async () => {
      if (!token) return null;
      
      const { data, error } = await supabase.functions.invoke("manage-booking", {
        body: { action: "get", token },
      });

      if (error) throw error;
      return data?.booking || null;
    },
    enabled: !!token,
  });

  const handleSearch = async () => {
    if (!lookupPhone && !lookupEmail) {
      toast.error("Vui lòng nhập số điện thoại hoặc email");
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-booking", {
        body: {
          action: "lookup",
          phone: lookupPhone,
          email: lookupEmail,
        },
      });

      if (error) throw error;
      
      setSearchResults(data?.bookings || []);
      if (data?.bookings?.length === 0) {
        toast.info("Không tìm thấy lịch đặt nào");
      }
    } catch (error: any) {
      toast.error("Lỗi tìm kiếm: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: string, hasPaymentProof: boolean) => {
    if (!hasPaymentProof && status === "pending") {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Chờ thanh toán</Badge>;
    }
    
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">Chờ xác nhận</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500">Đã xác nhận</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Đã hủy</Badge>;
      case "completed":
        return <Badge className="bg-purple-500">Hoàn thành</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePaymentSuccess = () => {
    refetchToken();
    setSelectedBooking(null);
  };

  const currentBooking = tokenBooking || selectedBooking;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold mb-4">Tra cứu lịch đặt</h1>
            <p className="text-muted-foreground">
              Kiểm tra trạng thái và upload ảnh chuyển khoản
            </p>
          </div>

          {/* If has token, show booking details */}
          {token && tokenBooking && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Chi tiết lịch đặt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    {getStatusBadge(tokenBooking.status, !!tokenBooking.payment_proof_url)}
                  </div>
                  {!tokenBooking.payment_proof_url && tokenBooking.status !== "cancelled" && (
                    <Button onClick={() => {
                      setSelectedBooking(tokenBooking);
                      setPaymentDialogOpen(true);
                    }}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload ảnh chuyển khoản
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Khách hàng</p>
                    <p className="font-semibold">{tokenBooking.name}</p>
                    <p className="text-sm">{tokenBooking.phone}</p>
                    <p className="text-sm">{tokenBooking.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Thời gian</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(tokenBooking.booking_date).toLocaleDateString("vi-VN")}
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {tokenBooking.booking_time}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Hạng mục</p>
                  <p className="font-semibold">{tokenBooking.pet_name}</p>
                </div>

                {tokenBooking.payment_proof_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Ảnh chuyển khoản</p>
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Đã gửi ảnh xác nhận</span>
                    </div>
                    <img 
                      src={tokenBooking.payment_proof_url} 
                      alt="Ảnh chuyển khoản" 
                      className="max-h-[300px] rounded-lg border"
                    />
                  </div>
                )}

                {tokenBooking.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ghi chú</p>
                    <p>{tokenBooking.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loading state */}
          {loadingToken && (
            <Card className="mb-8">
              <CardContent className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          )}

          {/* Search form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Tra cứu lịch đặt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tìm...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Tìm kiếm
                  </>
                )}
              </Button>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold">Kết quả tìm kiếm ({searchResults.length})</h3>
                  {searchResults.map((booking) => (
                    <Card key={booking.id} className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{booking.pet_name}</p>
                              {getStatusBadge(booking.status, !!booking.payment_proof_url)}
                            </div>
                            <p className="text-sm flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(booking.booking_date).toLocaleDateString("vi-VN")} - {booking.booking_time}
                            </p>
                            {booking.payment_proof_url ? (
                              <p className="text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Đã gửi ảnh chuyển khoản
                              </p>
                            ) : (
                              <p className="text-sm text-yellow-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Chưa upload ảnh chuyển khoản
                              </p>
                            )}
                          </div>
                          {!booking.payment_proof_url && booking.status !== "cancelled" && (
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setPaymentDialogOpen(true);
                              }}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Upload ảnh
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back to booking */}
          <div className="mt-8 text-center">
            <Link to="/booking">
              <Button variant="outline">
                Đặt lịch mới
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      {bankConfig && selectedBooking && (
        <PaymentConfirmDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          bookingId={selectedBooking.id}
          customerPhone={selectedBooking.phone}
          customerName={selectedBooking.name}
          bankConfig={bankConfig}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <Footer />
    </div>
  );
};

export default BookingConfirmation;
