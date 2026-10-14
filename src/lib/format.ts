/**
 * Datas e horas, sempre em WAT.
 *
 * Angola é UTC+1 fixo, o ano inteiro. O backend faz um esforço explícito
 * para servir em WAT (`common/time.ts`, `startOfWatDay`, e o comentário em
 * `admin-query.service.ts` sobre o bug que a falta disto já causou), mas o
 * painel formatava com `toLocaleString()` **sem `timeZone`**, ou seja no fuso
 * do browser do operador.
 *
 * A diferença não é cosmética: em UTC, o filtro "hoje" do backend fecha uma
 * hora mais cedo do que a pessoa espera, e todas as horas de partida aparecem
 * erradas em uma hora. Um operador em UTC via a Lucia partir às 05:00.
 *
 * `pt-AO` e não `pt-PT`: o painel é de um produto angolano e usa o Kwanza
 * em toda a parte; as datas em formato europeu com barras destoavam do resto.
 */

const WAT = 'Africa/Luanda';

const dateFmt = new Intl.DateTimeFormat('pt-AO', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	timeZone: WAT,
});

const dateTimeFmt = new Intl.DateTimeFormat('pt-AO', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	timeZone: WAT,
});

const shortDateFmt = new Intl.DateTimeFormat('pt-AO', {
	day: '2-digit',
	month: 'short',
	timeZone: WAT,
});

const kzFmt = new Intl.NumberFormat('pt-AO', {
	style: 'currency',
	currency: 'AOA',
	// O Kwanza não tem subunidade em circulação.
	maximumFractionDigits: 0,
});

function toDate(value: string | Date | null | undefined): Date | null {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

/** "12/03/2026" em WAT. */
export function fmtDate(value: string | Date | null | undefined): string {
	const date = toDate(value);
	return date ? dateFmt.format(date) : '—';
}

/** "12/03/2026 08:30" em WAT. */
export function fmtDateTime(value: string | Date | null | undefined): string {
	const date = toDate(value);
	return date ? dateTimeFmt.format(date) : '—';
}

/** "12 mar" em WAT. */
export function fmtShortDate(value: string | Date | null | undefined): string {
	const date = toDate(value);
	return date ? shortDateFmt.format(date) : '—';
}

/** "5 000 Kz". `amount` é um `Int` no Prisma, nunca um `Decimal`. */
export function fmtKz(amount: number | null | undefined): string {
	if (amount === null || amount === undefined) return '—';
	return kzFmt.format(amount);
}
