import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    console.log("Starting payment reminder job...");

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get bookings created more than 24 hours ago without payment proof
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    console.log("Checking bookings created before:", twentyFourHoursAgo.toISOString());

    const { data: pendingBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .is("payment_proof_url", null)
      .eq("status", "pending")
      .lt("created_at", twentyFourHoursAgo.toISOString());

    if (fetchError) {
      console.error("Error fetching bookings:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingBookings?.length || 0} bookings without payment after 24h`);

    if (!pendingBookings || pendingBookings.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending payments to remind", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get base URL from environment or use default
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://snappup.vn";
    
    const results = [];

    for (const booking of pendingBookings) {
      try {
        // Generate confirmation page URL with manage token
        const confirmUrl = `${baseUrl}/booking/confirmation?token=${booking.manage_token}`;

        console.log(`Sending payment reminder to: ${booking.email}`);

        const emailResponse = await resend.emails.send({
          from: "SnapPup Studio <noreply@snappup.vn>",
          to: [booking.email],
          subject: `🐾 Nhắc nhở: Hoàn tất đặt lịch chụp ảnh tại SnapPup Studio`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
              <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #333; text-align: center; margin-bottom: 20px;">
                  🐾 Nhắc nhở đặt lịch
                </h1>
                
                <p style="font-size: 16px; color: #555;">Xin chào <strong>${escapeHtml(booking.name)}</strong>,</p>
                
                <p style="font-size: 16px; color: #555;">
                  Chúng tôi nhận thấy bạn đã đặt lịch chụp ảnh nhưng chưa hoàn tất thanh toán đặt cọc.
                </p>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #856404; margin: 0;">
                    <strong>⚠️ Lưu ý:</strong> Lịch đặt của bạn sẽ chỉ được xác nhận sau khi chúng tôi nhận được ảnh chuyển khoản.
                  </p>
                </div>
                
                <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">📅 Thông tin lịch hẹn:</h3>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="padding: 8px 0; border-bottom: 1px solid #ddd;">
                      <strong>Ngày:</strong> ${escapeHtml(booking.booking_date)}
                    </li>
                    <li style="padding: 8px 0; border-bottom: 1px solid #ddd;">
                      <strong>Giờ:</strong> ${escapeHtml(booking.booking_time)}
                    </li>
                    <li style="padding: 8px 0;">
                      <strong>Hạng mục:</strong> ${escapeHtml(booking.pet_name || booking.selected_category)}
                    </li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmUrl}" 
                     style="display: inline-block; background-color: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Upload ảnh chuyển khoản
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #888; text-align: center;">
                  Nếu bạn không muốn tiếp tục đặt lịch, bạn có thể bỏ qua email này.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p style="font-size: 14px; color: #666; text-align: center;">
                  Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ:<br>
                  📞 <strong>037.213.0010</strong> | ✉️ <strong>snappup@gmail.com</strong>
                </p>
              </div>
              
              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                © 2024 SnapPup Studio - Chuyên chụp ảnh thú cưng chuyên nghiệp
              </p>
            </div>
          `,
        });

        results.push({
          bookingId: booking.id,
          email: booking.email,
          status: "sent",
          response: emailResponse,
        });

        console.log(`Payment reminder sent successfully to ${booking.email}`);
      } catch (emailError: any) {
        console.error(`Error sending reminder to ${booking.email}:`, emailError);
        results.push({
          bookingId: booking.id,
          email: booking.email,
          status: "failed",
          error: emailError.message,
        });
      }
    }

    const successCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    console.log(`Payment reminder job completed: ${successCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Payment reminder job completed",
        total: pendingBookings.length,
        sent: successCount,
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
