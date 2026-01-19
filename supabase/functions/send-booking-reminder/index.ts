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
    console.log("Starting booking reminder job...");

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split("T")[0];

    console.log("Checking bookings for date:", tomorrowString);

    // Fetch confirmed bookings for tomorrow
    const { data: bookings, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_date", tomorrowString)
      .eq("status", "confirmed");

    if (fetchError) {
      console.error("Error fetching bookings:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${bookings?.length || 0} confirmed bookings for tomorrow`);

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ message: "No bookings to remind", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results = [];

    for (const booking of bookings) {
      try {
        // Format date for display
        const bookingDate = new Date(booking.booking_date);
        const formattedDate = bookingDate.toLocaleDateString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        console.log(`Sending reminder to: ${booking.email} for booking at ${booking.booking_time}`);

        const emailResponse = await resend.emails.send({
          from: "SnapPup Studio <noreply@snapup-booking.id.vn>",
          to: [booking.email],
          subject: `🐾 Nhắc lịch: Buổi chụp ảnh ngày mai tại SnapPup Studio`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
              <div style="background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #333; text-align: center; margin-bottom: 20px;">
                  🐾 Nhắc lịch chụp ảnh
                </h1>
                
                <p style="font-size: 16px; color: #555;">Xin chào <strong>${escapeHtml(booking.name)}</strong>,</p>
                
                <p style="font-size: 16px; color: #555;">
                  Đây là email nhắc nhở về buổi chụp ảnh của bạn tại <strong>SnapPup Studio</strong> vào ngày mai.
                </p>
                
                <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">📅 Thông tin buổi chụp:</h3>
                  <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="padding: 8px 0; border-bottom: 1px solid #ddd;">
                      <strong>Ngày:</strong> ${formattedDate}
                    </li>
                    <li style="padding: 8px 0; border-bottom: 1px solid #ddd;">
                      <strong>Giờ:</strong> ${escapeHtml(booking.booking_time)}
                    </li>
                    <li style="padding: 8px 0; border-bottom: 1px solid #ddd;">
                      <strong>Hạng mục:</strong> ${escapeHtml(booking.pet_name || booking.selected_category)}
                    </li>
                    ${booking.notes ? `<li style="padding: 8px 0;"><strong>Ghi chú:</strong> ${escapeHtml(booking.notes)}</li>` : ""}
                  </ul>
                </div>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #856404; margin: 0 0 10px 0;">📝 Lưu ý trước buổi chụp:</h4>
                  <ul style="color: #856404; margin: 0; padding-left: 20px;">
                    <li>Đảm bảo bé cưng được tắm rửa sạch sẽ</li>
                    <li>Mang theo đồ chơi yêu thích của bé (nếu có)</li>
                    <li>Đến đúng giờ để có thời gian chuẩn bị</li>
                    <li>Nếu cần thay đổi lịch, vui lòng liên hệ trước</li>
                  </ul>
                </div>
                
                <p style="font-size: 14px; color: #666; text-align: center;">
                  Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ:<br>
                  📞 <strong>037.213.0010</strong> | ✉️ <strong>snappup@gmail.com</strong>
                </p>
                
                <p style="font-size: 16px; color: #555; text-align: center; margin-top: 20px;">
                  Chúng tôi rất mong được gặp bạn và bé cưng! 🐕🐈
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

        console.log(`Reminder sent successfully to ${booking.email}`);
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

    console.log(`Reminder job completed: ${successCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Reminder job completed",
        total: bookings.length,
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
    console.error("Error in send-booking-reminder function:", error);
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
