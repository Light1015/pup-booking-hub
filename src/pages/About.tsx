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
        "Đội ngũ nhiếp ảnh gia có kinh nghiệm lâu năm trong lĩnh vực chụp ảnh",
    },
    {
      icon: Heart,
      title: "Tiện lợi",
      description:
        "Đặt lịch chụp ảnh, makeup và trang phục nhanh chóng trên một nền tảng duy nhất, tiết kiệm thời gian và công sức",
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
            SnapPup là nền tảng đặt lịch chụp ảnh trực tuyến, được xây dựng nhằm
            mang đến trải nghiệm nhanh chóng – minh bạch – trọn gói cho khách
            hàng trong thời đại số. Chúng tôi kết nối khách hàng với các studio,
            nhiếp ảnh gia, dịch vụ makeup và cho thuê trang phục uy tín, giúp
            quá trình chuẩn bị cho một buổi chụp ảnh trở nên đơn giản và thuận
            tiện hơn bao giờ hết.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold mb-4">Giá trị cốt lõi</h2>
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
            <h2 className="text-3xl font-display font-bold">Câu chuyện của chúng tôi</h2>
            <p className="text-muted-foreground leading-relaxed">
              SnapPup được tạo ra với mong muốn đơn giản hóa việc đặt lịch chụp
              ảnh trong thời đại số. Chúng tôi nhận thấy khách hàng thường mất
              nhiều thời gian tìm kiếm concept, so sánh giá và liên hệ nhiều
              dịch vụ riêng lẻ. SnapPup ra đời như một nền tảng kết nối trọn
              gói, giúp khách hàng dễ dàng khám phá ý tưởng, lựa chọn dịch vụ và
              đặt lịch chụp ảnh nhanh chóng, minh bạch trên một nền tảng duy
              nhất.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-display font-bold">Đội ngũ của chúng tôi</h2>
            <p className="text-muted-foreground leading-relaxed">
              Đội ngũ SnapPup là những người trẻ đam mê nhiếp ảnh và công nghệ.
              Chúng tôi tập trung xây dựng một nền tảng thân thiện, đáng tin
              cậy, giúp khách hàng và các studio, nhiếp ảnh gia, dịch vụ makeup
              – trang phục kết nối hiệu quả và phát triển bền vững cùng nhau.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
