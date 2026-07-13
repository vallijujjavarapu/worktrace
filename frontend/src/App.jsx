import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./routes/ProtectedRoute"
import Login from "./pages/auth/Login"
import Dashboard from "./pages/Dashboard"
import ProjectsList from "./pages/projects/ProjectsList"
import ProjectDetail from "./pages/projects/ProjectDetail"
import CreateTask from "./pages/projects/CreateTask"
import TaskDetail from "./pages/tasks/TaskDetail"
import OrgPage from "./pages/org/OrgPage"
import CreateProject from "./pages/projects/CreateProject"
import ClientsList from "./pages/clients/ClientsList"
import ClientDetail from "./pages/clients/ClientDetail"
import RequirementsList from "./pages/requirements/RequirementsList"
import WorkUpdates from "./pages/updates/WorkUpdates"
import NotFound from "./pages/NotFound"
import RegisterEmployee from "./pages/admin/RegisterEmployee"
import ProfilePage from "./pages/profile/ProfilePage"
import EditEmployee from "./pages/admin/EditEmployee"
import ManageOrg from "./pages/admin/ManageOrg"
import PeoplePage from "./pages/people/PeoplePage"
import PersonProfile from "./pages/people/PersonProfile"
import TeamSummary from "./pages/updates/TeamSummary"
import BenchTeams from "./pages/teams/BenchTeams";
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute><ProjectsList /></ProtectedRoute>
          } />
          <Route path="/projects/:id" element={
            <ProtectedRoute><ProjectDetail /></ProtectedRoute>
          } />
          <Route path="/projects/:id/tasks/new" element={
            <ProtectedRoute><CreateTask /></ProtectedRoute>
          } />
          <Route path="/tasks/:id" element={
            <ProtectedRoute><TaskDetail /></ProtectedRoute>
          } />
          <Route path="/people" element={<ProtectedRoute><PeoplePage /></ProtectedRoute>} />
          <Route path="/people/:id" element={<ProtectedRoute><PersonProfile /></ProtectedRoute>} />

          <Route path="/org" element={
            <ProtectedRoute><OrgPage /></ProtectedRoute>
          } />
          <Route path="/ai/summary" element={
            <ProtectedRoute><TeamSummary /></ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/projects/new" element={
            <ProtectedRoute><CreateProject /></ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute><ClientsList /></ProtectedRoute>
          } />
          <Route path="/clients/:id" element={
  <ProtectedRoute><ClientDetail /></ProtectedRoute>
          } />
          <Route path="/requirements" element={
            <ProtectedRoute><RequirementsList /></ProtectedRoute>
          } />
          <Route path="/updates" element={
            <ProtectedRoute><WorkUpdates /></ProtectedRoute>
          } />
          <Route path="/teams/bench" element={<ProtectedRoute><BenchTeams /></ProtectedRoute>} />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/admin/register" element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
          <RegisterEmployee />
            </ProtectedRoute>
          } />
          <Route path="/admin/org" element={
            <ProtectedRoute allowedRoles={["admin"]}>
           <ManageOrg />
               </ProtectedRoute>
} />
          <Route path="/admin/employees/:id/edit" element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
              <EditEmployee />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}