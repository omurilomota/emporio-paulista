export type ProductCard = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string | null;
  available: boolean;
};

export type MenuCard = {
  id: number;
  date: string;
  shift: string;
  title: string;
  description: string;
  dishes: string[];
  isPublished: boolean;
};

export type CartLine = {
  cartKey: string;
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  customizations?: { protein: string; sides: string[] };
};

export type OrderItem = {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  customizations?: { protein: string; sides: string[] };
};

export type OrderRecord = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  fulfillment: string;
  address: string | null;
  paymentMethod: string;
  notes: string;
  items: OrderItem[];
  subtotal: string;
  deliveryFee: string;
  total: string;
  status: string;
  createdAt: string;
};
