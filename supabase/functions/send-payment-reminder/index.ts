import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// HTML escape function to prevent XSS in email content
const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting payment reminder job (12h + 24h check)...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = Date.now();
    const twelveHoursAgo = new Date(now - 12 * 60 * 60 * 1000);
    const thirteenHoursAgo = new Date(now - 13 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Get bookings needing 12h reminder (between 12-13 hours old, no payment)
    const { data: reminder12hBookings, error: fetch12hError } = await supabase
      .from("bookings")
      .select("*")
      .eq("workflow_status", "pending_payment")
      .is("payment_proof_url", null)
      .lt("created_at", twelveHoursAgo.toISOString())
      .gt("created_at", thirteenHoursAgo.toISOString());

    if (fetch12hError) {
      console.error("Error fetching 12h bookings:", fetch12hError);
    }

    // Get bookings for 24h auto-cancel warning (more than 24h old)
    const { data: reminder24hBookings, error: fetch24hError } = await supabase
      .from("bookings")
      .select("*")
      .is("payment_proof_url", null)
      .eq("workflow_status", "pending_payment")
      .lt("created_at", twentyFourHoursAgo.toISOString());

    if (fetch24hError) {
      console.error("Error fetching 24h bookings:", fetch24hError);
    }

    console.log(`Found ${reminder12hBookings?.length || 0} bookings for 12h reminder`);
    console.log(`Found ${reminder24hBookings?.length || 0} bookings for 24h warning`);

    const baseUrl = "https://snappup.lovable.app";
    const results: any[] = [];

    // Send 12h reminders
    for (const booking of (reminder12hBookings || [])) {
      try {
        const confirmUrl = `${baseUrl}/booking-confirmation?token=${booking.manage_token}`;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Nhắc nhở thanh toán</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Booking của bạn sắp hết hạn!</p>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <p style="font-size: 16px;">Xin chào <strong>${escapeHtml(booking.name)}</strong>,</p>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>⚠️ Lưu ý:</strong> Booking của bạn chưa được thanh toán. Nếu không thanh toán trong vòng <strong>12 giờ tới</strong>, booking sẽ tự động bị hủy.
      </p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">📋 Thông tin booking:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Ngày chụp:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(new Date(booking.booking_date).toLocaleDateString("vi-VN"))}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Giờ:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(booking.booking_time)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Tên thú cưng:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(booking.pet_name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Gói dịch vụ:</strong></td>
          <td style="padding: 8px 0;">${escapeHtml(booking.selected_category || "Chưa chọn")}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        💳 Thanh toán ngay
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; text-align: center;">
      Nếu bạn đã thanh toán, vui lòng upload ảnh chuyển khoản qua link trên để xác nhận.
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
    <p>© 2024 SNAPPUP Studio. All rights reserved.</p>
  </div>
</body>
</html>`;

        const { error: emailError } = await resend.emails.send({
          from: "SNAPPUP Studio <booking@snapup-booking.id.vn>",
          to: [booking.email],
          subject: "⏰ Nhắc nhở: Booking sắp hết hạn thanh toán (còn 12 giờ)",
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Failed to send 12h reminder to ${booking.email}:`, emailError);
          results.push({ type: "12h", email: booking.email, status: "failed", error: emailError.message });
        } else {
          console.log(`Sent 12h reminder to ${booking.email}`);
          results.push({ type: "12h", email: booking.email, status: "sent" });
        }
      } catch (err: any) {
        console.error(`Error sending 12h reminder:`, err);
        results.push({ type: "12h", email: booking.email, status: "failed", error: err.message });
      }
    }

    // Send 24h warnings (final reminder before auto-cancel)
    for (const booking of (reminder24hBookings || [])) {
      try {
        const confirmUrl = `${baseUrl}/booking-confirmation?token=${booking.manage_token}`;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Cảnh báo: Booking sắp bị hủy!</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <p style="font-size: 16px;">Xin chào <strong>${escapeHtml(booking.name)}</strong>,</p>
    
    <div style="background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #dc2626;">
        <strong>🚨 Quan trọng:</strong> Booking của bạn đã quá hạn thanh toán và sẽ bị hủy trong thời gian tới nếu không nhận được ảnh chuyển khoản.
      </p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #dc2626;">📋 Thông tin booking:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Ngày chụp:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(new Date(booking.booking_date).toLocaleDateString("vi-VN"))}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Giờ:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(booking.booking_time)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Tên thú cưng:</strong></td>
          <td style="padding: 8px 0;">${escapeHtml(booking.pet_name)}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        💳 Thanh toán ngay để giữ lịch
      </a>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
    <p>© 2024 SNAPPUP Studio. All rights reserved.</p>
  </div>
</body>
</html>`;

        const { error: emailError } = await resend.emails.send({
          from: "SNAPPUP Studio <booking@snapup-booking.id.vn>",
          to: [booking.email],
          subject: "🚨 Cảnh báo cuối: Booking sắp bị hủy do chưa thanh toán",
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Failed to send 24h warning to ${booking.email}:`, emailError);
          results.push({ type: "24h", email: booking.email, status: "failed", error: emailError.message });
        } else {
          console.log(`Sent 24h warning to ${booking.email}`);
          results.push({ type: "24h", email: booking.email, status: "sent" });
        }
      } catch (err: any) {
        console.error(`Error sending 24h warning:`, err);
        results.push({ type: "24h", email: booking.email, status: "failed", error: err.message });
      }
    }

    const sentCount = results.filter(r => r.status === "sent").length;
    const failedCount = results.filter(r => r.status === "failed").length;

    console.log(`Payment reminder job completed: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Payment reminder job completed",
        sent: sentCount,
        failed: failedCount,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-payment-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
