/** Formatadores usados apenas pela tela de Crônicas. */

/** Data da aventura (`YYYY-MM-DD`) por extenso, lida em UTC. */
export const formatSessionDate = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));

/** Data e hora da publicação agendada. */
export const formatScheduledDate = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
