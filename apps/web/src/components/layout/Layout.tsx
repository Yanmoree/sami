import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { Splash } from '@/components/ui/Splash';
import { PageTransition } from '@/components/ui/PageTransition';

export function Layout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <Splash />
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
