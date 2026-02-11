import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleRoute } from "@/components/RoleRoute";

import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import UserDetails from "./pages/UserDetails";
import Monitor from "./pages/Monitor";
import Report from "./pages/Report";
import History from "./pages/History";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ApplyDoctor from "./pages/ApplyDoctor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>

            {/* ================= PUBLIC ROUTES ================= */}
            <Route path="/" element={<Splash />} />
            <Route path="/auth" element={<Auth />} />

            {/* ================= USER ROUTES ================= */}
            <Route
              path="/new-session"
              element={
                <ProtectedRoute>
                  <UserDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/monitor/:sessionId"
              element={
                <ProtectedRoute>
                  <Monitor />
                </ProtectedRoute>
              }
            />

            <Route
              path="/report/:sessionId"
              element={
                <ProtectedRoute>
                  <Report />
                </ProtectedRoute>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />

            {/* ================= DOCTOR ROUTE ================= */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRole="doctor">
                    <DoctorDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* ================= ADMIN ROUTE ================= */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRole="admin">
                    <AdminDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            {/* ================= APPLY ROUTE ================= */}
            <Route
              path="/apply-doctor"
              element={
                <ProtectedRoute>
                  <ApplyDoctor />
                </ProtectedRoute>
              }
            />
            {/* ================= 404 ================= */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>

      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;