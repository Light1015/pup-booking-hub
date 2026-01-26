import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Calendar, Clock, Upload, Loader2, Search, AlertCircle, User, Phone, Mail, FileText } from "lucide-react";
import { toast } from "sonner";
import { PaymentConfirmDialog } from "@/components/PaymentConfirmDialog";
import { BookingWorkflowTimeline, WorkflowStatus } from "@/components/BookingWorkflowTimeline";

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

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

  const handlePaymentSuccess = () => {
    refetchToken();
    setSelectedBooking(null);
    // Refresh search results
    if (lookupPhone || lookupEmail) {
      handleSearch();
    }
  };

  const currentBooking = tokenBooking || selectedBooking;

  const renderBookingDetails = (booking: any, isExpanded: boolean = true) => {
    const workflowStatus = (booking.workflow_status || "pending_payment") as WorkflowStatus;
    const isPendingPayment = workflowStatus === "pending_payment" && !booking.payment_proof_url;
    const isCancelled = workflowStatus === "cancelled";

    return (
      <div className="space-y-6">
        {/* Workflow Timeline */}
        <BookingWorkflowTimeline
          currentStatus={workflowStatus}
          timestamps={{
            created_at: booking.created_at,
            payment_confirmed_at: booking.payment_confirmed_at,
            scheduled_at: booking.scheduled_at,
            shooting_at: booking.shooting_at,
            processing_at: booking.processing_at,
            editing_complete_at: booking.editing_complete_at,
            delivered_at: booking.delivered_at,
            cancelled_at: booking.cancelled_at,
          }}
          hasPaymentProof={!!booking.payment_proof_url}
          compact={!isExpanded}
        />

        {isExpanded && (
          <>
            <Separator />

            {/* Customer Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Khách hàng
                </p>
                <p className="font-semibold">{booking.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Số điện thoại
                </p>
                <p>{booking.phone}</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p>{booking.email}</p>
              </div>
            </div>

            <Separator />

            {/* Booking Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ngày chụp
                </p>
                <p className="font-semibold">
                  {new Date(booking.booking_date).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Giờ chụp
                </p>
                <p className="font-semibold">{booking.booking_time}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Dịch vụ</p>
              <p className="font-semibold">{booking.pet_name || booking.selected_category || "Chưa chọn"}</p>
            </div>

            {booking.notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4" />
                  Ghi chú
                </p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}

            <Separator />

            {/* Payment Section */}
            <div className="space-y-3">
              <h4 className="font-semibold">Thông tin thanh toán</h4>
              
              {booking.payment_proof_url ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Đã gửi ảnh xác nhận thanh toán</span>
                  </div>
                  <img 
                    src={booking.payment_proof_url} 
                    alt="Ảnh chuyển khoản" 
                    className="max-h-[300px] rounded-lg border w-full object-contain bg-muted"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-yellow-600 p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Chưa upload ảnh chuyển khoản</span>
                  </div>
                  
                  {!isCancelled && (
                    <div className="p-4 border border-dashed rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-3">
                        Vui lòng chuyển khoản và upload ảnh xác nhận để hoàn tất đặt lịch.
                        <br />
                        <span className="text-destructive font-medium">
                          Lưu ý: Lịch đặt sẽ tự động hủy sau 24h nếu chưa thanh toán.
                        </span>
                      </p>
                      <Button 
                        onClick={() => {
                          setSelectedBooking(booking);
                          setPaymentDialogOpen(true);
                        }}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Xác nhận đã chuyển khoản
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold mb-4">Tra cứu trạng thái</h1>
            <p className="text-muted-foreground">
              Theo dõi tiến độ xử lý và upload ảnh chuyển khoản
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
              <CardContent>
                {renderBookingDetails(tokenBooking, true)}
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
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                  {searchResults.map((booking) => {
                    const isExpanded = expandedBookingId === booking.id;
                    const workflowStatus = (booking.workflow_status || "pending_payment") as WorkflowStatus;
                    
                    return (
                      <Card 
                        key={booking.id} 
                        className={`transition-all cursor-pointer ${isExpanded ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
                        onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                      >
                        <CardContent className="p-4">
                          {isExpanded ? (
                            renderBookingDetails(booking, true)
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold">{booking.pet_name || booking.selected_category}</p>
                                    <Badge 
                                      variant={workflowStatus === "cancelled" ? "destructive" : "default"}
                                      className={
                                        workflowStatus === "pending_payment" && !booking.payment_proof_url 
                                          ? "bg-yellow-500" 
                                          : workflowStatus === "delivered" 
                                            ? "bg-green-500" 
                                            : ""
                                      }
                                    >
                                      {workflowStatus === "pending_payment" && !booking.payment_proof_url 
                                        ? "Chờ thanh toán"
                                        : workflowStatus === "pending_payment"
                                          ? "Chờ xác nhận TT"
                                          : workflowStatus === "payment_confirmed"
                                            ? "Đã thanh toán"
                                            : workflowStatus === "scheduled"
                                              ? "Đã lên lịch"
                                              : workflowStatus === "shooting"
                                                ? "Đang chụp"
                                                : workflowStatus === "processing"
                                                  ? "Đang xử lý"
                                                  : workflowStatus === "editing_complete"
                                                    ? "Hoàn tất chỉnh sửa"
                                                    : workflowStatus === "delivered"
                                                      ? "Đã bàn giao"
                                                      : workflowStatus === "cancelled"
                                                        ? "Đã hủy"
                                                        : workflowStatus
                                      }
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(booking.booking_date).toLocaleDateString("vi-VN")} - {booking.booking_time}
                                  </p>
                                </div>
                                {!booking.payment_proof_url && workflowStatus !== "cancelled" && (
                                  <Button 
                                    size="sm"
                                    variant="default"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBooking(booking);
                                      setPaymentDialogOpen(true);
                                    }}
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Upload ảnh
                                  </Button>
                                )}
                              </div>
                              
                              {/* Compact Timeline */}
                              <BookingWorkflowTimeline
                                currentStatus={workflowStatus}
                                timestamps={{
                                  created_at: booking.created_at,
                                  payment_confirmed_at: booking.payment_confirmed_at,
                                  scheduled_at: booking.scheduled_at,
                                  shooting_at: booking.shooting_at,
                                  processing_at: booking.processing_at,
                                  editing_complete_at: booking.editing_complete_at,
                                  delivered_at: booking.delivered_at,
                                  cancelled_at: booking.cancelled_at,
                                }}
                                hasPaymentProof={!!booking.payment_proof_url}
                                compact
                              />
                              
                              <p className="text-xs text-muted-foreground">
                                Nhấn để xem chi tiết
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
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
