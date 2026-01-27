import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const workflowStatusLabels: Record<string, string> = {
  pending_payment: "Chờ thanh toán",
  payment_confirmed: "Đã xác nhận thanh toán",
  scheduled: "Đã lên lịch",
  shooting: "Đang chụp ảnh",
  processing: "Đang xử lý hình ảnh",
  editing_complete: "Hoàn tất chỉnh sửa",
  delivered: "Đã bàn giao",
  cancelled: "Đã hủy",
};

interface WorkflowUpdateRequest {
  customerEmail: string;
  customerName: string;
  petName: string;
  bookingDate: string;
  bookingTime: string;
  selectedCategory: string;
  previousStatus: string;
  newStatus: string;
  manageToken: string;
}

const escapeHtml = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Workflow update email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail,
      customerName,
      petName,
      bookingDate,
      bookingTime,
      selectedCategory,
      previousStatus,
      newStatus,
      manageToken,
    }: WorkflowUpdateRequest = await req.json();

    console.log(`Sending workflow update email to ${customerEmail}`);
    console.log(`Status change: ${previousStatus} -> ${newStatus}`);

    const previousLabel = workflowStatusLabels[previousStatus] || previousStatus;
    const newLabel = workflowStatusLabels[newStatus] || newStatus;
    const safeName = escapeHtml(customerName);
    const safePetName = escapeHtml(petName);
    const safeCategory = escapeHtml(selectedCategory || "Chưa chọn");

    // Generate timeline HTML
    const statuses = ['pending_payment', 'payment_confirmed', 'scheduled', 'shooting', 'processing', 'editing_complete', 'delivered'];
    const currentIndex = statuses.indexOf(newStatus);
    
    let timelineHtml = '<div style="margin: 20px 0;">';
    statuses.forEach((status, index) => {
      const label = workflowStatusLabels[status];
      const isCompleted = index <= currentIndex && newStatus !== 'cancelled';
      const isCurrent = index === currentIndex && newStatus !== 'cancelled';
      const bgColor = isCompleted ? '#10B981' : '#E5E7EB';
      const textColor = isCompleted ? '#FFFFFF' : '#6B7280';
      const fontWeight = isCurrent ? 'bold' : 'normal';
      
      timelineHtml += `
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${bgColor}; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
            ${isCompleted ? '<span style="color: white; font-size: 14px;">✓</span>' : '<span style="color: #9CA3AF; font-size: 12px;">' + (index + 1) + '</span>'}
          </div>
          <span style="color: ${textColor}; font-weight: ${fontWeight};">${label}</span>
          ${isCurrent ? '<span style="margin-left: 8px; padding: 2px 8px; background-color: #DBEAFE; color: #1D4ED8; border-radius: 9999px; font-size: 12px;">Hiện tại</span>' : ''}
        </div>
      `;
    });
    timelineHtml += '</div>';

    const trackingUrl = `https://snappup.lovable.app/booking-confirmation?token=${manageToken}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316; margin: 0; font-size: 28px;">🐾 SnapPup Studio</h1>
            <p style="color: #6B7280; margin-top: 8px;">Cập nhật trạng thái đơn hàng</p>
          </div>
          
          <div style="background-color: #FFF7ED; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 16px;">
              Xin chào <strong>${safeName}</strong>! 👋
            </p>
            <p style="margin: 10px 0 0 0;">
              Đơn hàng chụp ảnh cho <strong>${safePetName}</strong> của bạn đã được cập nhật trạng thái mới.
            </p>
          </div>

          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #1F2937;">📋 Thông tin đơn hàng</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Ngày chụp:</td>
                <td style="padding: 8px 0; font-weight: 500;">${bookingDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Giờ chụp:</td>
                <td style="padding: 8px 0; font-weight: 500;">${bookingTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Dịch vụ:</td>
                <td style="padding: 8px 0; font-weight: 500;">${safeCategory}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #ECFDF5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #065F46;">🔄 Cập nhật trạng thái</h3>
            <p style="margin: 0;">
              <span style="text-decoration: line-through; color: #6B7280;">${previousLabel}</span>
              <span style="margin: 0 10px;">→</span>
              <span style="font-weight: bold; color: #059669;">${newLabel}</span>
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #1F2937;">📍 Tiến trình đơn hàng</h3>
            ${timelineHtml}
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${trackingUrl}" style="display: inline-block; background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500;">
              Xem chi tiết đơn hàng
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 14px;">
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
            <p style="margin-top: 10px;">
              📧 contact@snapup-booking.id.vn | 📞 0123 456 789
            </p>
            <p style="margin-top: 15px; color: #9CA3AF; font-size: 12px;">
              © 2026 SnapPup Studio. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SnapPup <noreply@snapup-booking.id.vn>",
        to: [customerEmail],
        subject: `Cập nhật trạng thái đơn hàng - ${newLabel}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Workflow update email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending workflow update email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
