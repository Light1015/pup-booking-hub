import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Save, X, Upload, ChevronDown, ChevronUp, Package, Image as ImageIcon, DollarSign, FileText, Sparkles } from "lucide-react";

interface Service {
  id: string;
  title: string;
  price: string;
  description: string;
  image_url: string;
  features: string[];
  package_1_name: string | null;
  package_1_price: string | null;
  package_1_features: string[] | null;
  package_1_image_url?: string | null;
  package_2_name: string | null;
  package_2_price: string | null;
  package_2_features: string[] | null;
  package_2_image_url?: string | null;
}

interface ServiceManagerProps {
  services: Service[];
}

interface NewService {
  title: string;
  price: string;
  description: string;
  image_url: string;
  features: string;
  package_1_name: string;
  package_1_price: string;
  package_1_features: string;
  package_1_image_url: string;
  package_2_name: string;
  package_2_price: string;
  package_2_features: string;
  package_2_image_url: string;
}

const initialNewService: NewService = {
  title: "",
  price: "",
  description: "",
  image_url: "",
  features: "",
  package_1_name: "GÓI CÁ NHÂN",
  package_1_price: "400K",
  package_1_features: "",
  package_1_image_url: "",
  package_2_name: "GÓI NHÓM",
  package_2_price: "100K",
  package_2_features: "",
  package_2_image_url: "",
};

export const ServiceManager = ({ services }: ServiceManagerProps) => {
  const queryClient = useQueryClient();
  const [newService, setNewService] = useState<NewService>(initialNewService);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const validate = (service: NewService) => {
    const errs: Record<string, string> = {};
    if (!service.title.trim()) errs.title = "Tiêu đề không được để trống";
    if (!service.price.trim()) errs.price = "Giá không được để trống";
    if (!service.description.trim()) errs.description = "Mô tả không được để trống";
    if (!service.image_url.trim()) errs.image_url = "Ảnh dịch vụ không được để trống";
    if (!service.package_1_name.trim()) errs.package_1_name = "Tên gói 1 không được để trống";
    if (!service.package_1_price.trim()) errs.package_1_price = "Giá gói 1 không được để trống";
    if (!service.package_2_name.trim()) errs.package_2_name = "Tên gói 2 không được để trống";
    if (!service.package_2_price.trim()) errs.package_2_price = "Giá gói 2 không được để trống";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleImageUpload = async (file: File, field: string, isEditing = false) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh quá lớn (tối đa 5MB)");
      return;
    }

    setUploadingImage(field);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `services/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from("gallery")
        .getPublicUrl(fileName);

      if (isEditing && editingService) {
        setEditingService({ ...editingService, [field]: publicUrl });
      } else {
        setNewService({ ...newService, [field]: publicUrl });
      }
      toast.success("Đã tải ảnh thành công!");
    } catch (error: any) {
      toast.error("Lỗi tải ảnh: " + error.message);
    } finally {
      setUploadingImage(null);
    }
  };

  const addService = useMutation({
    mutationFn: async (service: NewService) => {
      const { error } = await supabase.from("services").insert([{
        title: service.title,
        price: service.price,
        description: service.description,
        image_url: service.image_url,
        features: service.features.split(",").map((f: string) => f.trim()).filter(Boolean),
        package_1_name: service.package_1_name,
        package_1_price: service.package_1_price,
        package_1_features: service.package_1_features.split(",").map((f: string) => f.trim()).filter(Boolean),
        package_1_image_url: service.package_1_image_url || null,
        package_2_name: service.package_2_name,
        package_2_price: service.package_2_price,
        package_2_features: service.package_2_features.split(",").map((f: string) => f.trim()).filter(Boolean),
        package_2_image_url: service.package_2_image_url || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Đã thêm dịch vụ!");
      setNewService(initialNewService);
      setErrors({});
      setIsAddFormOpen(false);
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...service }: any) => {
      const updateData: any = { ...service };
      if (typeof service.features === "string") {
        updateData.features = service.features.split(",").map((f: string) => f.trim()).filter(Boolean);
      }
      if (typeof service.package_1_features === "string") {
        updateData.package_1_features = service.package_1_features.split(",").map((f: string) => f.trim()).filter(Boolean);
      }
      if (typeof service.package_2_features === "string") {
        updateData.package_2_features = service.package_2_features.split(",").map((f: string) => f.trim()).filter(Boolean);
      }
      const { error } = await supabase.from("services").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Đã cập nhật dịch vụ!");
      setEditingService(null);
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Đã xóa dịch vụ!");
    },
    onError: (error: any) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const handleAdd = () => {
    if (validate(newService)) {
      addService.mutate(newService);
    } else {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
    }
  };

  const ImageUploadField = ({ 
    value, 
    onChange, 
    label, 
    fieldKey, 
    isEditing = false 
  }: { 
    value: string; 
    onChange: (url: string) => void; 
    label: string; 
    fieldKey: string;
    isEditing?: boolean;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder="Nhập URL hoặc tải ảnh lên"
          className="flex-1"
        />
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, fieldKey, isEditing);
            }}
          />
          <Button type="button" variant="outline" size="icon" asChild disabled={uploadingImage === fieldKey}>
            <span>
              {uploadingImage === fieldKey ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </span>
          </Button>
        </label>
      </div>
      {value && (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button 
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );

  const PackageForm = ({ 
    prefix, 
    name, 
    price, 
    features, 
    imageUrl,
    onNameChange, 
    onPriceChange, 
    onFeaturesChange,
    onImageChange,
    errors,
    isEditing = false 
  }: any) => (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Package className="h-4 w-4 text-primary" />
        <span className="font-medium">{prefix}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Tên gói *</Label>
          <Input 
            value={name} 
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Tên gói"
            className={errors?.name ? "border-destructive" : ""}
          />
          {errors?.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label className="text-xs">Giá *</Label>
          <Input 
            value={price} 
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="400K"
            className={errors?.price ? "border-destructive" : ""}
          />
          {errors?.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
        </div>
      </div>
      <div>
        <Label className="text-xs">Đặc điểm (phân cách bởi dấu phẩy)</Label>
        <Textarea 
          value={features} 
          onChange={(e) => onFeaturesChange(e.target.value)}
          placeholder="Chụp đẹp, Makeup, Chỉnh sửa ảnh..."
          rows={2}
        />
      </div>
      <ImageUploadField
        value={imageUrl}
        onChange={onImageChange}
        label="Ảnh gói (không bắt buộc)"
        fieldKey={`${prefix.toLowerCase().replace(' ', '_')}_image_url`}
        isEditing={isEditing}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quản lý dịch vụ
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {services.length} dịch vụ đang hoạt động
          </p>
        </div>
        <Button onClick={() => setIsAddFormOpen(!isAddFormOpen)} className="gap-2">
          {isAddFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isAddFormOpen ? "Đóng" : "Thêm dịch vụ"}
        </Button>
      </div>

      {/* Add Form */}
      <Collapsible open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
        <CollapsibleContent>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Thêm dịch vụ mới
              </h3>
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tiêu đề *</Label>
                  <Input 
                    value={newService.title} 
                    onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                    placeholder="Chụp ảnh sản phẩm"
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
                </div>
                <div>
                  <Label>Giá hiển thị *</Label>
                  <Input 
                    value={newService.price} 
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    placeholder="Từ 400K"
                    className={errors.price ? "border-destructive" : ""}
                  />
                  {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
                </div>
              </div>

              <div>
                <Label>Mô tả *</Label>
                <Textarea 
                  value={newService.description} 
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Mô tả chi tiết về dịch vụ..."
                  className={errors.description ? "border-destructive" : ""}
                  rows={3}
                />
                {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
              </div>

              <ImageUploadField
                value={newService.image_url}
                onChange={(url) => setNewService({ ...newService, image_url: url })}
                label="Ảnh dịch vụ *"
                fieldKey="image_url"
              />
              {errors.image_url && <p className="text-xs text-destructive mt-1">{errors.image_url}</p>}

              <div>
                <Label>Tính năng nổi bật (phân cách bởi dấu phẩy)</Label>
                <Textarea 
                  value={newService.features} 
                  onChange={(e) => setNewService({ ...newService, features: e.target.value })}
                  placeholder="Chất lượng cao, Giao nhanh, Đội ngũ chuyên nghiệp..."
                  rows={2}
                />
              </div>

              {/* Package 1 */}
              <PackageForm
                prefix="Gói 1"
                name={newService.package_1_name}
                price={newService.package_1_price}
                features={newService.package_1_features}
                imageUrl={newService.package_1_image_url}
                onNameChange={(v: string) => setNewService({ ...newService, package_1_name: v })}
                onPriceChange={(v: string) => setNewService({ ...newService, package_1_price: v })}
                onFeaturesChange={(v: string) => setNewService({ ...newService, package_1_features: v })}
                onImageChange={(v: string) => setNewService({ ...newService, package_1_image_url: v })}
                errors={{ name: errors.package_1_name, price: errors.package_1_price }}
              />

              {/* Package 2 */}
              <PackageForm
                prefix="Gói 2"
                name={newService.package_2_name}
                price={newService.package_2_price}
                features={newService.package_2_features}
                imageUrl={newService.package_2_image_url}
                onNameChange={(v: string) => setNewService({ ...newService, package_2_name: v })}
                onPriceChange={(v: string) => setNewService({ ...newService, package_2_price: v })}
                onFeaturesChange={(v: string) => setNewService({ ...newService, package_2_features: v })}
                onImageChange={(v: string) => setNewService({ ...newService, package_2_image_url: v })}
                errors={{ name: errors.package_2_name, price: errors.package_2_price }}
              />

              <Button onClick={handleAdd} disabled={addService.isPending} className="w-full">
                {addService.isPending ? "Đang thêm..." : "Thêm dịch vụ"}
              </Button>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Services List */}
      <div className="space-y-4">
        {services.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có dịch vụ nào</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm dịch vụ đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {editingService?.id === service.id ? (
                  /* Edit Mode */
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tiêu đề</Label>
                        <Input 
                          value={editingService.title} 
                          onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Giá</Label>
                        <Input 
                          value={editingService.price} 
                          onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Textarea 
                        value={editingService.description} 
                        onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                      />
                    </div>
                    <ImageUploadField
                      value={editingService.image_url}
                      onChange={(url) => setEditingService({ ...editingService, image_url: url })}
                      label="Ảnh dịch vụ"
                      fieldKey="image_url"
                      isEditing
                    />
                    <div>
                      <Label>Tính năng</Label>
                      <Textarea 
                        value={Array.isArray(editingService.features) ? editingService.features.join(", ") : editingService.features} 
                        onChange={(e) => setEditingService({ ...editingService, features: e.target.value })}
                      />
                    </div>

                    <PackageForm
                      prefix="Gói 1"
                      name={editingService.package_1_name || ""}
                      price={editingService.package_1_price || ""}
                      features={Array.isArray(editingService.package_1_features) ? editingService.package_1_features.join(", ") : editingService.package_1_features || ""}
                      imageUrl={editingService.package_1_image_url || ""}
                      onNameChange={(v: string) => setEditingService({ ...editingService, package_1_name: v })}
                      onPriceChange={(v: string) => setEditingService({ ...editingService, package_1_price: v })}
                      onFeaturesChange={(v: string) => setEditingService({ ...editingService, package_1_features: v })}
                      onImageChange={(v: string) => setEditingService({ ...editingService, package_1_image_url: v })}
                      isEditing
                    />

                    <PackageForm
                      prefix="Gói 2"
                      name={editingService.package_2_name || ""}
                      price={editingService.package_2_price || ""}
                      features={Array.isArray(editingService.package_2_features) ? editingService.package_2_features.join(", ") : editingService.package_2_features || ""}
                      imageUrl={editingService.package_2_image_url || ""}
                      onNameChange={(v: string) => setEditingService({ ...editingService, package_2_name: v })}
                      onPriceChange={(v: string) => setEditingService({ ...editingService, package_2_price: v })}
                      onFeaturesChange={(v: string) => setEditingService({ ...editingService, package_2_features: v })}
                      onImageChange={(v: string) => setEditingService({ ...editingService, package_2_image_url: v })}
                      isEditing
                    />

                    <div className="flex gap-2">
                      <Button onClick={() => updateService.mutate(editingService)} disabled={updateService.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {updateService.isPending ? "Đang lưu..." : "Lưu"}
                      </Button>
                      <Button variant="outline" onClick={() => setEditingService(null)}>
                        <X className="h-4 w-4 mr-2" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    {/* Header with Image */}
                    <div className="flex gap-4 p-4 border-b">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        {service.image_url ? (
                          <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg truncate">{service.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="font-mono">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {service.price}
                              </Badge>
                              <Badge variant="outline">2 gói</Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setEditingService({ ...service })}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteService.mutate(service.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{service.description}</p>
                      </div>
                    </div>

                    {/* Expandable Packages */}
                    <Collapsible 
                      open={expandedServiceId === service.id}
                      onOpenChange={(open) => setExpandedServiceId(open ? service.id : null)}
                    >
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                          {expandedServiceId === service.id ? (
                            <>Thu gọn <ChevronUp className="h-4 w-4" /></>
                          ) : (
                            <>Xem chi tiết gói <ChevronDown className="h-4 w-4" /></>
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30">
                          {/* Package 1 */}
                          <div className="p-4 bg-background rounded-lg border">
                            <div className="flex items-start gap-3">
                              {service.package_1_image_url ? (
                                <img src={service.package_1_image_url} alt={service.package_1_name || ""} className="w-16 h-16 rounded-lg object-cover" />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-primary" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold">{service.package_1_name}</h4>
                                <p className="text-primary font-bold">{service.package_1_price}</p>
                              </div>
                            </div>
                            {service.package_1_features && service.package_1_features.length > 0 && (
                              <ul className="mt-3 space-y-1">
                                {service.package_1_features.slice(0, 3).map((f, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-primary" />
                                    {f}
                                  </li>
                                ))}
                                {service.package_1_features.length > 3 && (
                                  <li className="text-xs text-muted-foreground">+{service.package_1_features.length - 3} thêm</li>
                                )}
                              </ul>
                            )}
                          </div>

                          {/* Package 2 */}
                          <div className="p-4 bg-background rounded-lg border">
                            <div className="flex items-start gap-3">
                              {service.package_2_image_url ? (
                                <img src={service.package_2_image_url} alt={service.package_2_name || ""} className="w-16 h-16 rounded-lg object-cover" />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-secondary/50 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-secondary-foreground" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold">{service.package_2_name}</h4>
                                <p className="text-primary font-bold">{service.package_2_price}</p>
                              </div>
                            </div>
                            {service.package_2_features && service.package_2_features.length > 0 && (
                              <ul className="mt-3 space-y-1">
                                {service.package_2_features.slice(0, 3).map((f, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-secondary" />
                                    {f}
                                  </li>
                                ))}
                                {service.package_2_features.length > 3 && (
                                  <li className="text-xs text-muted-foreground">+{service.package_2_features.length - 3} thêm</li>
                                )}
                              </ul>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
