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
  // Optional booking details
  bookingDetails?: {
    booking_date: string;
    booking_time: string;
    pet_name: string;
    selected_category?: string;
    notes?: string;
  };
  // Optional contact details
  contactDetails?: {
    phone: string;
    original_message: string;
    created_at: string;
  };
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

    const { customerEmail, customerName, subject, message, bookingDetails, contactDetails }: ReplyEmailRequest = await req.json();

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

    // Build booking details section if available
    let bookingSection = '';
    if (bookingDetails) {
      const bookingDate = new Date(bookingDetails.booking_date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      bookingSection = `
        <div style="background-color: #e8f4f8; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0;">📅 Thông tin lịch đặt của bạn:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 120px;">Hạng mục:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapeHtml(bookingDetails.pet_name || bookingDetails.selected_category || '')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Ngày chụp:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${bookingDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Giờ chụp:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapeHtml(bookingDetails.booking_time)}</td>
            </tr>
            ${bookingDetails.notes ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Ghi chú:</td>
              <td style="padding: 8px 0; color: #1f2937;">${escapeHtml(bookingDetails.notes)}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      `;
    }

    // Build contact details section if available
    let contactSection = '';
    if (contactDetails) {
      const contactDate = new Date(contactDetails.created_at).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      contactSection = `
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 15px 0;">💬 Tin nhắn gốc của bạn:</h3>
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">Gửi lúc: ${contactDate}</p>
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">SĐT: ${escapeHtml(contactDetails.phone)}</p>
          <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px;">
            <p style="color: #1f2937; white-space: pre-wrap; margin: 0; line-height: 1.6;">${escapeHtml(contactDetails.original_message)}</p>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "SnapPup Studio <noreply@snapup-booking.id.vn>",
      to: [customerEmail],
      subject: escapeHtml(subject),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #8b5cf6; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">SnapPup Studio</h1>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #333;">${escapeHtml(subject)}</h2>
            <p style="color: #4b5563; font-size: 16px;">Xin chào <strong>${escapeHtml(customerName)}</strong>,</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0;">📝 Phản hồi từ SnapPup Studio:</h3>
              <p style="white-space: pre-wrap; color: #1f2937; line-height: 1.6; margin: 0;">${escapeHtml(message)}</p>
            </div>

            ${bookingSection}
            ${contactSection}
            
            <p style="color: #4b5563; margin-top: 30px;">Trân trọng,<br><strong>SnapPup Studio Team</strong></p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0 0 10px 0;">
              📞 Hotline: <strong>037.213.0010</strong> | 
              ✉️ Email: <strong>snappup@gmail.com</strong>
            </p>
            <p style="margin: 0;">© 2024 SnapPup Studio. All rights reserved.</p>
          </div>
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
