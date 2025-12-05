-- Fase 1.2: Criar Vilas Gastronômicas de Tamandaré
INSERT INTO vilas (name, slug, description, neighborhood, address, is_active) VALUES
('Vila Pescador Caboco', 'vila-pescador-caboco', 'Centro gastronômico com os melhores restaurantes e bares de frutos do mar de Tamandaré', 'Centro', 'Av. José Bezerra Sobrinho, Centro', true),
('Vila Padre Arlindo', 'vila-padre-arlindo', 'Polo gastronômico familiar com diversas opções de alimentação e lazer', 'Praia dos Carneiros', 'Praia dos Carneiros', true),
('Galeria Mares', 'galeria-mares', 'Centro comercial com praça de alimentação e lojas variadas', 'Centro', 'Rua da Matriz, Centro', true),
('Vila dos Sabores', 'vila-dos-sabores', 'Espaço dedicado à gastronomia local com restaurantes e lanchonetes', 'Orla', 'Av. Beira Mar, Orla', true)
ON CONFLICT (slug) DO NOTHING;