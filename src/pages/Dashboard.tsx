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
import { Trash2, Mail, Upload, Plus, Edit, LogOut, Eye, Calendar, MessageSquare, Image, FolderOpen, Bell, Search, Download, FileText, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, Ban } from "lucide-react";
import { BookingCalendar } from "@/components/BookingCalendar";
import { AdminReplies } from "@/components/AdminReplies";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  const [bookingPaymentFilter, setBookingPaymentFilter] = useState<string>("all");
  const [contactStatusFilter, setContactStatusFilter] = useState<string>("all");
  const [bookingSearch, setBookingSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [bookingDateFilter, setBookingDateFilter] = useState<string>("all");
  const [contactDateFilter, setContactDateFilter] = useState<string>("all");
  const [reportPeriod, setReportPeriod] = useState<string>("month");
  
  // Bank config states
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankQrUrl, setBankQrUrl] = useState("");
  
  // Album states
  const [newAlbum, setNewAlbum] = useState({ name: "", description: "", category_id: "", price: "", image_urls: [] as string[] });
  
  // Detail dialog states
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; type: 'booking' | 'contact'; data: any }>({ open: false, type: 'booking', data: null });
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

  // Fetch admin email and bank config
  const { data: siteConfig } = useQuery({
    queryKey: ["siteConfig"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_config")
        .select("*");
      if (error) throw error;
      
      const configMap: Record<string, string> = {};
      data?.forEach((item) => {
        configMap[item.key] = item.value;
      });
      
      setAdminEmail(configMap.admin_email || "");
      setBankAccountName(configMap.bank_account_name || "");
      setBankAccountNumber(configMap.bank_account_number || "");
      setBankName(configMap.bank_name || "");
      setBankQrUrl(configMap.bank_qr_url || "");
      
      return configMap;
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

  // Update bank config
  const updateBankConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data: existing } = await supabase
        .from("site_config")
        .select("id")
        .eq("key", key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("site_config")
          .update({ value })
          .eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_config")
          .insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteConfig"] });
      toast.success("Đã cập nhật thông tin ngân hàng!");
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

  // Cancel booking mutation
  const cancelBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Đã hủy lịch đặt");
      setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    },
  });

  // Confirm booking mutation
  const confirmBookingStatus = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Đã xác nhận lịch đặt");
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
      setNewAlbum({ name: "", description: "", category_id: "", price: "", image_urls: [] });
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
        const unreadBookings = bookings.filter((b: any) => !b.read_at);
        const unreadContacts = contacts.filter((c: any) => !c.read_at);
        
        // Booking status stats
        const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed');
        const pendingBookings = bookings.filter((b: any) => b.status === 'pending');
        const cancelledBookings = bookings.filter((b: any) => b.status === 'cancelled');
        
        // Cancellation rate
        const totalProcessedBookings = confirmedBookings.length + cancelledBookings.length;
        const cancellationRate = totalProcessedBookings > 0 
          ? ((cancelledBookings.length / totalProcessedBookings) * 100).toFixed(1)
          : '0';
        
        // Expected revenue calculation (based on confirmed bookings)
        const AVERAGE_BOOKING_VALUE = 400000; // 400K VND average per booking
        const expectedRevenue = confirmedBookings.length * AVERAGE_BOOKING_VALUE;
        const potentialRevenue = pendingBookings.length * AVERAGE_BOOKING_VALUE;
        
        // This month stats
        const thisMonth = new Date();
        const thisMonthBookings = bookings.filter((b: any) => {
          const bookingDate = new Date(b.booking_date);
          return bookingDate.getMonth() === thisMonth.getMonth() && bookingDate.getFullYear() === thisMonth.getFullYear();
        });
        const thisMonthConfirmed = thisMonthBookings.filter((b: any) => b.status === 'confirmed');
        const thisMonthCancelled = thisMonthBookings.filter((b: any) => b.status === 'cancelled');
        const thisMonthRevenue = thisMonthConfirmed.length * AVERAGE_BOOKING_VALUE;
        
        // Chart data
        const bookingsByCategory = categories.map((cat: any) => ({
          name: cat.label,
          value: bookings.filter((b: any) => b.selected_category === cat.name || b.pet_type === cat.name).length
        })).filter((item: any) => item.value > 0);
        
        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        
        // Monthly bookings for bar chart
        const monthlyData = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - i));
          const monthName = date.toLocaleDateString('vi-VN', { month: 'short' });
          const monthBookings = bookings.filter((b: any) => {
            const bookingDate = new Date(b.created_at);
            return bookingDate.getMonth() === date.getMonth() && bookingDate.getFullYear() === date.getFullYear();
          }).length;
          return { name: monthName, bookings: monthBookings };
        });
        
        // Booking status chart data
        const statusChartData = [
          { name: 'Đã xác nhận', value: confirmedBookings.length, color: '#10b981' },
          { name: 'Chờ xác nhận', value: pendingBookings.length, color: '#f59e0b' },
          { name: 'Đã hủy', value: cancelledBookings.length, color: '#ef4444' },
        ].filter(item => item.value > 0);

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Tổng quan</h2>
            
            {/* Stats Cards - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Tổng lịch đặt</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{bookings.length}</p>
                  <p className="text-xs text-muted-foreground">{unreadBookings.length} chưa đọc</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Đã xác nhận</CardTitle>
                  <Calendar className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{confirmedBookings.length}</p>
                  <p className="text-xs text-muted-foreground">{thisMonthConfirmed.length} tháng này</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Chờ xác nhận</CardTitle>
                  <Calendar className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-600">{pendingBookings.length}</p>
                  <p className="text-xs text-muted-foreground">Cần xử lý</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Tỷ lệ hủy</CardTitle>
                  <Calendar className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{cancellationRate}%</p>
                  <p className="text-xs text-muted-foreground">{cancelledBookings.length} đã hủy / {thisMonthCancelled.length} tháng này</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Stats Cards - Row 2: Revenue */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Doanh thu dự kiến</CardTitle>
                  <span className="text-lg">💰</span>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-600">
                    {new Intl.NumberFormat('vi-VN').format(expectedRevenue)} đ
                  </p>
                  <p className="text-xs text-muted-foreground">Từ {confirmedBookings.length} lịch đã xác nhận</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Doanh thu tiềm năng</CardTitle>
                  <span className="text-lg">📈</span>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-amber-600">
                    {new Intl.NumberFormat('vi-VN').format(potentialRevenue)} đ
                  </p>
                  <p className="text-xs text-muted-foreground">Từ {pendingBookings.length} lịch chờ xác nhận</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
                  <span className="text-lg">📊</span>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-cyan-600">
                    {new Intl.NumberFormat('vi-VN').format(thisMonthRevenue)} đ
                  </p>
                  <p className="text-xs text-muted-foreground">{thisMonthConfirmed.length} lịch đã xác nhận</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Liên hệ</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{contacts.length}</p>
                  <p className="text-xs text-muted-foreground">{unreadContacts.length} chưa đọc</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Thư viện</CardTitle>
                  <Image className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{gallery.length}</p>
                  <p className="text-xs text-muted-foreground">{albums.length} bộ ảnh</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Danh mục</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{categories.length}</p>
                  <p className="text-xs text-muted-foreground">{services.length} dịch vụ</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-pink-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Giá trị TB/đơn</CardTitle>
                  <span className="text-sm">💵</span>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{new Intl.NumberFormat('vi-VN').format(AVERAGE_BOOKING_VALUE)} đ</p>
                  <p className="text-xs text-muted-foreground">Ước tính</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch đặt theo tháng</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Phân bố theo hạng mục</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={bookingsByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {bookingsByCategory.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Chưa có dữ liệu
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <CardTitle>Lịch đặt mới</CardTitle>
                  {unreadBookings.length > 0 && <Badge variant="destructive">{unreadBookings.length}</Badge>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {bookings.slice(0, 10).map((booking: any) => (
                      <div 
                        key={booking.id} 
                        className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${!booking.read_at ? 'bg-blue-50 border-blue-200' : ''}`}
                        onClick={() => setDetailDialog({ open: true, type: 'booking', data: booking })}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{booking.name}</p>
                            {!booking.read_at && <Badge variant="default" className="text-xs">Mới</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {booking.pet_name} - {new Date(booking.booking_date).toLocaleDateString('vi-VN')} {booking.booking_time}
                          </p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                    {bookings.length === 0 && <p className="text-center text-muted-foreground py-4">Chưa có lịch đặt</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Bell className="h-5 w-5 text-green-500" />
                  <CardTitle>Tin nhắn liên hệ</CardTitle>
                  {unreadContacts.length > 0 && <Badge variant="destructive">{unreadContacts.length}</Badge>}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {contacts.slice(0, 10).map((contact: any) => (
                      <div 
                        key={contact.id} 
                        className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${!contact.read_at ? 'bg-green-50 border-green-200' : ''}`}
                        onClick={() => setDetailDialog({ open: true, type: 'contact', data: contact })}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{contact.name}</p>
                            {!contact.read_at && <Badge variant="default" className="text-xs">Mới</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{contact.message}</p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                    {contacts.length === 0 && <p className="text-center text-muted-foreground py-4">Chưa có tin nhắn</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "bookings":
        // Filter bookings
        const filteredBookings = bookings.filter((booking: any) => {
          // Status filter
          if (bookingStatusFilter === 'unread' && booking.read_at) return false;
          if (bookingStatusFilter === 'read' && (!booking.read_at || booking.replied_at)) return false;
          if (bookingStatusFilter === 'replied' && !booking.replied_at) return false;
          
          // Payment/Booking status filter
          if (bookingPaymentFilter === 'pending_payment' && booking.status !== 'pending_payment') return false;
          if (bookingPaymentFilter === 'pending' && booking.status !== 'pending') return false;
          if (bookingPaymentFilter === 'confirmed' && booking.status !== 'confirmed') return false;
          if (bookingPaymentFilter === 'cancelled' && booking.status !== 'cancelled') return false;
          
          // Date filter
          if (bookingDateFilter !== 'all') {
            const bookingDate = new Date(booking.created_at);
            const now = new Date();
            if (bookingDateFilter === 'today') {
              if (bookingDate.toDateString() !== now.toDateString()) return false;
            } else if (bookingDateFilter === 'week') {
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (bookingDate < weekAgo) return false;
            } else if (bookingDateFilter === 'month') {
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              if (bookingDate < monthAgo) return false;
            }
          }
          
          // Search filter
          if (bookingSearch) {
            const search = bookingSearch.toLowerCase();
            return booking.name?.toLowerCase().includes(search) ||
                   booking.email?.toLowerCase().includes(search) ||
                   booking.phone?.includes(search) ||
                   booking.pet_name?.toLowerCase().includes(search);
          }
          return true;
        });

        // Export function
        const exportBookings = () => {
          const headers = ['Tên', 'Email', 'SĐT', 'Hạng mục', 'Ngày chụp', 'Giờ', 'Ghi chú', 'Trạng thái', 'Ngày tạo'];
          const data = filteredBookings.map((b: any) => [
            b.name,
            b.email,
            b.phone,
            b.pet_name,
            new Date(b.booking_date).toLocaleDateString('vi-VN'),
            b.booking_time,
            b.notes || '',
            b.replied_at ? 'Đã phản hồi' : b.read_at ? 'Đã đọc' : 'Chưa đọc',
            new Date(b.created_at).toLocaleDateString('vi-VN')
          ]);
          
          const csvContent = [headers.join(','), ...data.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
          const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `lich-dat_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          toast.success('Đã xuất báo cáo lịch đặt!');
        };

        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Quản lý lịch đặt</CardTitle>
                    <CardDescription>Danh sách các lịch đặt chụp ảnh ({filteredBookings.length} kết quả)</CardDescription>
                  </div>
                  <Button onClick={exportBookings} variant="outline">
                    <Download className="w-4 h-4 mr-2" />Xuất CSV
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Tìm theo tên, email, SĐT, hạng mục..." 
                      value={bookingSearch} 
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="unread">Chưa đọc</SelectItem>
                      <SelectItem value="read">Đã đọc</SelectItem>
                      <SelectItem value="replied">Đã phản hồi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={bookingPaymentFilter} onValueChange={setBookingPaymentFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Thanh toán" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả TT</SelectItem>
                      <SelectItem value="pending_payment">Chờ thanh toán</SelectItem>
                      <SelectItem value="pending">Chờ xác nhận</SelectItem>
                      <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={bookingDateFilter} onValueChange={setBookingDateFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="today">Hôm nay</SelectItem>
                      <SelectItem value="week">7 ngày qua</SelectItem>
                      <SelectItem value="month">30 ngày qua</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Không tìm thấy lịch đặt nào</p>
                  </div>
                ) : filteredBookings.map((booking: any) => (
                  <Card key={booking.id} className={!booking.read_at ? 'border-primary' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-wrap gap-2">
                          {/* Read status badges */}
                          {!booking.read_at && <Badge variant="default">Chưa đọc</Badge>}
                          {booking.read_at && !booking.replied_at && <Badge variant="secondary">Đã đọc</Badge>}
                          {booking.replied_at && <Badge variant="outline">Đã phản hồi</Badge>}
                          
                          {/* Payment/Booking status badges */}
                          {booking.status === 'pending_payment' && (
                            <Badge className="bg-orange-500 hover:bg-orange-600">
                              <CreditCard className="w-3 h-3 mr-1" />Chờ thanh toán
                            </Badge>
                          )}
                          {booking.status === 'pending' && (
                            <Badge className="bg-yellow-500 hover:bg-yellow-600">
                              <Clock className="w-3 h-3 mr-1" />Chờ xác nhận
                            </Badge>
                          )}
                          {booking.status === 'confirmed' && (
                            <Badge className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />Đã xác nhận
                            </Badge>
                          )}
                          {booking.status === 'cancelled' && (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />Đã hủy
                            </Badge>
                          )}
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
                      
                      {/* Payment proof image */}
                      {booking.payment_proof_url && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Ảnh xác nhận chuyển khoản:
                          </p>
                          <a href={booking.payment_proof_url} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={booking.payment_proof_url} 
                              alt="Ảnh chuyển khoản" 
                              className="max-h-40 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </a>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {!booking.read_at && (
                          <Button size="sm" variant="outline" onClick={() => markAsRead.mutate({ type: 'booking', id: booking.id })}>
                            <Eye className="w-4 h-4 mr-2" />Đánh dấu đã đọc
                          </Button>
                        )}
                        {/* Confirm booking button - only show for pending/pending_payment status */}
                        {(booking.status === 'pending' || booking.status === 'pending_payment') && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => showConfirmDialog(
                              "Xác nhận lịch đặt", 
                              `Bạn có chắc chắn muốn xác nhận lịch đặt của ${booking.name} vào ngày ${new Date(booking.booking_date).toLocaleDateString('vi-VN')} lúc ${booking.booking_time}?`, 
                              () => confirmBookingStatus.mutate(booking.id),
                              "default"
                            )}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />Xác nhận
                          </Button>
                        )}
                        {/* Cancel booking button - only show for non-cancelled status */}
                        {booking.status !== 'cancelled' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-orange-600 border-orange-600 hover:bg-orange-50"
                            onClick={() => showConfirmDialog(
                              "Hủy lịch đặt", 
                              `Bạn có chắc chắn muốn hủy lịch đặt của ${booking.name}? Hành động này không thể hoàn tác.`, 
                              () => cancelBooking.mutate(booking.id),
                              "destructive"
                            )}
                          >
                            <Ban className="w-4 h-4 mr-2" />Hủy lịch
                          </Button>
                        )}
                        <Button size="sm" onClick={() => showConfirmDialog(
                          "Gửi email", 
                          `Bạn có muốn gửi email cho ${booking.name} (${booking.email})?`, 
                          () => { setReplyData({ type: 'booking', data: booking, message: '' }); setReplyDialogOpen(true); setConfirmDialog(prev => ({ ...prev, open: false })); },
                          "default"
                        )}>
                          <Mail className="w-4 h-4 mr-2" />Gửi mail
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => showConfirmDialog("Xóa lịch đặt", `Bạn có chắc muốn xóa vĩnh viễn lịch đặt của ${booking.name}? Hành động này không thể hoàn tác.`, () => deleteBooking.mutate(booking.id), "destructive")}>
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
        // Filter contacts
        const filteredContacts = contacts.filter((contact: any) => {
          // Status filter
          if (contactStatusFilter === 'unread' && contact.read_at) return false;
          if (contactStatusFilter === 'read' && (!contact.read_at || contact.replied_at)) return false;
          if (contactStatusFilter === 'replied' && !contact.replied_at) return false;
          
          // Date filter
          if (contactDateFilter !== 'all') {
            const contactDate = new Date(contact.created_at);
            const now = new Date();
            if (contactDateFilter === 'today') {
              if (contactDate.toDateString() !== now.toDateString()) return false;
            } else if (contactDateFilter === 'week') {
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (contactDate < weekAgo) return false;
            } else if (contactDateFilter === 'month') {
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              if (contactDate < monthAgo) return false;
            }
          }
          
          // Search filter
          if (contactSearch) {
            const search = contactSearch.toLowerCase();
            return contact.name?.toLowerCase().includes(search) ||
                   contact.email?.toLowerCase().includes(search) ||
                   contact.phone?.includes(search) ||
                   contact.message?.toLowerCase().includes(search);
          }
          return true;
        });

        // Export contacts function
        const exportContacts = () => {
          const headers = ['Tên', 'Email', 'SĐT', 'Tin nhắn', 'Trạng thái', 'Ngày gửi'];
          const data = filteredContacts.map((c: any) => [
            c.name,
            c.email,
            c.phone,
            c.message,
            c.replied_at ? 'Đã phản hồi' : c.read_at ? 'Đã đọc' : 'Chưa đọc',
            new Date(c.created_at).toLocaleDateString('vi-VN')
          ]);
          
          const csvContent = [headers.join(','), ...data.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
          const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `lien-he_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          toast.success('Đã xuất báo cáo liên hệ!');
        };

        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Quản lý liên hệ</CardTitle>
                    <CardDescription>Danh sách tin nhắn liên hệ ({filteredContacts.length} kết quả)</CardDescription>
                  </div>
                  <Button onClick={exportContacts} variant="outline">
                    <Download className="w-4 h-4 mr-2" />Xuất CSV
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Tìm theo tên, email, SĐT, tin nhắn..." 
                      value={contactSearch} 
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={contactStatusFilter} onValueChange={setContactStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="unread">Chưa đọc</SelectItem>
                      <SelectItem value="read">Đã đọc</SelectItem>
                      <SelectItem value="replied">Đã phản hồi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={contactDateFilter} onValueChange={setContactDateFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="today">Hôm nay</SelectItem>
                      <SelectItem value="week">7 ngày qua</SelectItem>
                      <SelectItem value="month">30 ngày qua</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Không tìm thấy liên hệ nào</p>
                  </div>
                ) : filteredContacts.map((contact: any) => (
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

      case "reports":
        // Generate report data
        const getMonthlyStats = (data: any[], months: number) => {
          return Array.from({ length: months }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (months - 1 - i));
            const monthName = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
            const count = data.filter((item: any) => {
              const itemDate = new Date(item.created_at);
              return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
            }).length;
            return { name: monthName, count };
          });
        };

        const getQuarterlyStats = (data: any[]) => {
          const quarters: { [key: string]: number } = {};
          data.forEach((item: any) => {
            const date = new Date(item.created_at);
            const q = Math.floor(date.getMonth() / 3) + 1;
            const key = `Q${q}/${date.getFullYear()}`;
            quarters[key] = (quarters[key] || 0) + 1;
          });
          return Object.entries(quarters).slice(-8).map(([name, count]) => ({ name, count }));
        };

        const monthsToShow = reportPeriod === 'quarter' ? 12 : 6;
        const bookingStats = reportPeriod === 'quarter' ? getQuarterlyStats(bookings) : getMonthlyStats(bookings, monthsToShow);
        const contactStats = reportPeriod === 'quarter' ? getQuarterlyStats(contacts) : getMonthlyStats(contacts, monthsToShow);

        // Category distribution for bookings
        const categoryStats = categories.map((cat: any) => ({
          name: cat.label,
          count: bookings.filter((b: any) => b.selected_category === cat.name || b.pet_type === cat.name).length
        })).filter((item: any) => item.count > 0);

        // Status distribution
        const statusStats = [
          { name: 'Chưa đọc', bookings: bookings.filter((b: any) => !b.read_at).length, contacts: contacts.filter((c: any) => !c.read_at).length },
          { name: 'Đã đọc', bookings: bookings.filter((b: any) => b.read_at && !b.replied_at).length, contacts: contacts.filter((c: any) => c.read_at && !c.replied_at).length },
          { name: 'Đã phản hồi', bookings: bookings.filter((b: any) => b.replied_at).length, contacts: contacts.filter((c: any) => c.replied_at).length },
        ];

        const exportFullReport = () => {
          // Bookings summary
          let content = 'BÁO CÁO THỐNG KÊ - SNAPPUP STUDIO\n';
          content += `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}\n\n`;
          content += '=== TỔNG QUAN ===\n';
          content += `Tổng lịch đặt: ${bookings.length}\n`;
          content += `Tổng liên hệ: ${contacts.length}\n`;
          content += `Chưa đọc: ${bookings.filter((b: any) => !b.read_at).length} lịch đặt, ${contacts.filter((c: any) => !c.read_at).length} liên hệ\n\n`;
          
          content += '=== LỊCH ĐẶT THEO HẠNG MỤC ===\n';
          categoryStats.forEach((cat: any) => {
            content += `${cat.name}: ${cat.count}\n`;
          });
          
          content += '\n=== THỐNG KÊ THEO THỜI GIAN ===\n';
          bookingStats.forEach((stat: any) => {
            content += `${stat.name}: ${stat.count} lịch đặt\n`;
          });

          const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `bao-cao-thong-ke_${new Date().toISOString().split('T')[0]}.txt`;
          link.click();
          toast.success('Đã xuất báo cáo thống kê!');
        };

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Báo cáo thống kê</CardTitle>
                    <CardDescription>Thống kê lịch đặt và liên hệ theo thời gian</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Select value={reportPeriod} onValueChange={setReportPeriod}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Theo tháng</SelectItem>
                        <SelectItem value="quarter">Theo quý</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={exportFullReport} variant="outline">
                      <Download className="w-4 h-4 mr-2" />Xuất báo cáo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Booking stats chart */}
                  <div>
                    <h3 className="font-semibold mb-4">Lịch đặt theo {reportPeriod === 'quarter' ? 'quý' : 'tháng'}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={bookingStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" name="Lịch đặt" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Contact stats chart */}
                  <div>
                    <h3 className="font-semibold mb-4">Liên hệ theo {reportPeriod === 'quarter' ? 'quý' : 'tháng'}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={contactStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" name="Liên hệ" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Phân bố theo hạng mục</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="count"
                          label={({ name, count }) => `${name}: ${count}`}
                        >
                          {categoryStats.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">Chưa có dữ liệu</div>
                  )}
                </CardContent>
              </Card>

              {/* Status distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Trạng thái xử lý</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={statusStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="bookings" name="Lịch đặt" fill="#3b82f6" />
                      <Bar dataKey="contacts" name="Liên hệ" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Summary table */}
            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt số liệu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-600">{bookings.length}</p>
                    <p className="text-sm text-muted-foreground">Tổng lịch đặt</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-600">{contacts.length}</p>
                    <p className="text-sm text-muted-foreground">Tổng liên hệ</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-orange-600">{bookings.filter((b: any) => !b.read_at).length + contacts.filter((c: any) => !c.read_at).length}</p>
                    <p className="text-sm text-muted-foreground">Chưa đọc</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-purple-600">{bookings.filter((b: any) => b.replied_at).length + contacts.filter((c: any) => c.replied_at).length}</p>
                    <p className="text-sm text-muted-foreground">Đã phản hồi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
              <CardDescription>Thêm và chỉnh sửa bộ ảnh trong từng danh mục (với tên, mô tả, giá)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">Thêm bộ ảnh mới</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Tên bộ ảnh</Label><Input placeholder="VD: Bộ ảnh gia đình..." value={newAlbum.name} onChange={(e) => setNewAlbum({ ...newAlbum, name: e.target.value })} /></div>
                    <div><Label>Giá bộ ảnh</Label><Input placeholder="VD: 500,000 VNĐ" value={newAlbum.price} onChange={(e) => setNewAlbum({ ...newAlbum, price: e.target.value })} /></div>
                  </div>
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
              
              {/* Albums grouped by category */}
              {categories.map((cat: any) => {
                const categoryAlbums = albums.filter((a: any) => a.category_id === cat.id);
                if (categoryAlbums.length === 0) return null;
                return (
                  <div key={cat.id} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      {cat.label}
                      <Badge variant="secondary">{categoryAlbums.length} bộ ảnh</Badge>
                    </h3>
                    <div className="grid gap-4">
                      {categoryAlbums.map((album: any) => (
                        <Card key={album.id}>
                          <CardContent className="pt-6">
                            {editingAlbum?.id === album.id ? (
                              <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <Input value={editingAlbum.name} onChange={(e) => setEditingAlbum({ ...editingAlbum, name: e.target.value })} placeholder="Tên bộ ảnh" />
                                  <Input value={editingAlbum.price || ""} onChange={(e) => setEditingAlbum({ ...editingAlbum, price: e.target.value })} placeholder="Giá bộ ảnh" />
                                </div>
                                <Textarea value={editingAlbum.description || ""} onChange={(e) => setEditingAlbum({ ...editingAlbum, description: e.target.value })} placeholder="Mô tả" />
                                <Select value={editingAlbum.category_id || ""} onValueChange={(value) => setEditingAlbum({ ...editingAlbum, category_id: value })}>
                                  <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                                  <SelectContent>
                                    {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <div>
                                  <Label>Chọn ảnh</Label>
                                  <div className="grid grid-cols-6 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-2">
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
                                    <h4 className="font-semibold text-lg">{album.name}</h4>
                                    {album.price && <p className="text-primary font-bold text-lg">{album.price}</p>}
                                    {album.description && <p className="text-sm text-muted-foreground mt-1">{album.description}</p>}
                                  </div>
                                  <Badge>{(album.image_urls || []).length} ảnh</Badge>
                                </div>
                                {(album.image_urls || []).length > 0 && (
                                  <div className="grid grid-cols-6 gap-2 mb-4">
                                    {(album.image_urls || []).slice(0, 6).map((url: string, idx: number) => (
                                      <img key={idx} src={url} alt={`${album.name} ${idx + 1}`} className="w-full h-16 object-cover rounded-lg" />
                                    ))}
                                    {(album.image_urls || []).length > 6 && (
                                      <div className="w-full h-16 bg-muted rounded-lg flex items-center justify-center text-sm">+{(album.image_urls || []).length - 6}</div>
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
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Albums without category */}
              {albums.filter((a: any) => !a.category_id || !categories.find((c: any) => c.id === a.category_id)).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Chưa phân loại</h3>
                  <div className="grid gap-4">
                    {albums.filter((a: any) => !a.category_id || !categories.find((c: any) => c.id === a.category_id)).map((album: any) => (
                      <Card key={album.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-lg">{album.name}</h4>
                              {album.price && <p className="text-primary font-bold">{album.price}</p>}
                              {album.description && <p className="text-sm text-muted-foreground mt-1">{album.description}</p>}
                            </div>
                            <Badge>{(album.image_urls || []).length} ảnh</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => setEditingAlbum(album)}><Edit className="w-4 h-4 mr-2" />Sửa</Button>
                            <Button size="sm" variant="destructive" onClick={() => showConfirmDialog("Xóa bộ ảnh", `Bạn có chắc muốn xóa bộ ảnh "${album.name}"?`, () => deleteAlbum.mutate(album.id), "destructive")}>
                              <Trash2 className="w-4 h-4 mr-2" />Xóa
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
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
              <div className="space-y-8">
                <div>
                  <Label>Email admin nhận thông báo</Label>
                  <div className="flex gap-4 mt-2">
                    <Input type="email" placeholder="admin@example.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                    <Button onClick={() => updateAdminEmail.mutate(adminEmail)}>Lưu</Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Thông tin chuyển khoản
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <Label>Tên chủ tài khoản</Label>
                      <div className="flex gap-4 mt-2">
                        <Input placeholder="SnapPup Studio" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} />
                        <Button onClick={() => updateBankConfig.mutate({ key: "bank_account_name", value: bankAccountName })}>Lưu</Button>
                      </div>
                    </div>
                    <div>
                      <Label>Số tài khoản</Label>
                      <div className="flex gap-4 mt-2">
                        <Input placeholder="19031267227016" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
                        <Button onClick={() => updateBankConfig.mutate({ key: "bank_account_number", value: bankAccountNumber })}>Lưu</Button>
                      </div>
                    </div>
                    <div>
                      <Label>Tên ngân hàng</Label>
                      <div className="flex gap-4 mt-2">
                        <Input placeholder="Techcombank - Chi nhánh Phú Mỹ Hưng" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                        <Button onClick={() => updateBankConfig.mutate({ key: "bank_name", value: bankName })}>Lưu</Button>
                      </div>
                    </div>
                    <div>
                      <Label>URL mã QR chuyển khoản</Label>
                      <div className="flex gap-4 mt-2">
                        <Input placeholder="https://..." value={bankQrUrl} onChange={(e) => setBankQrUrl(e.target.value)} />
                        <Button onClick={() => updateBankConfig.mutate({ key: "bank_qr_url", value: bankQrUrl })}>Lưu</Button>
                      </div>
                      {bankQrUrl && (
                        <div className="mt-2">
                          <img src={bankQrUrl} alt="QR Preview" className="max-h-32 rounded-lg border" />
                        </div>
                      )}
                    </div>
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

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailDialog.type === 'booking' ? 'Chi tiết lịch đặt' : 'Chi tiết liên hệ'}</DialogTitle>
          </DialogHeader>
          {detailDialog.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div><p className="text-sm text-muted-foreground">Họ tên</p><p className="font-medium">{detailDialog.data.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{detailDialog.data.email}</p></div>
                <div><p className="text-sm text-muted-foreground">Số điện thoại</p><p className="font-medium">{detailDialog.data.phone}</p></div>
                {detailDialog.type === 'booking' && (
                  <>
                    <div><p className="text-sm text-muted-foreground">Hạng mục</p><p className="font-medium text-primary">{detailDialog.data.pet_name}</p></div>
                    <div><p className="text-sm text-muted-foreground">Ngày chụp</p><p className="font-medium">{new Date(detailDialog.data.booking_date).toLocaleDateString('vi-VN')}</p></div>
                    <div><p className="text-sm text-muted-foreground">Giờ chụp</p><p className="font-medium">{detailDialog.data.booking_time}</p></div>
                  </>
                )}
                <div className="col-span-2"><p className="text-sm text-muted-foreground">Ngày gửi</p><p className="font-medium">{new Date(detailDialog.data.created_at).toLocaleString('vi-VN')}</p></div>
                {(detailDialog.data.notes || detailDialog.data.message) && (
                  <div className="col-span-2"><p className="text-sm text-muted-foreground">{detailDialog.type === 'booking' ? 'Ghi chú' : 'Tin nhắn'}</p><p className="font-medium">{detailDialog.data.notes || detailDialog.data.message}</p></div>
                )}
              </div>
              <div className="flex gap-2">
                {!detailDialog.data.read_at && (
                  <Button size="sm" variant="outline" onClick={() => { markAsRead.mutate({ type: detailDialog.type, id: detailDialog.data.id }); setDetailDialog(prev => ({ ...prev, open: false })); }}>
                    <Eye className="w-4 h-4 mr-2" />Đánh dấu đã đọc
                  </Button>
                )}
                <Button size="sm" onClick={() => { setReplyData({ type: detailDialog.type, data: detailDialog.data, message: '' }); setReplyDialogOpen(true); setDetailDialog(prev => ({ ...prev, open: false })); }}>
                  <Mail className="w-4 h-4 mr-2" />Gửi mail
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
