import { PageHeader } from '../ui/PageHeader';
import { ComingNext } from './ComingNext';

export function AddGamePage() {
  return (
    <>
      <PageHeader
        title="Add a game"
        summary="Put it on your shelf: in your backlog, in progress, done, or wanted."
      />
      <ComingNext>The add-a-game form is coming next.</ComingNext>
    </>
  );
}
