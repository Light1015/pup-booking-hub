import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  customerName: string;
  petName: string;
  bookingDate: string;
  bookingTime: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, customerName, petName, bookingDate, bookingTime, message }: EmailRequest = await req.json();

    console.log("Sending email to:", to);

    const emailResponse = await resend.emails.send({
      from: "SnapPup Photography <onboarding@resend.dev>",
      to: [to],
      subject: "Xác nhận lịch chụp ảnh - SnapPup",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              h1 { margin: 0; font-size: 28px; }
              h2 { color: #667eea; font-size: 20px; margin-top: 0; }
              .detail-row { margin: 10px 0; }
              .label { font-weight: bold; color: #555; }
              .message-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🐾 SnapPup Photography</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Xác nhận lịch chụp ảnh</p>
              </div>
              <div class="content">
                <p>Xin chào <strong>${customerName}</strong>,</p>
                <p>Cảm ơn bạn đã đặt lịch chụp ảnh cho <strong>${petName}</strong>! Đây là thông tin chi tiết về lịch hẹn của bạn:</p>
                
                <div class="info-box">
                  <h2>📅 Thông tin lịch hẹn</h2>
                  <div class="detail-row">
                    <span class="label">Tên khách hàng:</span> ${customerName}
                  </div>
                  <div class="detail-row">
                    <span class="label">Tên thú cưng:</span> ${petName}
                  </div>
                  <div class="detail-row">
                    <span class="label">Ngày chụp:</span> ${new Date(bookingDate).toLocaleDateString('vi-VN')}
                  </div>
                  <div class="detail-row">
                    <span class="label">Giờ chụp:</span> ${bookingTime}
                  </div>
                </div>

                ${message ? `
                  <div class="message-box">
                    <strong>💬 Tin nhắn từ SnapPup:</strong>
                    <p style="margin: 10px 0 0 0;">${message}</p>
                  </div>
                ` : ''}

                <p style="margin-top: 30px;">Chúng tôi rất mong được gặp bạn và ${petName}! Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>
                
                <div class="footer">
                  <p><strong>SnapPup Photography Studio</strong></p>
                  <p>📧 Email: contact@snappup.com | 📞 Phone: (028) 1234 5678</p>
                  <p>📍 123 Nguyễn Huệ, Quận 1, TP.HCM</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-email function:", error);
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
