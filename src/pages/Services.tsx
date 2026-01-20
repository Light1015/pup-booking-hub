import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Package, ArrowRight, Star, Clock, Camera, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<Record<string, { package1: number; package2: number }>>({});

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

  // Check if service is product photography (by title)
  const isProductService = (title: string) => {
    return title.toLowerCase().includes("sản phẩm") || title.toLowerCase().includes("product");
  };

  // Parse price string to number (e.g., "400K" -> 400000, "100K" -> 100000)
  const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    const cleaned = priceStr.replace(/[^0-9kKmM.]/g, "");
    const match = cleaned.match(/(\d+(?:\.\d+)?)\s*([kKmM])?/);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const suffix = match[2]?.toLowerCase();
    if (suffix === "k") return num * 1000;
    if (suffix === "m") return num * 1000000;
    return num;
  };

  // Calculate total price for a service
  const calculateTotal = (serviceId: string, service: Service): number => {
    const packages = selectedPackages[serviceId] || { package1: 0, package2: 0 };
    const price1 = parsePrice(service.package_1_price || "0") * packages.package1;
    const price2 = parsePrice(service.package_2_price || "0") * packages.package2;
    return price1 + price2;
  };

  // Format number to VND
  const formatVND = (num: number): string => {
    return new Intl.NumberFormat("vi-VN").format(num) + " VNĐ";
  };

  const handleBookingClick = (serviceId: string) => {
    if (expandedService === serviceId) {
      setExpandedService(null);
    } else {
      setExpandedService(serviceId);
      if (!selectedPackages[serviceId]) {
        setSelectedPackages(prev => ({
          ...prev,
          [serviceId]: { package1: 1, package2: 0 }
        }));
      }
    }
  };

  const handleProceedToBooking = (service: Service) => {
    const packages = selectedPackages[service.id] || { package1: 0, package2: 0 };
    const total = calculateTotal(service.id, service);
    
    // Navigate to booking with selected package info
    const params = new URLSearchParams({
      service: service.title,
      package1: packages.package1.toString(),
      package1_name: service.package_1_name || "",
      package1_price: service.package_1_price || "",
      package2: packages.package2.toString(),
      package2_name: service.package_2_name || "",
      package2_price: service.package_2_price || "",
      total: total.toString()
    });
    
    navigate(`/booking?${params.toString()}`);
  };

  const updatePackageQuantity = (serviceId: string, packageType: "package1" | "package2", delta: number) => {
    setSelectedPackages(prev => {
      const current = prev[serviceId] || { package1: 0, package2: 0 };
      const newValue = Math.max(0, current[packageType] + delta);
      return {
        ...prev,
        [serviceId]: {
          ...current,
          [packageType]: newValue
        }
      };
    });
  };

  return (
    <>
      <Helmet>
        <title>Dịch Vụ Chụp Ảnh Sản Phẩm - SnapPup Studio</title>
        <meta name="description" content="Khám phá các gói dịch vụ chụp ảnh sản phẩm chuyên nghiệp tại SnapPup Studio - Giá từ 50K/ảnh." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center space-y-4">
                <Badge className="bg-primary text-primary-foreground px-4 py-1.5 text-sm mb-4">
                  <Sparkles className="h-4 w-4 mr-1" />
                  DỊCH VỤ NỔI BẬT
                </Badge>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                  DỊCH VỤ CHỤP ẢNH SẢN PHẨM
                </h1>
                <p className="text-lg text-muted-foreground">
                  Nâng tầm sản phẩm của bạn với hình ảnh chuyên nghiệp, thu hút khách hàng
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
                    const isExpanded = expandedService === service.id;
                    const packages = selectedPackages[service.id] || { package1: 0, package2: 0 };
                    const total = calculateTotal(service.id, service);
                    
                    return (
                      <Card 
                        key={service.id}
                        className={`overflow-hidden transition-all duration-300 ${
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
                              
                              {/* Booking button that expands packages */}
                              <Collapsible open={isExpanded} onOpenChange={() => handleBookingClick(service.id)}>
                                <CollapsibleTrigger asChild>
                                  <Button 
                                    className={`w-full ${isProduct 
                                      ? "bg-primary hover:bg-primary/90 font-bold" 
                                      : "bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                                    }`}
                                  >
                                    {isExpanded ? (
                                      <>
                                        Đóng lại
                                        <ChevronUp className="ml-2 h-5 w-5" />
                                      </>
                                    ) : (
                                      <>
                                        Đặt lịch ngay
                                        <ChevronDown className="ml-2 h-5 w-5" />
                                      </>
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                                
                                <CollapsibleContent className="mt-4 space-y-4">
                                  {/* Package selection */}
                                  <div className="border rounded-xl p-4 bg-muted/30 space-y-4">
                                    <h4 className="font-semibold text-lg">Chọn gói chụp:</h4>
                                    
                                    {/* Package 1 */}
                                    {service.package_1_name && (
                                      <div className="flex items-start gap-4 p-4 bg-background rounded-lg border">
                                        {(service as any).package_1_image_url && (
                                          <img 
                                            src={(service as any).package_1_image_url} 
                                            alt={service.package_1_name}
                                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                          />
                                        )}
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <h5 className="font-semibold">{service.package_1_name}</h5>
                                            <Badge variant="outline">{service.package_1_price}</Badge>
                                          </div>
                                          {service.package_1_features && service.package_1_features.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                              {service.package_1_features.slice(0, 3).map((feature, idx) => (
                                                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-1">
                                                  <Check className="h-3 w-3 text-primary" />
                                                  {feature}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => updatePackageQuantity(service.id, "package1", -1)}
                                            disabled={packages.package1 <= 0}
                                          >
                                            -
                                          </Button>
                                          <span className="w-8 text-center font-bold">{packages.package1}</span>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => updatePackageQuantity(service.id, "package1", 1)}
                                          >
                                            +
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Package 2 */}
                                    {service.package_2_name && (
                                      <div className="flex items-start gap-4 p-4 bg-background rounded-lg border">
                                        {(service as any).package_2_image_url && (
                                          <img 
                                            src={(service as any).package_2_image_url} 
                                            alt={service.package_2_name}
                                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                          />
                                        )}
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <h5 className="font-semibold">{service.package_2_name}</h5>
                                            <Badge variant="outline">{service.package_2_price}</Badge>
                                          </div>
                                          {service.package_2_features && service.package_2_features.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                              {service.package_2_features.slice(0, 3).map((feature, idx) => (
                                                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-1">
                                                  <Check className="h-3 w-3 text-primary" />
                                                  {feature}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => updatePackageQuantity(service.id, "package2", -1)}
                                            disabled={packages.package2 <= 0}
                                          >
                                            -
                                          </Button>
                                          <span className="w-8 text-center font-bold">{packages.package2}</span>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => updatePackageQuantity(service.id, "package2", 1)}
                                          >
                                            +
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Total */}
                                    <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                                      <span className="font-semibold text-lg">Tổng tiền:</span>
                                      <span className="text-2xl font-bold text-primary">{formatVND(total)}</span>
                                    </div>
                                    
                                    {/* Proceed button */}
                                    <Button 
                                      className="w-full bg-primary hover:bg-primary/90 font-bold text-lg py-6"
                                      onClick={() => handleProceedToBooking(service)}
                                      disabled={total === 0}
                                    >
                                      Tiếp tục đặt lịch
                                      <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
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
                  MUỐN CÓ ẢNH SẢN PHẨM ĐẸP? LIÊN HỆ NGAY
                </h2>
                <p className="text-primary-foreground/90 text-lg">
                  Để được tư vấn và đặt lịch chụp ảnh sản phẩm thuận tiện nhất
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