import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			/** Dati vetrina cambiano raramente: meno richieste ripetute se l’utente naviga tra le pagine. */
			staleTime: 60_000,
			gcTime: 10 * 60_000,
		},
	},
});