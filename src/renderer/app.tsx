import { createHashRouter, RouterProvider } from 'react-router';
import { AppShell } from './components/shell/app-shell';
import { DashboardPage } from './components/dashboard/dashboard-page';
import { ArchitectureViz } from './components/dashboard/architecture-viz';
import { ProjectsPage } from './components/projects/projects-page';
import { ProjectDetail } from './components/projects/project-detail';
import { ProvisionWizard } from './components/provision/provision-wizard';
import { CostsPage } from './components/costs/costs-page';
import { ObservabilityPage } from './components/observability/observability-page';
import { SaaSPanel } from './components/saas-tabs/saas-panel';
import { SocialPage } from './components/social/social-page';
import { InsightsPage } from './components/insights/insights-page';
import { CopilotChat } from './components/chat/copilot-chat';
import { SetupWizard } from './components/setup/setup-wizard';

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/new', element: <ProvisionWizard /> },
      { path: 'projects/:id', element: <ProjectDetail /> },
      { path: 'costs', element: <CostsPage /> },
      { path: 'observability', element: <ObservabilityPage /> },
      { path: 'social', element: <SocialPage /> },
      { path: 'insights', element: <InsightsPage /> },
      { path: 'saas/:provider', element: <SaaSPanel /> },
      { path: 'architecture', element: <ArchitectureViz /> },
      { path: 'copilot', element: <CopilotChat /> },
    ],
  },
  { path: '/setup', element: <SetupWizard /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
