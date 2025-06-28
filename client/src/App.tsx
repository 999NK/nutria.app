import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import AddMeal from "@/pages/AddMeal";
import MyPlan from "@/pages/MyPlan";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";
import Onboarding from "@/pages/Onboarding";
import AiChat from "@/pages/AiChat";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";
import { InstallPrompt } from "@/components/InstallPrompt";

function AppRouter() {
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
      <Route path="/">
        {!isAuthenticated ? (
          <Landing />
        ) : user && !(user as any).isProfileComplete ? (
          <Onboarding />
        ) : (
          <Layout><Dashboard /></Layout>
        )}
      </Route>
      <Route path="/add-meal">
        {isAuthenticated && user && (user as any).isProfileComplete ? (
          <Layout><AddMeal /></Layout>
        ) : (
          <Landing />
        )}
      </Route>
      <Route path="/my-plan">
        {isAuthenticated && user && (user as any).isProfileComplete ? (
          <Layout><MyPlan /></Layout>
        ) : (
          <Landing />
        )}
      </Route>
      <Route path="/progress">
        {isAuthenticated && user && (user as any).isProfileComplete ? (
          <Layout><Progress /></Layout>
        ) : (
          <Landing />
        )}
      </Route>
      <Route path="/profile">
        {isAuthenticated && user && (user as any).isProfileComplete ? (
          <Layout><Profile /></Layout>
        ) : (
          <Landing />
        )}
      </Route>
      <Route path="/ai-chat">
        {isAuthenticated && user && (user as any).isProfileComplete ? (
          <Layout><AiChat /></Layout>
        ) : (
          <Landing />
        )}
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
        <InstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
