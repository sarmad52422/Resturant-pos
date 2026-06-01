import { create } from 'zustand';

interface CartLine {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface PosState {
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  cart: CartLine[];
  setOrderType: (orderType: PosState['orderType']) => void;
  addLine: (line: CartLine) => void;
  removeLine: (id: string) => void;
  clear: () => void;
}

export const usePosStore = create<PosState>((set) => ({
  orderType: 'DINE_IN',
  cart: [],
  setOrderType: (orderType) => set({ orderType }),
  addLine: (line) =>
    set((state) => {
      const existing = state.cart.find((item) => item.id === line.id);
      if (!existing) return { cart: [...state.cart, line] };
      return {
        cart: state.cart.map((item) =>
          item.id === line.id ? { ...item, quantity: item.quantity + line.quantity } : item,
        ),
      };
    }),
  removeLine: (id) => set((state) => ({ cart: state.cart.filter((item) => item.id !== id) })),
  clear: () => set({ cart: [] }),
}));
