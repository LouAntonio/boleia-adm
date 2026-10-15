import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { authClient } from '../../lib/auth-client';
import { useAppStore } from '../../stores/useAppStore';
import { isAdminRole } from '../../lib/enums';

/**
 * Invólucro de todas as páginas do painel.
 *
 * Faz três validações, por ordem:
 *
 * 1. **A sessão ainda é válida?** A sessão vive num cookie, que o JavaScript não
 *    lê. A única forma de saber se é válida é perguntar ao servidor, e o
 *    `useSession()` é essa pergunta. Por isso o `isPending` é o estado normal do
 *    arranque de cada página protegida, e não uma excepção — já não se pode
 *    decidir de relance a partir do `localStorage`, que era o que permitia
 *    logo fechar a janela.
 * 2. **É administrador?** Um `USER` ou `DRIVER` com sessão válida — pode
 *    existir, se a sessão foi iniciada na app — não tem nada a ver aqui.
 * 3. **A sessão expirou a meio?** O interceptor do axios avisa; o `Layout` é
 *    quem escuta e redirecciona sem esperar pelo refetch.
 */
export function Layout() {
	const { data: session, isPending } = authClient.useSession();
	const sidebarOpen = useAppStore((s) => s.sidebarOpen);
	const location = useLocation();
	const [expired, setExpired] = useState(false);

	const role = session?.user?.role as string | undefined;

	useEffect(() => {
		const onUnauthorised = () => setExpired(true);
		window.addEventListener('boleia:unauthorised', onUnauthorised);
		return () =>
			window.removeEventListener('boleia:unauthorised', onUnauthorised);
	}, []);

	/*
	 * Uma sessão aparece sem acção nenhuma (expirou, foi revogada noutro
	 * sítio), e o `expired` ficava stuck em `true` para sempre, a expulsar
	 * quem acabasse de entrar. É a mesma armadilha da componente que dealha
	 * com a sessão, mas do outro lado.
	 */
	useEffect(() => {
		if (session) setExpired(false);
	}, [session]);

	// `replace` para não deixar a rota protegida no histórico: senão o botão
	// "voltar" depois do login leva a quem squeezou à página que o expulsou.
	if (expired || (!isPending && !session)) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	// Ainda a perguntar ao servidor se há sessão. Sem este estado, o `Navigate`
	// disparava antes da resposta, levava ao login, e a sessão chegava a seguir
	// a empurrar a pessoa outra vez para dentro do painel.
	if (isPending) {
		return <ShellSkeleton />;
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

function ShellSkeleton() {
	return (
		<div className="min-h-screen bg-background p-6">
			<div className="h-8 w-48 rounded bg-muted animate-pulse" />
			<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="h-24 rounded bg-muted animate-pulse"
					/>
				))}
			</div>
			<div className="mt-6 h-64 rounded bg-muted animate-pulse" />
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
