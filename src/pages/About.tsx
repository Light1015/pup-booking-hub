import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Shield, Zap, Lightbulb, Palette, Target, Sparkles, Mail, Phone, Users } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  display_order: number;
  is_active: boolean;
}

const About = () => {
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["teamMembersPublic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const coreValues = [
    {
      icon: Heart,
      title: "Tâm (Dedicated)",
      description:
        "Chúng tôi đặt cả tâm huyết vào từng set-up, tỉ mỉ trong từng khâu hậu kỳ để đảm bảo mỗi bức ảnh bàn giao đều là một tác phẩm hoàn hảo nhất.",
    },
    {
      icon: Shield,
      title: "Tín (Reliable)",
      description:
        "Uy tín là nền tảng của SnapPup. Chúng tôi cam kết đúng tiến độ, đúng chất lượng và minh bạch trong mọi chi phí ngay từ đầu.",
    },
    {
      icon: Zap,
      title: "Tốc (Speed)",
      description:
        "Trong kỷ nguyên kinh doanh số, thời gian là vàng. SnapPup tối ưu quy trình để bàn giao hình ảnh nhanh nhất (24h - 48h), giúp khách hàng kịp tiến độ chiến dịch marketing.",
    },
    {
      icon: Lightbulb,
      title: "Sáng (Creative)",
      description:
        "Luôn làm mới mình với những concept độc đáo, không rập khuôn. Chúng tôi không chỉ chụp sản phẩm, chúng tôi tạo ra xu hướng hình ảnh để sản phẩm của bạn dẫn đầu thị trường.",
    },
    {
      icon: Palette,
      title: "Mỹ (Aesthetic)",
      description:
        "Đề cao tính thẩm mỹ và sự tinh tế. Hình ảnh của SnapPup không chỉ đẹp về thị giác mà còn phải đúng 'gu' của đối tượng khách hàng mục tiêu mà bạn hướng tới.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              Về chúng tôi
            </Badge>
            <h1 className="text-5xl font-display font-bold">
              SnapPup – Người kể chuyện thương hiệu bằng hình ảnh
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Tại SnapPup, chúng tôi không chỉ "chụp ảnh", chúng tôi kiến tạo giá trị cho sản phẩm. 
              Với biểu tượng chú chó thông minh và nhạy bén trong logo, SnapPup cam kết sự tận tâm, 
              tốc độ và độ chính xác cao nhất trong từng khung hình.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-2 border-primary/20">
          <CardContent className="p-8 md:p-12">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
                <Target className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-display font-bold">Sứ mệnh</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Giúp các doanh nghiệp vừa và nhỏ (SMEs) tại Cần Thơ và miền Tây sở hữu bộ nhận diện 
                  sản phẩm chuyên nghiệp với chi phí tối ưu. Chúng tôi tin rằng mọi sản phẩm đều 
                  xứng đáng được thể hiện đẹp nhất.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Core Values */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-1.5">
              <Sparkles className="h-4 w-4 mr-1" />
              Những gì định nghĩa chúng tôi
            </Badge>
            <h2 className="text-4xl font-display font-bold mb-4">
              Giá trị cốt lõi
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              5 giá trị cốt lõi tạo nên thương hiệu SnapPup
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreValues.map((value, index) => (
              <Card 
                key={index} 
                className={`text-center hover:shadow-lg transition-all duration-300 ${
                  index === 4 ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <CardContent className="p-8 space-y-4">
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

      {/* Team Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <Badge variant="outline" className="px-4 py-1.5">
              <Users className="h-4 w-4 mr-1" />
              Đội ngũ
            </Badge>
            <h2 className="text-4xl font-display font-bold">
              Đội ngũ của chúng tôi
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Đội ngũ SnapPup gồm các nhiếp ảnh gia, stylist và chuyên gia hậu kỳ giàu kinh nghiệm, 
              luôn cập nhật xu hướng và công nghệ mới nhất.
            </p>
          </div>

          {teamMembers.length > 0 ? (
            <Tabs defaultValue={teamMembers[0]?.id} className="w-full">
              <TabsList className="flex flex-wrap justify-center gap-2 h-auto bg-transparent p-0 mb-8">
                {teamMembers.map((member) => (
                  <TabsTrigger
                    key={member.id}
                    value={member.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 rounded-full border data-[state=active]:border-primary transition-all"
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {member.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {teamMembers.map((member) => (
                <TabsContent key={member.id} value={member.id} className="mt-0">
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <CardContent className="p-0">
                      <div className="grid md:grid-cols-2 gap-0">
                        {/* Avatar/Image Section */}
                        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex items-center justify-center min-h-[300px]">
                          <Avatar className="h-48 w-48 border-4 border-background shadow-xl">
                            <AvatarImage 
                              src={member.avatar_url || undefined} 
                              className="object-cover"
                            />
                            <AvatarFallback className="text-6xl bg-primary/10">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Info Section */}
                        <div className="p-8 flex flex-col justify-center space-y-6">
                          <div>
                            <h3 className="text-3xl font-display font-bold">{member.name}</h3>
                            <p className="text-primary font-medium text-lg">{member.role}</p>
                          </div>

                          {member.bio && (
                            <p className="text-muted-foreground leading-relaxed">
                              {member.bio}
                            </p>
                          )}

                          <div className="space-y-3">
                            {member.email && (
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                  <Mail className="h-5 w-5" />
                                </div>
                                <span>{member.email}</span>
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                  <Phone className="h-5 w-5" />
                                </div>
                                <span>{member.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg text-muted-foreground">
                  Thông tin đội ngũ đang được cập nhật...
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Story */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="px-4 py-1.5">
                <Sparkles className="h-4 w-4 mr-1" />
                Câu chuyện
              </Badge>
              <h2 className="text-3xl font-display font-bold">
                Câu chuyện của SnapPup
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                SnapPup được thành lập từ niềm đam mê nhiếp ảnh và mong muốn hỗ trợ các doanh nghiệp 
                địa phương phát triển. Nhận thấy nhiều shop online và doanh nghiệp nhỏ tại Cần Thơ 
                gặp khó khăn trong việc có được hình ảnh sản phẩm chất lượng với chi phí hợp lý, 
                chúng tôi quyết định xây dựng một studio chuyên nghiệp với quy trình tối ưu, 
                giúp mọi sản phẩm đều có cơ hội tỏa sáng.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
