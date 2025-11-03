import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Users, Award, Heart } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Camera,
      title: "Chuyên nghiệp",
      description: "Đội ngũ nhiếp ảnh gia có kinh nghiệm lâu năm trong lĩnh vực chụp ảnh thú cưng",
    },
    {
      icon: Heart,
      title: "Yêu thương",
      description: "Chúng tôi đối xử với mỗi bé cưng như thành viên trong gia đình",
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
            Chúng tôi là một studio chụp ảnh thú cưng chuyên nghiệp tại Hà Nội, 
            với sứ mệnh lưu giữ những khoảnh khắc đáng yêu nhất của các bé cưng. 
            Với hơn 5 năm kinh nghiệm, chúng tôi tự hào đã phục vụ hàng nghìn 
            khách hàng và tạo ra vô số kỷ niệm đẹp.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold mb-4">Giá trị cốt lõi</h2>
            <p className="text-muted-foreground text-lg">
              Những gì chúng tôi mang đến cho bạn và bé cưng
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
              SnapPup Studio được thành lập vào năm 2019 bởi một nhóm nhiếp ảnh gia 
              yêu động vật. Chúng tôi tin rằng mỗi thú cưng đều có cá tính riêng và 
              những khoảnh khắc đáng yêu cần được lưu giữ một cách chuyên nghiệp.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Với trang thiết bị hiện đại và không gian studio rộng rãi, thoải mái, 
              chúng tôi tạo ra môi trường lý tưởng để các bé cưng có thể thoải mái 
              thể hiện bản thân. Mỗi buổi chụp đều được chuẩn bị kỹ lưỡng để đảm bảo 
              cả bé cưng và chủ nhân đều có trải nghiệm tuyệt vời nhất.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-display font-bold">Đội ngũ của chúng tôi</h2>
            <p className="text-muted-foreground leading-relaxed">
              Đội ngũ nhiếp ảnh gia của SnapPup không chỉ có chuyên môn cao mà còn 
              là những người yêu động vật thực sự. Chúng tôi hiểu rằng việc chụp ảnh 
              thú cưng đòi hỏi sự kiên nhẫn, yêu thương và kỹ năng giao tiếp đặc biệt 
              với các bé.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
