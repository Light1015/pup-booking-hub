import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authorization" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Failed to get user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user has admin role using the has_role function
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error("Admin role check failed:", roleError, "isAdmin:", isAdmin);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin verified:", user.email);

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

    console.log("Sending reply to customer:", customerEmail, "by admin:", user.email);

    const emailResponse = await resend.emails.send({
      from: "SnapPup Studio <noreply@snapup-booking.id.vn>",
      to: [customerEmail],
      subject: escapeHtml(subject),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${escapeHtml(subject)}</h2>
          <p>Xin chào ${escapeHtml(customerName)},</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
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
