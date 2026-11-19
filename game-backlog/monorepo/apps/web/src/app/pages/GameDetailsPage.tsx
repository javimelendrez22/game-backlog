import { useParams } from 'react-router-dom';
import { PageHeader } from '../ui/PageHeader';
import { ComingNext } from './ComingNext';

export function GameDetailsPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageHeader title="Game details" summary={`Game ${id}`} />
      <ComingNext>
        Cover, status switcher, play time, notes and sessions are coming next.
      </ComingNext>
    </>
  );
}
