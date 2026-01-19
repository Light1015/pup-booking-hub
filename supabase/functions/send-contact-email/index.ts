import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
  adminEmail: string;
}

// HTML escape function to prevent XSS in email content
const escapeHtml = (text: string): string => {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

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

const validatePhone = (phone: string): boolean => {
  return /^[0-9+\-\s()]+$/.test(phone) && phone.length >= 8 && phone.length <= 20;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key to prevent abuse
    const authHeader = req.headers.get("apikey");
    if (authHeader !== Deno.env.get("SUPABASE_ANON_KEY")) {
      console.error("Unauthorized: Invalid or missing API key");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { name, email, phone, message, adminEmail }: ContactEmailRequest = await req.json();

    // Validate all inputs
    if (!validateString(name, 1, 100)) {
      return new Response(
        JSON.stringify({ error: "Tên không hợp lệ (1-100 ký tự)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Email không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validatePhone(phone)) {
      return new Response(
        JSON.stringify({ error: "Số điện thoại không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateString(message, 1, 1000)) {
      return new Response(
        JSON.stringify({ error: "Tin nhắn không hợp lệ (1-1000 ký tự)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateEmail(adminEmail)) {
      return new Response(
        JSON.stringify({ error: "Email admin không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const currentDate = new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    console.log("Sending contact notification to admin:", adminEmail);

    const emailResponse = await resend.emails.send({
      from: "SnapPup Studio <noreply@snappup.vn>",
      to: [adminEmail],
      subject: `📬 Liên hệ mới: ${escapeHtml(name)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #8b5cf6; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">📬 Tin Nhắn Mới</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="color: #4b5563; font-size: 16px;">Có một tin nhắn liên hệ mới từ website. Chi tiết như sau:</p>
            
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #8b5cf6;">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">👤 Thông tin người gửi</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; width: 140px; border-bottom: 1px solid #e5e7eb;">Họ và tên:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${escapeHtml(name)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Email:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb;">
                    <a href="mailto:${escapeHtml(email)}" style="color: #3b82f6;">${escapeHtml(email)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Số điện thoại:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb;">
                    <a href="tel:${escapeHtml(phone)}" style="color: #3b82f6;">${escapeHtml(phone)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;">Thời gian gửi:</td>
                  <td style="padding: 10px 0; color: #1f2937;">${currentDate}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fef3c7; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">💬 Nội dung tin nhắn</h3>
              <p style="color: #1f2937; white-space: pre-wrap; line-height: 1.6; margin: 0;">${escapeHtml(message)}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${escapeHtml(email)}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">Trả lời email</a>
            </div>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">Email này được gửi tự động từ form liên hệ trên website SnapPup Studio</p>
          </div>
        </div>
      `,
    });

    console.log("Contact email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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
