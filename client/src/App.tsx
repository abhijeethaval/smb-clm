import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ContractsPage from "@/pages/contracts-page";
import ContractDetailPage from "@/pages/contract-detail-page";
import TemplatesPage from "@/pages/templates-page";
import ApprovalQueuePage from "@/pages/approval-queue-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/contracts" component={ContractsPage} />
      <ProtectedRoute path="/contract/:id" component={ContractDetailPage} />
      <ProtectedRoute path="/templates" component={TemplatesPage} />
      <ProtectedRoute path="/approvals" component={ApprovalQueuePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
