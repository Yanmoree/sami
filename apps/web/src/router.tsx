import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Container } from '@/components/ui/Container';

// Lazy-loaded pages — каждая страница в своём chunk
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const CatalogPage = lazy(() => import('@/pages/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const ProductPage = lazy(() => import('@/pages/ProductPage').then((m) => ({ default: m.ProductPage })));
const CartPage = lazy(() => import('@/pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const AccountPage = lazy(() => import('@/pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const OrdersPage = lazy(() => import('@/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function RouteFallback() {
  return (
    <Container className="py-32">
      <div className="space-y-4">
        <div className="h-6 w-32 animate-shimmer bg-ink-200" />
        <div className="h-16 w-2/3 animate-shimmer bg-ink-200" />
        <div className="grid grid-cols-2 gap-4 pt-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-shimmer bg-ink-200" />
          ))}
        </div>
      </div>
    </Container>
  );
}

const lazyRoute = (node: ReactNode) => <Suspense fallback={<RouteFallback />}>{node}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: lazyRoute(<HomePage />) },
      { path: '/shop', element: lazyRoute(<CatalogPage />) },
      { path: '/shop/:category', element: lazyRoute(<CatalogPage />) },
      { path: '/product/:slug', element: lazyRoute(<ProductPage />) },
      { path: '/cart', element: lazyRoute(<CartPage />) },
      { path: '/about', element: lazyRoute(<AboutPage />) },
      {
        path: '/checkout',
        element: <ProtectedRoute>{lazyRoute(<CheckoutPage />)}</ProtectedRoute>,
      },
      { path: '/login', element: lazyRoute(<LoginPage />) },
      { path: '/register', element: lazyRoute(<RegisterPage />) },
      {
        path: '/account',
        element: <ProtectedRoute>{lazyRoute(<AccountPage />)}</ProtectedRoute>,
      },
      {
        path: '/account/orders',
        element: <ProtectedRoute>{lazyRoute(<OrdersPage />)}</ProtectedRoute>,
      },
      {
        path: '/account/orders/:id',
        element: <ProtectedRoute>{lazyRoute(<OrdersPage />)}</ProtectedRoute>,
      },
      { path: '*', element: lazyRoute(<NotFoundPage />) },
    ],
  },
]);
