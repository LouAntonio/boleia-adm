import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';
import { isAdminRole } from '../../lib/enums';

/**
 * Invólucro de todas as páginas do painel.
 *
 * Faz três validações, por ordem:
 *
 * 1. **Há sessão?** Se não, vai para o login.
 * 2. **É administrador?** Um `USER` ou `DRIVER` com um token válido — porque
 *    pode existir, se a sessão foi iniciada na app e o token é o mesmo — não
 *    tem nada a ver aqui. Antes isto não era verificado: bastava escrever a
 *    URL à mão e a página carregava, protegida só pelo 403 do servidor.
 * 3. **Sessão expirada a meio?** O interceptor do axios dispara um evento
 *    quando recebe 401; o `Layout` é quem escuta e redirecciona, para não
 *    ter de o fazer em cada hook.
 */
export function Layout() {
	const token = useAuthStore((s) => s.token);
	const role = useAuthStore((s) => s.user?.role);
	const sidebarOpen = useAppStore((s) => s.sidebarOpen);
	const location = useLocation();
	const [expired, setExpired] = useState(false);

	useEffect(() => {
		const onUnauthorised = () => setExpired(true);
		window.addEventListener('boleia:unauthorised', onUnauthorised);
		return () =>
			window.removeEventListener('boleia:unauthorised', onUnauthorised);
	}, []);

	// `replace` para não deixar a rota protegida no histórico: senão o botão
	// "voltar" depois do login leva a quem squeezou à página que o expulsou.
	if (expired || !token) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	if (role && !isAdminRole(role)) {
		// Sessão válida mas sem permissões. Fica numa página de recusa em vez
		// de um redirect silencioso para o login, que pareceria que a password
		// estava errada.
		return <NoAccess role={role} />;
	}

	return (
		<div className="min-h-screen bg-background">
			<Sidebar />
			<div
				className={`transition-all duration-300 ${
					sidebarOpen ? 'ml-60' : 'ml-16'
				}`}
			>
				<Header />
				<main className="p-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

function NoAccess({ role }: { role: string }) {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-6">
			<div className="max-w-md text-center">
				<h1 className="text-title-secondary font-sansExtraBold text-text">
					Sem acesso ao painel
				</h1>
				<p className="text-body-small text-text-secondary mt-2">
					A tua conta ({role}) não tem permissões de administração. Se
					precisas deste acesso, fala com quem administra a
					plataforma.
				</p>
				<a
					href="/login"
					className="inline-block mt-6 rounded-md bg-primary px-5 py-2.5 text-body-small font-sansMedium text-white"
				>
					Sair
				</a>
			</div>
		</div>
	);
}
