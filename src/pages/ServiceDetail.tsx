import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import { Service } from "./Services";
import { Helmet } from "react-helmet";

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);

  useEffect(() => {
    const savedServices = localStorage.getItem("services");
    if (savedServices) {
      const services: Service[] = JSON.parse(savedServices);
      const foundService = services.find(s => s.id === id);
      setService(foundService || null);
    }
  }, [id]);

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
                      src={service.image}
                      alt={service.title}
                      className="w-full aspect-[4/3] object-cover"
                    />
                  </Card>
                  
                  {/* Info Card */}
                  <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-xl font-bold text-foreground">
                        Anh/Chị CV là gì?
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Với nền kinh tế, anh CV chính chủ tùy thuộc vào nghề nghiệp hoặc lĩnh vực công việc mà bạn muốn ứng tuyển. Tuy nhiên, chúng tôi cung cấp các dịch vụ chụp ảnh CV chuyên nghiệp với nhiều phong cách khác nhau để bạn lựa chọn phù hợp nhất với mục đích của mình. Mỗi bức ảnh CV đều được chăm chút kỹ lưỡng, giúp bạn tự tin hơn trong quá trình tìm kiếm việc làm.
                      </p>
                    </CardContent>
                  </Card>
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

                  {/* Pricing Section */}
                  <Card className="border-2 border-primary">
                    <CardContent className="p-8 space-y-6">
                      <div>
                        <h2 className="text-2xl font-display font-bold mb-4">
                          Sự chính chủ và nghiêm túc của bạn
                        </h2>
                        <p className="text-muted-foreground">
                          Với mỗi khách hàng, anh CV chính chủ tùy thuộc vào nghề nghiệp hoặc lĩnh vực công việc mà bạn muốn ứng tuyển. Tuy nhiên, chúng tôi cung cấp các dịch vụ chụp ảnh CV chuyên nghiệp với nhiều phong cách khác nhau để bạn lựa chọn phù hợp nhất.
                        </p>
                      </div>

                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-xl font-bold">
                          Xây dựng thương hiệu cá nhân
                        </h3>
                        <p className="text-muted-foreground">
                          Hình ảnh CV chuyên nghiệp không chỉ giúp bạn gây ấn tượng tốt với nhà tuyển dụng mà còn xây dựng thương hiệu cá nhân của bạn. Mỗi bức ảnh đều được chăm chút kỹ lưỡng, từ góc chụp, ánh sáng đến cách trang điểm, nhằm tôn lên vẻ đẹp tự nhiên và sự tự tin của bạn.
                        </p>
                      </div>

                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-xl font-bold">
                          Đa dạng công dụng, sử dụng ảnh cho nhiều mục đích khác nhau
                        </h3>
                        <p className="text-muted-foreground">
                          Không chỉ dành cho hồ sơ xin việc, bộ ảnh CV còn có thể sử dụng cho các mục đích khác như hồ sơ mạng xã hội chuyên nghiệp (LinkedIn), portfolio cá nhân, danh thiếp điện tử, và nhiều mục đích khác. Chúng tôi luôn đảm bảo chất lượng ảnh cao nhất để bạn có thể sử dụng linh hoạt.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing Packages */}
                  <div className="space-y-4">
                    <h2 className="text-3xl font-display font-bold text-center">
                      Bảng giá chụp ảnh CV tại SNAPPUP
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Individual Package */}
                      <Card className="border-2 border-primary bg-primary text-primary-foreground">
                        <CardContent className="p-6 space-y-4">
                          <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold">GÓI CÁ NHÂN</h3>
                            <div className="text-5xl font-bold">400K</div>
                            <p className="text-sm opacity-90">/ 1 người</p>
                          </div>
                          <ul className="space-y-3 pt-4">
                            {[
                              "Chụp trọn gói cho một người",
                              "Tư vấn trang phục và makeup",
                              "Chọn phông nền theo yêu cầu",
                              "Chụp nhiều pose khác nhau",
                              "Giao ảnh trong 48h (2 ngày làm việc)"
                            ].map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Group Package */}
                      <Card className="border-2 border-accent bg-accent text-accent-foreground">
                        <CardContent className="p-6 space-y-4">
                          <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold">GÓI NHÓM</h3>
                            <div className="text-5xl font-bold">100K</div>
                            <p className="text-sm opacity-90">/ 1 người</p>
                          </div>
                          <ul className="space-y-3 pt-4">
                            {[
                              "Áp dụng từ 5 người trở lên",
                              "Tư vấn trang phục chung cho cả nhóm",
                              "Đồng giá chỉ 100k/người",
                              "Chụp riêng từng người theo style nhất quán",
                              "Tặng ảnh chung cho cả nhóm (nếu có yêu cầu)"
                            ].map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

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
