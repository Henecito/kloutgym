import { Routes, Route } from "react-router-dom";
import Login from "../auth/Login";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "../pages/admin/Dashboard";
import Clients from "../pages/admin/Clients";
import Trainers from "../pages/admin/Trainers";
import Attendance from "../pages/admin/Attendance";
import Payments from "../pages/admin/Payments";
import ChangePassword from "../auth/ChangePassword";
import TrainerLayout from "../layouts/TrainerLayout";
import TrainerDashboard from "../pages/trainer/Dashboard";
import Sessions from "../pages/trainer/Sessions";
import TrainerClients from "../pages/trainer/Clients";
import TrainerProfile from "../pages/trainer/Profile";
import ClientLayout from "../layouts/ClientLayout";
import ClientHome from "../pages/client/Home";
import ClientBook from "../pages/client/Book";
import ClientSessions from "../pages/client/Sessions";
import ClientProfile from "../pages/client/Profile";

export default function Router() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<Login />} />

      {/* CAMBIAR PASSWORD (solo sesión, sin rol) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/cambiar-password" element={<ChangePassword />} />
      </Route>

      {/* ADMIN */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="entrenadores" element={<Trainers />} />
          <Route path="asistencia" element={<Attendance />} />
          <Route path="pagos" element={<Payments />} />
        </Route>
      </Route>

      {/* TRAINER */}
      <Route element={<ProtectedRoute allowedRoles={["trainer"]} />}>
        <Route path="/trainer" element={<TrainerLayout />}>
          <Route index element={<TrainerDashboard />} />
          <Route path="sesiones" element={<Sessions />} />
          <Route path="alumnos" element={<TrainerClients />} />
          <Route path="perfil" element={<TrainerProfile />} />
        </Route>
      </Route>

      {/* CLIENT */}
      <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<ClientHome />} />
          <Route path="reservar" element={<ClientBook />} />
          <Route path="sesiones" element={<ClientSessions />} />
          <Route path="perfil" element={<ClientProfile />} />
        </Route>
      </Route>
    </Routes>
  );
}
