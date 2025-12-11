import { useState } from "react";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import LoadingDialog from "@/components/LoadingDialog";

// Validation schema
const contactSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(100, "Tên quá dài (tối đa 100 ký tự)"),
  email: z.string().email("Email không hợp lệ").max(255, "Email quá dài"),
  phone: z.string().regex(/^[0-9+\-\s()]+$/, "Số điện thoại không hợp lệ").min(8, "Số điện thoại quá ngắn").max(20, "Số điện thoại quá dài"),
  message: z.string().trim().min(1, "Vui lòng nhập tin nhắn").max(1000, "Tin nhắn quá dài (tối đa 1000 ký tự)"),
});

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Insert contact first
      const { error: contactError } = await supabase
        .from("contacts")
        .insert([data]);
      
      if (contactError) throw contactError;

      // Get admin email
      const { data: config } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "admin_email")
        .single();

      const adminEmail = config?.value || "admin@snappup.studio";

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          adminEmail: adminEmail,
        },
      });

      if (emailError) {
        console.error("Email error:", emailError);
        throw new Error("Không gửi được email thông báo");
      }
    },
    onSuccess: () => {
      toast.success("Cảm ơn bạn! Chúng tôi đã nhận được tin nhắn và sẽ liên hệ lại sớm.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    },
    onError: (error: any) => {
      if (error.message.includes("email")) {
        toast.warning("Tin nhắn đã được lưu nhưng không gửi được email thông báo");
      } else {
        toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    try {
      contactSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    
    createContactMutation.mutate(formData);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Điện thoại",
      content: "037.213.0010",
      link: "tel:0372130010",
    },
    {
      icon: Mail,
      title: "Email",
      content: "snappup@gmail.com",
      link: "mailto:snappup@gmail.com",
    },
    {
      icon: MapPin,
      title: "Địa chỉ",
      content: "Hà Nội, Việt Nam",
    },
    {
      icon: Clock,
      title: "Giờ làm việc",
      content: "8:00 - 20:00 (Thứ 2 - Chủ nhật)",
    },
  ];

  return (
    <div className="min-h-screen">
      <LoadingDialog open={createContactMutation.isPending} message="Đang gửi tin nhắn..." />
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-display font-bold mb-4">Liên hệ với chúng tôi</h1>
            <p className="text-xl text-muted-foreground">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Gửi tin nhắn</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ và tên *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Tin nhắn *</Label>
                      <Textarea
                        id="message"
                        required
                        rows={6}
                        placeholder="Để lại tin nhắn cho chúng tôi..."
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={createContactMutation.isPending}
                    >
                      {createContactMutation.isPending ? "Đang gửi..." : "Gửi tin nhắn"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{info.title}</h3>
                        {info.link ? (
                          <a
                            href={info.link}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {info.content}
                          </a>
                        ) : (
                          <p className="text-muted-foreground">{info.content}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Social Media */}
              <Card>
                <CardHeader>
                  <CardTitle>Kết nối với chúng tôi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <a
                      href="#"
                      className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Facebook className="h-6 w-6" />
                    </a>
                    <a
                      href="#"
                      className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Instagram className="h-6 w-6" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Map placeholder */}
              <Card>
                <CardContent className="p-0">
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Bản đồ vị trí studio</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
