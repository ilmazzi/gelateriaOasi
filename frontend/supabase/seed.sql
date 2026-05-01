insert into public.gelati (
  nome, descrizione, foto, prezzo_piccolo, prezzo_medio, prezzo_grande, categoria, in_evidenza, disponibile, allergeni
)
values
  ('Pistacchio', 'Crema intensa con pistacchi selezionati.', null, 3.00, 5.50, 10.00, 'classico', true, true, 'Frutta a guscio, latte'),
  ('Cioccolato Fondente', 'Fondente 70% dal gusto deciso.', null, 3.00, 5.50, 10.00, 'classico', true, true, 'Latte'),
  ('Fragola', 'Sorbetto fresco con fragole di stagione.', null, 3.00, 5.50, 10.00, 'frutta', false, true, null),
  ('Limone', 'Sorbetto al limone, leggero e dissetante.', null, 3.00, 5.50, 10.00, 'vegano', false, true, null),
  ('Nocciola', 'Crema vellutata alla nocciola.', null, 3.20, 5.80, 10.50, 'speciale', true, true, 'Frutta a guscio, latte');

insert into public.promozioni (
  titolo, descrizione, foto, data_inizio, data_fine, sconto_percentuale, attiva
)
values
  (
    '2x1 Cono Classico',
    'Ogni martedi su tutti i gusti classici.',
    null,
    current_date,
    current_date + interval '30 day',
    50,
    true
  ),
  (
    'Family Pack',
    'Vaschetta grande scontata nel weekend.',
    null,
    current_date,
    current_date + interval '45 day',
    20,
    true
  );

insert into public.foto_galleria (titolo, descrizione, foto_url, in_evidenza)
values
  ('Vetrina gusti', 'I gusti del giorno appena mantecati.', 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=900', true),
  ('Coppette artigianali', 'Servizio al banco con topping freschi.', 'https://images.unsplash.com/photo-1514849302-984523450cf4?w=900', true),
  ('Coni colorati', 'Una selezione dei nostri coni piu richiesti.', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=900', true);
