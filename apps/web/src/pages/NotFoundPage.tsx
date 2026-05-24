import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <Container className="anim-fade-in py-32 text-center">
      <p className="label">404</p>
      <h1 className="display text-display-xl mt-2">Страница не найдена</h1>
      <p className="mt-6 text-ink-500">Возможно, она была удалена или вы перешли по неверной ссылке.</p>
      <Link to="/" className="mt-10 inline-block">
        <Button>На главную</Button>
      </Link>
    </Container>
  );
}
