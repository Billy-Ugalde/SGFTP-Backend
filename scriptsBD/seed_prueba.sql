-- ============================================================
--  SEED DE PRUEBA — SGTPF
--  Base de datos: data_prueba
--
--  Propósito: poblar todas las tablas del sistema para verificar
--             que los triggers de auditoría registran correctamente
--             en audit_log.
--
--  IMPORTANTE: correr UNA sola vez sobre una BD limpia.
--              Si ya hay datos, truncar las tablas primero.
--  Genera aprox. 80+ registros en audit_log.
-- ============================================================
USE data_prueba;
SET FOREIGN_KEY_CHECKS = 0;
SET @hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uax2.HDrKe';
-- Contraseña real del hash anterior: "secret" (solo para pruebas)


-- ══════════════════════════════════════════════════════════════
-- 1. ROLES
-- ══════════════════════════════════════════════════════════════
INSERT IGNORE INTO roles (id_role, name) VALUES
(1, 'super_admin'),
(2, 'general_admin'),
(3, 'fair_admin'),
(4, 'content_admin'),
(5, 'auditor'),
(6, 'entrepreneur'),
(7, 'volunteer');


-- ══════════════════════════════════════════════════════════════
-- 2. PERSONAS  (base para usuarios, emprendedores y voluntarios)
-- ══════════════════════════════════════════════════════════════
INSERT INTO person (first_name, second_name, first_lastname, second_lastname, email, phone_primary) VALUES
-- Futuros usuarios del sistema
('Carlos',   'Alberto', 'Rodríguez', 'Méndez',   'carlos.r@sgtpf.com',       '87654321'),
('María',    'José',    'González',  'Vargas',    'maria.g@sgtpf.com',        '88112233'),
('Luis',     NULL,      'Herrera',   'Solano',    'luis.h@sgtpf.com',         '86543210'),
('Ana',      'Lucía',   'Morales',   'Brenes',    'ana.m@sgtpf.com',          '89871234'),
('Pedro',    NULL,      'Jiménez',   'Castro',    'pedro.j@sgtpf.com',        '83456789'),
-- Futuros emprendedores
('Sofía',    'Isabel',  'Campos',    'Rojas',     'sofia.c@sgtpf.com',        '87001122'),
('Diego',    NULL,      'Vega',      'Alvarado',  'diego.v@sgtpf.com',        '84556677'),
('Valeria',  'Paola',   'Núñez',     'Picado',    'valeria.n@sgtpf.com',      '85223344'),
-- Futuros voluntarios
('Andrés',   NULL,      'Quesada',   'Mora',      'andres.q@sgtpf.com',       '86334455'),
('Gabriela', 'María',   'Sánchez',   'Ulate',     'gabriela.s@sgtpf.com',     '82445566'),
('Ricardo',  NULL,      'Mora',      'Aguilar',   'ricardo.m@sgtpf.com',      '81556677');


-- ══════════════════════════════════════════════════════════════
-- 3. USUARIOS  → trigger INSERT en users
-- ══════════════════════════════════════════════════════════════
INSERT INTO users (password, status, isEmailVerified, person_id) VALUES
(@hash, 1, 1, 1),   -- Carlos   → id_user 1
(@hash, 1, 1, 2),   -- María    → id_user 2
(@hash, 1, 1, 3),   -- Luis     → id_user 3
(@hash, 0, 1, 4),   -- Ana      → inactiva
(@hash, 1, 0, 5);   -- Pedro    → email no verificado


-- ══════════════════════════════════════════════════════════════
-- 4. ASIGNACIÓN DE ROLES → trigger ROLE_ASSIGNED (INSERT user_roles)
-- ══════════════════════════════════════════════════════════════
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1),   -- Carlos  → super_admin
(1, 5),   -- Carlos  → auditor
(2, 2),   -- María   → general_admin
(3, 3),   -- Luis    → fair_admin
(4, 4),   -- Ana     → content_admin
(5, 6);   -- Pedro   → entrepreneur

-- Remoción de rol → trigger ROLE_REMOVED (DELETE user_roles)
DELETE FROM user_roles WHERE user_id = 4 AND role_id = 4;

-- Nuevo rol para Ana
INSERT INTO user_roles (user_id, role_id) VALUES (4, 7);  -- Ana → volunteer


-- ══════════════════════════════════════════════════════════════
-- 5. EMPRENDEDORES → trigger INSERT en entrepreneurs
-- ══════════════════════════════════════════════════════════════
INSERT INTO entrepreneurs (id_person, experience, status, is_active) VALUES
(6, 5, 'approved', 1),   -- Sofía    → id_entrepreneur 1
(7, 3, 'approved', 1),   -- Diego    → id_entrepreneur 2
(8, 8, 'approved', 1),   -- Valeria  → id_entrepreneur 3
(5, 2, 'pending',  1);   -- Pedro    → id_entrepreneur 4 (pendiente)

-- Cambio de estado → trigger STATUS_CHANGE en entrepreneurs
UPDATE entrepreneurs SET status    = 'approved' WHERE id_entrepreneur = 4;
UPDATE entrepreneurs SET is_active = 0          WHERE id_entrepreneur = 2;
UPDATE entrepreneurs SET is_active = 1          WHERE id_entrepreneur = 2;


-- ══════════════════════════════════════════════════════════════
-- 6. EMPRENDIMIENTOS → trigger INSERT en entrepreneurships
-- ══════════════════════════════════════════════════════════════
INSERT INTO entrepreneurships (id_entrepreneur, name, description, location, category, approach) VALUES
(1, 'Sabores de la Tierra',  'Gastronomía típica costarricense',     'San José',  'Comida',    'social'),
(2, 'Arte en Madera',        'Artesanías en madera nativa',          'Heredia',   'Artesanía', 'cultural'),
(3, 'Moda Sostenible',       'Ropa con telas recicladas',            'Alajuela',  'Vestimenta','ambiental'),
(4, 'Bisutería Natural',     'Accesorios con materiales naturales',  'Cartago',   'Accesorios','social');

-- Update de emprendimiento → trigger UPDATE en entrepreneurships
UPDATE entrepreneurships
   SET description = 'Gastronomía típica y fusión costarricense artesanal'
 WHERE id_entrepreneurship = 1;


-- ══════════════════════════════════════════════════════════════
-- 7. FERIAS → trigger INSERT en fair
-- ══════════════════════════════════════════════════════════════
INSERT INTO fair (name, description, conditions, location, stand_capacity, status, archived, typeFair, date) VALUES
('Feria Verde 2025',     'Feria de productos orgánicos y artesanales', 'Solo productos naturales',  'Parque La Sabana, SJ',    30, 1, 0, 'interna', '2025-06-15 08:00:00'),
('Expo Emprendedores',   'Muestra de emprendimientos locales',         'Registro previo requerido', 'Centro Cultural, Heredia', 50, 1, 0, 'externa', '2025-07-20 09:00:00'),
('Feria Artesanal 2025', 'Arte y cultura local',                       'Sin restricciones',         'Plaza Central, Alajuela',  25, 1, 0, 'interna', '2025-08-10 10:00:00');

-- Cambios en feria → trigger STATUS_CHANGE / datos en fair
UPDATE fair SET status   = 0 WHERE id_fair = 3;
UPDATE fair SET archived = 1 WHERE id_fair = 3;
UPDATE fair SET status   = 1, archived = 0 WHERE id_fair = 3;   -- la rehabilitamos


-- ══════════════════════════════════════════════════════════════
-- 8. STANDS (no tienen trigger propio, pero son FK de fair_enrollment)
-- ══════════════════════════════════════════════════════════════
INSERT INTO stand (stand_code, status, id_fair) VALUES
('F1-A01', 1, 1), ('F1-A02', 1, 1), ('F1-A03', 1, 1), ('F1-A04', 1, 1),
('F2-B01', 1, 2), ('F2-B02', 1, 2), ('F2-B03', 1, 2),
('F3-C01', 1, 3), ('F3-C02', 1, 3);


-- ══════════════════════════════════════════════════════════════
-- 9. INSCRIPCIONES A FERIA → trigger INSERT en fair_enrollment
-- ══════════════════════════════════════════════════════════════
INSERT INTO fair_enrollment (id_fair, id_stand, id_entreprenuer, status) VALUES
(1, 1, 1, 'approved'),
(1, 2, 2, 'pending'),
(1, 3, 3, 'pending'),
(2, 5, 1, 'approved'),
(2, 6, 4, 'pending');

-- Cambio de estado → trigger STATUS_CHANGE en fair_enrollment
UPDATE fair_enrollment SET status = 'approved' WHERE id_enrrolment_fair = 2;
UPDATE fair_enrollment SET status = 'approved' WHERE id_enrrolment_fair = 3;
UPDATE fair_enrollment SET status = 'rejected' WHERE id_enrrolment_fair = 5;


-- ══════════════════════════════════════════════════════════════
-- 10. PROYECTOS → trigger INSERT en project
-- ══════════════════════════════════════════════════════════════
INSERT INTO project
  (Name, Slug, Description, Observations, Aim,
   Start_date, End_date, Status, Target_population, Location,
   METRIC_TOTAL_BENEFICIATED, METRIC_TOTAL_WASTE_COLLECTED, METRIC_TOTAL_TREES_PLANTED, Active)
VALUES
('Reforestación Río Grande',
 'reforestacion-rio-grande',
 'Reforestación de riberas del Río Grande de Tárcoles',
 'Zona de amortiguamiento protegida',
 'Plantar 500 árboles nativos en 2025',
 '2025-01-15', '2025-12-15', 'execution', 'Comunidades ribereñas', 'Río Grande, Alajuela',
 200, 0, 150, 1),

('Reciclaje Comunitario',
 'reciclaje-comunitario',
 'Programa de reciclaje en 5 comunidades del área metropolitana',
 'Coordinación previa con municipalidad',
 'Reducir 2 toneladas de residuos sólidos',
 '2025-02-01', '2025-11-30', 'execution', 'Residentes zona norte', 'San José Norte',
 500, 2000, 0, 1),

('Huertos Urbanos Escolares',
 'huertos-urbanos-escolares',
 'Implementación de huertos en escuelas públicas de Heredia',
 'Requiere permiso del MEP',
 'Proveer hortalizas frescas a 300 estudiantes',
 '2025-03-10', NULL, 'planning', 'Estudiantes de primaria', 'Heredia',
 300, 0, 20, 0);

-- Cambio de estado → trigger STATUS_CHANGE / Active en project
UPDATE project SET Status = 'execution' WHERE Id_project = 3;
UPDATE project SET Active = 1           WHERE Id_project = 3;
UPDATE project SET METRIC_TOTAL_TREES_PLANTED = 175 WHERE Id_project = 1;


-- ══════════════════════════════════════════════════════════════
-- 11. ACTIVIDADES → trigger INSERT en activity
-- ══════════════════════════════════════════════════════════════
INSERT INTO activity
  (Name, Description, Conditions, Observations, IsRecurring, OpenForRegistration,
   Type_activity, Status_activity, Approach, Spaces, Location, Aim,
   Metric_activity, Total_metric_value, Active, Id_project)
VALUES
('Siembra Masiva Río Grande',
 'Jornada comunitaria de siembra de árboles nativos',
 'Llevar guantes, botas y agua',
 'Primera jornada del proyecto',
 0, 1, 'reforestation', 'execution', 'environmental',
 50, 'Río Grande, Alajuela', 'Plantar 100 árboles nativos',
 'trees_planted', 0, 1, 1),

('Taller Reciclaje Creativo',
 'Aprende a reciclar y reutilizar materiales del hogar',
 'Mayor de 12 años',
 'Se realiza el primer sábado de cada mes',
 1, 1, 'workshop', 'execution', 'social',
 30, 'Centro Comunal San José', 'Educar sobre reciclaje y economía circular',
 'attendance', 0, 1, 2),

('Recolección de Basura La Sabana',
 'Jornada de limpieza de espacios públicos',
 'Ropa cómoda, no se requiere experiencia',
 'Coordinar con municipalidad previo',
 0, 1, 'garbage_collection', 'planning', 'environmental',
 40, 'Parque La Sabana', 'Recolectar al menos 500 kg de residuos',
 'waste_collected', 0, 0, 2),

('Huerto Escuela La Libertad',
 'Instalación de huerto hidropónico en escuela pública',
 'Solo estudiantes y docentes de la institución',
 'Coordinar horario con dirección escolar',
 0, 0, 'conference', 'planning', 'social',
 25, 'Escuela La Libertad, Heredia', 'Instalar 5 camas de siembra',
 'attendance', 0, 0, 3);

-- Fechas de actividades
INSERT INTO date_activity (Start_date, End_date, Id_activity) VALUES
('2025-04-05 08:00:00', '2025-04-05 13:00:00', 1),
('2025-05-03 09:00:00', '2025-05-03 12:00:00', 2),
('2025-06-07 09:00:00', '2025-06-07 12:00:00', 2),
('2025-06-01 08:00:00', '2025-06-01 14:00:00', 3),
('2025-07-15 08:00:00', '2025-07-15 11:00:00', 4);

-- Cambio de estado → trigger STATUS_CHANGE / datos en activity
UPDATE activity SET Status_activity = 'execution'  WHERE Id_activity = 3;
UPDATE activity SET OpenForRegistration = 1         WHERE Id_activity = 3;
UPDATE activity SET Active = 1                      WHERE Id_activity = 3;
UPDATE activity SET Total_metric_value = 87         WHERE Id_activity = 1;


-- ══════════════════════════════════════════════════════════════
-- 12. VOLUNTARIOS → trigger INSERT en volunteers
-- ══════════════════════════════════════════════════════════════
INSERT INTO volunteers (id_person, is_active) VALUES
(9,  1),   -- Andrés    → id_volunteer 1
(10, 1),   -- Gabriela  → id_volunteer 2
(11, 1);   -- Ricardo   → id_volunteer 3

-- Cambio de estado → trigger en volunteers
UPDATE volunteers SET is_active = 0 WHERE id_volunteer = 3;
UPDATE volunteers SET is_active = 1 WHERE id_volunteer = 3;


-- ══════════════════════════════════════════════════════════════
-- 13. INSCRIPCIONES A ACTIVIDADES → trigger INSERT en activity_enrollment
-- ══════════════════════════════════════════════════════════════
INSERT INTO activity_enrollment (id_volunteer, id_activity, status) VALUES
(1, 1, 'enrolled'),   -- Andrés   → Siembra
(1, 2, 'enrolled'),   -- Andrés   → Taller reciclaje
(2, 1, 'enrolled'),   -- Gabriela → Siembra
(2, 3, 'enrolled'),   -- Gabriela → Recolección basura
(3, 2, 'enrolled'),   -- Ricardo  → Taller reciclaje
(3, 4, 'enrolled');   -- Ricardo  → Huerto escolar

-- Cambio de estado → trigger STATUS_CHANGE en activity_enrollment
UPDATE activity_enrollment SET status = 'attended'     WHERE id_enrollment_activity = 1;
UPDATE activity_enrollment SET status = 'attended'     WHERE id_enrollment_activity = 3;
UPDATE activity_enrollment SET status = 'not_attended' WHERE id_enrollment_activity = 5;
UPDATE activity_enrollment SET status = 'cancelled'    WHERE id_enrollment_activity = 6;


-- ══════════════════════════════════════════════════════════════
-- 14. NOTICIAS → trigger INSERT / UPDATE / DELETE en news
-- ══════════════════════════════════════════════════════════════
INSERT INTO news (title, content, author, status, publicationDate) VALUES
('Feria Verde llega este junio',
 'La Fundación Tamarindo Park presenta su primera Feria Verde del 2025. Un espacio para emprendedores locales y productos orgánicos.',
 'Equipo Editorial', 'published', '2025-05-01'),

('Nuevo proyecto de reforestación en Río Grande',
 'Iniciamos un ambicioso plan de reforestación en las riberas del Río Grande de Tárcoles, con la participación de 50 voluntarios.',
 'Carlos Rodríguez', 'draft', '2025-05-10'),

('Convocatoria voluntarios 2025',
 'Buscamos voluntarios comprometidos con el medio ambiente para nuestras actividades de reforestación y limpieza comunitaria.',
 'María González', 'draft', '2025-05-12'),

('Resultados Expo Emprendedores 2024',
 'La segunda edición de Expo Emprendedores superó todas las expectativas con más de 500 visitantes y 30 emprendimientos participantes.',
 'Equipo Editorial', 'published', '2025-04-20');

-- Cambio de estado (published) → trigger STATUS_CHANGE
UPDATE news SET status = 'published' WHERE id_news = 2;
UPDATE news SET status = 'published' WHERE id_news = 3;

-- Edición de contenido → trigger UPDATE datos
UPDATE news SET title = 'Convocatoria Voluntarios 2025 — ¡Cupos limitados!' WHERE id_news = 3;
UPDATE news SET status = 'archived' WHERE id_news = 4;

-- INSERT temporal + DELETE → trigger DELETE en news
INSERT INTO news (title, content, author, status, publicationDate)
VALUES ('Noticia temporal de prueba', 'Contenido de prueba para el trigger DELETE.', 'Sistema', 'draft', CURDATE());
DELETE FROM news WHERE title = 'Noticia temporal de prueba';


-- ══════════════════════════════════════════════════════════════
-- 15. CONTENT BLOCKS → trigger UPDATE en content_blocks
--     (los bloques normalmente existen desde el inicio del backend;
--      los insertamos con INSERT IGNORE y luego los editamos)
-- ══════════════════════════════════════════════════════════════
INSERT IGNORE INTO content_blocks (page, section, block_key, text_content) VALUES
('home',  'hero',            'title',       'Fundación Tamarindo Park'),
('home',  'hero',            'description', 'Transformando vidas y comunidades'),
('home',  'value_prop',      'card_1',      'Sostenibilidad ambiental'),
('home',  'value_prop',      'card_2',      'Inclusión social'),
('home',  'involve_section', 'title',       'Únete a nuestra misión'),
('about', 'hero',            'title',       'Quiénes somos'),
('about', 'hero',            'description', 'Una fundación comprometida con Costa Rica');

-- Ediciones → trigger UPDATE en content_blocks
UPDATE content_blocks
   SET text_content = 'Fundación Tamarindo Park — Por un Costa Rica mejor'
 WHERE page = 'home' AND section = 'hero' AND block_key = 'title';

UPDATE content_blocks
   SET text_content = 'Construyendo un futuro sostenible para las comunidades más vulnerables'
 WHERE page = 'home' AND section = 'hero' AND block_key = 'description';

UPDATE content_blocks
   SET text_content = 'Impacto ambiental medible y sostenido'
 WHERE page = 'home' AND section = 'value_prop' AND block_key = 'card_1';

UPDATE content_blocks
   SET text_content = 'Inclusión social y equidad'
 WHERE page = 'home' AND section = 'value_prop' AND block_key = 'card_2';


-- ══════════════════════════════════════════════════════════════
-- 16. SUSCRIPTORES → trigger INSERT / DELETE en subscriber
-- ══════════════════════════════════════════════════════════════
INSERT INTO subscriber (email, first_name, last_name, preferred_language) VALUES
('andrea.v@gmail.com',   'Andrea',   'Vargas',    'es'),
('fernanda.l@gmail.com', 'Fernanda', 'López',     'es'),
('john.s@gmail.com',     'John',     'Smith',     'en'),
('juliana.r@gmail.com',  'Juliana',  'Rodríguez', 'es'),
('michael.j@gmail.com',  'Michael',  'Johnson',   'en'),
('temporal@test.com',    'Temporal', 'Prueba',    'es');   -- se eliminará

-- DELETE → trigger DELETE en subscriber
DELETE FROM subscriber WHERE email = 'temporal@test.com';


-- ══════════════════════════════════════════════════════════════
-- 17. DONANTES Y DONACIONES → trigger INSERT / UPDATE en donation
-- ══════════════════════════════════════════════════════════════
INSERT INTO donor (firstName, firstLastName, secondLastName, donorType, interest, email, phone) VALUES
('Empresas',     'Verde',    'SA',    'strategic_ally', 'environmental', 'emp.verde@corp.com',    '22334455'),
('Inversiones',  'Futuro',   'Ltda',  'strategic_ally', 'social',        'inv.futuro@corp.com',   '22556677'),
('Roberto',      'Arias',    'Rojas', 'donor',          'cultural',      'roberto.a@gmail.com',   '87990011'),
('Carmen',       'Delgado',  'Solís', 'donor',          'environmental', 'carmen.d@gmail.com',    '86112233');

INSERT INTO donation (donationType, donationDetails, status, idDonor) VALUES
('money',      'Donación mensual para proyectos ambientales',  'nuevo',     1),
('food',       'Alimentos no perecederos para 50 familias',    'ejecucion', 2),
('clothing',   'Ropa de segunda mano en buen estado',          'nuevo',     3),
('used_items', 'Herramientas para el huerto escolar',          'ejecucion', 4),
('money',      'Aporte especial para Feria Verde 2025',        'nuevo',     1),
('other',      'Servicios de logística para eventos',          'nuevo',     2);

-- Cambio de estado → trigger STATUS_CHANGE en donation
UPDATE donation SET status = 'ejecucion'  WHERE idDonation = 1;
UPDATE donation SET status = 'finalizado' WHERE idDonation = 2;
UPDATE donation SET status = 'ejecucion'  WHERE idDonation = 3;
UPDATE donation SET status = 'finalizado' WHERE idDonation = 4;
UPDATE donation SET status = 'suspendido' WHERE idDonation = 6;


-- ══════════════════════════════════════════════════════════════
-- 18. NEWSLETTER CAMPAIGNS → trigger INSERT en newsletter_campaigns
-- ══════════════════════════════════════════════════════════════
INSERT INTO newsletter_campaigns
  (subject, content, language, sent_by, totalRecipients, successfulSends, failedSends, status)
VALUES
('Novedades Mayo 2025',
 '<h1>Hola!</h1><p>Este mes tenemos ferias, voluntariados y mucho más.</p>',
 'spanish', 1, 5, 5, 0, 'completed'),

('Upcoming Events — May 2025',
 '<h1>Hello!</h1><p>This month we have fairs, volunteer opportunities and more.</p>',
 'english', 1, 2, 2, 0, 'completed'),

('Convocatoria Voluntarios Junio 2025',
 '<h1>¡Únete!</h1><p>Necesitamos voluntarios para las actividades de junio. ¡Inscríbete ya!</p>',
 'spanish', 2, 5, 4, 1, 'partial');


-- ══════════════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL
-- ══════════════════════════════════════════════════════════════
SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ Seed completado exitosamente.' AS resultado;

SELECT
  entity                                   AS tabla,
  action                                   AS accion,
  COUNT(*)                                 AS eventos
FROM audit_log
GROUP BY entity, action
ORDER BY entity, action;

SELECT COUNT(*) AS total_eventos_auditados FROM audit_log;
