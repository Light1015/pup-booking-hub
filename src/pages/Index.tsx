import { Link } from "react-router-dom";
import { Camera, Heart, Star, Clock, Package, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-section.png";
import anhSanPham from "@/assets/anh-san-pham.png";

const Index = () => {
  const services = [
    {
      icon: Camera,
      title: "Chụp ảnh chuyên nghiệp",
      description: "Trang bị đầy đủ thiết bị hiện đại, ánh sáng chuyên nghiệp",
    },
    {
      icon: Heart,
      title: "Tận tâm với khách hàng",
      description: "Đội ngũ nhiếp ảnh gia giàu kinh nghiệm, phục vụ tận tình",
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
              Chụp ảnh <span className="text-primary">sản phẩm</span> <br />
              chuyên nghiệp
            </h1>
            <p className="text-xl text-muted-foreground">
              Studio chụp ảnh sản phẩm chuyên nghiệp tại Cần Thơ - Giúp sản phẩm của bạn 
              nổi bật và thu hút khách hàng
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/booking">Đặt lịch ngay</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/services">Xem dịch vụ</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Photography Highlight Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1.5 text-sm">
                  <Sparkles className="h-4 w-4 mr-1" />
                  HOT
                </Badge>
                <Badge variant="outline" className="px-4 py-1.5 text-sm">
                  Dành cho người bán hàng
                </Badge>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-display font-bold">
                Chụp ảnh <span className="text-primary">sản phẩm</span> chuyên nghiệp
              </h2>
              
              <p className="text-lg text-muted-foreground">
                Hình ảnh sản phẩm đẹp giúp tăng 40% tỷ lệ chuyển đổi bán hàng. 
                Chúng tôi chuyên cung cấp dịch vụ chụp ảnh sản phẩm cho các shop online, doanh nghiệp với chất lượng cao nhất.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-background/80 rounded-xl border">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Đa dạng sản phẩm</h4>
                    <p className="text-sm text-muted-foreground">Thời trang, mỹ phẩm, thực phẩm, đồ điện tử...</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-background/80 rounded-xl border">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Background đa dạng</h4>
                    <p className="text-sm text-muted-foreground">Phông nền trắng, lifestyle, flatlay...</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-background/80 rounded-xl border">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Chỉnh sửa chuyên nghiệp</h4>
                    <p className="text-sm text-muted-foreground">Retouch, cắt nền, xử lý hậu kỳ</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-background/80 rounded-xl border">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Giao ảnh nhanh</h4>
                    <p className="text-sm text-muted-foreground">Chỉ 24-48h sau khi chụp</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" asChild>
                  <Link to="/services">
                    Xem chi tiết dịch vụ
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/booking">Đặt lịch chụp sản phẩm</Link>
                </Button>
              </div>
            </div>
            
            {/* Image */}
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50">
                <img
                  src={anhSanPham}
                  alt="Chụp ảnh sản phẩm chuyên nghiệp"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold shadow-lg animate-bounce">
                GIÁ TỪ 50K/ẢNH
              </div>
              <div className="absolute -bottom-4 -left-4 bg-background border-2 border-primary px-4 py-2 rounded-full font-semibold shadow-lg">
                ✨ 500+ khách hàng tin tưởng
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold mb-4">Tại sao chọn SnapPup Studio?</h2>
          <p className="text-muted-foreground text-lg">
            Chúng tôi mang đến trải nghiệm chụp ảnh sản phẩm tuyệt vời
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

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-4xl font-display font-bold">
              Sẵn sàng chụp ảnh sản phẩm?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Đặt lịch ngay hôm nay để nhận ưu đãi đặc biệt cho khách hàng mới
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/booking">Đặt lịch ngay</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Liên hệ tư vấn</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Index;