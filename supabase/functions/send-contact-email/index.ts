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

    // TEST MODE: Domain chưa verify
    const testModeEmail = "trangnpd.work@gmail.com";
    
    console.log("TEST MODE: Sending to:", testModeEmail);
    console.log("Original admin email:", adminEmail);

    const emailResponse = await resend.emails.send({
      from: "SnapPup Studio <onboarding@resend.dev>",
      to: [testModeEmail],
      subject: `Liên hệ mới từ ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <strong>⚠️ TEST MODE:</strong> Email gốc admin: <strong>${adminEmail}</strong>
          </div>
          <h2 style="color: #333;">Liên hệ mới từ website</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Họ tên:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Số điện thoại:</strong> ${phone}</p>
            <p><strong>Tin nhắn:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Email này được gửi từ form liên hệ trên website SnapPup Studio</p>
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
