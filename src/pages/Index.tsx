import { Link } from "react-router-dom";
import { Camera, Heart, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-dog.jpg";
import galleryCat from "@/assets/gallery-cat.jpg";
import galleryBeagle from "@/assets/gallery-beagle.jpg";
import galleryRabbit from "@/assets/gallery-rabbit.jpg";

const Index = () => {
  const services = [
    {
      icon: Camera,
      title: "Chụp ảnh chuyên nghiệp",
      description: "Trang bị đầy đủ thiết bị hiện đại, ánh sáng chuyên nghiệp",
    },
    {
      icon: Heart,
      title: "Yêu thương bé cưng",
      description: "Đội ngũ nhiếp ảnh gia yêu động vật, tận tâm với từng bé",
    },
    {
      icon: Star,
      title: "Chất lượng cao",
      description: "Hình ảnh sắc nét, chỉnh sửa chuyên nghiệp",
    },
    {
      icon: Clock,
      title: "Nhanh chóng",
      description: "Giao ảnh trong 3-5 ngày làm việc",
    },
  ];

  const galleryPreviews = [
    { image: galleryCat, title: "Mèo" },
    { image: galleryBeagle, title: "Chó" },
    { image: galleryRabbit, title: "Thú cưng khác" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Pet photography studio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 z-10">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight">
              Lưu giữ khoảnh khắc <br />
              <span className="text-primary">đáng yêu nhất</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Studio chụp ảnh thú cưng chuyên nghiệp, nơi những khoảnh khắc của bé cưng được tôn vinh
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/booking">Đặt lịch ngay</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/gallery">Xem thư viện</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold mb-4">Dịch vụ của chúng tôi</h2>
          <p className="text-muted-foreground text-lg">
            Chúng tôi mang đến trải nghiệm chụp ảnh tuyệt vời cho bé cưng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{service.title}</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold mb-4">Thư viện ảnh</h2>
            <p className="text-muted-foreground text-lg">
              Những khoảnh khắc đáng yêu chúng tôi đã lưu giữ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {galleryPreviews.map((item, index) => (
              <div
                key={index}
                className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex items-end">
                  <p className="p-6 text-2xl font-display font-semibold">{item.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button size="lg" variant="outline" asChild>
              <Link to="/gallery">Xem tất cả ảnh</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-4xl font-display font-bold">
              Sẵn sàng chụp ảnh cho bé cưng?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Đặt lịch ngay hôm nay để nhận ưu đãi đặc biệt cho khách hàng mới
            </p>
            <Button size="lg" asChild>
              <Link to="/booking">Đặt lịch ngay</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
