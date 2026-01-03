import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, Loader2, CreditCard, Image as ImageIcon, QrCode } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BankConfig {
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrUrl: string;
}

interface PaymentConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  customerPhone: string;
  customerName: string;
  bankConfig: BankConfig;
  onSuccess: () => void;
}

export function PaymentConfirmDialog({
  open,
  onOpenChange,
  bookingId,
  customerPhone,
  customerName,
  bankConfig,
  onSuccess,
}: PaymentConfirmDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh quá lớn (tối đa 5MB)");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `payment-proof/${bookingId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("gallery")
        .getPublicUrl(fileName);

      setUploadedUrl(publicUrl);
      toast.success("Tải ảnh lên thành công!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Lỗi tải ảnh: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!uploadedUrl) {
      toast.error("Vui lòng tải ảnh chuyển khoản lên trước");
      return;
    }

    setConfirming(true);
    try {
      // Update booking with payment proof URL using edge function
      const { error } = await supabase.functions.invoke("manage-booking", {
        body: {
          action: "update_payment_proof",
          bookingId,
          paymentProofUrl: uploadedUrl,
        },
      });

      if (error) throw error;

      toast.success("Đặt lịch thành công! Chúng tôi sẽ liên hệ bạn sớm.");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Confirm error:", error);
      toast.error("Lỗi xác nhận: " + error.message);
    } finally {
      setConfirming(false);
    }
  };

  const transferContent = `${customerPhone}_${customerName}`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="h-6 w-6" />
              Xác nhận thanh toán đặt cọc
            </DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {/* Left side - Bank transfer info with QR */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Quét mã QR để chuyển khoản
              </h3>
              
              {/* QR Code - Prominent display */}
              {bankConfig.qrUrl ? (
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img 
                    src={bankConfig.qrUrl} 
                    alt="QR chuyển khoản" 
                    className="max-w-[280px] w-full rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex justify-center p-8 bg-muted rounded-lg">
                  <p className="text-muted-foreground">QR code chưa được cấu hình</p>
                </div>
              )}

              {/* Bank info */}
              <div className="bg-accent/20 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <Label className="text-muted-foreground text-xs">Chủ tài khoản</Label>
                    <p className="font-semibold">{bankConfig.accountName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Ngân hàng</Label>
                    <p className="font-semibold">{bankConfig.bankName}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Số tài khoản</Label>
                  <p className="font-semibold text-lg font-mono">{bankConfig.accountNumber}</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <Label className="text-muted-foreground text-xs">Nội dung chuyển khoản</Label>
                  <p className="font-semibold text-primary">{transferContent}</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <Label className="text-muted-foreground text-xs">Số tiền đặt cọc</Label>
                  <p className="font-bold text-xl text-primary">300,000 VNĐ</p>
                </div>
              </div>
            </div>

            {/* Right side - Upload payment proof */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Tải ảnh xác nhận chuyển khoản
              </h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors min-h-[280px] flex items-center justify-center">
                  {uploadedUrl ? (
                    <div className="space-y-3 w-full">
                      <div 
                        className="flex justify-center cursor-pointer"
                        onClick={() => setShowFullImage(true)}
                      >
                        <img 
                          src={uploadedUrl} 
                          alt="Ảnh chuyển khoản" 
                          className="max-h-[200px] w-auto rounded-lg object-contain hover:opacity-90 transition-opacity"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Nhấn vào ảnh để xem toàn bộ</p>
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Đã tải ảnh lên</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadedUrl(null)}
                      >
                        Chọn ảnh khác
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block w-full">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          <span className="text-muted-foreground">Đang tải lên...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="h-8 w-8 text-primary" />
                          </div>
                          <span className="font-medium">Nhấn để chọn ảnh</span>
                          <span className="text-sm text-muted-foreground">
                            Chụp màn hình xác nhận chuyển khoản
                          </span>
                        </div>
                      )}
                    </label>
                  )}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground space-y-2">
                  <p className="flex items-start gap-2">
                    <ImageIcon className="h-4 w-4 mt-0.5 shrink-0" />
                    Chụp màn hình xác nhận chuyển khoản từ app ngân hàng
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    Đảm bảo ảnh hiển thị rõ số tiền và nội dung chuyển khoản
                  </p>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  onClick={handleConfirm}
                  disabled={!uploadedUrl || confirming}
                >
                  {confirming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xác nhận...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Xác nhận hoàn tất đặt lịch
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full image preview dialog */}
      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-2">
          <div className="relative w-full h-full flex items-center justify-center overflow-auto">
            {uploadedUrl && (
              <img 
                src={uploadedUrl} 
                alt="Ảnh chuyển khoản" 
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
