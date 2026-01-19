import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

interface ManageBookingRequest {
  token?: string;
  action: "get" | "cancel" | "reschedule" | "update_payment_proof" | "lookup";
  newDate?: string;
  newTime?: string;
  bookingId?: string;
  paymentProofUrl?: string;
  phone?: string;
  email?: string;
}

// Send notification email to admin
async function sendAdminNotification(
  resend: Resend,
  adminEmail: string,
  action: "cancel" | "reschedule",
  booking: any,
  newDate?: string,
  newTime?: string
) {
  const actionText = action === "cancel" ? "HỦY LỊCH" : "DỜI LỊCH";
  const subject = `[SNAPPUP] Khách hàng ${actionText} - ${escapeHtml(booking.name)}`;
  
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">🐾 Thông báo ${actionText}</h2>
      <p>Khách hàng <strong>${escapeHtml(booking.name)}</strong> đã ${action === "cancel" ? "hủy" : "dời"} lịch chụp ảnh.</p>
      
      <h3>Thông tin lịch hẹn ban đầu:</h3>
      <ul>
        <li><strong>Khách hàng:</strong> ${escapeHtml(booking.name)}</li>
        <li><strong>Email:</strong> ${escapeHtml(booking.email)}</li>
        <li><strong>Điện thoại:</strong> ${escapeHtml(booking.phone)}</li>
        <li><strong>Ngày:</strong> ${escapeHtml(booking.booking_date)}</li>
        <li><strong>Giờ:</strong> ${escapeHtml(booking.booking_time)}</li>
        <li><strong>Thú cưng:</strong> ${escapeHtml(booking.pet_name)}</li>
        <li><strong>Gói chụp:</strong> ${escapeHtml(booking.selected_category) || "Chưa chọn"}</li>
      </ul>
  `;
  
  if (action === "reschedule" && newDate && newTime) {
    html += `
      <h3 style="color: #22c55e;">Lịch hẹn mới:</h3>
      <ul>
        <li><strong>Ngày mới:</strong> ${escapeHtml(newDate)}</li>
        <li><strong>Giờ mới:</strong> ${escapeHtml(newTime)}</li>
      </ul>
      <p style="color: #f59e0b;"><em>Vui lòng xác nhận lịch hẹn mới trong hệ thống quản trị.</em></p>
    `;
  }
  
  html += `
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #888; font-size: 12px;">Email này được gửi tự động từ hệ thống SNAPPUP.</p>
    </div>
  `;
  
  try {
    await resend.emails.send({
      from: "SNAPPUP <noreply@snapup-booking.id.vn>",
      to: [adminEmail],
      subject,
      html,
    });
    console.log(`Admin notification sent for ${action} action`);
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    
    // Get admin email
    const { data: configData } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", "admin_email")
      .maybeSingle();
    const adminEmail = configData?.value || "snappupstudio@gmail.com";

    const { token, action, newDate, newTime, bookingId, paymentProofUrl, phone, email }: ManageBookingRequest = await req.json();

    // Handle update_payment_proof action - accepts either token or bookingId
    if (action === "update_payment_proof") {
      if ((!token && !bookingId) || !paymentProofUrl) {
        return new Response(
          JSON.stringify({ error: "Thiếu thông tin cần thiết" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      let targetBookingId: string;

      // If token is provided, find booking by token
      if (token) {
        console.log(`Updating payment proof for booking with token ${token.substring(0, 8)}...`);

        const { data: tokenBooking, error: tokenError } = await supabase
          .from("bookings")
          .select("id")
          .eq("manage_token", token)
          .maybeSingle();

        if (tokenError || !tokenBooking) {
          console.error("Booking not found for payment proof update:", tokenError);
          return new Response(
            JSON.stringify({ error: "Không tìm thấy lịch đặt" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        targetBookingId = tokenBooking.id;
      } else {
        // Use bookingId directly (for new bookings that don't have token yet)
        console.log(`Updating payment proof for booking with id ${bookingId}...`);
        targetBookingId = bookingId!;

        // Verify booking exists
        const { data: existingBooking, error: checkError } = await supabase
          .from("bookings")
          .select("id")
          .eq("id", targetBookingId)
          .maybeSingle();

        if (checkError || !existingBooking) {
          console.error("Booking not found for payment proof update:", checkError);
          return new Response(
            JSON.stringify({ error: "Không tìm thấy lịch đặt" }),
            { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ payment_proof_url: paymentProofUrl })
        .eq("id", targetBookingId);

      if (updateError) {
        console.error("Error updating payment proof:", updateError);
        throw updateError;
      }

      console.log(`Payment proof updated successfully for booking ${targetBookingId}`);

      return new Response(
        JSON.stringify({ message: "Đã cập nhật ảnh xác nhận thanh toán" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Handle lookup action (search by phone/email)
    if (action === "lookup") {
      if (!phone && !email) {
        return new Response(
          JSON.stringify({ error: "Vui lòng nhập số điện thoại hoặc email" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`Looking up bookings for phone: ${phone}, email: ${email}`);

      let query = supabase
        .from("bookings")
        .select("id, name, phone, email, booking_date, booking_time, pet_name, status, payment_proof_url, created_at")
        .order("booking_date", { ascending: false });

      if (phone && email) {
        query = query.or(`phone.eq.${phone},email.eq.${email}`);
      } else if (phone) {
        query = query.eq("phone", phone);
      } else if (email) {
        query = query.eq("email", email);
      }

      const { data: bookings, error: lookupError } = await query.limit(20);

      if (lookupError) {
        console.error("Error looking up bookings:", lookupError);
        throw lookupError;
      }

      console.log(`Found ${bookings?.length || 0} bookings`);

      return new Response(
        JSON.stringify({ bookings: bookings || [] }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Managing booking with action: ${action}, token: ${token.substring(0, 8)}...`);

    // Fetch booking by token
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("manage_token", token)
      .maybeSingle();

    if (fetchError || !booking) {
      console.error("Booking not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Không tìm thấy lịch đặt" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if booking date has passed
    const bookingDate = new Date(booking.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today && action !== "get") {
      return new Response(
        JSON.stringify({ error: "Không thể thay đổi lịch đã qua" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Handle different actions
    switch (action) {
      case "get":
        // Return booking details (sanitized)
        return new Response(
          JSON.stringify({
            booking: {
              id: booking.id,
              name: booking.name,
              email: booking.email,
              phone: booking.phone,
              booking_date: booking.booking_date,
              booking_time: booking.booking_time,
              pet_name: booking.pet_name,
              selected_category: booking.selected_category,
              notes: booking.notes,
              status: booking.status,
              payment_proof_url: booking.payment_proof_url,
              created_at: booking.created_at,
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );

      case "cancel":
        // Check if already cancelled
        if (booking.status === "cancelled") {
          return new Response(
            JSON.stringify({ error: "Lịch này đã được hủy trước đó" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Check if at least 24 hours before booking
        const hoursUntilBooking = (bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60);
        if (hoursUntilBooking < 24) {
          return new Response(
            JSON.stringify({ error: "Chỉ có thể hủy lịch trước 24 giờ" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Cancel the booking
        const { error: cancelError } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", booking.id);

        if (cancelError) {
          console.error("Error cancelling booking:", cancelError);
          throw cancelError;
        }

        console.log(`Booking ${booking.id} cancelled successfully`);
        
        // Send admin notification
        if (resend) {
          await sendAdminNotification(resend, adminEmail, "cancel", booking);
        }

        return new Response(
          JSON.stringify({ message: "Đã hủy lịch thành công", status: "cancelled" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );

      case "reschedule":
        if (!newDate || !newTime) {
          return new Response(
            JSON.stringify({ error: "Vui lòng chọn ngày và giờ mới" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Check if the new slot is available
        const { data: existingBookings, error: checkError } = await supabase
          .from("bookings")
          .select("id")
          .eq("booking_date", newDate)
          .eq("booking_time", newTime)
          .in("status", ["pending", "confirmed"])
          .neq("id", booking.id);

        if (checkError) {
          throw checkError;
        }

        if (existingBookings && existingBookings.length > 0) {
          return new Response(
            JSON.stringify({ error: "Khung giờ này đã có người đặt" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Update the booking
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ 
            booking_date: newDate, 
            booking_time: newTime,
            status: "pending" // Reset to pending for admin to confirm
          })
          .eq("id", booking.id);

        if (updateError) {
          console.error("Error rescheduling booking:", updateError);
          throw updateError;
        }

        console.log(`Booking ${booking.id} rescheduled to ${newDate} ${newTime}`);
        
        // Send admin notification
        if (resend) {
          await sendAdminNotification(resend, adminEmail, "reschedule", booking, newDate, newTime);
        }

        return new Response(
          JSON.stringify({ 
            message: "Đã dời lịch thành công. Vui lòng đợi xác nhận từ studio.", 
            newDate, 
            newTime 
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );

      default:
        return new Response(
          JSON.stringify({ error: "Action không hợp lệ" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }
  } catch (error: any) {
    console.error("Error in manage-booking function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
