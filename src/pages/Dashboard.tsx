import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/imageCompress";
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
import { Trash2, Mail, Upload, Plus, Edit, LogOut, Eye, Calendar, MessageSquare, Image, FolderOpen, Bell, Search, Download, FileText, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, Ban, CalendarDays, Camera, Package, ImageIcon } from "lucide-react";
import { BookingCalendar } from "@/components/BookingCalendar";
import { AdminReplies } from "@/components/AdminReplies";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AdminCalendarView } from "@/components/AdminCalendarView";
import { AdminNotificationBell } from "@/components/AdminNotificationBell";
import { ServiceManager } from "@/components/admin/ServiceManager";
import { TeamMemberManager } from "@/components/admin/TeamMemberManager";
import { RevenueExport } from "@/components/admin/RevenueExport";
import { BookingDetailDialog } from "@/components/BookingDetailDialog";
import { BookingWorkflowTimeline, WorkflowStatus } from "@/components/BookingWorkflowTimeline";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Dashboard = () => {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [uploadData, setUploadData] = useState({ title: "", category: "", url: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<any>(null);
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

    if (uploadType === "file" && selectedFile) {
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error("Ảnh quá lớn (tối đa 20MB)");
        return;
      }
    }

    setUploadingImage(true);
    try {
      if (uploadType === "file" && selectedFile) {
        const compressedFile = await compressImage(selectedFile);
        const fileExt = compressedFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, compressedFile);

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
          bookingDetails: {
            booking_date: booking.booking_date,
            booking_time: booking.booking_time,
            pet_name: booking.pet_name,
            selected_category: booking.selected_category,
            notes: booking.notes,
          },
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
          contactDetails: {
            phone: contact.phone,
            original_message: contact.message,
            created_at: contact.created_at,
          },
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
        
        // Revenue calculation (based on actual_revenue from delivered bookings)
        const deliveredBookings = bookings.filter((b: any) => b.workflow_status === 'delivered');
        const expectedRevenue = deliveredBookings.reduce((sum: number, b: any) => sum + (b.actual_revenue || 0), 0);
        const potentialRevenue = confirmedBookings.reduce((sum: number, b: any) => sum + (b.expected_revenue || 0), 0);
        
        // This month stats
        const thisMonth = new Date();
        const thisMonthBookings = bookings.filter((b: any) => {
          const bookingDate = new Date(b.booking_date);
          return bookingDate.getMonth() === thisMonth.getMonth() && bookingDate.getFullYear() === thisMonth.getFullYear();
        });
        const thisMonthConfirmed = thisMonthBookings.filter((b: any) => b.status === 'confirmed');
        const thisMonthCancelled = thisMonthBookings.filter((b: any) => b.status === 'cancelled');
        const thisMonthDelivered = thisMonthBookings.filter((b: any) => b.workflow_status === 'delivered');
        const thisMonthRevenue = thisMonthDelivered.reduce((sum: number, b: any) => sum + (b.actual_revenue || 0), 0);
        
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
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-primary-foreground">
              <h2 className="text-2xl font-bold mb-1">Xin chào! 👋</h2>
              <p className="opacity-90">Đây là tổng quan hoạt động của SnapPup Studio hôm nay</p>
            </div>
            
            {/* Stats Cards - Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setActiveTab("bookings")}>
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Tổng lịch đặt</CardTitle>
                  <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-2xl md:text-3xl font-bold">{bookings.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-blue-600 font-medium">{unreadBookings.length}</span> chưa đọc
                  </p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setActiveTab("bookings"); setBookingPaymentFilter("confirmed"); }}>
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Đã xác nhận</CardTitle>
                  <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-2xl md:text-3xl font-bold text-emerald-600">{confirmedBookings.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-emerald-600 font-medium">{thisMonthConfirmed.length}</span> tháng này
                  </p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setActiveTab("bookings"); setBookingPaymentFilter("pending"); }}>
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Chờ xác nhận</CardTitle>
                  <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-2xl md:text-3xl font-bold text-amber-600">{pendingBookings.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Cần xử lý</p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setActiveTab("bookings"); setBookingPaymentFilter("cancelled"); }}>
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Tỷ lệ hủy</CardTitle>
                  <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <XCircle className="h-4 w-4 md:h-5 md:w-5 text-rose-600" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-2xl md:text-3xl font-bold text-rose-600">{cancellationRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-rose-600 font-medium">{cancelledBookings.length}</span> đã hủy
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab("revenue")}>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xs md:text-sm font-medium opacity-90">Doanh thu thực tế</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-xl md:text-2xl font-bold">
                    {new Intl.NumberFormat('vi-VN').format(expectedRevenue)} đ
                  </p>
                  <p className="text-xs opacity-80 mt-1">Từ {deliveredBookings.length} lịch đã bàn giao</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab("revenue")}>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xs md:text-sm font-medium opacity-90">Doanh thu tiềm năng</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-xl md:text-2xl font-bold">
                    {new Intl.NumberFormat('vi-VN').format(potentialRevenue)} đ
                  </p>
                  <p className="text-xs opacity-80 mt-1">Từ {pendingBookings.length} lịch chờ xác nhận</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab("revenue")}>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xs md:text-sm font-medium opacity-90">Doanh thu tháng này</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-xl md:text-2xl font-bold">
                    {new Intl.NumberFormat('vi-VN').format(thisMonthRevenue)} đ
                  </p>
                  <p className="text-xs opacity-80 mt-1">{thisMonthDelivered.length} lịch đã bàn giao</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{contacts.length}</p>
                    <p className="text-xs text-muted-foreground">Liên hệ ({unreadContacts.length} mới)</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Image className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{gallery.length}</p>
                    <p className="text-xs text-muted-foreground">Ảnh ({albums.length} bộ)</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{categories.length}</p>
                    <p className="text-xs text-muted-foreground">Danh mục</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{services.length}</p>
                    <p className="text-xs text-muted-foreground">Dịch vụ</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Lịch đặt theo tháng</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                      <YAxis axisLine={false} tickLine={false} fontSize={12} />
                      <Tooltip 
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="bookings" fill="hsl(215 90% 28%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Phân bố theo hạng mục</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={bookingsByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {bookingsByCategory.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                      Chưa có dữ liệu
                    </div>
                  )}
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {bookingsByCategory.map((entry: any, index: number) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span>{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-base font-semibold">Lịch đặt gần đây</CardTitle>
                  </div>
                  {unreadBookings.length > 0 && (
                    <Badge className="bg-blue-500 hover:bg-blue-600">{unreadBookings.length} mới</Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {bookings.slice(0, 8).map((booking: any) => (
                      <div 
                        key={booking.id} 
                        className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all ${!booking.read_at ? 'bg-blue-50 hover:bg-blue-100' : 'bg-muted/50 hover:bg-muted'}`}
                        onClick={() => setDetailDialog({ open: true, type: 'booking', data: booking })}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{booking.name}</p>
                            {!booking.read_at && <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {booking.pet_name} • {new Date(booking.booking_date).toLocaleDateString('vi-VN')} {booking.booking_time}
                          </p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">Chưa có lịch đặt</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base font-semibold">Tin nhắn liên hệ</CardTitle>
                  </div>
                  {unreadContacts.length > 0 && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">{unreadContacts.length} mới</Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {contacts.slice(0, 8).map((contact: any) => (
                      <div 
                        key={contact.id} 
                        className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all ${!contact.read_at ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-muted/50 hover:bg-muted'}`}
                        onClick={() => setDetailDialog({ open: true, type: 'contact', data: contact })}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{contact.name}</p>
                            {!contact.read_at && <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{contact.message}</p>
                        </div>
                        <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    ))}
                    {contacts.length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">Chưa có tin nhắn</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar View */}
            <AdminCalendarView 
              bookings={bookings}
              onSelectBooking={(booking) => setDetailDialog({ open: true, type: 'booking', data: booking })}
            />
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
          <div className="space-y-4">
            {/* Header & Filters */}
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Quản lý lịch đặt</h2>
                      <p className="text-sm text-muted-foreground">{filteredBookings.length} kết quả</p>
                    </div>
                    <Button onClick={exportBookings} variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />Xuất CSV
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
              </CardContent>
            </Card>

            {/* Booking List */}
            <div className="space-y-3">
              {filteredBookings.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Không tìm thấy lịch đặt nào</p>
                  </CardContent>
                </Card>
              ) : filteredBookings.map((booking: any) => {
                const workflowStatus = (booking.workflow_status || "pending_payment") as WorkflowStatus;
                
                return (
                  <Card 
                    key={booking.id} 
                    className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${!booking.read_at ? 'ring-2 ring-primary/20' : ''}`}
                    onClick={() => {
                      setSelectedBookingDetail(booking);
                      setBookingDetailOpen(true);
                      if (!booking.read_at) {
                        markAsRead.mutate({ type: 'booking', id: booking.id });
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2">
                          {!booking.read_at && <Badge className="bg-blue-500">Mới</Badge>}
                          {booking.replied_at && <Badge variant="outline" className="border-green-500 text-green-600">Đã phản hồi</Badge>}
                          
                          {/* Workflow Status Badge */}
                          {workflowStatus === 'pending_payment' && !booking.payment_proof_url && (
                            <Badge className="bg-orange-500"><CreditCard className="w-3 h-3 mr-1" />Chờ TT</Badge>
                          )}
                          {workflowStatus === 'pending_payment' && booking.payment_proof_url && (
                            <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Chờ XN TT</Badge>
                          )}
                          {workflowStatus === 'payment_confirmed' && (
                            <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Đã TT</Badge>
                          )}
                          {workflowStatus === 'scheduled' && (
                            <Badge className="bg-indigo-500"><Calendar className="w-3 h-3 mr-1" />Đã lên lịch</Badge>
                          )}
                          {workflowStatus === 'shooting' && (
                            <Badge className="bg-purple-500"><Camera className="w-3 h-3 mr-1" />Đang chụp</Badge>
                          )}
                          {workflowStatus === 'processing' && (
                            <Badge className="bg-pink-500"><ImageIcon className="w-3 h-3 mr-1" />Đang xử lý</Badge>
                          )}
                          {workflowStatus === 'editing_complete' && (
                            <Badge className="bg-teal-500"><CheckCircle className="w-3 h-3 mr-1" />Hoàn tất</Badge>
                          )}
                          {workflowStatus === 'delivered' && (
                            <Badge className="bg-emerald-500"><Package className="w-3 h-3 mr-1" />Đã giao</Badge>
                          )}
                          {workflowStatus === 'cancelled' && (
                            <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Đã hủy</Badge>
                          )}
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <p className="font-semibold text-base">{booking.name}</p>
                            <p className="text-sm text-muted-foreground">{booking.email}</p>
                            <p className="text-sm text-muted-foreground">{booking.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm"><span className="text-muted-foreground">Dịch vụ:</span> <span className="font-medium text-primary">{booking.pet_name}</span></p>
                            <p className="text-sm"><span className="text-muted-foreground">Ngày:</span> {new Date(booking.booking_date).toLocaleDateString('vi-VN')}</p>
                            <p className="text-sm"><span className="text-muted-foreground">Giờ:</span> {booking.booking_time}</p>
                          </div>
                          <div>
                            {booking.expected_revenue > 0 && (
                              <p className="text-sm text-green-600 font-medium">
                                {new Intl.NumberFormat("vi-VN").format(booking.expected_revenue)} VNĐ
                              </p>
                            )}
                            {booking.payment_proof_url && (
                              <span className="inline-flex items-center gap-1 text-sm text-primary">
                                <CreditCard className="h-3 w-3" />Có ảnh TT
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Compact Timeline */}
                        <div className="hidden xl:block">
                          <BookingWorkflowTimeline
                            currentStatus={workflowStatus}
                            timestamps={{
                              created_at: booking.created_at,
                              payment_confirmed_at: booking.payment_confirmed_at,
                              scheduled_at: booking.scheduled_at,
                              shooting_at: booking.shooting_at,
                              processing_at: booking.processing_at,
                              editing_complete_at: booking.editing_complete_at,
                              delivered_at: booking.delivered_at,
                              cancelled_at: booking.cancelled_at,
                            }}
                            hasPaymentProof={!!booking.payment_proof_url}
                            compact
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" onClick={() => { setReplyData({ type: 'booking', data: booking, message: '' }); setReplyDialogOpen(true); }}>
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => showConfirmDialog("Xóa", `Xóa lịch đặt của ${booking.name}?`, () => deleteBooking.mutate(booking.id), "destructive")}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case "calendar":
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Xem lịch</CardTitle>
                  <CardDescription>Xem và quản lý lịch đặt theo ngày</CardDescription>
                </div>
              </div>
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
          <div className="space-y-4">
            {/* Header & Filters */}
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Quản lý liên hệ</h2>
                      <p className="text-sm text-muted-foreground">{filteredContacts.length} kết quả</p>
                    </div>
                    <Button onClick={exportContacts} variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />Xuất CSV
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
              </CardContent>
            </Card>

            {/* Contact List */}
            <div className="space-y-3">
              {filteredContacts.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Không tìm thấy liên hệ nào</p>
                  </CardContent>
                </Card>
              ) : filteredContacts.map((contact: any) => (
                <Card key={contact.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${!contact.read_at ? 'ring-2 ring-emerald-500/20' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2">
                        {!contact.read_at && <Badge className="bg-emerald-500">Mới</Badge>}
                        {contact.read_at && !contact.replied_at && <Badge variant="secondary">Đã đọc</Badge>}
                        {contact.replied_at && <Badge variant="outline" className="border-green-500 text-green-600">Đã phản hồi</Badge>}
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="font-semibold text-base">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.email}</p>
                          <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{contact.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(contact.created_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                        {!contact.read_at && (
                          <Button size="sm" variant="ghost" onClick={() => markAsRead.mutate({ type: 'contact', id: contact.id })}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => { setReplyData({ type: 'contact', data: contact, message: '' }); setReplyDialogOpen(true); }}>
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => showConfirmDialog("Xóa", `Xóa liên hệ của ${contact.name}?`, () => deleteContact.mutate(contact.id), "destructive")}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "revenue":
        const deliveredForRevenue = bookings.filter((b: any) => b.workflow_status === 'delivered');
        const totalActualRevenue = deliveredForRevenue.reduce((sum: number, b: any) => sum + (b.actual_revenue || 0), 0);
        const pendingRevenueInput = deliveredForRevenue.filter((b: any) => !b.actual_revenue).length;
        
        return (
          <div className="space-y-6">
            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-medium opacity-90">Tổng doanh thu thực tế</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('vi-VN').format(totalActualRevenue)} đ
                  </p>
                  <p className="text-xs opacity-80 mt-1">{deliveredForRevenue.filter((b: any) => b.actual_revenue).length} lịch đã nhập doanh thu</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-medium opacity-90">Tổng lịch đã bàn giao</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-2xl font-bold">{deliveredForRevenue.length}</p>
                  <p className="text-xs opacity-80 mt-1">Hoàn thành & bàn giao cho khách</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-medium opacity-90">Chưa nhập doanh thu</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-2xl font-bold">{pendingRevenueInput}</p>
                  <p className="text-xs opacity-80 mt-1">Cần nhập số tiền thực tế</p>
                </CardContent>
              </Card>
            </div>

            {/* Delivered bookings list with revenue input */}
            <Card>
              <CardHeader>
                <CardTitle>Quản lý doanh thu theo lịch đặt</CardTitle>
                <CardDescription>Nhập số tiền thực tế cho mỗi lịch đã bàn giao để thống kê doanh thu chính xác</CardDescription>
              </CardHeader>
              <CardContent>
                {deliveredForRevenue.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có lịch nào được bàn giao</p>
                    <p className="text-sm mt-1">Khi lịch đặt được chuyển sang trạng thái "Đã giao", sẽ hiển thị ở đây</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deliveredForRevenue.map((booking: any) => (
                      <div key={booking.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Customer info */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Khách hàng</p>
                              <p className="font-medium">{booking.name}</p>
                              <p className="text-sm text-muted-foreground">{booking.phone}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Ngày chụp</p>
                              <p className="font-medium">{new Date(booking.booking_date).toLocaleDateString('vi-VN')}</p>
                              <p className="text-sm text-muted-foreground">{booking.booking_time}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Dịch vụ</p>
                              <p className="font-medium">{booking.selected_category || 'Chưa chọn'}</p>
                              <Badge variant="outline" className="mt-1 text-emerald-600 border-emerald-200 bg-emerald-50">
                                Đã bàn giao
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Revenue input */}
                          <div className="lg:w-64 flex items-end gap-2">
                            <div className="flex-1">
                              <Label className="text-sm">Doanh thu thực tế (VNĐ)</Label>
                              <Input
                                type="number"
                                placeholder="Nhập số tiền..."
                                defaultValue={booking.actual_revenue || ''}
                                onBlur={async (e) => {
                                  const value = parseFloat(e.target.value);
                                  if (isNaN(value) && e.target.value !== '') return;
                                  const newValue = e.target.value === '' ? null : value;
                                  try {
                                    const { error } = await supabase
                                      .from('bookings')
                                      .update({ actual_revenue: newValue })
                                      .eq('id', booking.id);
                                    if (error) throw error;
                                    queryClient.invalidateQueries({ queryKey: ['bookings'] });
                                    toast.success('Đã cập nhật doanh thu');
                                  } catch (err: any) {
                                    toast.error('Lỗi: ' + err.message);
                                  }
                                }}
                                className="mt-1"
                              />
                            </div>
                            {booking.actual_revenue > 0 && (
                              <div className="pb-1">
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  {new Intl.NumberFormat('vi-VN').format(booking.actual_revenue)} đ
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Export */}
            <RevenueExport bookings={bookings} />
          </div>
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

            {/* Revenue Export */}
            <RevenueExport bookings={bookings} />
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
        return <ServiceManager services={services} />;

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

      case "team":
        return <TeamMemberManager />;

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
                      <Label>Mã QR chuyển khoản</Label>
                      <div className="mt-2 space-y-3">
                        {/* File upload option */}
                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                          <label className="cursor-pointer block">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (!file.type.startsWith("image/")) {
                                  toast.error("Vui lòng chọn file ảnh");
                                  return;
                                }
                                if (file.size > 20 * 1024 * 1024) {
                                  toast.error("Ảnh quá lớn (tối đa 20MB)");
                                  return;
                                }
                                try {
                                  const compressedFile = await compressImage(file);
                                  const fileExt = compressedFile.name.split(".").pop();
                                  const fileName = `qr-code/bank-qr-${Date.now()}.${fileExt}`;
                                  const { error: uploadError } = await supabase.storage
                                    .from("gallery")
                                    .upload(fileName, compressedFile);
                                  if (uploadError) throw uploadError;
                                  const { data: { publicUrl } } = supabase.storage
                                    .from("gallery")
                                    .getPublicUrl(fileName);
                                  setBankQrUrl(publicUrl);
                                  updateBankConfig.mutate({ key: "bank_qr_url", value: publicUrl });
                                } catch (error: any) {
                                  toast.error("Lỗi tải ảnh: " + error.message);
                                }
                              }}
                            />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Nhấn để tải ảnh QR code</span>
                            </div>
                          </label>
                        </div>
                        
                        {/* Or enter URL manually */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">hoặc nhập URL</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        
                        <div className="flex gap-2">
                          <Input placeholder="https://..." value={bankQrUrl} onChange={(e) => setBankQrUrl(e.target.value)} className="flex-1" />
                          <Button size="sm" onClick={() => updateBankConfig.mutate({ key: "bank_qr_url", value: bankQrUrl })}>Lưu</Button>
                        </div>
                        
                        {/* Preview */}
                        {bankQrUrl && (
                          <div className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                            <img src={bankQrUrl} alt="QR Preview" className="max-h-40 rounded-lg border" />
                            <Button size="sm" variant="destructive" onClick={() => {
                              setBankQrUrl("");
                              updateBankConfig.mutate({ key: "bank_qr_url", value: "" });
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
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

  // Get current tab title
  const getCurrentTabTitle = () => {
    const allItems = [
      { id: "overview", label: "Dashboard" },
      { id: "reports", label: "Báo cáo thống kê" },
      { id: "bookings", label: "Quản lý lịch đặt" },
      { id: "calendar", label: "Xem lịch" },
      { id: "contacts", label: "Quản lý liên hệ" },
      { id: "replies", label: "Lịch sử phản hồi" },
      { id: "gallery", label: "Thư viện ảnh" },
      { id: "albums", label: "Bộ ảnh" },
      { id: "categories", label: "Quản lý danh mục" },
      { id: "services", label: "Quản lý dịch vụ" },
      { id: "team", label: "Quản lý thành viên" },
      { id: "settings", label: "Cài đặt hệ thống" },
    ];
    return allItems.find(item => item.id === activeTab)?.label || "Dashboard";
  };

  const unreadBookingsCount = bookings.filter((b: any) => !b.read_at).length;
  const unreadContactsCount = contacts.filter((c: any) => !c.read_at).length;

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AdminSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        unreadBookings={unreadBookingsCount}
        unreadContacts={unreadContactsCount}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Space for mobile hamburger */}
            <div className="w-10 lg:hidden" />
            <div>
              <h1 className="text-base md:text-lg font-semibold text-foreground">{getCurrentTabTitle()}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <AdminNotificationBell 
              onNotificationClick={(notification) => {
                if (notification.type === "booking" || notification.type === "payment") {
                  setActiveTab("bookings");
                  setDetailDialog({ open: true, type: "booking", data: notification.data });
                } else if (notification.type === "contact") {
                  setActiveTab("contacts");
                  setDetailDialog({ open: true, type: "contact", data: notification.data });
                }
              }}
            />
            <div className="h-8 w-px bg-border" />
            <Button onClick={signOut} variant="outline" size="sm" className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
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

      {/* Booking Detail Dialog */}
      <BookingDetailDialog
        open={bookingDetailOpen}
        onOpenChange={setBookingDetailOpen}
        booking={selectedBookingDetail}
        isAdmin={true}
      />
    </div>
  );
};

export default Dashboard;
