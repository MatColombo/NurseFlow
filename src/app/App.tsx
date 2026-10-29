import { AppProviders } from '@app/providers';
import { AppRoutes } from '@app/routes';

export default function App() {
  return (
    <AppProviders>
      <main>
        <h1>NurseFlow</h1>
        <AppRoutes />
      </main>
    </AppProviders>
  );
}
