-- Add additional fields to services table for ServiceDetail page
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS info_title_1 text,
ADD COLUMN IF NOT EXISTS info_content_1 text,
ADD COLUMN IF NOT EXISTS info_title_2 text,
ADD COLUMN IF NOT EXISTS info_content_2 text,
ADD COLUMN IF NOT EXISTS info_title_3 text,
ADD COLUMN IF NOT EXISTS info_content_3 text,
ADD COLUMN IF NOT EXISTS pricing_title text DEFAULT 'Bảng giá chụp ảnh CV tại SNAPPUP',
ADD COLUMN IF NOT EXISTS package_1_name text DEFAULT 'GÓI CÁ NHÂN',
ADD COLUMN IF NOT EXISTS package_1_price text DEFAULT '400K',
ADD COLUMN IF NOT EXISTS package_1_features text[] DEFAULT ARRAY['Chụp trọn gói cho một người', 'Tư vấn trang phục và makeup', 'Chọn phông nền theo yêu cầu', 'Chụp nhiều pose khác nhau', 'Giao ảnh trong 48h (2 ngày làm việc)'],
ADD COLUMN IF NOT EXISTS package_2_name text DEFAULT 'GÓI NHÓM',
ADD COLUMN IF NOT EXISTS package_2_price text DEFAULT '100K',
ADD COLUMN IF NOT EXISTS package_2_features text[] DEFAULT ARRAY['Áp dụng từ 5 người trở lên', 'Tư vấn trang phục chung cho cả nhóm', 'Đồng giá chỉ 100k/người', 'Chụp riêng từng người theo style nhất quán', 'Tặng ảnh chung cho cả nhóm (nếu có yêu cầu)'];

-- Add image_url to gallery_categories for displaying category images
ALTER TABLE public.gallery_categories
ADD COLUMN IF NOT EXISTS image_url text;

-- Add email recipient setting for admin (store in a simple config table)
CREATE TABLE IF NOT EXISTS public.site_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on site_config
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage site config
CREATE POLICY "Admins can manage site config"
ON public.site_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default admin email for notifications
INSERT INTO public.site_config (key, value)
VALUES ('admin_email', 'admin@snappup.studio')
ON CONFLICT (key) DO NOTHING;

-- Add trigger for site_config updated_at
CREATE TRIGGER update_site_config_updated_at
  BEFORE UPDATE ON public.site_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();