import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingWorkflowTimeline, WorkflowStatus } from "./BookingWorkflowTimeline";
import { Calendar, Clock, User, Phone, Mail, FileText, CreditCard, Camera, ImageIcon, Package, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface BookingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  isAdmin?: boolean;
}

const workflowStatusLabels: Record<WorkflowStatus, string> = {
  pending_payment: "Chờ thanh toán",
  payment_confirmed: "Đã xác nhận thanh toán",
  scheduled: "Đã lên lịch",
  shooting: "Đang chụp ảnh",
  processing: "Đang xử lý hình ảnh",
  editing_complete: "Hoàn tất chỉnh sửa",
  delivered: "Đã bàn giao",
  cancelled: "Đã hủy",
};

const adminEditableStatuses: WorkflowStatus[] = [
  "scheduled",
  "shooting", 
  "processing",
  "editing_complete",
  "delivered",
];

export const BookingDetailDialog = ({
  open,
  onOpenChange,
  booking,
  isAdmin = false,
}: BookingDetailDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | "">("");

  const updateWorkflowStatus = useMutation({
    mutationFn: async (newStatus: WorkflowStatus) => {
      const timestampField = `${newStatus}_at`;
      const updateData: Record<string, any> = {
        workflow_status: newStatus,
        [timestampField]: new Date().toISOString(),
      };

      // Also update the old status field for backward compatibility
      if (newStatus === "delivered") {
        updateData.status = "completed";
      } else if (newStatus === "cancelled") {
        updateData.status = "cancelled";
      } else if (newStatus === "payment_confirmed" || newStatus === "scheduled") {
        updateData.status = "confirmed";
      }

      const { error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", booking.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Đã cập nhật trạng thái!");
      setSelectedStatus("");
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const confirmPayment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("bookings")
        .update({
          workflow_status: "payment_confirmed",
          payment_confirmed_at: new Date().toISOString(),
          status: "confirmed",
        })
        .eq("id", booking.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Đã xác nhận thanh toán!");
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const cancelBooking = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("bookings")
        .update({
          workflow_status: "cancelled",
          cancelled_at: new Date().toISOString(),
          status: "cancelled",
        })
        .eq("id", booking.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Đã hủy lịch đặt!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  if (!booking) return null;

  const currentStatus = (booking.workflow_status || "pending_payment") as WorkflowStatus;
  const isPendingPayment = currentStatus === "pending_payment";
  const isCancelled = currentStatus === "cancelled";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Chi tiết lịch đặt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={isCancelled ? "destructive" : "default"}
              className={
                isPendingPayment ? "bg-yellow-500" :
                currentStatus === "delivered" ? "bg-green-500" :
                ""
              }
            >
              {workflowStatusLabels[currentStatus]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              ID: {booking.id.slice(0, 8)}...
            </span>
          </div>

          {/* Timeline */}
          <BookingWorkflowTimeline
            currentStatus={currentStatus}
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
          />

          <Separator />

          {/* Customer Info */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Thông tin khách hàng
            </h4>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.phone}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{booking.email}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Booking Info */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Thông tin lịch đặt
            </h4>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(booking.booking_date).toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{booking.booking_time}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Dịch vụ: </span>
                <span className="font-medium">{booking.pet_name || booking.selected_category || "Chưa chọn"}</span>
              </div>
              {booking.expected_revenue > 0 && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Doanh thu dự kiến: </span>
                  <span className="font-medium text-green-600">
                    {new Intl.NumberFormat("vi-VN").format(booking.expected_revenue)} VNĐ
                  </span>
                </div>
              )}
            </div>
            {booking.notes && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-sm text-muted-foreground">Ghi chú: </span>
                    <p className="text-sm">{booking.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Proof */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Thông tin thanh toán
            </h4>
            {booking.payment_proof_url ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Đã gửi ảnh xác nhận thanh toán</span>
                </div>
                <div className="relative">
                  <img
                    src={booking.payment_proof_url}
                    alt="Ảnh chuyển khoản"
                    className="max-h-[300px] rounded-lg border w-full object-contain bg-muted"
                  />
                  <a
                    href={booking.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background p-2 rounded-full transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600 p-3 bg-yellow-50 rounded-lg">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Chưa upload ảnh chuyển khoản</span>
              </div>
            )}
          </div>

          {/* Admin Actions */}
          {isAdmin && !isCancelled && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold">Thao tác Admin</h4>
                
                {/* Confirm Payment (only if pending and has proof) */}
                {isPendingPayment && booking.payment_proof_url && (
                  <Button
                    onClick={() => confirmPayment.mutate()}
                    disabled={confirmPayment.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Xác nhận đã thanh toán
                  </Button>
                )}

                {/* Update Workflow Status */}
                {!isPendingPayment && currentStatus !== "delivered" && (
                  <div className="flex gap-2">
                    <Select
                      value={selectedStatus}
                      onValueChange={(value) => setSelectedStatus(value as WorkflowStatus)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Chọn trạng thái mới" />
                      </SelectTrigger>
                      <SelectContent>
                        {adminEditableStatuses
                          .filter(status => {
                            const currentIdx = adminEditableStatuses.indexOf(currentStatus as any);
                            const statusIdx = adminEditableStatuses.indexOf(status);
                            return statusIdx > currentIdx || currentIdx === -1;
                          })
                          .map((status) => (
                            <SelectItem key={status} value={status}>
                              {workflowStatusLabels[status]}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => selectedStatus && updateWorkflowStatus.mutate(selectedStatus as WorkflowStatus)}
                      disabled={!selectedStatus || updateWorkflowStatus.isPending}
                    >
                      Cập nhật
                    </Button>
                  </div>
                )}

                {/* Cancel Button */}
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("Bạn có chắc muốn hủy lịch đặt này?")) {
                      cancelBooking.mutate();
                    }
                  }}
                  disabled={cancelBooking.isPending}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Hủy lịch đặt
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
