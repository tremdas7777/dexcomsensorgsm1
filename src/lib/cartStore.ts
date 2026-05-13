/**
 * Carrinho da loja — estado leve com persistência em localStorage e
 * notificação de mudanças via custom event (sem context tree).
 */
import { useEffect, useState } from 'react';
import { STORE_PRODUCT, findVariant, type ProductVariant } from './storeProduct';
import { trackStoreCartEngagement } from './funnelTracking';

const STORAGE_KEY = 'dexcom_cart_v1';
const EVENT = 'dexcom-cart-changed';

export type CartItem = {
  /** Identificador único da linha (productHandle:variantId). */
  key: string;
  productHandle: string;
  productTitle: string;
  productImage: string;
  variantId: string;
  variantTitle: string;
  variantSubtitle: string;
  unitPriceCents: number;
  quantity: number;
};

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* noop */
  }
}

export function getCart(): CartItem[] {
  return read();
}

export function addToCart(variant: ProductVariant, quantity = 1) {
  const items = read();
  const key = `${STORE_PRODUCT.handle}:${variant.id}`;
  const existing = items.find((i) => i.key === key);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + quantity);
  } else {
    items.push({
      key,
      productHandle: STORE_PRODUCT.handle,
      productTitle: STORE_PRODUCT.title,
      productImage: STORE_PRODUCT.images[0],
      variantId: variant.id,
      variantTitle: variant.title,
      variantSubtitle: variant.subtitle,
      unitPriceCents: variant.priceCents,
      quantity: Math.min(99, Math.max(1, quantity)),
    });
  }
  write(items);
  trackStoreCartEngagement();
}

export function updateQuantity(key: string, quantity: number) {
  const items = read();
  const item = items.find((i) => i.key === key);
  if (!item) return;
  item.quantity = Math.min(99, Math.max(1, Math.round(quantity)));
  write(items);
}

export function removeFromCart(key: string) {
  write(read().filter((i) => i.key !== key));
}

export function clearCart() {
  write([]);
}

export function cartSubtotalCents(items: CartItem[] = read()) {
  return items.reduce((acc, i) => acc + i.unitPriceCents * i.quantity, 0);
}

export function cartItemCount(items: CartItem[] = read()) {
  return items.reduce((acc, i) => acc + i.quantity, 0);
}

/** Hook reativo para componentes. */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => read());
  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return {
    items,
    subtotalCents: cartSubtotalCents(items),
    count: cartItemCount(items),
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}

/** Texto amigável para enviar ao gateway (`items_description`). */
export function buildItemsDescription(items: CartItem[]): string {
  if (items.length === 0) return 'Pedido loja Dexcom';
  return items
    .map((i) => `${i.quantity}x ${i.productTitle} — ${i.variantTitle}`)
    .join(' | ')
    .slice(0, 240);
}

/** Compra direta (Buy now) sem mexer no carrinho atual. */
export function buyNow(variantId: string, quantity = 1) {
  clearCart();
  addToCart(findVariant(variantId), quantity);
}
