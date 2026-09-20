// src/lib/store/index.ts

import { create } from "zustand";
import { Refinery, Order, User, Notification, ProductType } from "@/types";
import { mockDepots, mockRefineries, type MockDepot } from "@/lib/mock-data";

// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// Depot Store
// Note: depot prices are private (revealed only via chat), so the store holds
// the mock catalogue shape. A price-updating store action will return with the
// real private-pricing model.
interface DepotState {
  depots: MockDepot[];
  selectedDepot: MockDepot | null;
  isLoading: boolean;
  setDepots: (depots: MockDepot[]) => void;
  selectDepot: (depot: MockDepot | null) => void;
}

export const useDepotStore = create<DepotState>((set) => ({
  depots: mockDepots,
  selectedDepot: null,
  isLoading: false,
  setDepots: (depots) => set({ depots }),
  selectDepot: (depot) => set({ selectedDepot: depot }),
}));

// Refinery Store
interface RefineryState {
  refineries: Refinery[];
  updateRefineryPrice: (refineryId: string, productType: string, newPrice: number) => void;
}

export const useRefineryStore = create<RefineryState>((set) => ({
  refineries: mockRefineries,
  updateRefineryPrice: (refineryId, productType, newPrice) =>
    set((state) => ({
      refineries: state.refineries.map((refinery) =>
        refinery.id === refineryId
          ? {
              ...refinery,
              prices: { ...refinery.prices, [productType as ProductType]: newPrice },
              lastUpdated: new Date().toISOString(),
            }
          : refinery
      ),
    })),
}));

// Order Store
interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order["status"], note?: string) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
  updateOrderStatus: (orderId, status, note = "") =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              timeline: [
                ...(order.timeline ?? []),
                { status, timestamp: new Date().toISOString(), note },
              ],
              updatedAt: new Date().toISOString(),
            }
          : order
      ),
    })),
}));

// Notification Store
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));

// UI Store (for demo controls, modals, etc.)
interface UIState {
  isMobileMenuOpen: boolean;
  activeModal: string | null;
  toggleMobileMenu: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  activeModal: null,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}));