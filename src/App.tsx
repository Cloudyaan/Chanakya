
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Licenses from "./pages/Microsoft365/Licenses";
import M365Dashboard from "./pages/Microsoft365/Dashboard";
import M365DSC from "./pages/Microsoft365/M365DSC";
import Updates from "./pages/Microsoft365/Updates";
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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/microsoft-365" element={<Microsoft365 />}>
            <Route path="dashboard" element={<M365Dashboard />} />
            <Route path="licenses" element={<Licenses />} />
            <Route path="updates" element={<Updates />} />
            <Route path="dsc" element={<M365DSC />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="/azure" element={<Azure />} />
          <Route path="/azure/cost-analysis" element={<AzureCostAnalysis />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
