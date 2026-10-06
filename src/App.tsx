import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { usePageTitle } from './hooks/usePageTitle';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UserList } from './pages/users/UserList';
import { UserCreate } from './pages/users/UserCreate';
import { UserDetail } from './pages/users/UserDetail';
import { PlanList } from './pages/plans/PlanList';
import { PlanCreate } from './pages/plans/PlanCreate';
import { SubscriptionList } from './pages/subscriptions/SubscriptionList';
import { TranscriptionList } from './pages/transcriptions/TranscriptionList';
import { TranscriptionDetail } from './pages/transcriptions/TranscriptionDetail';
import { PaymentList } from './pages/payments/PaymentList';
import { PaymentDetail } from './pages/payments/PaymentDetail';
import { CmsPage } from './pages/settings/CmsPage';
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
					<Route path="/users/create" element={<UserCreate />} />
					<Route path="/users/:id" element={<UserDetail />} />

					<Route path="/plans" element={<PlanList />} />
					<Route path="/plans/create" element={<PlanCreate />} />

					<Route
						path="/subscriptions"
						element={<SubscriptionList />}
					/>

					<Route
						path="/transcriptions"
						element={<TranscriptionList />}
					/>
					<Route
						path="/transcriptions/:id"
						element={<TranscriptionDetail />}
					/>

					<Route path="/payments" element={<PaymentList />} />
					<Route path="/payments/:id" element={<PaymentDetail />} />

					<Route path="/settings" element={<CmsPage />} />

					<Route path="/audit-logs" element={<AuditLogList />} />
				</Route>
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
