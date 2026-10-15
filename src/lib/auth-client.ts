import { createAuthClient } from 'better-auth/react';
import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins';
import type { SessionUser } from '../types/admin';

/**
 * Cliente de autenticação oficial do better-auth.
 *
 * Substitui o que estava espalhado por três ficheiros: o `tokenFrom()` que lia o
 * header `set-auth-token`, a `useMe()` que fazia `GET /get-session` à mão, e as
 * cinco chamadas a `/api/auth/admin/*` escritas à mão em `useAdmin.ts`. As três
 * coisas continuam a existir, mas agoravem do cliente — com os tipos certaindos
 * pelo servidor.
 *
 * **A sessão vive num cookie, não num token.** `createAuthClient` põe
 * `credentials: 'include'` por omissão num browser, e o `AuthGuard` do backend
 * lê a sessão do cookie (`fromNodeHeaders`). É por isso que o `apiClient` de
 * axios deixou de levar `Authorization`: o browser envia o cookie sozinho com
 * `withCredentials: true` e não há nada a acrescentar. O token deixou de ser
 * legível por JavaScript, o que fecha a amplificação de um eventual XSS.
 *
 * O `adminClient()` expõe como `authClient.admin.*` exactamente os endpoints que
 * o plugin `admin` do backend regista (`back/src/auth/auth.ts:227`) — as mesmas
 * rotas que o painel chamava à mão.
 */
export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
	plugins: [
		adminClient(),
		/*
		 * `surname` e `phone` são `additionalFields` declarados no servidor
		 * (`back/src/auth/auth.ts:126-137`). O servidor envia-os — a página de
		 * detalhe do utilizador mostra o nome completo e o telefone — mas o
		 * cliente não os conhece sem que lhos declaremos.
		 *
		 * O `inferAdditionalFields` existe para exactamente isto: descreve a
		 * forma, e não exige o config do servidor. Sem ele, `getUser` devolvia
		 * um tipo onde `.surname` não existe, e a página tinha de tratar um
		 * campo que o backend envia como se não viesse.
		 *
		 * Este bloco tem de ser uma cópia do `user.additionalFields` do
		 * backend. Divergir dá `undefined` em silêncio num campo que a pessoa
		 * vê no ecrã.
		 */
		inferAdditionalFields({
			user: {
				phone: { type: 'string', required: false },
				surname: { type: 'string', required: false },
			},
		}),
	],
});

export type Session = typeof authClient.$Infer.Session;

/**
 * O utilizador da sessão em forma de `SessionUser`.
 *
 * O backend declara `phone` e `surname` como `additionalFields`
 * (`back/src/auth/auth.ts:126-137`). O cliente não os conhece por tipo — só
 * pelo que o servidor manda — e declará-los exigiria importar o config do
 * servidor, que vive noutro repositório. Normalizar aqui é o que mantém o resto
 * do painel com um tipo só, em vez de andar a verificar `undefined` em cada
 * campo nos quatro sítios que o usam.
 */
export function sessionUserFrom(raw: unknown): SessionUser {
	const data = (raw ?? {}) as Record<string, unknown>;
	return {
		id: String(data.id ?? ''),
		name: String(data.name ?? ''),
		surname: (data.surname as string | null) ?? null,
		email: String(data.email ?? ''),
		role: String(data.role ?? 'USER'),
		image: (data.image as string | null) ?? null,
		phone: (data.phone as string | null) ?? null,
		emailVerified: Boolean(data.emailVerified),
		createdAt: (data.createdAt as string) ?? '',
	};
}

/**
 * Mensagem de erro do cliente do better-auth.
 *
 * Devolve `null` quando o erro não tem mensagem legível, para o caller cair no
 * texto que tem em vez de mostrar `undefined` à pessoa.
 *
 * A forma do erro é `{ error: { message } }` e não a do axios
 * (`error.response.data.message`). São dois clientes HTTP diferentes, com duas
 * formas de erro diferentes, e misturá-las é como se chega a mostrar a mensagem
 * de fallback num erro que o servidor já tinha explicado.
 */
export function authErrorMessage(error: unknown): string | null {
	const err = error as {
		error?: { message?: unknown };
		message?: unknown;
		status?: unknown;
		body?: { message?: unknown };
	};
	const message = err?.error?.message ?? err?.body?.message ?? err?.message;
	return typeof message === 'string' && message.length > 0 ? message : null;
}

/**
 * `{ data, error }` → `data`, ou uma excepção.
 *
 * O `better-fetch` não faz `throw`: devolve os dois e deixa o caller escolher.
 * Para as queries do painel isso não serve — o `useQuery` trata `error` como um
 * valor, e as páginas leem `data.users` sem verificar nada. Devolvemos `data`
 * ou atiramos, para que o `useQuery` veja uma falha da maneira que já via, sem
 * cada hook ter de repetir a verificação.
 */
export async function unwrap<T>(
	result: Promise<{
		data: T | null;
		error: unknown;
	}>,
): Promise<T> {
	const { data, error } = await result;
	if (error) {
		throw new Error(
			authErrorMessage(error) ?? 'Falha ao falar com o servidor.',
		);
	}
	if (data === null || data === undefined) {
		throw new Error('O servidor devolveu uma resposta vazia.');
	}
	return data;
}
