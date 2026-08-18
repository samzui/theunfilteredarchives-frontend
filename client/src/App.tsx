
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";

import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

import Home from "./pages/Home";
import SamIntro from "./pages/SamIntro";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminWritings from "./pages/AdminWritings";
import AdminNewWriting from "./pages/AdminNewWriting";
import NotFound from "./pages/NotFound";
import AdminEditWriting from "./pages/AdminEditWriting";
import WritingDetail from "./pages/WritingDetail";
import GoogleLoginTest from "./pages/GoogleLoginTest";
import AdminComments from "./pages/AdminComments";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";
import AdminCommunity from "./pages/AdminCommunity";

function Router() {
  return (
    <Switch>
      {/* Public website */}
      <Route path="/" component={Home} />

      <Route
  path="/about-sam"
  component={SamIntro}
/>

      {/* Admin authentication */}
      <Route
        path="/admin/login"
        component={AdminLogin}
      />

      {/* Admin dashboard */}
      <Route
        path="/admin"
        component={AdminDashboard}
      />
     
     <Route
  path="/admin/comments"
  component={AdminComments}
/>

    <Route
  path="/admin/users"
  component={AdminUsers}
/>
<Route
  path="/admin/reports"
  component={AdminReports}
/>
<Route
  path="/admin/community"
  component={AdminCommunity}
/>

      {/* Admin writings */}
      <Route
        path="/admin/writings"
        component={AdminWritings}
      />
      
      {/* Create new writing */}
      <Route
        path="/admin/writings/new"
        component={AdminNewWriting}
      />
      <Route
  path="/admin/writings/:id/edit"
  component={AdminEditWriting}
/>

<Route
  path="/google-login-test"
  component={GoogleLoginTest}
/>
<Route path="/writings/:id" component={WritingDetail} />


      {/* 404 */}
      <Route
        path="/404"
        component={NotFound}
      />

      {/* Catch-all */}
      <Route component={NotFound} />

      
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />

          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

