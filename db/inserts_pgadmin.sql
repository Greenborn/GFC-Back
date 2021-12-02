--
-- PostgreSQL database dump
--

-- Dumped from database version 14.1 (Debian 14.1-1.pgdg100+1)
-- Dumped by pg_dump version 14.1 (Debian 14.1-1.pgdg100+1)

-- Started on 2021-12-02 17:58:38 EST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3403 (class 0 OID 16621)
-- Dependencies: 214
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.category (name, id) FROM stdin;
Estímulo	1
Primera etapa	2
Principiante	3
\.


--
-- TOC entry 3405 (class 0 OID 16628)
-- Dependencies: 216
-- Data for Name: contest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contest (name, description, start_date, end_date, max_img_section, img_url, rules_url, id) FROM stdin;
Concurso 1	Esto es una descripción	2021-10-23	2025-12-23	3	\N	\N	1
\.


--
-- TOC entry 3407 (class 0 OID 16638)
-- Dependencies: 218
-- Data for Name: contest_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contest_category (contest_id, category_id, id) FROM stdin;
1	1	1
1	2	2
1	3	3
\.


--
-- TOC entry 3415 (class 0 OID 16674)
-- Dependencies: 226
-- Data for Name: image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.image (code, title, profile_id, url, id) FROM stdin;
1-c1s2p3-1638484240	m	3	images/1-c1s2p3-1638484240.jpg	5
\.


--
-- TOC entry 3417 (class 0 OID 16681)
-- Dependencies: 228
-- Data for Name: metric; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metric (prize, score, id) FROM stdin;
15	5	1
0	0	4
0	0	5
\.


--
-- TOC entry 3425 (class 0 OID 16716)
-- Dependencies: 236
-- Data for Name: section; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.section (name, id) FROM stdin;
Monocromo	1
Color	2
Travel	3
\.


--
-- TOC entry 3409 (class 0 OID 16647)
-- Dependencies: 220
-- Data for Name: contest_result; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contest_result (metric_id, image_id, contest_id, id, section_id) FROM stdin;
5	5	1	5	2
\.


--
-- TOC entry 3411 (class 0 OID 16657)
-- Dependencies: 222
-- Data for Name: contest_section; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contest_section (contest_id, section_id, id) FROM stdin;
1	1	5
1	2	6
1	3	7
\.


--
-- TOC entry 3399 (class 0 OID 16605)
-- Dependencies: 210
-- Data for Name: footer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.footer (email, address, phone, id) FROM stdin;
\.


--
-- TOC entry 3413 (class 0 OID 16666)
-- Dependencies: 224
-- Data for Name: fotoclub; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fotoclub (name, id) FROM stdin;
El Portal De Tandil	1
Juarez Fotoclub	2
Necochea Fotoclub	3
Olavarría Fotoclub	4
Fotobar Necochea	5
\.


--
-- TOC entry 3401 (class 0 OID 16612)
-- Dependencies: 212
-- Data for Name: info_centro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.info_centro (title, content, img_url, id) FROM stdin;
\.


--
-- TOC entry 3419 (class 0 OID 16688)
-- Dependencies: 230
-- Data for Name: profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profile (name, last_name, fotoclub_id, id, img_url) FROM stdin;
administrador	base	2	1	\N
delegado	base	2	2	\N
concursante	base	1	3	\N
Juan	Perez	2	4	\N
\.


--
-- TOC entry 3421 (class 0 OID 16698)
-- Dependencies: 232
-- Data for Name: profile_contest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profile_contest (profile_id, contest_id, id, category_id) FROM stdin;
3	1	1	1
\.


--
-- TOC entry 3423 (class 0 OID 16709)
-- Dependencies: 234
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role (type, id) FROM stdin;
Administrador	1
Delegado	2
Concursante	3
\.


--
-- TOC entry 3429 (class 0 OID 16813)
-- Dependencies: 240
-- Data for Name: thumbnail; Type: TABLE DATA; Schema: public; Owner: grupo_fotografico
--

COPY public.thumbnail (id, image_id, thumbnail_type, url) FROM stdin;
4	5	1	images/thumbnails/256_2561-c1s2p3-1638484240.jpg
\.


--
-- TOC entry 3428 (class 0 OID 16806)
-- Dependencies: 239
-- Data for Name: thumbnail_type; Type: TABLE DATA; Schema: public; Owner: grupo_fotografico
--

COPY public.thumbnail_type (id, width, height) FROM stdin;
1	256	256
\.


--
-- TOC entry 3427 (class 0 OID 16723)
-- Dependencies: 238
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (username, password_hash, password_reset_token, access_token, created_at, updated_at, status, role_id, profile_id, id) FROM stdin;
admin	$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu	\N	ewrg(//(/FGtygvTCFR%&45fg6h7tm6tg65dr%RT&H/(O_O	\N	\N	1	1	1	1
concursante	$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu	\N	v	\N	\N	0	3	3	2
delegado	$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu	\N	v	\N	\N	1	2	2	3
jperez	$2y$13$gpO7MWrJh1wUrUj1zR1K5OQHrFW8h9aR5iwW.wvob0mIElUYbnp9S	\N	12345;3;4	1638481246	\N	1	3	4	4
\.


--
-- TOC entry 3437 (class 0 OID 0)
-- Dependencies: 213
-- Name: category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.category_id_seq', 3, true);


--
-- TOC entry 3438 (class 0 OID 0)
-- Dependencies: 217
-- Name: contest_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contest_category_id_seq', 3, true);


--
-- TOC entry 3439 (class 0 OID 0)
-- Dependencies: 215
-- Name: contest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contest_id_seq', 1, true);


--
-- TOC entry 3440 (class 0 OID 0)
-- Dependencies: 219
-- Name: contest_result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contest_result_id_seq', 5, true);


--
-- TOC entry 3441 (class 0 OID 0)
-- Dependencies: 221
-- Name: contest_section_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contest_section_id_seq', 7, true);


--
-- TOC entry 3442 (class 0 OID 0)
-- Dependencies: 209
-- Name: footer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.footer_id_seq', 1, false);


--
-- TOC entry 3443 (class 0 OID 0)
-- Dependencies: 223
-- Name: fotoclub_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fotoclub_id_seq', 5, true);


--
-- TOC entry 3444 (class 0 OID 0)
-- Dependencies: 225
-- Name: image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.image_id_seq', 5, true);


--
-- TOC entry 3445 (class 0 OID 0)
-- Dependencies: 211
-- Name: info_centro_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.info_centro_id_seq', 1, false);


--
-- TOC entry 3446 (class 0 OID 0)
-- Dependencies: 227
-- Name: metric_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.metric_id_seq', 5, true);


--
-- TOC entry 3447 (class 0 OID 0)
-- Dependencies: 231
-- Name: profile_contest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profile_contest_id_seq', 1, true);


--
-- TOC entry 3448 (class 0 OID 0)
-- Dependencies: 229
-- Name: profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profile_id_seq', 4, true);


--
-- TOC entry 3449 (class 0 OID 0)
-- Dependencies: 233
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_id_seq', 3, true);


--
-- TOC entry 3450 (class 0 OID 0)
-- Dependencies: 235
-- Name: section_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.section_id_seq', 3, true);


--
-- TOC entry 3451 (class 0 OID 0)
-- Dependencies: 241
-- Name: thumbnail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: grupo_fotografico
--

SELECT pg_catalog.setval('public.thumbnail_id_seq', 4, true);


--
-- TOC entry 3452 (class 0 OID 0)
-- Dependencies: 242
-- Name: thumbnail_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: grupo_fotografico
--

SELECT pg_catalog.setval('public.thumbnail_type_id_seq', 1, true);


--
-- TOC entry 3453 (class 0 OID 0)
-- Dependencies: 237
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_id_seq', 4, true);


-- Completed on 2021-12-02 17:58:39 EST

--
-- PostgreSQL database dump complete
--

