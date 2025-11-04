import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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

  return (
    <>
      <Helmet>
        <title>Dịch Vụ Chụp Ảnh - SnapPup Studio</title>
        <meta name="description" content="Khám phá các gói dịch vụ chụp ảnh chuyên nghiệp tại SnapPup: CV Profile, Couple, Gia đình, Tốt nghiệp và nhiều hơn nữa." />
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

          {/* Services Grid */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {services.map((service, index) => (
                  <Card 
                    key={service.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-0">
                      <div className={`grid md:grid-cols-2 gap-0 ${index % 2 === 1 ? 'md:grid-flow-dense' : ''}`}>
                        {/* Image */}
                        <div className={`relative h-64 md:h-auto ${index % 2 === 1 ? 'md:col-start-2' : ''}`}>
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Content */}
                        <div className="p-8 flex flex-col justify-center space-y-4">
                          <h2 className="text-3xl font-display font-bold text-foreground">
                            {service.title}
                          </h2>
                          <p className="text-muted-foreground">
                            {service.description}
                          </p>
                          <div className="text-3xl font-bold text-primary">
                            CHỈ TỪ {service.price}
                          </div>
                          <Button 
                            onClick={() => handleServiceClick(service.id)}
                            className="w-fit bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8"
                          >
                            CHI TIẾT
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">
                  MUỐN CÓ ẢNH ĐẸP HAY LIÊN HỆ NGAY CHO CHÚNG TÔI
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
