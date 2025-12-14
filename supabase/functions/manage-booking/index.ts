import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ManageBookingRequest {
  token: string;
  action: "get" | "cancel" | "reschedule";
  newDate?: string;
  newTime?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, action, newDate, newTime }: ManageBookingRequest = await req.json();

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
