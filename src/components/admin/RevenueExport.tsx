import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  pet_name: string;
  pet_type: string;
  selected_category: string | null;
  status: string | null;
  workflow_status: string | null;
  expected_revenue: number | null;
  payment_confirmed_at: string | null;
  created_at: string;
}

interface RevenueExportProps {
  bookings: Booking[];
}

const WORKFLOW_LABELS: Record<string, string> = {
  pending_payment: "Chờ thanh toán",
  payment_confirmed: "Đã thanh toán",
  scheduled: "Đã lên lịch",
  shooting: "Đang chụp",
  processing: "Đang xử lý",
  editing_complete: "Hoàn thành chỉnh sửa",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

export const RevenueExport = ({ bookings }: RevenueExportProps) => {
  const [period, setPeriod] = useState<string>("month");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  // Generate period options
  const getPeriodOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();

    if (period === "month") {
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const label = `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
        options.push({ value, label });
      }
    } else {
      for (let i = 0; i < 8; i++) {
        const quarter = Math.floor((now.getMonth() - i * 3) / 3) + 1;
        const year = now.getFullYear() - Math.floor((i * 3 + (3 - (now.getMonth() % 3))) / 12);
        const adjustedQuarter = ((quarter - 1 + 4) % 4) + 1;
        const date = new Date(now);
        date.setMonth(now.getMonth() - i * 3);
        const q = Math.floor(date.getMonth() / 3) + 1;
        const y = date.getFullYear();
        const value = `${y}-Q${q}`;
        const label = `Quý ${q}/${y}`;
        if (!options.find((o) => o.value === value)) {
          options.push({ value, label });
        }
      }
    }
    return options;
  };

  const filterBookingsByPeriod = () => {
    if (!selectedPeriod) return bookings;

    return bookings.filter((b) => {
      const bookingDate = new Date(b.booking_date);
      if (period === "month") {
        const [year, month] = selectedPeriod.split("-").map(Number);
        return bookingDate.getFullYear() === year && bookingDate.getMonth() + 1 === month;
      } else {
        const [year, q] = selectedPeriod.split("-Q");
        const quarter = parseInt(q);
        const bookingQuarter = Math.floor(bookingDate.getMonth() / 3) + 1;
        return bookingDate.getFullYear() === parseInt(year) && bookingQuarter === quarter;
      }
    });
  };

  const calculateStats = () => {
    const filtered = filterBookingsByPeriod();
    const confirmedBookings = filtered.filter((b) => b.payment_confirmed_at && b.workflow_status !== "cancelled");
    const pendingBookings = filtered.filter((b) => !b.payment_confirmed_at && b.workflow_status !== "cancelled");
    const cancelledBookings = filtered.filter((b) => b.workflow_status === "cancelled");

    const confirmedRevenue = confirmedBookings.reduce((sum, b) => sum + (b.expected_revenue || 0), 0);
    const potentialRevenue = pendingBookings.reduce((sum, b) => sum + (b.expected_revenue || 0), 0);

    return {
      total: filtered.length,
      confirmed: confirmedBookings.length,
      pending: pendingBookings.length,
      cancelled: cancelledBookings.length,
      confirmedRevenue,
      potentialRevenue,
      filtered,
      confirmedBookings,
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const exportToExcel = () => {
    const stats = calculateStats();
    const periodLabel = getPeriodOptions().find((o) => o.value === selectedPeriod)?.label || "Tất cả";

    // Summary sheet data
    const summaryData = [
      ["BÁO CÁO DOANH THU - SNAPPUP STUDIO"],
      [""],
      ["Kỳ báo cáo:", periodLabel],
      ["Ngày xuất:", new Date().toLocaleDateString("vi-VN")],
      [""],
      ["TỔNG QUAN"],
      ["Tổng số booking", stats.total],
      ["Đã thanh toán", stats.confirmed],
      ["Chờ thanh toán", stats.pending],
      ["Đã hủy", stats.cancelled],
      [""],
      ["DOANH THU"],
      ["Doanh thu thực tế", stats.confirmedRevenue],
      ["Doanh thu tiềm năng", stats.potentialRevenue],
    ];

    // Detail sheet data
    const detailHeaders = [
      "STT",
      "Ngày đặt",
      "Khách hàng",
      "SĐT",
      "Email",
      "Loại dịch vụ",
      "Trạng thái",
      "Doanh thu (VND)",
    ];
    const detailData = stats.filtered.map((b, index) => [
      index + 1,
      new Date(b.booking_date).toLocaleDateString("vi-VN"),
      b.name,
      b.phone,
      b.email,
      b.selected_category || "Chưa chọn",
      WORKFLOW_LABELS[b.workflow_status || ""] || b.workflow_status,
      b.expected_revenue || 0,
    ]);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1["!cols"] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Tổng quan");

    // Detail sheet
    const ws2 = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailData]);
    ws2["!cols"] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 18 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "Chi tiết");

    // Export
    const fileName = `bao-cao-doanh-thu_${selectedPeriod || "all"}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Đã xuất báo cáo Excel!");
  };

  const exportToPDF = () => {
    const stats = calculateStats();
    const periodLabel = getPeriodOptions().find((o) => o.value === selectedPeriod)?.label || "Tất cả";

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("BAO CAO DOANH THU - SNAPPUP STUDIO", 105, 20, { align: "center" });

    // Period info
    doc.setFontSize(11);
    doc.text(`Ky bao cao: ${periodLabel}`, 14, 35);
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString("vi-VN")}`, 14, 42);

    // Summary section
    doc.setFontSize(14);
    doc.text("TONG QUAN", 14, 55);
    doc.setFontSize(11);
    doc.text(`Tong so booking: ${stats.total}`, 20, 65);
    doc.text(`Da thanh toan: ${stats.confirmed}`, 20, 72);
    doc.text(`Cho thanh toan: ${stats.pending}`, 20, 79);
    doc.text(`Da huy: ${stats.cancelled}`, 20, 86);

    // Revenue section
    doc.setFontSize(14);
    doc.text("DOANH THU", 14, 100);
    doc.setFontSize(11);
    doc.text(`Doanh thu thuc te: ${formatCurrency(stats.confirmedRevenue)}`, 20, 110);
    doc.text(`Doanh thu tiem nang: ${formatCurrency(stats.potentialRevenue)}`, 20, 117);

    // Detail table
    if (stats.filtered.length > 0) {
      doc.setFontSize(14);
      doc.text("CHI TIET BOOKING", 14, 135);

      const tableData = stats.filtered.slice(0, 20).map((b, index) => [
        (index + 1).toString(),
        new Date(b.booking_date).toLocaleDateString("vi-VN"),
        b.name.substring(0, 15),
        b.selected_category?.substring(0, 15) || "-",
        WORKFLOW_LABELS[b.workflow_status || ""]?.substring(0, 12) || "-",
        (b.expected_revenue || 0).toLocaleString(),
      ]);

      autoTable(doc, {
        startY: 140,
        head: [["STT", "Ngay", "Khach hang", "Dich vu", "Trang thai", "Doanh thu"]],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      if (stats.filtered.length > 20) {
        const finalY = (doc as any).lastAutoTable?.finalY || 200;
        doc.setFontSize(10);
        doc.text(`... va ${stats.filtered.length - 20} booking khac`, 14, finalY + 10);
      }
    }

    // Export
    const fileName = `bao-cao-doanh-thu_${selectedPeriod || "all"}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    toast.success("Đã xuất báo cáo PDF!");
  };

  const stats = calculateStats();
  const periodOptions = getPeriodOptions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Xuất báo cáo doanh thu
        </CardTitle>
        <CardDescription>Xuất báo cáo chi tiết theo tháng hoặc quý dưới dạng PDF hoặc Excel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Loại kỳ báo cáo</Label>
            <Select
              value={period}
              onValueChange={(v) => {
                setPeriod(v);
                setSelectedPeriod("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Theo tháng</SelectItem>
                <SelectItem value="quarter">Theo quý</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Chọn kỳ</Label>
            <Select value={selectedPeriod || "all"} onValueChange={(v) => setSelectedPeriod(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn kỳ báo cáo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {periodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Tổng booking</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-sm text-muted-foreground">Đã thanh toán</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg text-center">
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.confirmedRevenue)}</p>
            <p className="text-sm text-muted-foreground">Doanh thu thực</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.potentialRevenue)}</p>
            <p className="text-sm text-muted-foreground">Tiềm năng</p>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex gap-4">
          <Button onClick={exportToExcel} className="flex-1" variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Button onClick={exportToPDF} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Xuất PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
