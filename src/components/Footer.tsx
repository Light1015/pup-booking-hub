import { Link } from "react-router-dom";
import { Camera, Facebook, Instagram, Mail, Phone, MapPin, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#001D4D] text-[#D89825] border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              {/* <Camera className="h-8 w-8 text-primary" /> */}
              <span className="text-2xl font-display font-bold">SnapPup</span>
            </Link>
            <p className="text-sm text-[#FFFFFF]">
              Lưu giữ những khoảnh khắc đáng nhớ nhất
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/profile.php?id=61581392236844" className="text-accent hover:text-accent/80 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-accent hover:text-accent/80 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-accent hover:text-accent/80 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-accent hover:text-accent/80 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 ">
              <li>
                <Link to="/" className="text-sm text-[#FFFFFF] hover:text-primary transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-sm text-[#FFFFFF] hover:text-primary transition-colors">
                  Thư viện
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-[#FFFFFF] hover:text-primary transition-colors">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-sm text-[#FFFFFF] hover:text-primary transition-colors">
                  Đặt lịch
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Dịch vụ</h3>
            <ul className="space-y-2 text-sm text-[#FFFFFF]">
              <li>Chụp ảnh nền trơn</li>
              <li>Chụp ảnh layout/concept</li>
              <li>Chụp ảnh chụp với người mẫu</li>
              <li>Chụp ảnh sản phẩm & thương hiệu</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-sm text-[#FFFFFF]">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>037.213.0010</span>
              </li>
              <li className="flex items-start space-x-2 text-sm text-[#FFFFFF]">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>snappup@gmail.com</span>
              </li>
              <li className="flex items-start space-x-2 text-sm text-[#FFFFFF]">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Cần Thơ, Việt Nam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-[#FFFFFF]">
          <p>&copy; {new Date().getFullYear()} SnapPup Studio. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
