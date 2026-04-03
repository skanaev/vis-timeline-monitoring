import { QueryProvider } from './providers/QueryProvider';
import { TimelinePage } from '../pages/timeline-page/TimelinePage';

export const App = (): JSX.Element => {
  return (
    <QueryProvider>
      <TimelinePage />
    </QueryProvider>
  );
};
