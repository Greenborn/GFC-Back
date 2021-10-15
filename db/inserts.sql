INSERT INTO "category" ("id", "name") VALUES
(1, 'Primera, number one'),
(2, 'Segunda');

INSERT INTO "section" ("id", "name") VALUES
(1, 'Monocromo'),
(2, 'Color');

INSERT INTO "fotoclub" ("id", "name") VALUES
(1, 'Testing'),
(2, 'El faro');

INSERT INTO "role" ("id", "type") VALUES
(1, 'Administrador'),
(2, 'Delegado'),
(3, 'Concursante');


INSERT INTO "user" ("id", "username", "password_hash", "password_reset_token", "access_token", "created_at", "updated_at", "status", "role_id", "profile_id") VALUES
(1, 'admin', '$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu', NULL, 'ewrg(//(/FGtygvTCFR%&45fg6h7tm6tg65dr%RT&H/(O_O', NULL, NULL, 1, 1, 1),
(6, 'conc', NULL, NULL, '1', NULL, NULL, 0, 3, 24),
(7, 'c1', NULL, NULL, '1', NULL, NULL, 0, 3, 26),
(8, 'c2', NULL, NULL, '1', NULL, NULL, 0, 3, 27),
(9, 'c3', NULL, NULL, '1', NULL, NULL, 0, 3, 28),
(10, 'c4', NULL, NULL, '1', NULL, NULL, 0, 3, 29),
(101, 'd2', NULL, NULL, '1', NULL, NULL, 1, 2, 30),
(102, 'user', '$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu', NULL, 'v', NULL, NULL, 1, 2, 2);


INSERT INTO "profile" ("id", "name", "last_name", "fotoclub_id") VALUES
(1, 'admin', 'dos', 2),
(2, 'delegado', 'uno', 2),
(24, 'concursante', 'uno', 1),
(26, 'concursante', 'dos', 1),
(27, 'concursante', 'tres', 1),
(28, 'concursante', 'cuatro', 2),
(29, 'concursante', 'cinco', 2),
(30, 'delegado', 'dos', 1);

INSERT INTO "contest" ("id", "name", "description", "start_date", "end_date") VALUES
(1, 'Concurso primero todo', '1235555', NULL, NULL),
(2, 'concurso prueba 2', 'Reglas? no, no hay eso acá', NULL, NULL),
(5, 'concurso prueba 1', 'Reglas?', NULL, NULL),
(12, '124', '12433', NULL, NULL),
(13, '!231', ' 15221 sfd gs gfds gs', NULL, NULL),
(14, '123', '123', NULL, NULL);

INSERT INTO "image" ("id", "code", "title", "profile_id") VALUES
(25, '#123', '123', 24),
(26, '$6663', '2222', 29),
(27, '#123', '555', 27);


INSERT INTO "profile_contest" ("id", "profile_id", "contest_id") VALUES
(1, 1, 1),
(2, 1, 1);

INSERT INTO "contest_category" ("id", "contest_id", "category_id") VALUES
(1, 1, 1),
(2, 1, 2);

INSERT INTO "contest_section" ("id", "contest_id", "section_id") VALUES
(1, 1, 2),
(2, 1, 1);

INSERT INTO "metric" ("id", "prize", "score") VALUES
(24, '15', 5),
(25, '0', 0),
(26, '0', 0);

INSERT INTO "contest_result" ("id", "metric_id", "image_id", "contest_id") VALUES
(24, 24, 25, 1),
(25, 25, 26, 1),
(26, 26, 27, 1);















