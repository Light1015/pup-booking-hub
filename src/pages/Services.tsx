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
import { Sparkles, Package, ArrowRight, Clock, Camera, ChevronDown, ChevronUp, Check, ShoppingCart, Layers, Users } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface Service {
  id: string;
  title: string;
  price: string;
  description: string;
  image_url: string;
  features: string[];
  pricing_title?: string;
  package_1_name?: string;
  package_1_price?: string;
  package_1_features?: string[];
  package_1_image_url?: string;
  package_2_name?: string;
  package_2_price?: string;
  package_2_features?: string[];
  package_2_image_url?: string;
  info_title_1?: string;
  info_content_1?: string;
  info_title_2?: string;
  info_content_2?: string;
  info_title_3?: string;
  info_content_3?: string;
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

  // Get service icon based on title
  const getServiceIcon = (title: string) => {
    if (title.includes("nền trơn")) return ShoppingCart;
    if (title.includes("layout") || title.includes("concept")) return Layers;
    if (title.includes("người mẫu") || title.includes("Lifestyle")) return Users;
    return Package;
  };

  // Parse price string to number (e.g., "120K" -> 120000, "2.000K" -> 2000000, "1.500.000" -> 1500000)
  const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    
    // First, extract suffix (K or M)
    const suffixMatch = priceStr.match(/[kKmM]/);
    const suffix = suffixMatch ? suffixMatch[0].toLowerCase() : null;
    
    // Remove all non-numeric characters except dots and commas
    let numericPart = priceStr.replace(/[^0-9.,]/g, "");
    
    // Handle Vietnamese format: dots as thousand separators, comma as decimal
    // If there are multiple dots, they're thousand separators (e.g., "2.000.000")
    const dotCount = (numericPart.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Multiple dots = thousand separators
      numericPart = numericPart.replace(/\./g, "");
    } else if (dotCount === 1) {
      // Single dot: check if it's a decimal or thousand separator
      // In Vietnamese format, "2.000" means 2000, not 2.0
      const parts = numericPart.split(".");
      if (parts[1] && parts[1].length === 3) {
        // It's a thousand separator (e.g., "2.000")
        numericPart = numericPart.replace(".", "");
      }
      // Otherwise keep it as decimal (e.g., "2.5")
    }
    
    // Replace comma with dot for decimal parsing
    numericPart = numericPart.replace(",", ".");
    
    const num = parseFloat(numericPart);
    if (isNaN(num)) return 0;
    
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
        <meta name="description" content="Giải pháp hình ảnh sản phẩm dành cho bạn - Chụp nền trơn, theo concept, kèm người mẫu. Giá từ 120K." />
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
                  DỊCH VỤ CHỤP ẢNH SẢN PHẨM
                </Badge>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                  Giải pháp hình ảnh sản phẩm dành cho bạn
                </h1>
                <p className="text-lg text-muted-foreground">
                  Nâng tầm thương hiệu của bạn với hình ảnh chuyên nghiệp, tối ưu doanh thu bán hàng
                </p>
              </div>
            </div>
          </section>

          {/* Services List */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-12">
                  {services.map((service, index) => {
                    const isExpanded = expandedService === service.id;
                    const packages = selectedPackages[service.id] || { package1: 0, package2: 0 };
                    const total = calculateTotal(service.id, service);
                    const ServiceIcon = getServiceIcon(service.title);
                    
                    return (
                      <Card 
                        key={service.id}
                        className="overflow-hidden transition-all duration-300 hover:shadow-xl border-2"
                      >
                        <CardContent className="p-0">
                          <div className={`grid lg:grid-cols-2 gap-0 ${index % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                            {/* Image */}
                            <div className={`relative h-64 lg:h-auto min-h-[350px] ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                              <img
                                src={service.image_url}
                                alt={service.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-4 left-4">
                                <Badge className="bg-primary text-primary-foreground px-3 py-1.5">
                                  <ServiceIcon className="h-4 w-4 mr-1" />
                                  {index === 0 ? "PHỔ BIẾN" : index === 1 ? "CONCEPT" : "LIFESTYLE"}
                                </Badge>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 flex flex-col justify-center space-y-5 bg-gradient-to-br from-muted/20 to-transparent">
                              <div>
                                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                                  {service.title}
                                </h2>
                                <p className="text-muted-foreground text-lg">
                                  {service.description}
                                </p>
                              </div>
                              
                              {/* Features */}
                              <div className="space-y-2">
                                {service.features.slice(0, 4).map((feature, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Price */}
                              <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-primary">{service.price}</span>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>3-5 ngày làm việc</span>
                                </div>
                              </div>
                              
                              {/* Booking button that expands packages */}
                              <Collapsible open={isExpanded} onOpenChange={() => handleBookingClick(service.id)}>
                                <CollapsibleTrigger asChild>
                                  <Button 
                                    size="lg"
                                    className="w-full bg-primary hover:bg-primary/90 font-bold"
                                  >
                                    {isExpanded ? (
                                      <>
                                        Đóng lại
                                        <ChevronUp className="ml-2 h-5 w-5" />
                                      </>
                                    ) : (
                                      <>
                                        Chọn gói & Đặt lịch
                                        <ChevronDown className="ml-2 h-5 w-5" />
                                      </>
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                                
                                <CollapsibleContent className="mt-6 space-y-4">
                                  {/* Package selection */}
                                  <div className="border-2 rounded-xl p-5 bg-background space-y-5">
                                    <h4 className="font-semibold text-lg flex items-center gap-2">
                                      <Package className="h-5 w-5 text-primary" />
                                      Chọn gói chụp:
                                    </h4>
                                    
                                    {/* Package 1 */}
                                    {service.package_1_name && (
                                      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                                        {service.package_1_image_url && (
                                          <img 
                                            src={service.package_1_image_url} 
                                            alt={service.package_1_name}
                                            className="w-full md:w-24 h-32 md:h-24 rounded-lg object-cover flex-shrink-0"
                                          />
                                        )}
                                        <div className="flex-1 space-y-2">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h5 className="font-semibold text-lg">{service.package_1_name}</h5>
                                            <Badge className="bg-primary/10 text-primary border-primary/30">
                                              {service.package_1_price}
                                            </Badge>
                                          </div>
                                          {service.package_1_features && service.package_1_features.length > 0 && (
                                            <ul className="space-y-1">
                                              {service.package_1_features.map((feature, idx) => (
                                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-1.5">
                                                  <Check className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                                  {feature}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                        <div className="flex items-center justify-center gap-3 mt-2 md:mt-0">
                                          <Button 
                                            size="icon" 
                                            variant="outline"
                                            onClick={() => updatePackageQuantity(service.id, "package1", -1)}
                                            disabled={packages.package1 <= 0}
                                          >
                                            -
                                          </Button>
                                          <span className="w-10 text-center font-bold text-xl">{packages.package1}</span>
                                          <Button 
                                            size="icon" 
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
                                      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                                        {service.package_2_image_url && (
                                          <img 
                                            src={service.package_2_image_url} 
                                            alt={service.package_2_name}
                                            className="w-full md:w-24 h-32 md:h-24 rounded-lg object-cover flex-shrink-0"
                                          />
                                        )}
                                        <div className="flex-1 space-y-2">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h5 className="font-semibold text-lg">{service.package_2_name}</h5>
                                            <Badge variant="outline" className="border-primary/30">
                                              {service.package_2_price}
                                            </Badge>
                                          </div>
                                          {service.package_2_features && service.package_2_features.length > 0 && (
                                            <ul className="space-y-1">
                                              {service.package_2_features.map((feature, idx) => (
                                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-1.5">
                                                  <Check className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                                  {feature}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                        <div className="flex items-center justify-center gap-3 mt-2 md:mt-0">
                                          <Button 
                                            size="icon" 
                                            variant="outline"
                                            onClick={() => updatePackageQuantity(service.id, "package2", -1)}
                                            disabled={packages.package2 <= 0}
                                          >
                                            -
                                          </Button>
                                          <span className="w-10 text-center font-bold text-xl">{packages.package2}</span>
                                          <Button 
                                            size="icon" 
                                            variant="outline"
                                            onClick={() => updatePackageQuantity(service.id, "package2", 1)}
                                          >
                                            +
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Total and proceed button */}
                                    <div className="pt-4 border-t-2 space-y-4">
                                      <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium">Tổng tiền dự kiến:</span>
                                        <span className="text-3xl font-bold text-primary">{formatVND(total)}</span>
                                      </div>
                                      
                                      <Button 
                                        size="lg"
                                        className="w-full font-bold"
                                        onClick={() => handleProceedToBooking(service)}
                                        disabled={total === 0}
                                      >
                                        Tiếp tục đặt lịch
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                      </Button>
                                    </div>
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
          <section className="py-16 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <h2 className="text-3xl font-display font-bold">
                  Cần tư vấn thêm về dịch vụ?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Liên hệ với chúng tôi để nhận báo giá chi tiết và tư vấn phù hợp với nhu cầu của bạn
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" asChild>
                    <a href="/contact">
                      Liên hệ tư vấn
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="/gallery">Xem kho ảnh mẫu</a>
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
