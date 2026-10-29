import { AppProviders } from '@app/providers';
import { AppRoutes } from '@app/routes';
import type { AppearanceService } from './appearance-service';

export default function App({ appearanceService }: { appearanceService?: AppearanceService }) {
  return (
    <AppProviders {...(appearanceService ? { appearanceService } : {})}>
      <main className="nf-stack">
        <h1>NurseFlow</h1>
        <AppRoutes />
      </main>
    </AppProviders>
  );
}
