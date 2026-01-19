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
  customerPhone: string;
  categoryName: string;
  date: string;
  time: string;
  notes?: string;
  adminEmail: string;
  manageUrl?: string;
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

const validateTime = (time: string): boolean => {
  // Accept both "HH:MM" and "HH:MM - HH:MM" formats
  return /^\d{2}:\d{2}(\s*-\s*\d{2}:\d{2})?$/.test(time);
};

const validateDate = (date: string): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

const validatePhone = (phone: string): boolean => {
  return /^[0-9+\-\s()]+$/.test(phone) && phone.length >= 8 && phone.length <= 20;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-booking-email function called");
  
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

    const body = await req.text();
    console.log("Request body:", body);
    
    const { customerName, customerEmail, customerPhone, categoryName, date, time, notes, adminEmail, manageUrl }: EmailRequest = JSON.parse(body);

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

    if (!validatePhone(customerPhone)) {
      return new Response(
        JSON.stringify({ error: "Số điện thoại không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateString(categoryName, 1, 100)) {
      return new Response(
        JSON.stringify({ error: "Hạng mục không hợp lệ" }),
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

    if (notes && notes.length > 500) {
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

    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log("All validations passed. Sending booking confirmation to customer:", customerEmail);
    console.log("RESEND_API_KEY exists:", !!Deno.env.get("RESEND_API_KEY"));

    // Send confirmation email to customer with full form details
    const customerEmailResponse = await resend.emails.send({
      from: "SnapPup Studio <noreply@snappup.vn>",
      to: [customerEmail],
      subject: "Xác nhận đặt lịch chụp ảnh - SnapPup Studio",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #3b82f6; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">SnapPup Studio</h1>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Xác nhận đặt lịch chụp ảnh</h2>
            
            <p style="color: #4b5563; font-size: 16px;">Xin chào <strong>${escapeHtml(customerName)}</strong>,</p>
            <p style="color: #4b5563; font-size: 16px;">Cảm ơn bạn đã đặt lịch chụp ảnh tại SnapPup Studio. Chúng tôi đã nhận được yêu cầu của bạn với thông tin chi tiết như sau:</p>
            
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">📋 Thông tin đặt lịch</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 140px;">Họ và tên:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapeHtml(customerName)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapeHtml(customerEmail)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Số điện thoại:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapeHtml(customerPhone)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Hạng mục chụp:</td>
                  <td style="padding: 8px 0; color: #3b82f6; font-weight: 600;">${escapeHtml(categoryName)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Ngày chụp:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Giờ chụp:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapeHtml(time)}</td>
                </tr>
                ${notes ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Ghi chú:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${escapeHtml(notes)}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background-color: #fef3c7; padding: 20px; border-radius: 12px; margin: 25px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0;">⚠️ Lưu ý quan trọng</h4>
              <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Vui lòng đặt cọc 300,000 VNĐ để giữ chỗ</li>
                <li>Chúng tôi sẽ liên hệ xác nhận trong 24 giờ</li>
                <li>Nếu cần dời lịch, vui lòng thông báo trước 1 ngày</li>
              </ul>
            </div>

            ${manageUrl ? `
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center;">
              <h4 style="color: #1e40af; margin: 0 0 15px 0;">📋 Quản lý lịch đặt của bạn</h4>
              <p style="color: #3b82f6; font-size: 14px; margin-bottom: 15px;">
                Bạn có thể xem, dời lịch hoặc hủy lịch đặt bất kỳ lúc nào:
              </p>
              <a href="${manageUrl}" 
                 style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Quản lý lịch đặt
              </a>
              <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">
                Lưu ý: Chỉ có thể hủy lịch trước 24 giờ
              </p>
            </div>
            ` : ''}

            <p style="color: #4b5563; font-size: 14px;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline: <strong>037.213.0010</strong></p>
            
            <p style="color: #4b5563; margin-top: 30px;">Trân trọng,<br><strong>SnapPup Studio Team</strong></p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">© 2024 SnapPup Studio. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log("Customer email sent successfully:", customerEmailResponse);

    // Send notification email to admin with full form details
    const adminEmailResponse = await resend.emails.send({
      from: "SnapPup Studio <noreply@snappup.vn>",
      to: [adminEmail],
      subject: `🔔 Đặt lịch mới: ${customerName} - ${categoryName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #10b981; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">📅 Lịch Đặt Mới</h1>
          </div>
          
          <div style="padding: 30px;">
            <p style="color: #4b5563; font-size: 16px;">Có một đặt lịch mới từ khách hàng. Chi tiết như sau:</p>
            
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">👤 Thông tin khách hàng</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; width: 140px; border-bottom: 1px solid #e5e7eb;">Họ và tên:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${escapeHtml(customerName)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Email:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb;">
                    <a href="mailto:${escapeHtml(customerEmail)}" style="color: #3b82f6;">${escapeHtml(customerEmail)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Số điện thoại:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb;">
                    <a href="tel:${escapeHtml(customerPhone)}" style="color: #3b82f6;">${escapeHtml(customerPhone)}</a>
                  </td>
                </tr>
              </table>
            </div>

            <div style="background-color: #eff6ff; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">📸 Chi tiết đặt lịch</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; width: 140px; border-bottom: 1px solid #dbeafe;">Hạng mục:</td>
                  <td style="padding: 10px 0; color: #3b82f6; font-weight: 700; font-size: 18px; border-bottom: 1px solid #dbeafe;">${escapeHtml(categoryName)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #dbeafe;">Ngày chụp:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #dbeafe;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #dbeafe;">Giờ chụp:</td>
                  <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #dbeafe;">${escapeHtml(time)}</td>
                </tr>
                ${notes ? `
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; vertical-align: top;">Ghi chú:</td>
                  <td style="padding: 10px 0; color: #1f2937; background-color: #fef9c3; padding: 10px; border-radius: 6px;">${escapeHtml(notes)}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px;">Vui lòng liên hệ khách hàng để xác nhận lịch đặt.</p>
            </div>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">Email này được gửi tự động từ hệ thống SnapPup Studio</p>
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
