import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  customerName: string;
  customerEmail: string;
  petName: string;
  date: string;
  time: string;
  message?: string;
  adminEmail: string;
}

// Validation helper functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const validateString = (str: string, minLen: number, maxLen: number): boolean => {
  if (!str) return false;
  const trimmed = str.trim();
  return trimmed.length >= minLen && trimmed.length <= maxLen;
};

const validateTime = (time: string): boolean => {
  return /^\d{2}:\d{2}$/.test(time);
};

const validateDate = (date: string): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerName, customerEmail, petName, date, time, message, adminEmail }: EmailRequest = await req.json();

    // Validate all inputs
    if (!validateString(customerName, 1, 100)) {
      return new Response(
        JSON.stringify({ error: "Tên không hợp lệ (1-100 ký tự)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateEmail(customerEmail)) {
      return new Response(
        JSON.stringify({ error: "Email không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateString(petName, 1, 50)) {
      return new Response(
        JSON.stringify({ error: "Tên thú cưng không hợp lệ (1-50 ký tự)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateDate(date)) {
      return new Response(
        JSON.stringify({ error: "Ngày không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateTime(time)) {
      return new Response(
        JSON.stringify({ error: "Giờ không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (message && message.length > 500) {
      return new Response(
        JSON.stringify({ error: "Ghi chú quá dài (tối đa 500 ký tự)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateEmail(adminEmail)) {
      return new Response(
        JSON.stringify({ error: "Email admin không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending booking confirmation to customer:", customerEmail);
    console.log("Sending booking notification to admin:", adminEmail);

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "SnapPup Studio <onboarding@resend.dev>",
      to: [customerEmail],
      subject: "Xác nhận đặt lịch chụp ảnh",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Xác nhận đặt lịch chụp ảnh</h2>
          <p>Xin chào ${customerName},</p>
          <p>Cảm ơn bạn đã đặt lịch chụp ảnh tại SnapPup Studio. Chúng tôi đã nhận được yêu cầu của bạn với thông tin sau:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tên thú cưng:</strong> ${petName}</p>
            <p><strong>Ngày:</strong> ${date}</p>
            <p><strong>Giờ:</strong> ${time}</p>
            ${message ? `<p><strong>Ghi chú:</strong> ${message}</p>` : ''}
          </div>

          <p>Chúng tôi sẽ liên hệ với bạn sớm để xác nhận lịch hẹn.</p>
          <p>Trân trọng,<br>SnapPup Studio Team</p>
        </div>
      `,
    });

    console.log("Customer email sent successfully:", customerEmailResponse);

    // Send notification email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "SnapPup Studio <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `Đặt lịch mới từ ${customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Đặt lịch mới</h2>
          <p>Có một đặt lịch mới từ khách hàng:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tên khách hàng:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Tên thú cưng:</strong> ${petName}</p>
            <p><strong>Ngày:</strong> ${date}</p>
            <p><strong>Giờ:</strong> ${time}</p>
            ${message ? `<p><strong>Ghi chú:</strong> ${message}</p>` : ''}
          </div>
        </div>
      `,
    });

    console.log("Admin email sent successfully:", adminEmailResponse);

    return new Response(JSON.stringify({ 
      customer: customerEmailResponse, 
      admin: adminEmailResponse 
    }), {
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
