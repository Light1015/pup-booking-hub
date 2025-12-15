import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

async function hmacSha512(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataBuffer = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params: Record<string, string> = {};
    
    for (const [key, value] of url.searchParams) {
      params[key] = value;
    }

    console.log("VNPay callback received:", JSON.stringify(params));

    const hashSecret = Deno.env.get("VNPAY_HASH_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!hashSecret) {
      console.error("Missing VNPay hash secret");
      return new Response("Configuration error", { status: 500 });
    }

    const secureHash = params["vnp_SecureHash"];
    delete params["vnp_SecureHash"];
    delete params["vnp_SecureHashType"];

    const sortedParams = sortObject(params);
    const signData = new URLSearchParams(sortedParams).toString();

    // Verify signature
    const calculatedHash = await hmacSha512(hashSecret, signData);

    const txnRef = params["vnp_TxnRef"];
    const responseCode = params["vnp_ResponseCode"];
    const amount = parseInt(params["vnp_Amount"]) / 100;
    const transactionNo = params["vnp_TransactionNo"];
    const bookingId = txnRef?.split("-")[0];

    console.log(`Processing payment callback: txnRef=${txnRef}, responseCode=${responseCode}, amount=${amount}`);

    if (secureHash.toLowerCase() !== calculatedHash.toLowerCase()) {
      console.error("Invalid signature");
      return new Response(JSON.stringify({ RspCode: "97", Message: "Invalid signature" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find booking by ID prefix match
    const { data: bookings, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .ilike("id", `${bookingId}%`)
      .limit(1);

    if (fetchError || !bookings || bookings.length === 0) {
      console.error("Booking not found:", bookingId, fetchError);
      return new Response(JSON.stringify({ RspCode: "01", Message: "Booking not found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const booking = bookings[0];

    if (responseCode === "00") {
      // Payment successful - update booking status
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ 
          status: "confirmed",
          notes: booking.notes 
            ? `${booking.notes}\n[Đã thanh toán VNPay: ${amount.toLocaleString('vi-VN')}đ - Mã GD: ${transactionNo}]`
            : `[Đã thanh toán VNPay: ${amount.toLocaleString('vi-VN')}đ - Mã GD: ${transactionNo}]`
        })
        .eq("id", booking.id);

      if (updateError) {
        console.error("Error updating booking:", updateError);
      } else {
        console.log(`Booking ${booking.id} confirmed with payment ${transactionNo}`);

        // Send confirmation email
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          try {
            await resend.emails.send({
              from: "SnapPup Studio <no-reply@snapup-booking.id.vn>",
              to: [booking.email],
              subject: "Xác nhận thanh toán thành công - SnapPup Studio",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #2563eb;">Thanh toán thành công!</h1>
                  <p>Xin chào <strong>${booking.name}</strong>,</p>
                  <p>Chúng tôi đã nhận được thanh toán của bạn:</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')}đ</p>
                    <p><strong>Mã giao dịch:</strong> ${transactionNo}</p>
                    <p><strong>Ngày chụp:</strong> ${booking.booking_date}</p>
                    <p><strong>Giờ hẹn:</strong> ${booking.booking_time}</p>
                    <p><strong>Thú cưng:</strong> ${booking.pet_name} (${booking.pet_type})</p>
                  </div>
                  <p>Lịch hẹn của bạn đã được xác nhận. Chúng tôi rất mong được gặp bạn!</p>
                  <p>Trân trọng,<br>SnapPup Studio</p>
                </div>
              `,
            });
            console.log("Payment confirmation email sent to", booking.email);
          } catch (emailError) {
            console.error("Error sending payment confirmation email:", emailError);
          }
        }
      }
    } else {
      console.log(`Payment failed for booking ${booking.id}: responseCode=${responseCode}`);
    }

    // Redirect user back to result page
    const resultUrl = responseCode === "00" 
      ? `${url.origin}/booking?payment=success&txn=${transactionNo}`
      : `${url.origin}/booking?payment=failed&code=${responseCode}`;

    return new Response(null, {
      status: 302,
      headers: { Location: resultUrl },
    });
  } catch (error: any) {
    console.error("Error processing VNPay callback:", error);
    return new Response(JSON.stringify({ RspCode: "99", Message: error.message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};

serve(handler);
