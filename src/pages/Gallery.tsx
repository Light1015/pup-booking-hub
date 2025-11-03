import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import galleryCat from "@/assets/gallery-cat.jpg";
import galleryBeagle from "@/assets/gallery-beagle.jpg";
import galleryRabbit from "@/assets/gallery-rabbit.jpg";
import heroImage from "@/assets/hero-dog.jpg";

const Gallery = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", label: "Tất cả" },
    { id: "dog", label: "Chó" },
    { id: "cat", label: "Mèo" },
    { id: "other", label: "Khác" },
  ];

  const galleryItems = [
    { id: 1, image: heroImage, category: "dog", title: "Golden Retriever" },
    { id: 2, image: galleryCat, category: "cat", title: "Bengal Cat" },
    { id: 3, image: galleryBeagle, category: "dog", title: "Beagle" },
    { id: 4, image: galleryRabbit, category: "other", title: "Rabbit" },
    { id: 5, image: heroImage, category: "dog", title: "Golden Puppy" },
    { id: 6, image: galleryCat, category: "cat", title: "Kitten" },
  ];

  const filteredItems =
    activeFilter === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeFilter);

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
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "outline"}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer"
            >
              <img
                src={item.image}
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
