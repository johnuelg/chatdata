import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import RoutePermissionGuard from "@/components/admin/RoutePermissionGuard";
import AdminLanding from "@/components/admin/AdminLanding";
import Index from "./pages/Index.tsx";

import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminSettings from "./pages/AdminSettings.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDocuments from "./pages/AdminDocuments.tsx";
import AdminChat from "./pages/AdminChat.tsx";
import AdminBookmarks from "./pages/AdminBookmarks.tsx";
import AdminLayout from "./components/admin/AdminLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AdminLogin />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/landing" element={<AdminLanding />} />
              <Route
                path="/admin"
                element={
                  <AdminLayout allowNonAdmin>
                    <RoutePermissionGuard>
                      <Outlet />
                    </RoutePermissionGuard>
                  </AdminLayout>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="documents" element={<AdminDocuments />} />
                <Route path="chat" element={<AdminChat />} />
                <Route path="bookmarks" element={<AdminBookmarks />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
