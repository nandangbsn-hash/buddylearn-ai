import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Materials from "./pages/Materials";
import AIChat from "./pages/AIChat";
import Quizzes from "./pages/Quizzes";
import HomeworkHelper from "./pages/HomeworkHelper";
import StudyPlanner from "./pages/StudyPlanner";
import EmailPreferences from "./pages/EmailPreferences";
import Progress from "./pages/Progress";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/materials" element={<Materials />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/homework" element={<HomeworkHelper />} />
          <Route path="/planner" element={<StudyPlanner />} />
          <Route path="/email-preferences" element={<EmailPreferences />} />
          <Route path="/progress" element={<Progress />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
