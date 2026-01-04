import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, X, ChevronLeft, ChevronRight, Image as ImageIcon, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Album {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  image_urls: string[] | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  label: string;
  image_url: string | null;
  image_urls: string[] | null;
}

const Gallery = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [likedAlbums, setLikedAlbums] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("snappup_liked_albums");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_categories").select("*").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: albums = [] } = useQuery({
    queryKey: ["albums"],
    queryFn: async () => {
      const { data, error } = await supabase.from("photo_albums").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Album[];
    },
  });

  // Filter albums by category
  const filteredAlbums = activeFilter === "all" 
    ? albums 
    : albums.filter((album) => {
        const category = categories.find(c => c.id === album.category_id);
        return category?.name === activeFilter;
      });

  // Toggle like for an album
  const toggleLike = (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = new Set(likedAlbums);
    if (newLiked.has(albumId)) {
      newLiked.delete(albumId);
    } else {
      newLiked.add(albumId);
    }
    setLikedAlbums(newLiked);
    localStorage.setItem("snappup_liked_albums", JSON.stringify([...newLiked]));
  };

  // Open album detail
  const openAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setSelectedImageIndex(0);
  };

  // Navigate between images in album
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedAlbum?.image_urls) {
      setSelectedImageIndex((prev) => 
        prev < selectedAlbum.image_urls!.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedAlbum?.image_urls) {
      setSelectedImageIndex((prev) => 
        prev > 0 ? prev - 1 : selectedAlbum.image_urls!.length - 1
      );
    }
  };

  // Get category label for an album
  const getCategoryLabel = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category?.label;
  };

  // Get cover image for album
  const getCoverImage = (album: Album) => {
    if (album.image_urls && album.image_urls.length > 0) {
      return album.image_urls[0];
    }
    return "/placeholder.svg";
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-display font-bold mb-4">Kho ảnh đẹp</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Khám phá những khoảnh khắc đáng yêu của các bé cưng được chụp tại SnapPup Studio
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            onClick={() => setActiveFilter("all")}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Tất cả
          </Button>
          {categories.map((filter) => (
            <Button
              key={filter.name}
              variant={activeFilter === filter.name ? "default" : "outline"}
              onClick={() => setActiveFilter(filter.name)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Albums Grid - Instagram-like layout */}
        {filteredAlbums.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Chưa có album nào trong danh mục này</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAlbums.map((album) => {
              const isLiked = likedAlbums.has(album.id);
              const imageCount = album.image_urls?.length || 0;
              const categoryLabel = getCategoryLabel(album.category_id);
              
              return (
                <Card 
                  key={album.id}
                  className="group cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300"
                  onClick={() => openAlbum(album)}
                >
                  <CardContent className="p-0 relative">
                    {/* Cover Image */}
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      <img
                        src={getCoverImage(album)}
                        alt={album.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">{album.name}</h3>
                          {album.description && (
                            <p className="text-white/80 text-sm line-clamp-2">{album.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Image count badge */}
                      {imageCount > 1 && (
                        <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {imageCount}
                        </div>
                      )}
                      
                      {/* Category badge */}
                      {categoryLabel && (
                        <Badge className="absolute top-3 left-3 bg-primary/90">
                          {categoryLabel}
                        </Badge>
                      )}
                      
                      {/* Like button */}
                      <button
                        onClick={(e) => toggleLike(album.id, e)}
                        className={cn(
                          "absolute bottom-3 right-3 p-2 rounded-full transition-all duration-200",
                          isLiked 
                            ? "bg-red-500 text-white scale-110" 
                            : "bg-white/90 text-gray-600 hover:bg-white opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
                      </button>
                    </div>
                    
                    {/* Album info below image */}
                    <div className="p-3 bg-background">
                      <h3 className="font-semibold line-clamp-1">{album.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        {album.price && (
                          <span className="text-sm text-primary font-medium">{album.price}</span>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Heart className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Hiển thị {filteredAlbums.length} album
            {likedAlbums.size > 0 && ` • ${likedAlbums.size} album đã thích`}
          </p>
        </div>
      </div>

      {/* Album Detail Dialog */}
      <Dialog open={!!selectedAlbum} onOpenChange={() => setSelectedAlbum(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
          {selectedAlbum && (
            <div className="flex flex-col md:flex-row h-full">
              {/* Image viewer */}
              <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
                {selectedAlbum.image_urls && selectedAlbum.image_urls.length > 0 ? (
                  <>
                    <img
                      src={selectedAlbum.image_urls[selectedImageIndex]}
                      alt={`${selectedAlbum.name} - Ảnh ${selectedImageIndex + 1}`}
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                    
                    {/* Navigation arrows */}
                    {selectedAlbum.image_urls.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
                        >
                          <ChevronLeft className="h-6 w-6 text-white" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
                        >
                          <ChevronRight className="h-6 w-6 text-white" />
                        </button>
                        
                        {/* Image counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                          {selectedImageIndex + 1} / {selectedAlbum.image_urls.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-white/50 text-center p-8">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4" />
                    <p>Chưa có ảnh trong album này</p>
                  </div>
                )}
              </div>
              
              {/* Album info sidebar */}
              <div className="w-full md:w-80 p-6 bg-background overflow-y-auto">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl">{selectedAlbum.name}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Category */}
                  {getCategoryLabel(selectedAlbum.category_id) && (
                    <Badge className="mb-2">{getCategoryLabel(selectedAlbum.category_id)}</Badge>
                  )}
                  
                  {/* Price */}
                  {selectedAlbum.price && (
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                      <span className="text-muted-foreground">Giá</span>
                      <span className="text-xl font-bold text-primary">{selectedAlbum.price}</span>
                    </div>
                  )}
                  
                  {/* Description */}
                  {selectedAlbum.description && (
                    <div>
                      <h4 className="font-semibold mb-2">Mô tả</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {selectedAlbum.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Image thumbnails */}
                  {selectedAlbum.image_urls && selectedAlbum.image_urls.length > 1 && (
                    <div>
                      <h4 className="font-semibold mb-2">Tất cả ảnh ({selectedAlbum.image_urls.length})</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedAlbum.image_urls.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={cn(
                              "aspect-square rounded-md overflow-hidden border-2 transition-all",
                              selectedImageIndex === index 
                                ? "border-primary ring-2 ring-primary/20" 
                                : "border-transparent hover:border-muted-foreground/20"
                            )}
                          >
                            <img
                              src={url}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Like button */}
                  <Button
                    variant={likedAlbums.has(selectedAlbum.id) ? "default" : "outline"}
                    className="w-full"
                    onClick={(e) => toggleLike(selectedAlbum.id, e)}
                  >
                    <Heart className={cn(
                      "h-5 w-5 mr-2",
                      likedAlbums.has(selectedAlbum.id) && "fill-current"
                    )} />
                    {likedAlbums.has(selectedAlbum.id) ? "Đã thích" : "Thích album này"}
                  </Button>
                  
                  {/* Book now button */}
                  <Button className="w-full" asChild>
                    <a href="/booking">Đặt lịch chụp ngay</a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Gallery;
