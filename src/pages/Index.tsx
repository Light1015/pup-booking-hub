import { Link } from "react-router-dom";
import { Camera, Lightbulb, Palette, Clock, TrendingUp, ArrowRight, Zap, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-section.png";
import anhSanPham from "@/assets/anh-san-pham.png";

const Index = () => {
  const whyChooseUs = [
    {
      icon: Camera,
      title: "Thiết bị chuyên nghiệp",
      description: "Sử dụng hệ thống máy ảnh và ánh sáng hiện đại",
    },
    {
      icon: Palette,
      title: "Sáng tạo không giới hạn",
      description: "Đội ngũ Stylist luôn cập nhật xu hướng hình ảnh mới",
    },
    {
      icon: Clock,
      title: "Bàn giao nhanh",
      description: "Cam kết trả ảnh hậu kỳ đúng hạn trong 24h - 48h",
    },
    {
      icon: TrendingUp,
      title: "Tối ưu doanh số",
      description: "Hình ảnh được thiết kế để kích thích hành vi mua hàng",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[650px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="SnapPup Photography Studio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 z-10">
          <div className="max-w-2xl space-y-6">
            <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              Đầu tư hình ảnh, tối ưu doanh thu
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight">
              Hình ảnh sắc nét – <br />
              <span className="text-primary">Chốt đơn thần tốc.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground">
              Giải pháp hình ảnh sản phẩm chuyên nghiệp tại Cần Thơ giúp thương hiệu của bạn 
              nổi bật trên mọi sàn thương mại điện tử và mạng xã hội.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" asChild className="font-semibold">
                <Link to="/contact">
                  Nhận báo giá ngay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/gallery">Xem kho ảnh</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose SnapPup Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-1.5">
            <Sparkles className="h-4 w-4 mr-1" />
            Chuyên nghiệp & Tận tâm
          </Badge>
          <h2 className="text-4xl font-display font-bold mb-4">Tại sao chọn SnapPup?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Chúng tôi cam kết mang đến giải pháp hình ảnh tối ưu cho doanh nghiệp của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChooseUs.map((item, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg group">
              <CardContent className="p-6 space-y-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Product Photography Highlight Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50">
                <img
                  src={anhSanPham}
                  alt="Chụp ảnh sản phẩm chuyên nghiệp"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold shadow-lg animate-bounce">
                GIÁ TỪ 120K/SẢN PHẨM
              </div>
              <div className="absolute -bottom-4 -left-4 bg-background border-2 border-primary px-4 py-2 rounded-full font-semibold shadow-lg">
                ✨ 500+ khách hàng tin tưởng
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 order-1 lg:order-2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1.5 text-sm">
                <Sparkles className="h-4 w-4 mr-1" />
                DỊCH VỤ NỔI BẬT
              </Badge>
              
              <h2 className="text-4xl md:text-5xl font-display font-bold">
                Giải pháp hình ảnh <span className="text-primary">sản phẩm</span> dành cho bạn
              </h2>
              
              <p className="text-lg text-muted-foreground">
                Hình ảnh sản phẩm đẹp giúp tăng 40% tỷ lệ chuyển đổi bán hàng. 
                Chúng tôi chuyên cung cấp dịch vụ chụp ảnh sản phẩm cho các shop online, doanh nghiệp.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Chụp sản phẩm nền trơn - từ 120K/sản phẩm</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Chụp theo layout/concept - từ 500K/layout</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Chụp sản phẩm kèm người mẫu - từ 2.000K/gói</span>
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
                  <Link to="/booking">Đặt lịch ngay</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <CardContent className="p-12 text-center space-y-6 relative z-10">
            <Badge variant="outline" className="mb-2">
              <Lightbulb className="h-4 w-4 mr-1" />
              Ưu đãi dành cho bạn
            </Badge>
            <h2 className="text-4xl font-display font-bold">
              Sẵn sàng nâng tầm hình ảnh thương hiệu?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Liên hệ ngay để nhận tư vấn miễn phí và báo giá chi tiết cho dự án của bạn
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/contact">
                  Liên hệ tư vấn
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/services">Xem dịch vụ</Link>
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
