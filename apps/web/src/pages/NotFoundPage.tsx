import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n';

export function NotFoundPage() {
  const t = useTranslation();
  return (
    <Container className="py-32 text-center">
      <p className="label">404</p>
      <h1 className="display text-display-xl mt-2">{t('notfound.title')}</h1>
      <p className="mt-6 text-ink-500">{t('notfound.body')}</p>
      <Link to="/" className="mt-10 inline-block">
        <Button>{t('notfound.toHome')}</Button>
      </Link>
    </Container>
  );
}
