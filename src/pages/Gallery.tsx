import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, ChevronLeft, ChevronRight, Image as ImageIcon, FolderOpen, Filter, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

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

interface AlbumLike {
  album_id: string;
  like_count: number;
}

type SortOption = "newest" | "oldest" | "most_liked" | "name_asc" | "name_desc";

const Gallery = () => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
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

  // Fetch like counts for all albums
  const { data: albumLikes = [] } = useQuery({
    queryKey: ["album-likes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("album_likes").select("album_id, like_count");
      if (error) throw error;
      return data as AlbumLike[];
    },
  });

  // Create a map of album_id to like_count
  const likeCounts: Record<string, number> = {};
  albumLikes.forEach((like) => {
    likeCounts[like.album_id] = like.like_count;
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ albumId, increment }: { albumId: string; increment: boolean }) => {
      const { data, error } = await supabase.rpc("toggle_album_like", {
        p_album_id: albumId,
        p_increment: increment,
      });
      if (error) throw error;
      return { albumId, newCount: data as number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["album-likes"] });
    },
  });

  // Filter albums by category
  const filteredAlbums = activeFilter === "all" 
    ? albums 
    : activeFilter === "liked"
    ? albums.filter((album) => likedAlbums.has(album.id))
    : albums.filter((album) => {
        const category = categories.find(c => c.id === album.category_id);
        return category?.name === activeFilter;
      });

  // Sort albums
  const sortedAlbums = [...filteredAlbums].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return 0; // Already sorted by created_at desc
      case "oldest":
        return -1; // Reverse order
      case "most_liked":
        return (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0);
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  // Toggle like for an album
  const toggleLike = (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedAlbums.has(albumId);
    const newLiked = new Set(likedAlbums);
    
    if (isCurrentlyLiked) {
      newLiked.delete(albumId);
    } else {
      newLiked.add(albumId);
    }
    
    setLikedAlbums(newLiked);
    localStorage.setItem("snappup_liked_albums", JSON.stringify([...newLiked]));
    
    // Update server-side count
    toggleLikeMutation.mutate({ albumId, increment: !isCurrentlyLiked });
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

  // Format like count
  const formatLikeCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Mới nhất" },
    { value: "oldest", label: "Cũ nhất" },
    { value: "most_liked", label: "Nhiều tim nhất" },
    { value: "name_asc", label: "Tên A-Z" },
    { value: "name_desc", label: "Tên Z-A" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-5xl font-display font-bold">Kho ảnh đẹp</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Khám phá bộ sưu tập ảnh từ các buổi chụp tại SnapPup Studio - 
            mỗi bức ảnh là một câu chuyện được kể qua ánh sáng và màu sắc
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{albums.length}</p>
              <p className="text-sm text-muted-foreground">Album ảnh</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Danh mục</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{likedAlbums.size}</p>
              <p className="text-sm text-muted-foreground">Đã thích</p>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 mb-8 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={activeFilter === "all" ? "default" : "outline"}
                onClick={() => setActiveFilter("all")}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Tất cả ({albums.length})
              </Button>
              {categories.map((filter) => {
                const count = albums.filter(a => {
                  const cat = categories.find(c => c.id === a.category_id);
                  return cat?.name === filter.name;
                }).length;
                return (
                  <Button
                    key={filter.name}
                    size="sm"
                    variant={activeFilter === filter.name ? "default" : "outline"}
                    onClick={() => setActiveFilter(filter.name)}
                  >
                    {filter.label} ({count})
                  </Button>
                );
              })}
              <Button
                size="sm"
                variant={activeFilter === "liked" ? "default" : "outline"}
                onClick={() => setActiveFilter("liked")}
                className={activeFilter === "liked" ? "bg-red-500 hover:bg-red-600" : ""}
              >
                <Heart className={cn("h-4 w-4 mr-2", activeFilter === "liked" && "fill-current")} />
                Đã thích ({likedAlbums.size})
              </Button>
            </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Sắp xếp
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sắp xếp theo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={sortBy === option.value ? "bg-accent" : ""}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>

        {/* Albums Grid - Instagram-like layout */}
        {sortedAlbums.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {activeFilter === "liked" 
                ? "Bạn chưa thích album nào" 
                : "Chưa có album nào trong danh mục này"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedAlbums.map((album) => {
              const isLiked = likedAlbums.has(album.id);
              const imageCount = album.image_urls?.length || 0;
              const categoryLabel = getCategoryLabel(album.category_id);
              const likeCount = likeCounts[album.id] || 0;
              
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
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
                          "absolute bottom-3 right-3 p-2 rounded-full transition-all duration-200 flex items-center gap-1",
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
                          <span>{formatLikeCount(likeCount)}</span>
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
            Hiển thị {sortedAlbums.length} album
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
                  
                  {/* Like count display */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className={cn("h-5 w-5", likedAlbums.has(selectedAlbum.id) && "fill-red-500 text-red-500")} />
                    <span>{formatLikeCount(likeCounts[selectedAlbum.id] || 0)} lượt thích</span>
                  </div>
                  
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
                    className={cn("w-full", likedAlbums.has(selectedAlbum.id) && "bg-red-500 hover:bg-red-600")}
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