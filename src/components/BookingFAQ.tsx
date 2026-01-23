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
    answer:
      "Thông thường, khách hàng cần đặt cọc 30–50% giá trị gói chụp để giữ lịch. Mức cọc cụ thể sẽ được xác nhận sau khi chọn dịch vụ.",
  },
  {
    question: "Có thể hoàn tiền cọc không?",
    answer:
      "Nếu bạn hủy lịch trước 24 giờ, tiền cọc sẽ được hoàn lại 100%. Nếu hủy trong vòng 24 giờ, tiền cọc sẽ không được hoàn.",
  },
  {
    question: "Buổi chụp kéo dài bao lâu?",
    answer:
      "Thời gian chụp phụ thuộc vào số lượng sản phẩm và gói dịch vụ, thường từ 1–3 giờ cho mỗi buổi chụp.",
  },
  {
    question: "Tôi nhận ảnh sau bao lâu?",
    answer:
      "Ảnh sẽ được giao trong vòng 48 giờ (2 ngày làm việc) sau buổi chụp.",
  },
  {
    question: "Cần chuẩn bị gì trước buổi chụp?",
    answer:
      "Bạn chỉ cần chuẩn bị:\n\n• Sản phẩm cần chụp\n• Yêu cầu về concept, phong cách hoặc hình mẫu tham khảo (nếu có)\n\nSnapPup sẽ hỗ trợ phần setup và tư vấn chi tiết.",
  },
  {
    question: "Có thể dời lịch được không?",
    answer:
      "Có, bạn có thể dời lịch nếu thông báo trước ít nhất 1 ngày. Vui lòng liên hệ hotline để được hỗ trợ.",
  },
  {
    question: "Có chụp tại nhà không?",
    answer:
      "Hiện tại chúng tôi chỉ chụp tại studio. Nếu có nhu cầu chụp outdoor, vui lòng liên hệ để được tư vấn.",
  },
  {
    question: "Tôi có thể chụp nhiều sản phẩm trong một buổi không?",
    answer:
      "Có. SnapPup có các gói chụp nhiều sản phẩm. Vui lòng ghi rõ số lượng sản phẩm khi đặt lịch để được tư vấn phù hợp.",
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
