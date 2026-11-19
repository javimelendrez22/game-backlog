import { PageHeader } from '../ui/PageHeader';
import { ComingNext } from './ComingNext';

export function StatsPage() {
  return (
    <>
      <PageHeader
        title="Stats"
        summary="Everything you've finished, rated and played."
      />
      <ComingNext>
        Totals, finished per year, ratings and hours by genre are coming next.
      </ComingNext>
    </>
  );
}
