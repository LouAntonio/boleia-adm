import { useState } from 'react';
import { useLogin, authMessage } from '../hooks/useAuth';
import { authClient } from '../lib/auth-client';
import { Navigate } from 'react-router-dom';
import { LogIn, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const login = useLogin();
	// Já não há token em `localStorage` para ler de relance: a sessão vive num
	// cookie que o JavaScript não vê, e só o servidor responde se é válida.
	const { data: session, isPending } = authClient.useSession();

	if (!isPending && session) {
		return <Navigate to="/" replace />;
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !password) return;
		login.mutate({ email, password });
	};

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
			<div className="pointer-events-none absolute -inset-40">
				<div className="absolute right-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
				<div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
			</div>

			<div className="relative w-full max-w-sm animate-fade-in">
				<div className="rounded-xl border bg-surface p-8 shadow-elevated">
					<div className="mb-6 text-center">
						<img
							src="/images/logo.png"
							alt="Boleia"
							className="mx-auto h-12 w-12"
						/>
						<h1 className="mt-3 text-xl font-bold font-display text-text">
							Boleia
						</h1>
						<p className="mt-0.5 text-sm text-text-secondary">
							Painel Administrativo
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<label className="block text-sm font-medium text-text">
								Email
							</label>
							<div className="relative">
								<Mail
									size={16}
									className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
								/>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full rounded-lg border bg-surface py-2.5 pl-10 pr-4 text-sm text-text outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
									placeholder="admin@boleia.ao"
									required
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="block text-sm font-medium text-text">
								Senha
							</label>
							<div className="relative">
								<Lock
									size={16}
									className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
								/>
								<input
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									className="w-full rounded-lg border bg-surface py-2.5 pl-10 pr-10 text-sm text-text outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
									placeholder="••••••••"
									required
								/>
								<button
									type="button"
									onClick={() =>
										setShowPassword(!showPassword)
									}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
								>
									{showPassword ? (
										<EyeOff size={18} />
									) : (
										<Eye size={18} />
									)}
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={login.isPending}
							className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
						>
							{login.isPending ? (
								<>
									<Loader2
										size={16}
										className="animate-spin"
									/>
									A entrar...
								</>
							) : (
								<>
									<LogIn size={16} />
									Entrar
								</>
							)}
						</button>
					</form>

					{login.isError && (
						<p className="mt-4 animate-fade-in rounded-lg bg-error/10 p-3 text-center text-sm text-error">
							{authMessage(
								login.error,
								'Erro ao fazer login. Verifique as credenciais.',
							)}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
