import { Link, useLocation } from "react-router-dom";
import { Menu, X, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import logoIcon from "@/assets/logo-icon.png";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, user } = useAuth();

  const navItems = [
    { name: "Trang chủ", path: "/" },
    { name: "Giới thiệu", path: "/about" },
    { name: "Dịch vụ", path: "/services" },
    { name: "Kho ảnh đẹp", path: "/gallery" },
    { name: "Đặt lịch", path: "/booking" },
    { name: "Liên hệ", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-[#001D4D] text-primary-foreground sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-16 gap-10">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logoIcon} alt="SnapPup" className="h-10 w-15" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-16 ">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-base font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-orange-500 text-decoration-2 decoration-orange-500 underline underline-offset-8"
                    : "text-rose-50 hover:text-orange-500"
                }`}
              >
                {item.name}
              </Link>
            ))}
           
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Social Icons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Dashboard link for admin */}
            {isAdmin && (
              <Link 
                to="/admin-dashboard" 
                className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors"
                title="Quản trị"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
            )}
            <a
              href="https://www.facebook.com/profile.php?id=61586905820620"
              className="text-accent hover:text-accent/80 transition-colors"
            >
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

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-primary bg-secondary/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
              >
                {item.name}
              </Link>
            ))}
            {/* Dashboard link for admin on mobile */}
            {isAdmin && (
              <Link
                to="/admin-dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Dashboard
              </Link>
            )}
            <div className="px-4 pt-2">
              <Button asChild className="w-full">
                <Link to="/booking" onClick={() => setIsOpen(false)}>
                  Đặt lịch ngay
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
