import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReplyEmailRequest {
  customerEmail: string;
  customerName: string;
  subject: string;
  message: string;
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, subject, message }: ReplyEmailRequest = await req.json();

    // Validate all inputs
    if (!validateEmail(customerEmail)) {
      return new Response(
        JSON.stringify({ error: "Email không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateString(customerName, 1, 100)) {
      return new Response(
        JSON.stringify({ error: "Tên không hợp lệ (1-100 ký tự)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateString(subject, 1, 200)) {
      return new Response(
        JSON.stringify({ error: "Tiêu đề không hợp lệ (1-200 ký tự)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateString(message, 1, 5000)) {
      return new Response(
        JSON.stringify({ error: "Tin nhắn không hợp lệ (1-5000 ký tự)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // TEST MODE: Domain chưa verify
    const testModeEmail = "trangnpd.work@gmail.com";
    
    console.log("TEST MODE: Sending to:", testModeEmail);
    console.log("Original customer email:", customerEmail);

    const emailResponse = await resend.emails.send({
      from: "SnapPup Studio <onboarding@resend.dev>",
      to: [testModeEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <strong>⚠️ TEST MODE:</strong> Email gốc khách: <strong>${customerEmail}</strong>
          </div>
          <h2 style="color: #333;">${subject}</h2>
          <p>Xin chào ${customerName},</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p>Trân trọng,<br>SnapPup Studio Team</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Hotline: 037.213.0010<br>
            Email: snappup@gmail.com<br>
            Website: snappup.studio
          </p>
        </div>
      `,
    });

    console.log("Reply email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-customer-reply function:", error);
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
