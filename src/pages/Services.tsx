import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Package, ArrowRight, Star, Clock, Camera } from "lucide-react";

export interface Service {
  id: string;
  title: string;
  price: string;
  description: string;
  image_url: string;
  features: string[];
  info_title_1?: string;
  info_content_1?: string;
  info_title_2?: string;
  info_content_2?: string;
  info_title_3?: string;
  info_content_3?: string;
  pricing_title?: string;
  package_1_name?: string;
  package_1_price?: string;
  package_1_features?: string[];
  package_2_name?: string;
  package_2_price?: string;
  package_2_features?: string[];
}

const Services = () => {
  const navigate = useNavigate();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as Service[];
    },
  });

  const handleServiceClick = (serviceId: string) => {
    navigate(`/services/${serviceId}`);
  };

  // Check if service is product photography (by title)
  const isProductService = (title: string) => {
    return title.toLowerCase().includes("sản phẩm") || title.toLowerCase().includes("product");
  };

  return (
    <>
      <Helmet>
        <title>Dịch Vụ Chụp Ảnh - SnapPup Studio</title>
        <meta name="description" content="Khám phá các gói dịch vụ chụp ảnh chuyên nghiệp tại SnapPup: CV Profile, Couple, Gia đình, Tốt nghiệp, Sản phẩm và nhiều hơn nữa." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                  CÁC DỊCH VỤ CHỤP ẢNH TẠI SNAPPUP
                </h1>
                <p className="text-lg text-muted-foreground">
                  Lưu giữ những khoảnh khắc đẹp nhất với dịch vụ chụp ảnh chuyên nghiệp
                </p>
              </div>
            </div>
          </section>

          {/* Product Photography Highlight */}
          <section className="py-12 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-y-2 border-primary/20">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                    <Package className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold">Chụp ảnh sản phẩm</h2>
                      <Badge className="bg-red-500">
                        <Sparkles className="h-3 w-3 mr-1" />
                        HOT
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Dịch vụ chụp ảnh sản phẩm chuyên nghiệp cho shop online, doanh nghiệp
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">50K</p>
                    <p className="text-sm text-muted-foreground">/ ảnh</p>
                  </div>
                  <Button size="lg" onClick={() => navigate('/booking')}>
                    Đặt lịch ngay
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Services Grid */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {services.map((service, index) => {
                    const isProduct = isProductService(service.title);
                    
                    return (
                      <Card 
                        key={service.id}
                        className={`overflow-hidden hover:shadow-xl transition-all duration-300 ${
                          isProduct 
                            ? 'border-2 border-primary shadow-lg ring-2 ring-primary/20' 
                            : 'hover:shadow-lg'
                        }`}
                      >
                        <CardContent className="p-0">
                          <div className={`grid md:grid-cols-2 gap-0 ${index % 2 === 1 ? 'md:grid-flow-dense' : ''}`}>
                            {/* Image */}
                            <div className={`relative h-64 md:h-auto min-h-[300px] ${index % 2 === 1 ? 'md:col-start-2' : ''}`}>
                              <img
                                src={service.image_url}
                                alt={service.title}
                                className="w-full h-full object-cover"
                              />
                              {isProduct && (
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                  <Badge className="bg-red-500 text-white">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    ĐANG HOT
                                  </Badge>
                                  <Badge variant="secondary">
                                    Dành cho seller
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className={`p-8 flex flex-col justify-center space-y-5 ${isProduct ? 'bg-gradient-to-br from-primary/5 to-transparent' : ''}`}>
                              <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-display font-bold text-foreground">
                                  {service.title}
                                </h2>
                              </div>
                              
                              <p className="text-muted-foreground text-lg">
                                {service.description}
                              </p>
                              
                              {isProduct && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Camera className="h-4 w-4 text-primary" />
                                    <span>Background đa dạng</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Star className="h-4 w-4 text-primary" />
                                    <span>Chỉnh sửa chuyên nghiệp</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span>Giao ảnh 24-48h</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Package className="h-4 w-4 text-primary" />
                                    <span>Mọi loại sản phẩm</span>
                                  </div>
                                </div>
                              )}
                              
                              <div className={`text-3xl font-bold ${isProduct ? 'text-primary' : 'text-primary'}`}>
                                CHỈ TỪ {service.price}
                              </div>
                              
                              <div className="flex flex-wrap gap-3">
                                <Button 
                                  onClick={() => handleServiceClick(service.id)}
                                  className={isProduct 
                                    ? "bg-primary hover:bg-primary/90 font-bold px-8" 
                                    : "bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8"
                                  }
                                >
                                  CHI TIẾT
                                </Button>
                                {isProduct && (
                                  <Button 
                                    variant="outline"
                                    onClick={() => navigate('/booking')}
                                    className="font-bold px-8 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  >
                                    ĐẶT LỊCH NGAY
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">
                  MUỐN CÓ ẢNH ĐẸP? LIÊN HỆ NGAY CHO CHÚNG TÔI
                </h2>
                <p className="text-primary-foreground/90 text-lg">
                  Để được tư vấn và đặt lịch chụp ảnh thuận tiện nhất
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button
                    size="lg"
                    onClick={() => navigate('/booking')}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8"
                  >
                    ĐẶT LỊCH NGAY
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/contact')}
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold px-8 border-2"
                  >
                    LIÊN HỆ TƯ VẤN
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Services;