export type ProductStatus = "active" | "draft";

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  material: string | null;
  category_id: string | null;
  images: string[];
  status: ProductStatus;
  featured: boolean;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: number;
  shop_name: string;
  tagline: string;
  announcement: string | null;
  prelaunch_enabled: boolean;
  access_code: string;
  free_ship_threshold: number;
  shipping_flat: number;
}

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  qty: number;
}
