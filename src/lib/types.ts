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
  // Contenido editable (migración 002)
  instagram_url: string;
  tiktok_url: string;
  whatsapp_url: string;
  contact_email: string;
  hero_subtitle: string;
  story_text: string;
}

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  qty: number;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export interface Order {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  items: { id: string; name: string; price: number; qty: number }[];
  subtotal: number;
  shipping: number;
  discount: number;
  coupon_code: string | null;
  total: number;
  status: OrderStatus;
  tracking: string | null;
  note: string | null;
  created_at: string;
}

export type CouponKind = "percent" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  kind: CouponKind;
  value: number;
  min_subtotal: number;
  active: boolean;
  created_at: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  body: string;
  published: boolean;
  sort: number;
  created_at: string;
  updated_at: string;
}

export type TicketStatus = "open" | "pending" | "answered" | "closed";
export type TicketPriority = "low" | "normal" | "high";

export interface Ticket {
  id: string;
  ref: string;
  name: string;
  email: string;
  subject: string;
  order_ref: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export type TicketAuthor = "customer" | "admin";

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author: TicketAuthor;
  body: string;
  created_at: string;
}

/** Hilo público devuelto por la función SECURITY DEFINER `ticket_thread`. */
export interface TicketThread {
  ref: string;
  subject: string;
  status: TicketStatus;
  order_ref: string | null;
  created_at: string;
  messages: { author: TicketAuthor; body: string; created_at: string }[];
}

export interface Review {
  id: string;
  product_id: string;
  name: string;
  rating: number;
  body: string;
  approved: boolean;
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

export type NotificationKind =
  | "ticket_new"
  | "ticket_reply"
  | "order_new"
  | "review_new";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  url: string | null;
  read: boolean;
  created_at: string;
}
