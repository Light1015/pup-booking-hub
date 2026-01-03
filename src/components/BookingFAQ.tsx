import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Tôi cần đặt cọc bao nhiêu?",
    answer: "Phí đặt cọc là 300,000 VNĐ. Số tiền này sẽ được trừ vào tổng hóa đơn sau buổi chụp.",
  },
  {
    question: "Có thể hoàn tiền cọc không?",
    answer: "Nếu bạn hủy lịch trước 24 giờ, tiền cọc sẽ được hoàn lại 100%. Nếu hủy trong vòng 24 giờ, tiền cọc sẽ không được hoàn.",
  },
  {
    question: "Buổi chụp kéo dài bao lâu?",
    answer: "Thời gian chụp khoảng 1-2 giờ tùy theo gói dịch vụ và số lượng thú cưng.",
  },
  {
    question: "Tôi nhận ảnh sau bao lâu?",
    answer: "Ảnh sẽ được giao trong vòng 48 giờ (2 ngày làm việc) sau buổi chụp.",
  },
  {
    question: "Cần chuẩn bị gì trước buổi chụp?",
    answer: "Hãy đảm bảo thú cưng được tắm rửa sạch sẽ. Bạn có thể mang theo đồ chơi, phụ kiện yêu thích của bé.",
  },
  {
    question: "Có thể dời lịch được không?",
    answer: "Có, bạn có thể dời lịch nếu thông báo trước ít nhất 1 ngày. Vui lòng liên hệ hotline để được hỗ trợ.",
  },
  {
    question: "Có chụp tại nhà không?",
    answer: "Hiện tại chúng tôi chỉ chụp tại studio. Nếu có nhu cầu chụp outdoor, vui lòng liên hệ để được tư vấn.",
  },
  {
    question: "Có thể chụp nhiều thú cưng không?",
    answer: "Có! Chúng tôi có các gói chụp nhóm hoặc gia đình. Vui lòng ghi chú số lượng thú cưng khi đặt lịch.",
  },
];

export function BookingFAQ() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Câu hỏi thường gặp
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
