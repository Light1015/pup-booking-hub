import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Mail, Upload, Plus, Edit, LogOut, Eye } from "lucide-react";
import { BookingCalendar } from "@/components/BookingCalendar";
import { AdminReplies } from "@/components/AdminReplies";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const Dashboard = () => {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [uploadData, setUploadData] = useState({ title: "", category: "", url: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [newService, setNewService] = useState({ 
    title: "", 
    price: "", 
    description: "", 
    image_url: "", 
    features: "",
    info_title_1: "",
    info_content_1: "",
    info_title_2: "",
    info_content_2: "",
    info_title_3: "",
    info_content_3: "",
    package_1_name: "GÓI CÁ NHÂN",
    package_1_price: "400K",
    package_1_features: "Chụp trọn gói cho một người, Tư vấn trang phục và makeup, Chọn phông nền theo yêu cầu, Chụp nhiều pose khác nhau, Giao ảnh trong 48h",
    package_2_name: "GÓI NHÓM",
    package_2_price: "100K",
    package_2_features: "Áp dụng từ 5 người trở lên, Tư vấn trang phục chung cho cả nhóm, Đồng giá chỉ 100k/người, Chụp riêng từng người theo style nhất quán, Tặng ảnh chung cho cả nhóm"
  });
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyData, setReplyData] = useState<{ type: 'booking' | 'contact'; data: any; message: string }>({ type: 'booking', data: null, message: '' });
  const [newCategory, setNewCategory] = useState({ name: "", label: "", image_urls: [] as string[] });
  const [adminEmail, setAdminEmail] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");
  const [contactStatusFilter, setContactStatusFilter] = useState<string>("all");
  
  // Album states
  const [newAlbum, setNewAlbum] = useState({ name: "", description: "", category_id: "", image_urls: [] as string[] });
  const [editingAlbum, setEditingAlbum] = useState<any | null>(null);
  
  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isLoading: boolean;
    variant?: "default" | "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    isLoading: false,
  });

  // Fetch admin email
  const { data: siteConfig } = useQuery({
    queryKey: ["siteConfig"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_config")
        .select("*")
        .eq("key", "admin_email")
        .single();
      if (error) throw error;
      setAdminEmail(data.value);
      return data;
    },
  });

  // Update admin email
  const updateAdminEmail = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase
        .from("site_config")
        .update({ value: email })
        .eq("key", "admin_email");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteConfig"] });
      toast.success("Đã cập nhật email admin!");
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  // Fetch data
  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: gallery = [] } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch albums
  const { data: albums = [] } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const { data, error } = await supabase.from("photo_albums").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  // Delete mutations
  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Đã xóa lịch đặt");
      setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Đã xóa liên hệ");
      setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    },
  });

  const deleteImage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Đã xóa ảnh");
      setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Đã xóa dịch vụ");
      setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Đã xóa danh mục");
      setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    },
  });

  // Album mutations
  const addAlbum = useMutation({
    mutationFn: async (album: any) => {
      const { error } = await supabase.from("photo_albums").insert([album]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Đã thêm bộ ảnh!");
      setNewAlbum({ name: "", description: "", category_id: "", image_urls: [] });
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const updateAlbum = useMutation({
    mutationFn: async ({ id, ...album }: any) => {
      const { error } = await supabase.from("photo_albums").update(album).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Đã cập nhật bộ ảnh!");
      setEditingAlbum(null);
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const deleteAlbum = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("photo_albums").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      toast.success("Đã xóa bộ ảnh");
      setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    },
  });

  // Upload image mutation
  const uploadImage = useMutation({
    mutationFn: async ({ url, title, category }: { url: string; title: string; category: string }) => {
      const { error } = await supabase
        .from("gallery_images")
        .insert([{ image_url: url, title, category }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Đã thêm ảnh!");
      setUploadData({ title: "", category: "", url: "" });
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const handleImageUpload = async () => {
    if (!uploadData.title || !uploadData.category) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setUploadingImage(true);
    try {
      if (uploadType === "file" && selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("gallery")
          .getPublicUrl(fileName);

        await uploadImage.mutateAsync({ url: publicUrl, title: uploadData.title, category: uploadData.category });
      } else if (uploadType === "url" && uploadData.url) {
        await uploadImage.mutateAsync({ url: uploadData.url, title: uploadData.title, category: uploadData.category });
      }
    } catch (error: any) {
      toast.error("Lỗi upload: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Service mutations
  const addService = useMutation({
    mutationFn: async (service: any) => {
      const { error } = await supabase.from("services").insert([{
        ...service,
        features: service.features.split(",").map((f: string) => f.trim()),
        package_1_features: service.package_1_features.split(",").map((f: string) => f.trim()),
        package_2_features: service.package_2_features.split(",").map((f: string) => f.trim()),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Đã thêm dịch vụ!");
      setNewService({ 
        title: "", price: "", description: "", image_url: "", features: "",
        info_title_1: "", info_content_1: "", info_title_2: "", info_content_2: "", info_title_3: "", info_content_3: "",
        package_1_name: "GÓI CÁ NHÂN", package_1_price: "400K", package_1_features: "",
        package_2_name: "GÓI NHÓM", package_2_price: "100K", package_2_features: ""
      });
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...service }: any) => {
      const updateData: any = { ...service };
      if (typeof service.features === "string") {
        updateData.features = service.features.split(",").map((f: string) => f.trim());
      }
      if (typeof service.package_1_features === "string") {
        updateData.package_1_features = service.package_1_features.split(",").map((f: string) => f.trim());
      }
      if (typeof service.package_2_features === "string") {
        updateData.package_2_features = service.package_2_features.split(",").map((f: string) => f.trim());
      }
      const { error } = await supabase.from("services").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Đã cập nhật dịch vụ!");
      setEditingService(null);
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async ({ type, id }: { type: 'booking' | 'contact'; id: string }) => {
      const table = type === 'booking' ? 'bookings' : 'contacts';
      const { error } = await supabase.from(table).update({ read_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Đã đánh dấu đã đọc");
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  // Send email to customer from booking
  const sendBookingEmail = useMutation({
    mutationFn: async ({ booking, replyMessage }: { booking: any; replyMessage: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.functions.invoke("send-customer-reply", {
        body: {
          customerEmail: booking.email,
          customerName: booking.name,
          subject: "Phản hồi về lịch đặt chụp ảnh",
          message: replyMessage,
        },
      });
      if (error) throw error;

      await supabase.from("admin_replies").insert([{
        reference_type: 'booking',
        reference_id: booking.id,
        recipient_email: booking.email,
        subject: "Phản hồi về lịch đặt chụp ảnh",
        message: replyMessage,
        sent_by: user?.id
      }]);

      await supabase.from("bookings").update({ 
        replied_at: new Date().toISOString(),
        read_at: booking.read_at || new Date().toISOString()
      }).eq('id', booking.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["adminReplies"] });
      toast.success("Gửi email thành công!");
    },
    onError: (error: any) => {
      toast.error("Gửi email thất bại: " + error.message);
    },
  });

  // Send email to customer from contact
  const sendContactReply = useMutation({
    mutationFn: async ({ contact, replyMessage }: { contact: any; replyMessage: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.functions.invoke("send-customer-reply", {
        body: {
          customerEmail: contact.email,
          customerName: contact.name,
          subject: "Phản hồi liên hệ từ SnapPup Studio",
          message: replyMessage,
        },
      });
      if (error) throw error;

      await supabase.from("admin_replies").insert([{
        reference_type: 'contact',
        reference_id: contact.id,
        recipient_email: contact.email,
        subject: "Phản hồi liên hệ từ SnapPup Studio",
        message: replyMessage,
        sent_by: user?.id
      }]);

      await supabase.from("contacts").update({ 
        replied_at: new Date().toISOString(),
        read_at: contact.read_at || new Date().toISOString()
      }).eq('id', contact.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["adminReplies"] });
      toast.success("Gửi email thành công!");
    },
    onError: (error: any) => {
      toast.error("Gửi email thất bại: " + error.message);
    },
  });

  // Category mutations
  const addCategory = useMutation({
    mutationFn: async (category: any) => {
      const { error } = await supabase.from("gallery_categories").insert([category]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Đã thêm danh mục!");
      setNewCategory({ name: "", label: "", image_urls: [] });
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...category }: any) => {
      const { error } = await supabase.from("gallery_categories").update(category).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Đã cập nhật danh mục!");
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  // Helper to show confirm dialog
  const showConfirmDialog = (title: string, description: string, onConfirm: () => void, variant: "default" | "destructive" = "default") => {
    setConfirmDialog({
      open: true,
      title,
      description,
      onConfirm,
      isLoading: false,
      variant,
    });
  };

  const handleConfirmAction = () => {
    setConfirmDialog(prev => ({ ...prev, isLoading: true }));
    confirmDialog.onConfirm();
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Tổng quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader><CardTitle>Lịch đặt</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{bookings.length}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Liên hệ</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{contacts.length}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Thư viện</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{gallery.length}</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Dịch vụ</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{services.length}</p></CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Lịch đặt mới nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bookings.slice(0, 5).map((booking: any) => (
                    <div key={booking.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{booking.name}</p>
                        <p className="text-sm text-muted-foreground">{booking.pet_name} - {new Date(booking.booking_date).toLocaleDateString('vi-VN')}</p>
                      </div>
                      {!booking.read_at && <Badge>Mới</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "bookings":
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Quản lý lịch đặt</CardTitle>
                  <CardDescription>Danh sách các lịch đặt chụp ảnh</CardDescription>
                </div>
                <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="unread">Chưa đọc</SelectItem>
                    <SelectItem value="read">Đã đọc</SelectItem>
                    <SelectItem value="replied">Đã phản hồi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings
                  .filter((booking: any) => {
                    if (bookingStatusFilter === 'unread') return !booking.read_at;
                    if (bookingStatusFilter === 'read') return booking.read_at && !booking.replied_at;
                    if (bookingStatusFilter === 'replied') return booking.replied_at;
                    return true;
                  })
                  .map((booking: any) => (
                  <Card key={booking.id} className={!booking.read_at ? 'border-primary' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2">
                          {!booking.read_at && <Badge variant="default">Chưa đọc</Badge>}
                          {booking.read_at && !booking.replied_at && <Badge variant="secondary">Đã đọc</Badge>}
                          {booking.replied_at && <Badge variant="outline">Đã phản hồi</Badge>}
                          {booking.status === 'confirmed' && <Badge className="bg-green-600">Đã xác nhận</Badge>}
                          {booking.status === 'cancelled' && <Badge variant="destructive">Đã hủy</Badge>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p><strong>Tên:</strong> {booking.name}</p>
                          <p><strong>Email:</strong> {booking.email}</p>
                          <p><strong>SĐT:</strong> {booking.phone}</p>
                        </div>
                        <div>
                          <p><strong>Hạng mục:</strong> {booking.pet_name}</p>
                          <p><strong>Ngày:</strong> {new Date(booking.booking_date).toLocaleDateString('vi-VN')}</p>
                          <p><strong>Giờ:</strong> {booking.booking_time}</p>
                        </div>
                      </div>
                      {booking.notes && <p className="mt-4"><strong>Ghi chú:</strong> {booking.notes}</p>}
                      <div className="flex gap-2 mt-4">
                        {!booking.read_at && (
                          <Button size="sm" variant="outline" onClick={() => markAsRead.mutate({ type: 'booking', id: booking.id })}>
                            <Eye className="w-4 h-4 mr-2" />Đánh dấu đã đọc
                          </Button>
                        )}
                        <Button size="sm" onClick={() => { setReplyData({ type: 'booking', data: booking, message: '' }); setReplyDialogOpen(true); }}>
                          <Mail className="w-4 h-4 mr-2" />Gửi mail
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => showConfirmDialog("Xóa lịch đặt", `Bạn có chắc muốn xóa lịch đặt của ${booking.name}?`, () => deleteBooking.mutate(booking.id), "destructive")}>
                          <Trash2 className="w-4 h-4 mr-2" />Xóa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "calendar":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Quản lý lịch</CardTitle>
              <CardDescription>Xem và tạo lịch đặt mới, ngăn chặn đặt trùng</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingCalendar bookings={bookings} />
            </CardContent>
          </Card>
        );

      case "contacts":
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Quản lý liên hệ</CardTitle>
                  <CardDescription>Danh sách tin nhắn liên hệ</CardDescription>
                </div>
                <Select value={contactStatusFilter} onValueChange={setContactStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="unread">Chưa đọc</SelectItem>
                    <SelectItem value="read">Đã đọc</SelectItem>
                    <SelectItem value="replied">Đã phản hồi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contacts
                  .filter((contact: any) => {
                    if (contactStatusFilter === 'unread') return !contact.read_at;
                    if (contactStatusFilter === 'read') return contact.read_at && !contact.replied_at;
                    if (contactStatusFilter === 'replied') return contact.replied_at;
                    return true;
                  })
                  .map((contact: any) => (
                  <Card key={contact.id} className={!contact.read_at ? 'border-primary' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex gap-2 mb-4">
                        {!contact.read_at && <Badge variant="default">Chưa đọc</Badge>}
                        {contact.read_at && !contact.replied_at && <Badge variant="secondary">Đã đọc</Badge>}
                        {contact.replied_at && <Badge variant="outline">Đã phản hồi</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p><strong>Tên:</strong> {contact.name}</p>
                          <p><strong>Email:</strong> {contact.email}</p>
                          <p><strong>SĐT:</strong> {contact.phone}</p>
                        </div>
                        <div>
                          <p><strong>Tin nhắn:</strong> {contact.message}</p>
                          <p><strong>Ngày:</strong> {new Date(contact.created_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        {!contact.read_at && (
                          <Button size="sm" variant="outline" onClick={() => markAsRead.mutate({ type: 'contact', id: contact.id })}>
                            <Eye className="w-4 h-4 mr-2" />Đánh dấu đã đọc
                          </Button>
                        )}
                        <Button size="sm" onClick={() => { setReplyData({ type: 'contact', data: contact, message: '' }); setReplyDialogOpen(true); }}>
                          <Mail className="w-4 h-4 mr-2" />Gửi mail
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => showConfirmDialog("Xóa liên hệ", `Bạn có chắc muốn xóa liên hệ của ${contact.name}?`, () => deleteContact.mutate(contact.id), "destructive")}>
                          <Trash2 className="w-4 h-4 mr-2" />Xóa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "replies":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử phản hồi</CardTitle>
              <CardDescription>Tất cả tin nhắn đã gửi cho khách hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminReplies />
            </CardContent>
          </Card>
        );

      case "gallery":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Quản lý thư viện ảnh</CardTitle>
              <CardDescription>Upload và quản lý ảnh</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-6 border rounded-lg space-y-4">
                <div className="flex gap-4">
                  <Button variant={uploadType === "file" ? "default" : "outline"} onClick={() => setUploadType("file")}>Tải từ máy</Button>
                  <Button variant={uploadType === "url" ? "default" : "outline"} onClick={() => setUploadType("url")}>Nhập URL</Button>
                </div>
                <div>
                  <Label>Tiêu đề</Label>
                  <Input value={uploadData.title} onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })} placeholder="Nhập tiêu đề ảnh" />
                </div>
                <div>
                  <Label>Danh mục</Label>
                  <Select value={uploadData.category} onValueChange={(value) => setUploadData({ ...uploadData, category: value })}>
                    <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => <SelectItem key={cat.name} value={cat.name}>{cat.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {uploadType === "file" ? (
                  <div><Label>Chọn ảnh</Label><Input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} /></div>
                ) : (
                  <div><Label>URL ảnh</Label><Input value={uploadData.url} onChange={(e) => setUploadData({ ...uploadData, url: e.target.value })} placeholder="https://example.com/image.jpg" /></div>
                )}
                <Button onClick={handleImageUpload} disabled={uploadingImage} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />{uploadingImage ? "Đang tải..." : "Thêm ảnh"}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {gallery.map((image: any) => (
                  <Card key={image.id}>
                    <CardContent className="p-4">
                      <img src={image.image_url} alt={image.title} className="w-full h-40 object-cover rounded-lg mb-2" />
                      <p className="font-semibold">{image.title}</p>
                      <p className="text-sm text-muted-foreground">{image.category}</p>
                      <Button size="sm" variant="destructive" className="w-full mt-2" onClick={() => showConfirmDialog("Xóa ảnh", `Bạn có chắc muốn xóa ảnh "${image.title}"?`, () => deleteImage.mutate(image.id), "destructive")}>
                        <Trash2 className="w-4 h-4 mr-2" />Xóa
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "services":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Quản lý dịch vụ</CardTitle>
              <CardDescription>Thêm và chỉnh sửa dịch vụ với thông tin chi tiết</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">Thêm dịch vụ mới</h3>
                <div className="grid gap-4">
                  <Input placeholder="Tiêu đề" value={newService.title} onChange={(e) => setNewService({ ...newService, title: e.target.value })} />
                  <Input placeholder="Giá" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} />
                  <Textarea placeholder="Mô tả" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
                  <Input placeholder="URL ảnh" value={newService.image_url} onChange={(e) => setNewService({ ...newService, image_url: e.target.value })} />
                  <Textarea placeholder="Tính năng (cách nhau bởi dấu phẩy)" value={newService.features} onChange={(e) => setNewService({ ...newService, features: e.target.value })} />
                  <h4 className="font-semibold mt-4">Thông tin chi tiết</h4>
                  <Input placeholder="Tiêu đề 1" value={newService.info_title_1} onChange={(e) => setNewService({ ...newService, info_title_1: e.target.value })} />
                  <Textarea placeholder="Nội dung 1" value={newService.info_content_1} onChange={(e) => setNewService({ ...newService, info_content_1: e.target.value })} />
                  <Input placeholder="Tiêu đề 2" value={newService.info_title_2} onChange={(e) => setNewService({ ...newService, info_title_2: e.target.value })} />
                  <Textarea placeholder="Nội dung 2" value={newService.info_content_2} onChange={(e) => setNewService({ ...newService, info_content_2: e.target.value })} />
                  <Input placeholder="Tiêu đề 3" value={newService.info_title_3} onChange={(e) => setNewService({ ...newService, info_title_3: e.target.value })} />
                  <Textarea placeholder="Nội dung 3" value={newService.info_content_3} onChange={(e) => setNewService({ ...newService, info_content_3: e.target.value })} />
                  <h4 className="font-semibold mt-4">Gói 1</h4>
                  <Input placeholder="Tên gói 1" value={newService.package_1_name} onChange={(e) => setNewService({ ...newService, package_1_name: e.target.value })} />
                  <Input placeholder="Giá gói 1" value={newService.package_1_price} onChange={(e) => setNewService({ ...newService, package_1_price: e.target.value })} />
                  <Textarea placeholder="Tính năng gói 1" value={newService.package_1_features} onChange={(e) => setNewService({ ...newService, package_1_features: e.target.value })} />
                  <h4 className="font-semibold mt-4">Gói 2</h4>
                  <Input placeholder="Tên gói 2" value={newService.package_2_name} onChange={(e) => setNewService({ ...newService, package_2_name: e.target.value })} />
                  <Input placeholder="Giá gói 2" value={newService.package_2_price} onChange={(e) => setNewService({ ...newService, package_2_price: e.target.value })} />
                  <Textarea placeholder="Tính năng gói 2" value={newService.package_2_features} onChange={(e) => setNewService({ ...newService, package_2_features: e.target.value })} />
                  <Button onClick={() => addService.mutate(newService)}><Plus className="w-4 h-4 mr-2" />Thêm dịch vụ</Button>
                </div>
              </div>
              <div className="space-y-4">
                {services.map((service: any) => (
                  <Card key={service.id}>
                    <CardContent className="pt-6">
                      {editingService?.id === service.id ? (
                        <div className="grid gap-4">
                          <Input value={editingService.title} onChange={(e) => setEditingService({ ...editingService, title: e.target.value })} />
                          <Input value={editingService.price} onChange={(e) => setEditingService({ ...editingService, price: e.target.value })} />
                          <Textarea value={editingService.description} onChange={(e) => setEditingService({ ...editingService, description: e.target.value })} />
                          <Input value={editingService.image_url} onChange={(e) => setEditingService({ ...editingService, image_url: e.target.value })} />
                          <Textarea value={Array.isArray(editingService.features) ? editingService.features.join(", ") : editingService.features} onChange={(e) => setEditingService({ ...editingService, features: e.target.value })} />
                          <div className="flex gap-2">
                            <Button onClick={() => updateService.mutate(editingService)}>Lưu</Button>
                            <Button variant="outline" onClick={() => setEditingService(null)}>Hủy</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold text-lg">{service.title}</h3>
                          <p className="text-primary font-bold">{service.price}</p>
                          <p className="text-muted-foreground mt-2">{service.description}</p>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" onClick={() => setEditingService(service)}><Edit className="w-4 h-4 mr-2" />Sửa</Button>
                            <Button size="sm" variant="destructive" onClick={() => showConfirmDialog("Xóa dịch vụ", `Bạn có chắc muốn xóa dịch vụ "${service.title}"?`, () => deleteService.mutate(service.id), "destructive")}>
                              <Trash2 className="w-4 h-4 mr-2" />Xóa
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "categories":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Quản lý danh mục</CardTitle>
              <CardDescription>Thêm và chỉnh sửa danh mục ảnh với ảnh đại diện</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">Thêm danh mục mới</h3>
                <div className="grid gap-4">
                  <div><Label>Tên (key)</Label><Input placeholder="dog, cat, other..." value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} /></div>
                  <div><Label>Nhãn hiển thị</Label><Input placeholder="Chó, Mèo..." value={newCategory.label} onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })} /></div>
                  <div>
                    <Label>Chọn ảnh từ thư viện (có thể chọn nhiều)</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                      {gallery.map((img: any) => (
                        <div key={img.id} className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${newCategory.image_urls.includes(img.image_url) ? 'border-primary' : 'border-transparent'}`}
                          onClick={() => {
                            const urls = newCategory.image_urls.includes(img.image_url) ? newCategory.image_urls.filter(url => url !== img.image_url) : [...newCategory.image_urls, img.image_url];
                            setNewCategory({ ...newCategory, image_urls: urls });
                          }}>
                          <img src={img.image_url} alt={img.title} className="w-full h-20 object-cover" />
                          <p className="text-xs p-1 bg-background/80 absolute bottom-0 left-0 right-0">{img.title}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Đã chọn: {newCategory.image_urls.length} ảnh</p>
                  </div>
                  <Button onClick={() => addCategory.mutate(newCategory)}><Plus className="w-4 h-4 mr-2" />Thêm danh mục</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {categories.map((category: any) => (
                  <Card key={category.id}>
                    <CardContent className="pt-6">
                      {editingCategory?.id === category.id ? (
                        <div className="grid gap-4">
                          <Input value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                          <Input value={editingCategory.label} onChange={(e) => setEditingCategory({ ...editingCategory, label: e.target.value })} />
                          <div className="flex gap-2">
                            <Button onClick={() => updateCategory.mutate(editingCategory)}>Lưu</Button>
                            <Button variant="outline" onClick={() => setEditingCategory(null)}>Hủy</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {(category.image_urls || (category.image_url ? [category.image_url] : [])).length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {(category.image_urls || [category.image_url]).slice(0, 4).map((url: string, idx: number) => (
                                <img key={idx} src={url} alt={`${category.label} ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                              ))}
                            </div>
                          )}
                          <h3 className="font-semibold">{category.label}</h3>
                          <p className="text-sm text-muted-foreground">{category.name}</p>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" onClick={() => setEditingCategory(category)}><Edit className="w-4 h-4 mr-2" />Sửa</Button>
                            <Button size="sm" variant="destructive" onClick={() => showConfirmDialog("Xóa danh mục", `Bạn có chắc muốn xóa danh mục "${category.label}"?`, () => deleteCategory.mutate(category.id), "destructive")}>
                              <Trash2 className="w-4 h-4 mr-2" />Xóa
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "albums":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Quản lý bộ ảnh</CardTitle>
              <CardDescription>Thêm và chỉnh sửa bộ ảnh trong từng danh mục</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">Thêm bộ ảnh mới</h3>
                <div className="grid gap-4">
                  <div><Label>Tên bộ ảnh</Label><Input placeholder="VD: Bộ ảnh gia đình..." value={newAlbum.name} onChange={(e) => setNewAlbum({ ...newAlbum, name: e.target.value })} /></div>
                  <div><Label>Mô tả</Label><Textarea placeholder="Mô tả bộ ảnh..." value={newAlbum.description} onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })} /></div>
                  <div>
                    <Label>Danh mục</Label>
                    <Select value={newAlbum.category_id} onValueChange={(value) => setNewAlbum({ ...newAlbum, category_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat: any) => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Chọn ảnh từ thư viện</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                      {gallery.map((img: any) => (
                        <div key={img.id} className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${newAlbum.image_urls.includes(img.image_url) ? 'border-primary' : 'border-transparent'}`}
                          onClick={() => {
                            const urls = newAlbum.image_urls.includes(img.image_url) ? newAlbum.image_urls.filter(url => url !== img.image_url) : [...newAlbum.image_urls, img.image_url];
                            setNewAlbum({ ...newAlbum, image_urls: urls });
                          }}>
                          <img src={img.image_url} alt={img.title} className="w-full h-16 object-cover" />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Đã chọn: {newAlbum.image_urls.length} ảnh</p>
                  </div>
                  <Button onClick={() => addAlbum.mutate(newAlbum)}><Plus className="w-4 h-4 mr-2" />Thêm bộ ảnh</Button>
                </div>
              </div>
              <div className="space-y-4">
                {albums.map((album: any) => {
                  const category = categories.find((c: any) => c.id === album.category_id);
                  return (
                    <Card key={album.id}>
                      <CardContent className="pt-6">
                        {editingAlbum?.id === album.id ? (
                          <div className="grid gap-4">
                            <Input value={editingAlbum.name} onChange={(e) => setEditingAlbum({ ...editingAlbum, name: e.target.value })} placeholder="Tên bộ ảnh" />
                            <Textarea value={editingAlbum.description || ""} onChange={(e) => setEditingAlbum({ ...editingAlbum, description: e.target.value })} placeholder="Mô tả" />
                            <Select value={editingAlbum.category_id || ""} onValueChange={(value) => setEditingAlbum({ ...editingAlbum, category_id: value })}>
                              <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                              <SelectContent>
                                {categories.map((cat: any) => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <div>
                              <Label>Chọn ảnh</Label>
                              <div className="grid grid-cols-4 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                                {gallery.map((img: any) => (
                                  <div key={img.id} className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${(editingAlbum.image_urls || []).includes(img.image_url) ? 'border-primary' : 'border-transparent'}`}
                                    onClick={() => {
                                      const urls = (editingAlbum.image_urls || []).includes(img.image_url) 
                                        ? (editingAlbum.image_urls || []).filter((url: string) => url !== img.image_url) 
                                        : [...(editingAlbum.image_urls || []), img.image_url];
                                      setEditingAlbum({ ...editingAlbum, image_urls: urls });
                                    }}>
                                    <img src={img.image_url} alt={img.title} className="w-full h-12 object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => updateAlbum.mutate(editingAlbum)}>Lưu</Button>
                              <Button variant="outline" onClick={() => setEditingAlbum(null)}>Hủy</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{album.name}</h3>
                                <p className="text-sm text-muted-foreground">Danh mục: {category?.label || "Không xác định"}</p>
                                {album.description && <p className="text-sm mt-2">{album.description}</p>}
                              </div>
                              <Badge>{(album.image_urls || []).length} ảnh</Badge>
                            </div>
                            {(album.image_urls || []).length > 0 && (
                              <div className="grid grid-cols-4 gap-2 mb-4">
                                {(album.image_urls || []).slice(0, 8).map((url: string, idx: number) => (
                                  <img key={idx} src={url} alt={`${album.name} ${idx + 1}`} className="w-full h-16 object-cover rounded-lg" />
                                ))}
                                {(album.image_urls || []).length > 8 && (
                                  <div className="w-full h-16 bg-muted rounded-lg flex items-center justify-center text-sm">+{(album.image_urls || []).length - 8} ảnh</div>
                                )}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => setEditingAlbum(album)}><Edit className="w-4 h-4 mr-2" />Sửa</Button>
                              <Button size="sm" variant="destructive" onClick={() => showConfirmDialog("Xóa bộ ảnh", `Bạn có chắc muốn xóa bộ ảnh "${album.name}"?`, () => deleteAlbum.mutate(album.id), "destructive")}>
                                <Trash2 className="w-4 h-4 mr-2" />Xóa
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

      case "settings":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt</CardTitle>
              <CardDescription>Cấu hình hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label>Email admin nhận thông báo</Label>
                  <div className="flex gap-4 mt-2">
                    <Input type="email" placeholder="admin@example.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                    <Button onClick={() => updateAdminEmail.mutate(adminEmail)}>Lưu</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1">
        <header className="h-16 border-b flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <Button onClick={signOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />Đăng xuất
          </Button>
        </header>
        
        <main className="p-6">
          {renderContent()}
        </main>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gửi email phản hồi</DialogTitle>
            <DialogDescription>Gửi đến: {replyData.data?.email} ({replyData.data?.name})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tin nhắn</Label>
              <Textarea rows={8} placeholder="Nhập nội dung email..." value={replyData.message} onChange={(e) => setReplyData({ ...replyData, message: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Hủy</Button>
              <Button
                disabled={sendBookingEmail.isPending || sendContactReply.isPending}
                onClick={() => {
                  if (replyData.type === 'booking') {
                    sendBookingEmail.mutate({ booking: replyData.data, replyMessage: replyData.message });
                  } else {
                    sendContactReply.mutate({ contact: replyData.data, replyMessage: replyData.message });
                  }
                  setReplyDialogOpen(false);
                  setReplyData({ type: 'booking', data: null, message: '' });
                }}
              >
                <Mail className="w-4 h-4 mr-2" />Gửi email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={handleConfirmAction}
        isLoading={confirmDialog.isLoading}
        variant={confirmDialog.variant}
      />
    </div>
  );
};

export default Dashboard;
