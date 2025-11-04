import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Mail, Upload, Plus, Edit, LogOut } from "lucide-react";

const Dashboard = () => {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; booking: any | null }>({ open: false, booking: null });
  const [emailMessage, setEmailMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [newService, setNewService] = useState({ title: "", price: "", description: "", image_url: "", features: "" });
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", label: "" });

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

  // Delete mutations
  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Đã xóa lịch đặt");
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
    },
  });

  // Send email mutation
  const sendEmail = useMutation({
    mutationFn: async ({ email, customerName, petName, bookingDate, bookingTime, message }: any) => {
      const { error } = await supabase.functions.invoke("send-booking-email", {
        body: { to: email, customerName, petName, bookingDate, bookingTime, message },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Email đã được gửi!");
      setEmailDialog({ open: false, booking: null });
      setEmailMessage("");
    },
  });

  // Upload image mutation
  const uploadImage = useMutation({
    mutationFn: async ({ file, title, category }: { file: File; title: string; category: string }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("gallery")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from("gallery_images")
        .insert([{ image_url: publicUrl, title, category }]);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Đã tải ảnh lên!");
    },
  });

  // Service mutations
  const addService = useMutation({
    mutationFn: async (service: any) => {
      const { error } = await supabase.from("services").insert([{
        ...service,
        features: service.features.split(",").map((f: string) => f.trim()),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Đã thêm dịch vụ!");
      setNewService({ title: "", price: "", description: "", image_url: "", features: "" });
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...service }: any) => {
      const { error } = await supabase.from("services").update({
        ...service,
        features: typeof service.features === "string" 
          ? service.features.split(",").map((f: string) => f.trim())
          : service.features,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Đã cập nhật dịch vụ!");
      setEditingService(null);
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
      setNewCategory({ name: "", label: "" });
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
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const title = prompt("Nhập tiêu đề ảnh:");
    const category = prompt("Nhập danh mục (dog/cat/other):");

    if (!title || !category) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setUploadingImage(true);
    try {
      await uploadImage.mutateAsync({ file, title, category });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <Button onClick={signOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Lịch đặt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{bookings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Liên hệ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{contacts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Thư viện</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{gallery.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dịch vụ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{services.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="bookings">Lịch đặt</TabsTrigger>
            <TabsTrigger value="contacts">Liên hệ</TabsTrigger>
            <TabsTrigger value="gallery">Thư viện</TabsTrigger>
            <TabsTrigger value="services">Dịch vụ</TabsTrigger>
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý lịch đặt</CardTitle>
                <CardDescription>Danh sách các lịch đặt chụp ảnh</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.map((booking: any) => (
                    <Card key={booking.id}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p><strong>Tên:</strong> {booking.name}</p>
                            <p><strong>Email:</strong> {booking.email}</p>
                            <p><strong>SĐT:</strong> {booking.phone}</p>
                          </div>
                          <div>
                            <p><strong>Tên pet:</strong> {booking.pet_name}</p>
                            <p><strong>Loại pet:</strong> {booking.pet_type}</p>
                            <p><strong>Ngày:</strong> {new Date(booking.booking_date).toLocaleDateString('vi-VN')}</p>
                            <p><strong>Giờ:</strong> {booking.booking_time}</p>
                          </div>
                        </div>
                        {booking.notes && (
                          <p className="mt-4"><strong>Ghi chú:</strong> {booking.notes}</p>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" onClick={() => setEmailDialog({ open: true, booking })}>
                            <Mail className="w-4 h-4 mr-2" />
                            Gửi email
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteBooking.mutate(booking.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý liên hệ</CardTitle>
                <CardDescription>Danh sách tin nhắn liên hệ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contacts.map((contact: any) => (
                    <Card key={contact.id}>
                      <CardContent className="pt-6">
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
                        <Button size="sm" variant="destructive" className="mt-4" onClick={() => deleteContact.mutate(contact.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý thư viện ảnh</CardTitle>
                <CardDescription>Upload và quản lý ảnh</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                      <p className="text-lg font-semibold mb-2">Tải ảnh lên</p>
                      <p className="text-sm text-muted-foreground">Click để chọn ảnh</p>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </div>
                  </Label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {gallery.map((image: any) => (
                    <Card key={image.id}>
                      <CardContent className="p-4">
                        <img src={image.image_url} alt={image.title} className="w-full h-40 object-cover rounded-lg mb-2" />
                        <p className="font-semibold">{image.title}</p>
                        <p className="text-sm text-muted-foreground">{image.category}</p>
                        <Button size="sm" variant="destructive" className="w-full mt-2" onClick={() => deleteImage.mutate(image.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý dịch vụ</CardTitle>
                <CardDescription>Thêm và chỉnh sửa dịch vụ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 border rounded-lg">
                  <h3 className="font-semibold mb-4">Thêm dịch vụ mới</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label>Tiêu đề</Label>
                      <Input value={newService.title} onChange={(e) => setNewService({ ...newService, title: e.target.value })} />
                    </div>
                    <div>
                      <Label>Giá</Label>
                      <Input value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} />
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Textarea value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
                    </div>
                    <div>
                      <Label>URL ảnh</Label>
                      <Input value={newService.image_url} onChange={(e) => setNewService({ ...newService, image_url: e.target.value })} />
                    </div>
                    <div>
                      <Label>Tính năng (cách nhau bởi dấu phẩy)</Label>
                      <Textarea value={newService.features} onChange={(e) => setNewService({ ...newService, features: e.target.value })} />
                    </div>
                    <Button onClick={() => addService.mutate(newService)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm dịch vụ
                    </Button>
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
                              <Button size="sm" onClick={() => setEditingService(service)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Sửa
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteService.mutate(service.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa
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
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý danh mục</CardTitle>
                <CardDescription>Thêm và chỉnh sửa danh mục ảnh</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 border rounded-lg">
                  <h3 className="font-semibold mb-4">Thêm danh mục mới</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label>Mã danh mục (VD: dog, cat)</Label>
                      <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Tên hiển thị</Label>
                      <Input value={newCategory.label} onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })} />
                    </div>
                    <Button onClick={() => addCategory.mutate(newCategory)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm danh mục
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
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
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{category.label}</p>
                              <p className="text-sm text-muted-foreground">Mã: {category.name}</p>
                            </div>
                            <Button size="sm" onClick={() => setEditingCategory(category)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Sửa
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={emailDialog.open} onOpenChange={(open) => setEmailDialog({ open, booking: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi email xác nhận</DialogTitle>
            <DialogDescription>
              Gửi email xác nhận lịch đặt đến {emailDialog.booking?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tin nhắn (tùy chọn)</Label>
              <Textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} placeholder="Nhập tin nhắn thêm cho khách hàng..." rows={4} />
            </div>
            <Button
              onClick={() => {
                if (emailDialog.booking) {
                  sendEmail.mutate({
                    email: emailDialog.booking.email,
                    customerName: emailDialog.booking.name,
                    petName: emailDialog.booking.pet_name,
                    bookingDate: emailDialog.booking.booking_date,
                    bookingTime: emailDialog.booking.booking_time,
                    message: emailMessage,
                  });
                }
              }}
              disabled={sendEmail.isPending}
            >
              {sendEmail.isPending ? "Đang gửi..." : "Gửi email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
