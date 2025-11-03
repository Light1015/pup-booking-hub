import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, Mail, Image, Trash2, Home, Briefcase } from "lucide-react";
import { Service } from "./Services";

interface Booking {
  name: string;
  phone: string;
  email: string;
  petName: string;
  petType: string;
  date: string;
  time: string;
  notes: string;
  createdAt: string;
}

interface Contact {
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  category: string;
}

const Dashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [newImage, setNewImage] = useState({
    url: "",
    title: "",
    category: "dog",
  });
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const savedContacts = JSON.parse(localStorage.getItem("contacts") || "[]");
    const savedGallery = JSON.parse(localStorage.getItem("gallery") || "[]");
    const savedServices = JSON.parse(localStorage.getItem("services") || "[]");
    
    setBookings(savedBookings);
    setContacts(savedContacts);
    setGalleryImages(savedGallery);
    setServices(savedServices);
  };

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    
    const image: GalleryImage = {
      id: Date.now().toString(),
      ...newImage,
    };
    
    const updatedGallery = [...galleryImages, image];
    setGalleryImages(updatedGallery);
    localStorage.setItem("gallery", JSON.stringify(updatedGallery));
    
    toast.success("Đã thêm ảnh vào thư viện");
    setNewImage({ url: "", title: "", category: "dog" });
  };

  const handleDeleteImage = (id: string) => {
    const updatedGallery = galleryImages.filter((img) => img.id !== id);
    setGalleryImages(updatedGallery);
    localStorage.setItem("gallery", JSON.stringify(updatedGallery));
    toast.success("Đã xóa ảnh");
  };

  const handleDeleteBooking = (index: number) => {
    const updatedBookings = bookings.filter((_, i) => i !== index);
    setBookings(updatedBookings);
    localStorage.setItem("bookings", JSON.stringify(updatedBookings));
    toast.success("Đã xóa lịch đặt");
  };

  const handleDeleteContact = (index: number) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    setContacts(updatedContacts);
    localStorage.setItem("contacts", JSON.stringify(updatedContacts));
    toast.success("Đã xóa tin nhắn");
  };

  const handleUpdateService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingService) return;

    const updatedServices = services.map(s => 
      s.id === editingService.id ? editingService : s
    );
    setServices(updatedServices);
    localStorage.setItem("services", JSON.stringify(updatedServices));
    toast.success("Đã cập nhật dịch vụ");
    setEditingService(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Quản lý website SnapPup</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Về trang chủ
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lịch đặt</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tin nhắn</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contacts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ảnh trong thư viện</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{galleryImages.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Dịch vụ</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="bookings">Lịch đặt</TabsTrigger>
            <TabsTrigger value="contacts">Tin nhắn</TabsTrigger>
            <TabsTrigger value="gallery">Thư viện ảnh</TabsTrigger>
            <TabsTrigger value="services">Dịch vụ</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách lịch đặt</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Chưa có lịch đặt nào
                  </p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold">{booking.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.phone} • {booking.email}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Bé cưng:</span>{" "}
                              {booking.petName} ({booking.petType})
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Thời gian:</span>{" "}
                              {new Date(booking.date).toLocaleDateString("vi-VN")}{" "}
                              - {booking.time}
                            </p>
                            {booking.notes && (
                              <p className="text-sm">
                                <span className="font-medium">Ghi chú:</span>{" "}
                                {booking.notes}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBooking(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Tin nhắn liên hệ</CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Chưa có tin nhắn nào
                  </p>
                ) : (
                  <div className="space-y-4">
                    {contacts.map((contact, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <p className="font-semibold">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {contact.email} • {contact.phone}
                            </p>
                            <p className="text-sm mt-2">{contact.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(contact.createdAt).toLocaleString("vi-VN")}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContact(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <div className="space-y-6">
              {/* Add Image Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Thêm ảnh mới</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddImage} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">URL ảnh *</Label>
                      <Input
                        id="imageUrl"
                        required
                        placeholder="https://..."
                        value={newImage.url}
                        onChange={(e) =>
                          setNewImage({ ...newImage, url: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageTitle">Tiêu đề *</Label>
                      <Input
                        id="imageTitle"
                        required
                        value={newImage.title}
                        onChange={(e) =>
                          setNewImage({ ...newImage, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageCategory">Danh mục *</Label>
                      <select
                        id="imageCategory"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={newImage.category}
                        onChange={(e) =>
                          setNewImage({ ...newImage, category: e.target.value })
                        }
                      >
                        <option value="dog">Chó</option>
                        <option value="cat">Mèo</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <Button type="submit">Thêm ảnh</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Gallery Grid */}
              <Card>
                <CardHeader>
                  <CardTitle>Thư viện ảnh</CardTitle>
                </CardHeader>
                <CardContent>
                  {galleryImages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Chưa có ảnh nào trong thư viện
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {galleryImages.map((image) => (
                        <div
                          key={image.id}
                          className="relative group rounded-lg overflow-hidden"
                        >
                          <img
                            src={image.url}
                            alt={image.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                            <p className="font-semibold mb-2">{image.title}</p>
                            <p className="text-sm text-muted-foreground mb-4">
                              {image.category}
                            </p>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteImage(image.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý dịch vụ</CardTitle>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Chưa có dịch vụ nào
                  </p>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="border rounded-lg p-6 space-y-4"
                      >
                        {editingService?.id === service.id ? (
                          <form onSubmit={handleUpdateService} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Tiêu đề</Label>
                              <Input
                                value={editingService.title}
                                onChange={(e) =>
                                  setEditingService({
                                    ...editingService,
                                    title: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Giá</Label>
                              <Input
                                value={editingService.price}
                                onChange={(e) =>
                                  setEditingService({
                                    ...editingService,
                                    price: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Mô tả</Label>
                              <textarea
                                className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[100px]"
                                value={editingService.description}
                                onChange={(e) =>
                                  setEditingService({
                                    ...editingService,
                                    description: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>URL ảnh</Label>
                              <Input
                                value={editingService.image}
                                onChange={(e) =>
                                  setEditingService({
                                    ...editingService,
                                    image: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit">Lưu</Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingService(null)}
                              >
                                Hủy
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <h3 className="text-xl font-bold">{service.title}</h3>
                                <p className="text-2xl font-bold text-primary">
                                  {service.price}
                                </p>
                                <p className="text-muted-foreground">
                                  {service.description}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingService(service)}
                              >
                                Chỉnh sửa
                              </Button>
                            </div>
                            {service.image && (
                              <img
                                src={service.image}
                                alt={service.title}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
