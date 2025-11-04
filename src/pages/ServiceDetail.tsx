import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import { Service } from "./Services";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: service, isLoading } = useQuery({
    queryKey: ["service", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Service | null;
    },
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!service) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Không tìm thấy dịch vụ</h1>
            <Button onClick={() => navigate('/services')}>
              Quay lại trang dịch vụ
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{service.title} - SnapPup Studio</title>
        <meta name="description" content={service.description} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-1">
          {/* Back Button */}
          <section className="py-6 bg-secondary/30">
            <div className="container mx-auto px-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/services')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại dịch vụ
              </Button>
            </div>
          </section>

          {/* Service Details */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                {/* Image */}
                <div className="space-y-6">
                  <Card className="overflow-hidden">
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-full aspect-[4/3] object-cover"
                    />
                  </Card>
                  
                  {/* Info Card - only show if content exists */}
                  {service.info_title_1 && service.info_content_1 && (
                    <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                      <CardContent className="p-6 space-y-4">
                        <h3 className="text-xl font-bold text-foreground">
                          {service.info_title_1}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {service.info_content_1}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                      {service.title}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      {service.description}
                    </p>
                  </div>

                  {/* Additional Info Sections */}
                  {(service.info_title_2 || service.info_title_3) && (
                    <Card className="border-2 border-primary">
                      <CardContent className="p-8 space-y-6">
                        {service.info_title_2 && service.info_content_2 && (
                          <div>
                            <h2 className="text-2xl font-display font-bold mb-4">
                              {service.info_title_2}
                            </h2>
                            <p className="text-muted-foreground">
                              {service.info_content_2}
                            </p>
                          </div>
                        )}

                        {service.info_title_3 && service.info_content_3 && (
                          <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-xl font-bold">
                              {service.info_title_3}
                            </h3>
                            <p className="text-muted-foreground">
                              {service.info_content_3}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Pricing Packages - only show if data exists */}
                  {(service.package_1_name || service.package_2_name) && (
                    <div className="space-y-4">
                      <h2 className="text-3xl font-display font-bold text-center">
                        {service.pricing_title || "Bảng giá"}
                      </h2>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Package 1 */}
                        {service.package_1_name && (
                          <Card className="border-2 border-primary bg-primary text-primary-foreground">
                            <CardContent className="p-6 space-y-4">
                              <div className="text-center space-y-2">
                                <h3 className="text-2xl font-bold">{service.package_1_name}</h3>
                                <div className="text-5xl font-bold">{service.package_1_price}</div>
                              </div>
                              {service.package_1_features && Array.isArray(service.package_1_features) && (
                                <ul className="space-y-3 pt-4">
                                  {service.package_1_features.map((feature: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* Package 2 */}
                        {service.package_2_name && (
                          <Card className="border-2 border-accent bg-accent text-accent-foreground">
                            <CardContent className="p-6 space-y-4">
                              <div className="text-center space-y-2">
                                <h3 className="text-2xl font-bold">{service.package_2_name}</h3>
                                <div className="text-5xl font-bold">{service.package_2_price}</div>
                              </div>
                              {service.package_2_features && Array.isArray(service.package_2_features) && (
                                <ul className="space-y-3 pt-4">
                                  {service.package_2_features.map((feature: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      size="lg"
                      onClick={() => navigate('/booking')}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                    >
                      ĐẶT LỊCH NGAY
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate('/contact')}
                      className="flex-1 font-bold"
                    >
                      LIÊN HỆ TƯ VẤN
                    </Button>
                  </div>
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

export default ServiceDetail;
