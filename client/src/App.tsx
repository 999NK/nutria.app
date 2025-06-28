import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import AddMeal from "@/pages/AddMeal";
import MyFoods from "@/pages/MyFoods";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";
import Onboarding from "@/pages/Onboarding";
import AiChat from "@/pages/AiChat";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";
import { InstallPrompt } from "@/components/InstallPrompt";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <i className="fas fa-utensils text-white text-2xl"></i>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : user && !(user as any).isProfileComplete ? (
        <Route path="/" component={Onboarding} />
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/add-meal" component={AddMeal} />
          <Route path="/my-foods" component={MyFoods} />
          <Route path="/progress" component={Progress} />
          <Route path="/profile" component={Profile} />
          <Route path="/ai-chat" component={AiChat} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <InstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
