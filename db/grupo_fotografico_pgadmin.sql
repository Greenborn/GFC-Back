--
-- PostgreSQL database dump
--

-- Dumped from database version 14.1 (Debian 14.1-1.pgdg100+1)
-- Dumped by pg_dump version 14.1 (Debian 14.1-1.pgdg100+1)

-- Started on 2021-12-02 17:56:44 EST

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 214 (class 1259 OID 16621)
-- Name: category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category (
    name character varying(45) NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.category OWNER TO postgres;

--
-- TOC entry 213 (class 1259 OID 16620)
-- Name: category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.category_id_seq OWNER TO postgres;

--
-- TOC entry 3430 (class 0 OID 0)
-- Dependencies: 213
-- Name: category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.category_id_seq OWNED BY public.category.id;


--
-- TOC entry 216 (class 1259 OID 16628)
-- Name: contest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contest (
    name character varying(45) NOT NULL,
    description text,
    start_date date,
    end_date date,
    max_img_section integer DEFAULT 3,
    img_url character varying(45),
    rules_url character varying(45),
    id integer NOT NULL
);


ALTER TABLE public.contest OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16638)
-- Name: contest_category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contest_category (
    contest_id integer NOT NULL,
    category_id integer NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.contest_category OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16637)
-- Name: contest_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contest_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contest_category_id_seq OWNER TO postgres;

--
-- TOC entry 3434 (class 0 OID 0)
-- Dependencies: 217
-- Name: contest_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contest_category_id_seq OWNED BY public.contest_category.id;


--
-- TOC entry 215 (class 1259 OID 16627)
-- Name: contest_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contest_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contest_id_seq OWNER TO postgres;

--
-- TOC entry 3436 (class 0 OID 0)
-- Dependencies: 215
-- Name: contest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contest_id_seq OWNED BY public.contest.id;


--
-- TOC entry 220 (class 1259 OID 16647)
-- Name: contest_result; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contest_result (
    metric_id integer NOT NULL,
    image_id integer NOT NULL,
    contest_id integer NOT NULL,
    id integer NOT NULL,
    section_id integer NOT NULL
);


ALTER TABLE public.contest_result OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16646)
-- Name: contest_result_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contest_result_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contest_result_id_seq OWNER TO postgres;

--
-- TOC entry 3439 (class 0 OID 0)
-- Dependencies: 219
-- Name: contest_result_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contest_result_id_seq OWNED BY public.contest_result.id;


--
-- TOC entry 222 (class 1259 OID 16657)
-- Name: contest_section; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contest_section (
    contest_id integer NOT NULL,
    section_id integer NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.contest_section OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16656)
-- Name: contest_section_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contest_section_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contest_section_id_seq OWNER TO postgres;

--
-- TOC entry 3442 (class 0 OID 0)
-- Dependencies: 221
-- Name: contest_section_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contest_section_id_seq OWNED BY public.contest_section.id;


--
-- TOC entry 210 (class 1259 OID 16605)
-- Name: footer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.footer (
    email character varying(45),
    address character varying(45),
    phone character varying(45),
    id integer NOT NULL
);


ALTER TABLE public.footer OWNER TO postgres;

--
-- TOC entry 209 (class 1259 OID 16604)
-- Name: footer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.footer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.footer_id_seq OWNER TO postgres;

--
-- TOC entry 3445 (class 0 OID 0)
-- Dependencies: 209
-- Name: footer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.footer_id_seq OWNED BY public.footer.id;


--
-- TOC entry 224 (class 1259 OID 16666)
-- Name: fotoclub; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fotoclub (
    name character varying(45) DEFAULT NULL::character varying,
    id integer NOT NULL
);


ALTER TABLE public.fotoclub OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16665)
-- Name: fotoclub_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fotoclub_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fotoclub_id_seq OWNER TO postgres;

--
-- TOC entry 3448 (class 0 OID 0)
-- Dependencies: 223
-- Name: fotoclub_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fotoclub_id_seq OWNED BY public.fotoclub.id;


--
-- TOC entry 226 (class 1259 OID 16674)
-- Name: image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.image (
    code character varying(20) NOT NULL,
    title character varying(45) NOT NULL,
    profile_id integer NOT NULL,
    url character varying(45),
    id integer NOT NULL
);


ALTER TABLE public.image OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16673)
-- Name: image_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.image_id_seq OWNER TO postgres;

--
-- TOC entry 3451 (class 0 OID 0)
-- Dependencies: 225
-- Name: image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.image_id_seq OWNED BY public.image.id;


--
-- TOC entry 212 (class 1259 OID 16612)
-- Name: info_centro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.info_centro (
    title character varying(200),
    content text,
    img_url character varying(45),
    id integer NOT NULL
);


ALTER TABLE public.info_centro OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 16611)
-- Name: info_centro_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.info_centro_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.info_centro_id_seq OWNER TO postgres;

--
-- TOC entry 3454 (class 0 OID 0)
-- Dependencies: 211
-- Name: info_centro_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.info_centro_id_seq OWNED BY public.info_centro.id;


--
-- TOC entry 228 (class 1259 OID 16681)
-- Name: metric; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metric (
    prize character varying(10) NOT NULL,
    score integer,
    id integer NOT NULL
);


ALTER TABLE public.metric OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16680)
-- Name: metric_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.metric_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.metric_id_seq OWNER TO postgres;

--
-- TOC entry 3457 (class 0 OID 0)
-- Dependencies: 227
-- Name: metric_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metric_id_seq OWNED BY public.metric.id;


--
-- TOC entry 230 (class 1259 OID 16688)
-- Name: profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profile (
    name character varying(59) DEFAULT NULL::character varying,
    last_name character varying(50) DEFAULT NULL::character varying,
    fotoclub_id integer NOT NULL,
    id integer NOT NULL,
    img_url character varying(45)
);


ALTER TABLE public.profile OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16698)
-- Name: profile_contest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profile_contest (
    profile_id integer NOT NULL,
    contest_id integer NOT NULL,
    id integer NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.profile_contest OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16697)
-- Name: profile_contest_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.profile_contest_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.profile_contest_id_seq OWNER TO postgres;

--
-- TOC entry 3461 (class 0 OID 0)
-- Dependencies: 231
-- Name: profile_contest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.profile_contest_id_seq OWNED BY public.profile_contest.id;


--
-- TOC entry 229 (class 1259 OID 16687)
-- Name: profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.profile_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.profile_id_seq OWNER TO postgres;

--
-- TOC entry 3463 (class 0 OID 0)
-- Dependencies: 229
-- Name: profile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.profile_id_seq OWNED BY public.profile.id;


--
-- TOC entry 234 (class 1259 OID 16709)
-- Name: role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    type character varying(45) NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.role OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16708)
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_id_seq OWNER TO postgres;

--
-- TOC entry 3466 (class 0 OID 0)
-- Dependencies: 233
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_id_seq OWNED BY public.role.id;


--
-- TOC entry 236 (class 1259 OID 16716)
-- Name: section; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.section (
    name character varying(45) NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.section OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16715)
-- Name: section_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.section_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.section_id_seq OWNER TO postgres;

--
-- TOC entry 3469 (class 0 OID 0)
-- Dependencies: 235
-- Name: section_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.section_id_seq OWNED BY public.section.id;


--
-- TOC entry 240 (class 1259 OID 16813)
-- Name: thumbnail; Type: TABLE; Schema: public; Owner: grupo_fotografico
--

CREATE TABLE public.thumbnail (
    id integer NOT NULL,
    image_id integer NOT NULL,
    thumbnail_type integer NOT NULL,
    url character varying(250) NOT NULL
);


ALTER TABLE public.thumbnail OWNER TO grupo_fotografico;

--
-- TOC entry 241 (class 1259 OID 16830)
-- Name: thumbnail_id_seq; Type: SEQUENCE; Schema: public; Owner: grupo_fotografico
--

ALTER TABLE public.thumbnail ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.thumbnail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 239 (class 1259 OID 16806)
-- Name: thumbnail_type; Type: TABLE; Schema: public; Owner: grupo_fotografico
--

CREATE TABLE public.thumbnail_type (
    id integer NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL
);


ALTER TABLE public.thumbnail_type OWNER TO grupo_fotografico;

--
-- TOC entry 242 (class 1259 OID 16831)
-- Name: thumbnail_type_id_seq; Type: SEQUENCE; Schema: public; Owner: grupo_fotografico
--

ALTER TABLE public.thumbnail_type ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.thumbnail_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 238 (class 1259 OID 16723)
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    username character varying(45) DEFAULT NULL::character varying,
    password_hash character varying(255) DEFAULT NULL::character varying,
    password_reset_token character varying(255) DEFAULT NULL::character varying,
    access_token character varying(128) DEFAULT NULL::character varying,
    created_at character varying(45) DEFAULT NULL::character varying,
    updated_at character varying(45) DEFAULT NULL::character varying,
    status smallint NOT NULL,
    role_id integer NOT NULL,
    profile_id integer NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16722)
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO postgres;

--
-- TOC entry 3472 (class 0 OID 0)
-- Dependencies: 237
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- TOC entry 3199 (class 2604 OID 16624)
-- Name: category id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category ALTER COLUMN id SET DEFAULT nextval('public.category_id_seq'::regclass);


--
-- TOC entry 3201 (class 2604 OID 16632)
-- Name: contest id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest ALTER COLUMN id SET DEFAULT nextval('public.contest_id_seq'::regclass);


--
-- TOC entry 3202 (class 2604 OID 16641)
-- Name: contest_category id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_category ALTER COLUMN id SET DEFAULT nextval('public.contest_category_id_seq'::regclass);


--
-- TOC entry 3203 (class 2604 OID 16650)
-- Name: contest_result id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_result ALTER COLUMN id SET DEFAULT nextval('public.contest_result_id_seq'::regclass);


--
-- TOC entry 3204 (class 2604 OID 16660)
-- Name: contest_section id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_section ALTER COLUMN id SET DEFAULT nextval('public.contest_section_id_seq'::regclass);


--
-- TOC entry 3197 (class 2604 OID 16608)
-- Name: footer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.footer ALTER COLUMN id SET DEFAULT nextval('public.footer_id_seq'::regclass);


--
-- TOC entry 3206 (class 2604 OID 16670)
-- Name: fotoclub id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fotoclub ALTER COLUMN id SET DEFAULT nextval('public.fotoclub_id_seq'::regclass);


--
-- TOC entry 3207 (class 2604 OID 16677)
-- Name: image id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image ALTER COLUMN id SET DEFAULT nextval('public.image_id_seq'::regclass);


--
-- TOC entry 3198 (class 2604 OID 16615)
-- Name: info_centro id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_centro ALTER COLUMN id SET DEFAULT nextval('public.info_centro_id_seq'::regclass);


--
-- TOC entry 3208 (class 2604 OID 16684)
-- Name: metric id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metric ALTER COLUMN id SET DEFAULT nextval('public.metric_id_seq'::regclass);


--
-- TOC entry 3211 (class 2604 OID 16693)
-- Name: profile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile ALTER COLUMN id SET DEFAULT nextval('public.profile_id_seq'::regclass);


--
-- TOC entry 3212 (class 2604 OID 16701)
-- Name: profile_contest id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_contest ALTER COLUMN id SET DEFAULT nextval('public.profile_contest_id_seq'::regclass);


--
-- TOC entry 3213 (class 2604 OID 16712)
-- Name: role id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role ALTER COLUMN id SET DEFAULT nextval('public.role_id_seq'::regclass);


--
-- TOC entry 3214 (class 2604 OID 16719)
-- Name: section id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.section ALTER COLUMN id SET DEFAULT nextval('public.section_id_seq'::regclass);


--
-- TOC entry 3221 (class 2604 OID 16732)
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- TOC entry 3227 (class 2606 OID 16626)
-- Name: category category_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pk PRIMARY KEY (id);


--
-- TOC entry 3231 (class 2606 OID 16643)
-- Name: contest_category contest_category_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_category
    ADD CONSTRAINT contest_category_pk PRIMARY KEY (id);


--
-- TOC entry 3229 (class 2606 OID 16636)
-- Name: contest contest_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest
    ADD CONSTRAINT contest_pk PRIMARY KEY (id);


--
-- TOC entry 3235 (class 2606 OID 16652)
-- Name: contest_result contest_result_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_result
    ADD CONSTRAINT contest_result_pk PRIMARY KEY (id);


--
-- TOC entry 3240 (class 2606 OID 16662)
-- Name: contest_section contest_section_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_section
    ADD CONSTRAINT contest_section_pk PRIMARY KEY (id);


--
-- TOC entry 3263 (class 2606 OID 16738)
-- Name: user fk_user_profile_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT fk_user_profile_id UNIQUE (profile_id);


--
-- TOC entry 3223 (class 2606 OID 16610)
-- Name: footer footer_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.footer
    ADD CONSTRAINT footer_pk PRIMARY KEY (id);


--
-- TOC entry 3244 (class 2606 OID 16672)
-- Name: fotoclub fotoclub_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fotoclub
    ADD CONSTRAINT fotoclub_pk PRIMARY KEY (id);


--
-- TOC entry 3246 (class 2606 OID 16679)
-- Name: image image_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT image_pk PRIMARY KEY (id);


--
-- TOC entry 3225 (class 2606 OID 16619)
-- Name: info_centro info_centro_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.info_centro
    ADD CONSTRAINT info_centro_pk PRIMARY KEY (id);


--
-- TOC entry 3248 (class 2606 OID 16686)
-- Name: metric metric_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metric
    ADD CONSTRAINT metric_pk PRIMARY KEY (id);


--
-- TOC entry 3255 (class 2606 OID 16703)
-- Name: profile_contest profile_contest_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_contest
    ADD CONSTRAINT profile_contest_pk PRIMARY KEY (id);


--
-- TOC entry 3257 (class 2606 OID 16705)
-- Name: profile_contest profile_enrolled; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_contest
    ADD CONSTRAINT profile_enrolled UNIQUE (profile_id, contest_id);


--
-- TOC entry 3251 (class 2606 OID 16695)
-- Name: profile profile_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT profile_pk PRIMARY KEY (id);


--
-- TOC entry 3259 (class 2606 OID 16714)
-- Name: role role_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pk PRIMARY KEY (id);


--
-- TOC entry 3261 (class 2606 OID 16721)
-- Name: section section_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.section
    ADD CONSTRAINT section_pk PRIMARY KEY (id);


--
-- TOC entry 3270 (class 2606 OID 16829)
-- Name: thumbnail thumbnail_pkey; Type: CONSTRAINT; Schema: public; Owner: grupo_fotografico
--

ALTER TABLE ONLY public.thumbnail
    ADD CONSTRAINT thumbnail_pkey PRIMARY KEY (id);


--
-- TOC entry 3268 (class 2606 OID 16812)
-- Name: thumbnail_type thumbnail_type_pkey; Type: CONSTRAINT; Schema: public; Owner: grupo_fotografico
--

ALTER TABLE ONLY public.thumbnail_type
    ADD CONSTRAINT thumbnail_type_pkey PRIMARY KEY (id);


--
-- TOC entry 3266 (class 2606 OID 16736)
-- Name: user user_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pk PRIMARY KEY (id);


--
-- TOC entry 3232 (class 1259 OID 16644)
-- Name: fk_contest_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fk_contest_category_id ON public.contest_category USING btree (category_id);


--
-- TOC entry 3241 (class 1259 OID 16664)
-- Name: fk_contest_contest2_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fk_contest_contest2_id ON public.contest_section USING btree (contest_id);


--
-- TOC entry 3233 (class 1259 OID 16645)
-- Name: fk_contest_contest_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fk_contest_contest_id ON public.contest_category USING btree (contest_id);


--
-- TOC entry 3236 (class 1259 OID 16654)
-- Name: fk_contest_result_contest_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fk_contest_result_contest_id ON public.contest_result USING btree (contest_id);


--
-- TOC entry 3237 (class 1259 OID 16655)
-- Name: fk_contest_result_image_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fk_contest_result_image_id ON public.contest_result USING btree (image_id);


--
-- TOC entry 3238 (class 1259 OID 16653)
-- Name: fk_contest_result_metric_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fk_contest_result_metric_id ON public.contest_result USING btree (metric_id);


--
-- TOC entry 3242 (class 1259 OID 16663)
-- Name: fk_contest_section_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fk_contest_section_id ON public.contest_section USING btree (section_id);


--
-- TOC entry 3252 (class 1259 OID 16706)
-- Name: fk_profile_contest_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fk_profile_contest_id ON public.profile_contest USING btree (contest_id);


--
-- TOC entry 3249 (class 1259 OID 16696)
-- Name: fk_profile_fotoclub_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fk_profile_fotoclub_id ON public.profile USING btree (fotoclub_id);


--
-- TOC entry 3253 (class 1259 OID 16707)
-- Name: fk_profile_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fk_profile_profile_id ON public.profile_contest USING btree (profile_id);


--
-- TOC entry 3264 (class 1259 OID 16739)
-- Name: fk_user_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fk_user_role_id ON public."user" USING btree (role_id);


--
-- TOC entry 3273 (class 2606 OID 16740)
-- Name: contest_result contest_result_section; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_result
    ADD CONSTRAINT contest_result_section FOREIGN KEY (section_id) REFERENCES public.section(id);


--
-- TOC entry 3271 (class 2606 OID 16745)
-- Name: contest_category fk_contest_category_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_category
    ADD CONSTRAINT fk_contest_category_id FOREIGN KEY (category_id) REFERENCES public.category(id);


--
-- TOC entry 3277 (class 2606 OID 16750)
-- Name: contest_section fk_contest_contest2_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_section
    ADD CONSTRAINT fk_contest_contest2_id FOREIGN KEY (contest_id) REFERENCES public.contest(id);


--
-- TOC entry 3272 (class 2606 OID 16755)
-- Name: contest_category fk_contest_contest_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_category
    ADD CONSTRAINT fk_contest_contest_id FOREIGN KEY (contest_id) REFERENCES public.contest(id);


--
-- TOC entry 3274 (class 2606 OID 16760)
-- Name: contest_result fk_contest_result_contest_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_result
    ADD CONSTRAINT fk_contest_result_contest_id FOREIGN KEY (contest_id) REFERENCES public.contest(id);


--
-- TOC entry 3275 (class 2606 OID 16765)
-- Name: contest_result fk_contest_result_image_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_result
    ADD CONSTRAINT fk_contest_result_image_id FOREIGN KEY (image_id) REFERENCES public.image(id);


--
-- TOC entry 3276 (class 2606 OID 16770)
-- Name: contest_result fk_contest_result_metric_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_result
    ADD CONSTRAINT fk_contest_result_metric_id FOREIGN KEY (metric_id) REFERENCES public.metric(id);


--
-- TOC entry 3278 (class 2606 OID 16775)
-- Name: contest_section fk_contest_section_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contest_section
    ADD CONSTRAINT fk_contest_section_id FOREIGN KEY (section_id) REFERENCES public.section(id);


--
-- TOC entry 3280 (class 2606 OID 16780)
-- Name: profile_contest fk_profile_contest_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_contest
    ADD CONSTRAINT fk_profile_contest_id FOREIGN KEY (contest_id) REFERENCES public.contest(id);


--
-- TOC entry 3279 (class 2606 OID 16785)
-- Name: profile fk_profile_fotoclub_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile
    ADD CONSTRAINT fk_profile_fotoclub_id FOREIGN KEY (fotoclub_id) REFERENCES public.fotoclub(id);


--
-- TOC entry 3281 (class 2606 OID 16790)
-- Name: profile_contest fk_profile_profile_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_contest
    ADD CONSTRAINT fk_profile_profile_id FOREIGN KEY (profile_id) REFERENCES public.profile(id);


--
-- TOC entry 3283 (class 2606 OID 16795)
-- Name: user fk_user_role_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT fk_user_role_id FOREIGN KEY (role_id) REFERENCES public.role(id);


--
-- TOC entry 3282 (class 2606 OID 16800)
-- Name: profile_contest profile_contest_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_contest
    ADD CONSTRAINT profile_contest_category FOREIGN KEY (category_id) REFERENCES public.category(id);


--
-- TOC entry 3428 (class 0 OID 0)
-- Dependencies: 3
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA public TO grupo_fotografico;


--
-- TOC entry 3429 (class 0 OID 0)
-- Dependencies: 214
-- Name: TABLE category; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.category TO grupo_fotografico;


--
-- TOC entry 3431 (class 0 OID 0)
-- Dependencies: 213
-- Name: SEQUENCE category_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.category_id_seq TO grupo_fotografico;


--
-- TOC entry 3432 (class 0 OID 0)
-- Dependencies: 216
-- Name: TABLE contest; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contest TO grupo_fotografico;


--
-- TOC entry 3433 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE contest_category; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contest_category TO grupo_fotografico;


--
-- TOC entry 3435 (class 0 OID 0)
-- Dependencies: 217
-- Name: SEQUENCE contest_category_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.contest_category_id_seq TO grupo_fotografico;


--
-- TOC entry 3437 (class 0 OID 0)
-- Dependencies: 215
-- Name: SEQUENCE contest_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.contest_id_seq TO grupo_fotografico;


--
-- TOC entry 3438 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE contest_result; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contest_result TO grupo_fotografico;


--
-- TOC entry 3440 (class 0 OID 0)
-- Dependencies: 219
-- Name: SEQUENCE contest_result_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.contest_result_id_seq TO grupo_fotografico;


--
-- TOC entry 3441 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE contest_section; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contest_section TO grupo_fotografico;


--
-- TOC entry 3443 (class 0 OID 0)
-- Dependencies: 221
-- Name: SEQUENCE contest_section_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.contest_section_id_seq TO grupo_fotografico;


--
-- TOC entry 3444 (class 0 OID 0)
-- Dependencies: 210
-- Name: TABLE footer; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.footer TO grupo_fotografico;


--
-- TOC entry 3446 (class 0 OID 0)
-- Dependencies: 209
-- Name: SEQUENCE footer_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.footer_id_seq TO grupo_fotografico;


--
-- TOC entry 3447 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE fotoclub; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.fotoclub TO grupo_fotografico;


--
-- TOC entry 3449 (class 0 OID 0)
-- Dependencies: 223
-- Name: SEQUENCE fotoclub_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.fotoclub_id_seq TO grupo_fotografico;


--
-- TOC entry 3450 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE image; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.image TO grupo_fotografico;


--
-- TOC entry 3452 (class 0 OID 0)
-- Dependencies: 225
-- Name: SEQUENCE image_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.image_id_seq TO grupo_fotografico;


--
-- TOC entry 3453 (class 0 OID 0)
-- Dependencies: 212
-- Name: TABLE info_centro; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.info_centro TO grupo_fotografico;


--
-- TOC entry 3455 (class 0 OID 0)
-- Dependencies: 211
-- Name: SEQUENCE info_centro_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.info_centro_id_seq TO grupo_fotografico;


--
-- TOC entry 3456 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE metric; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.metric TO grupo_fotografico;


--
-- TOC entry 3458 (class 0 OID 0)
-- Dependencies: 227
-- Name: SEQUENCE metric_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.metric_id_seq TO grupo_fotografico;


--
-- TOC entry 3459 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE profile; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profile TO grupo_fotografico;


--
-- TOC entry 3460 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE profile_contest; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profile_contest TO grupo_fotografico;


--
-- TOC entry 3462 (class 0 OID 0)
-- Dependencies: 231
-- Name: SEQUENCE profile_contest_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.profile_contest_id_seq TO grupo_fotografico;


--
-- TOC entry 3464 (class 0 OID 0)
-- Dependencies: 229
-- Name: SEQUENCE profile_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.profile_id_seq TO grupo_fotografico;


--
-- TOC entry 3465 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE role; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.role TO grupo_fotografico;


--
-- TOC entry 3467 (class 0 OID 0)
-- Dependencies: 233
-- Name: SEQUENCE role_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.role_id_seq TO grupo_fotografico;


--
-- TOC entry 3468 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE section; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.section TO grupo_fotografico;


--
-- TOC entry 3470 (class 0 OID 0)
-- Dependencies: 235
-- Name: SEQUENCE section_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.section_id_seq TO grupo_fotografico;


--
-- TOC entry 3471 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE "user"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."user" TO grupo_fotografico;


--
-- TOC entry 3473 (class 0 OID 0)
-- Dependencies: 237
-- Name: SEQUENCE user_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_id_seq TO grupo_fotografico;


-- Completed on 2021-12-02 17:56:45 EST

--
-- PostgreSQL database dump complete
--

