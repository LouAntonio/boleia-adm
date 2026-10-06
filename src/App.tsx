import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { usePageTitle } from './hooks/usePageTitle';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UserList } from './pages/users/UserList';
import { UserDetail } from './pages/users/UserDetail';
import { KycList } from './pages/kyc/KycList';
import { VehicleList } from './pages/vehicles/VehicleList';
import { RideList } from './pages/rides/RideList';
import { BookingList } from './pages/bookings/BookingList';
import { AuditLogList } from './pages/audit-logs/AuditLogList';

function AppContent() {
	usePageTitle();

	return (
		<>
			<Toaster
				position="top-right"
				toastOptions={{
					style: {
						background: 'var(--surface)',
						color: 'var(--text)',
						border: '1px solid var(--border)',
					},
				}}
			/>
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route element={<Layout />}>
					<Route index element={<Dashboard />} />

					<Route path="/users" element={<UserList />} />
					<Route path="/users/:id" element={<UserDetail />} />

					<Route path="/kyc" element={<KycList />} />
					<Route path="/vehicles" element={<VehicleList />} />
					<Route path="/rides" element={<RideList />} />
					<Route path="/bookings" element={<BookingList />} />
					<Route path="/audit-logs" element={<AuditLogList />} />
				</Route>
				{/*
				 * Roubos de URL. Antes não havia rota `*`: escrever um caminho
				 * errado dava uma página em branco dentro do `Layout`, sem
				 * qualquer indicação do que aconteceu.
				 */}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</>
	);
}

function App() {
	return (
		<BrowserRouter>
			<AppContent />
		</BrowserRouter>
	);
}

export default App;
