
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./utils/authContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Licenses from "./pages/Microsoft365/Licenses";
import M365Dashboard from "./pages/Microsoft365/Dashboard";
import M365DSC from "./pages/Microsoft365/M365DSC";
import Updates from "./pages/Microsoft365/Updates";
import Notifications from "./pages/Microsoft365/Notifications";
import Reports from "./pages/Microsoft365/Reports";
import Microsoft365 from "./pages/Microsoft365";
import Azure from "./pages/Azure";
import AzureCostAnalysis from "./pages/Azure/CostAnalysis";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Create a new query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/microsoft-365" element={
              <ProtectedRoute>
                <Microsoft365 />
              </ProtectedRoute>
            } />
            <Route path="/microsoft-365/dashboard" element={
              <ProtectedRoute>
                <M365Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/microsoft-365/licenses" element={
              <ProtectedRoute>
                <Licenses />
              </ProtectedRoute>
            } />
            <Route path="/microsoft-365/updates" element={
              <ProtectedRoute>
                <Updates />
              </ProtectedRoute>
            } />
            <Route path="/microsoft-365/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/microsoft-365/dsc" element={
              <ProtectedRoute>
                <M365DSC />
              </ProtectedRoute>
            } />
            <Route path="/microsoft-365/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/azure" element={
              <ProtectedRoute>
                <Azure />
              </ProtectedRoute>
            } />
            <Route path="/azure/cost-analysis" element={
              <ProtectedRoute>
                <AzureCostAnalysis />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={
              <ProtectedRoute>
                <NotFound />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
