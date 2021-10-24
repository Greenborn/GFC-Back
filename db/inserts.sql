-- INSERT INTO "contest" ("id", "name", "description", "start_date", "end_date") VALUES
-- (1, 'Concurso primero todo', '1235555', NULL, NULL),
-- (2, 'concurso prueba 2', 'Reglas? no, no hay eso acá', NULL, NULL),
-- (5, 'concurso prueba 1', 'Reglas?', NULL, NULL),
-- (12, '124', '12433', NULL, NULL),
-- (13, '!231', ' 15221 sfd gs gfds gs', NULL, NULL),
-- (14, '123', '123', NULL, NULL);

-- INSERT INTO "image" ("id", "code", "title", "profile_id") VALUES
-- (25, '#123', '123', 24),
-- (26, '$6663', '2222', 29),
-- (27, '#123', '555', 27);


-- INSERT INTO "profile_contest" ("id", "profile_id", "contest_id") VALUES
-- (1, 1, 1),
-- (2, 1, 1);

-- INSERT INTO "contest_category" ("id", "contest_id", "category_id") VALUES
-- (1, 1, 1),
-- (2, 1, 2);

-- INSERT INTO "contest_section" ("id", "contest_id", "section_id") VALUES
-- (1, 1, 2),
-- (2, 1, 1);

-- INSERT INTO "metric" ("id", "prize", "score") VALUES
-- (24, '15', 5),
-- (25, '0', 0),
-- (26, '0', 0);

-- INSERT INTO "contest_result" ("id", "metric_id", "image_id", "contest_id") VALUES
-- (24, 24, 25, 1),
-- (25, 25, 26, 1),
-- (26, 26, 27, 1);

--------------------------------------------------------------------------------------------------------------------------------
--Básicos

INSERT INTO "category" ("name") VALUES
('Estímulo'),
('Primera etapa'),
('Principiante');

INSERT INTO "section" ("name") VALUES
('Monocromo'),
('Color'),
('Travel');

INSERT INTO "fotoclub" ("name") VALUES
('El Portal De Tandil'),
('Juarez Fotoclub'),
('Necochea Fotoclub'),
('Olavarría Fotoclub'),
('Fotobar Necochea');

INSERT INTO "role" ("type") VALUES
('Administrador'),
('Delegado'),
('Concursante');

INSERT INTO "profile" ("name", "last_name", "fotoclub_id") VALUES
('administrador', 'base', 2),
('delegado', 'base', 2),
('concursante', 'base', 1);

INSERT INTO "user" ("username", "password_hash", "password_reset_token", "access_token", "created_at", "updated_at", "status", "role_id", "profile_id") VALUES
('admin', '$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu', NULL, 'ewrg(//(/FGtygvTCFR%&45fg6h7tm6tg65dr%RT&H/(O_O', NULL, NULL, 1, 1, 1),
('concursante', '$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu', NULL, 'v', NULL, NULL, 0, 3, 3),
('delegado', '$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu', NULL, 'v', NULL, NULL, 1, 2, 2);

------------------------------------------------------------------------------------------------------------------------------
--EXTRA!

--concurso
INSERT INTO "contest" ("name", "description", "start_date", "end_date") VALUES
('Concurso 1', 'Esto es una descripción', '2021-10-23T00:00:00.000Z', '2025-12-23T03:00:00.000Z');

--subsección
INSERT INTO "section" ("name", "parent_id") VALUES
('Crudo', 1);

--concurso-sección (todas y la subsección en concurso 1)

INSERT INTO "contest_section" ("contest_id", "section_id") VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4);

--concurso-categorias (todas)

INSERT INTO "contest_category" ("contest_id", "category_id") VALUES
(1, 1),
(1, 2),
(1, 3);

--Inscripción de usuario concursante en concurso 1 categoria estímulo

INSERT INTO "profile_contest" ("profile_id", "contest_id", "category_id") VALUES
(3, 1, 1);

--imagen

INSERT INTO "image" ("code", "title", "profile_id") VALUES
('#123', '123', 3);

--metrica

INSERT INTO "metric" ("prize", "score") VALUES
('15', 5);

--resultado de concurso relacionado a una subseccion

INSERT INTO "contest_result" ("metric_id", "image_id", "contest_id", "section_id") VALUES
(1, 1, 1, 4);