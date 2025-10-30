import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { SessionRecording } from "./pages/SessionRecording";
import { NewSession } from "./pages/NewSession";
import { SessionStatus } from "./pages/SessionStatus";
import { Sessions } from "./pages/Sessions";
import { ClinicalNotes } from "./pages/ClinicalNotes";
import { PatientProfile } from "./pages/PatientProfile";
import { Patients } from "./pages/Patients";
import { AddPatient } from "./pages/AddPatient";
import { Search } from "./pages/Search";
import { Settings } from "./pages/Settings";
import { Billing } from "./pages/Billing";
import { Notifications } from "./pages/Notifications";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="sessions">
              <Route index element={<Sessions />} />
              <Route path="new" element={<NewSession />} />
              <Route path=":sessionId" element={<SessionRecording />} />
              <Route path="status/:sessionId" element={<SessionStatus />} />
            </Route>
            <Route path="notes">
              <Route path="new" element={<ClinicalNotes />} />
              <Route path=":sessionId" element={<ClinicalNotes />} />
            </Route>
            <Route path="patients">
              <Route index element={<Patients />} />
              <Route path="new" element={<AddPatient />} />
              <Route path=":patientId" element={<PatientProfile />} />
            </Route>
            <Route path="search" element={<Search />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="billing" element={<Billing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
