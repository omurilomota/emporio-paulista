import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyMenus = pgTable(
  "daily_menus",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    shift: text("shift").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    dishes: text("dishes").array().notNull().default(sql`ARRAY[]::text[]`),
    isPublished: boolean("is_published").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("daily_menus_date_shift_unique").on(table.date, table.shift)],
);

export type OrderItemSnapshot = {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  customizations?: { protein: string; sides: string[] };
};

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  fulfillment: text("fulfillment").notNull(),
  address: text("address"),
  paymentMethod: text("payment_method").notNull(),
  privacyConsent: boolean("privacy_consent").notNull().default(false),
  privacyConsentAt: timestamp("privacy_consent_at", { withTimezone: true }),
  notes: text("notes").notNull().default(""),
  items: jsonb("items").$type<OrderItemSnapshot[]>().notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("received"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
