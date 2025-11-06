import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, User } from "lucide-react";

export const AdminReplies = () => {
  const { data: replies = [] } = useQuery({
    queryKey: ["adminReplies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_replies")
        .select("*")
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const bookingReplies = replies.filter(r => r.reference_type === 'booking');
  const contactReplies = replies.filter(r => r.reference_type === 'contact');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Lịch sử phản hồi - Lịch đặt</h3>
        <div className="space-y-3">
          {bookingReplies.length === 0 ? (
            <p className="text-muted-foreground text-sm">Chưa có phản hồi nào</p>
          ) : (
            bookingReplies.map((reply: any) => (
              <Card key={reply.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {reply.subject}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Gửi đến: {reply.recipient_email}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(reply.sent_at).toLocaleDateString('vi-VN')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(reply.sent_at).toLocaleString('vi-VN')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Lịch sử phản hồi - Liên hệ</h3>
        <div className="space-y-3">
          {contactReplies.length === 0 ? (
            <p className="text-muted-foreground text-sm">Chưa có phản hồi nào</p>
          ) : (
            contactReplies.map((reply: any) => (
              <Card key={reply.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {reply.subject}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Gửi đến: {reply.recipient_email}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(reply.sent_at).toLocaleDateString('vi-VN')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(reply.sent_at).toLocaleString('vi-VN')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
