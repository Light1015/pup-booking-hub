import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Gallery = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: galleryItems = [] } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_images").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredItems = activeFilter === "all" ? galleryItems : galleryItems.filter((item: any) => item.category === activeFilter);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-display font-bold mb-4">Thư viện ảnh</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Khám phá những khoảnh khắc đáng yêu của các bé cưng
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((filter: any) => (
            <Button
              key={filter.name}
              variant={activeFilter === filter.name ? "default" : "outline"}
              onClick={() => setActiveFilter(filter.name)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item: any) => (
            <div
              key={item.id}
              className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer"
            >
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <p className="p-6 text-xl font-semibold">{item.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Hiển thị {filteredItems.length} ảnh
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Gallery;
