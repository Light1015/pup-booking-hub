import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Users, Award, Heart } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Camera,
      title: "Chuyên nghiệp",
      description:
        "Cung cấp dịch vụ chụp ảnh sản phẩm theo quy trình rõ ràng, phù hợp cho bán hàng và marketing.",
    },
    {
      icon: Heart,
      title: "Tiện lợi",
      description:
        "Khách hàng có thể xem dịch vụ, đặt lịch và theo dõi trạng thái booking trực tiếp trên website.",
    },
    {
      icon: Award,
      title: "Chất lượng",
      description: "Cam kết mang đến những bức ảnh chất lượng cao nhất",
    },
    {
      icon: Users,
      title: "Tận tâm",
      description: "Luôn lắng nghe và đáp ứng mọi yêu cầu của khách hàng",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-display font-bold">Về SnapPup Studio</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            SnapPup Studio là nền tảng hỗ trợ đặt lịch chụp ảnh sản phẩm trực
            tuyến, được xây dựng nhằm giúp cá nhân và doanh nghiệp dễ dàng tiếp
            cận dịch vụ chụp ảnh chuyên nghiệp một cách nhanh chóng – rõ ràng –
            tiện lợi. SnapPup tập trung vào việc đơn giản hóa quy trình đặt
            lịch, quản lý dịch vụ và theo dõi trạng thái booking trên một hệ
            thống tập trung.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold mb-4">
              Giá trị cốt lõi
            </h2>
            <p className="text-muted-foreground text-lg">
              Những gì chúng tôi mang đến cho bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-display font-bold">
              Câu chuyện của chúng tôi
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              SnapPup được phát triển từ nhu cầu thực tế trong việc đặt lịch và
              quản lý dịch vụ chụp ảnh sản phẩm. Nhóm nhận thấy khách hàng
              thường gặp khó khăn khi liên hệ studio, theo dõi lịch chụp và quản
              lý thông tin dịch vụ. Từ đó, SnapPup ra đời như một giải pháp số
              hóa quy trình, giúp việc đặt lịch chụp ảnh sản phẩm trở nên đơn
              giản và hiệu quả hơn.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-display font-bold">
              Đội ngũ của chúng tôi
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Đội ngũ SnapPup gồm các thành viên có nền tảng về công nghệ và
              quản lý hệ thống, tập trung xây dựng một nền tảng ổn định, dễ sử
              dụng, hỗ trợ tốt cho cả khách hàng và đơn vị cung cấp dịch vụ chụp
              ảnh.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
