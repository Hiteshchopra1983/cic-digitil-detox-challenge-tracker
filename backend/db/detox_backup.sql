--
-- PostgreSQL database dump
--

\restrict N4zB77v2GO9xyVvBoZW8svZzVn9abfNfcq0Do3omdzBq0IMmqdke4iiHaeqw7mo

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    admin_id uuid,
    action text,
    target_id uuid,
    details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: baseline_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.baseline_metrics (
    id integer NOT NULL,
    participant_id uuid,
    phone_storage_gb integer,
    laptop_storage_gb integer,
    cloud_storage_gb integer,
    mailbox_size_gb integer,
    screen_time_hours integer,
    streaming_hours integer,
    tiktok_minutes integer,
    instagram_minutes integer,
    facebook_minutes integer,
    youtube_minutes integer,
    downloads_gb_week integer,
    phone_devices integer DEFAULT 1,
    laptop_devices integer DEFAULT 1,
    tablet_devices integer DEFAULT 0,
    tablet_storage_gb integer,
    cloud_accounts integer DEFAULT 1,
    baseline_co2_kg double precision
);


ALTER TABLE public.baseline_metrics OWNER TO postgres;

--
-- Name: baseline_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.baseline_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.baseline_metrics_id_seq OWNER TO postgres;

--
-- Name: baseline_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.baseline_metrics_id_seq OWNED BY public.baseline_metrics.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    sender_id text NOT NULL,
    receiver_id text,
    sender_name text NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: co2_factors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.co2_factors (
    key text NOT NULL,
    value double precision
);


ALTER TABLE public.co2_factors OWNER TO postgres;

--
-- Name: emission_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.emission_config (
    id integer NOT NULL,
    streaming_per_hour double precision DEFAULT 40,
    tiktok_per_min double precision DEFAULT 2.63,
    instagram_per_min double precision DEFAULT 1.5,
    facebook_per_min double precision DEFAULT 0.79,
    youtube_scroll_per_min double precision DEFAULT 0.46,
    cloud_per_gb_year double precision DEFAULT 750,
    email_per double precision DEFAULT 4,
    text_per double precision DEFAULT 0.014,
    download_per_gb double precision DEFAULT 50
);


ALTER TABLE public.emission_config OWNER TO postgres;

--
-- Name: emission_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.emission_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.emission_config_id_seq OWNER TO postgres;

--
-- Name: emission_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.emission_config_id_seq OWNED BY public.emission_config.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    participant_id text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    email text,
    country text,
    city text,
    cohort text,
    consent boolean,
    created_at timestamp without time zone DEFAULT now(),
    password_hash text,
    role text DEFAULT 'participant'::text,
    reset_token text,
    reset_token_expiry timestamp without time zone,
    consent_given boolean DEFAULT false,
    consent_timestamp timestamp without time zone
);


ALTER TABLE public.participants OWNER TO postgres;

--
-- Name: program_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.program_config (
    id integer NOT NULL,
    program_duration_weeks integer DEFAULT 12,
    weekly_submission_gap_days integer DEFAULT 7,
    baseline_lock boolean DEFAULT true,
    program_weeks integer DEFAULT 12
);


ALTER TABLE public.program_config OWNER TO postgres;

--
-- Name: program_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.program_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.program_config_id_seq OWNER TO postgres;

--
-- Name: program_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.program_config_id_seq OWNED BY public.program_config.id;


--
-- Name: weekly_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.weekly_metrics (
    id integer NOT NULL,
    user_id integer,
    week_start date,
    storage_deleted_gb integer,
    streaming_reduction_minutes integer,
    screen_time_change_minutes integer,
    downloads_avoided_gb integer,
    ritual_completed boolean,
    alumni_touchpoints integer,
    tiktok_reduction_minutes integer,
    instagram_reduction_minutes integer,
    facebook_reduction_minutes integer,
    youtube_reduction_minutes integer
);


ALTER TABLE public.weekly_metrics OWNER TO postgres;

--
-- Name: weekly_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.weekly_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.weekly_metrics_id_seq OWNER TO postgres;

--
-- Name: weekly_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.weekly_metrics_id_seq OWNED BY public.weekly_metrics.id;


--
-- Name: weekly_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.weekly_progress (
    id integer NOT NULL,
    participant_id uuid,
    week_number integer,
    gb_deleted integer,
    streaming_reduction_minutes integer,
    screen_time_change integer,
    downloads_avoided_gb integer,
    emails_reduced integer,
    messages_reduced integer,
    ritual_completed boolean,
    alumni_touchpoints integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    co2_saved double precision DEFAULT 0,
    screen_change double precision DEFAULT 0,
    streaming_reduction double precision DEFAULT 0
);


ALTER TABLE public.weekly_progress OWNER TO postgres;

--
-- Name: weekly_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.weekly_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.weekly_progress_id_seq OWNER TO postgres;

--
-- Name: weekly_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.weekly_progress_id_seq OWNED BY public.weekly_progress.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: baseline_metrics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baseline_metrics ALTER COLUMN id SET DEFAULT nextval('public.baseline_metrics_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: emission_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emission_config ALTER COLUMN id SET DEFAULT nextval('public.emission_config_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: program_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_config ALTER COLUMN id SET DEFAULT nextval('public.program_config_id_seq'::regclass);


--
-- Name: weekly_metrics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_metrics ALTER COLUMN id SET DEFAULT nextval('public.weekly_metrics_id_seq'::regclass);


--
-- Name: weekly_progress id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_progress ALTER COLUMN id SET DEFAULT nextval('public.weekly_progress_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, admin_id, action, target_id, details, created_at) FROM stdin;
1	be1fe6e1-6fa6-4c3d-bda3-454680845f6a	CO2_FACTORS_UPDATED	\N	{"text_per_unit": 0.014, "email_per_unit": 4, "storage_per_gb": 0.75, "tiktok_per_min": 2.63, "youtube_per_min": 0.46, "facebook_per_min": 0.79, "instagram_per_min": 1.5, "streaming_per_hour": 40, "download_wifi_per_gb": 15, "download_mobile_per_gb": 70}	2026-03-24 16:43:28.611426
2	be1fe6e1-6fa6-4c3d-bda3-454680845f6a	ROLE_UPDATED	9384839c-a5f9-4e39-88ec-2d492e54eb50	{"role": "participant"}	2026-03-24 16:43:28.634452
3	be1fe6e1-6fa6-4c3d-bda3-454680845f6a	ROLE_UPDATED	3a117c85-cdc1-4c07-8e3b-d8c2320aa32d	{"role": "disabled"}	2026-03-24 19:09:56.687625
4	be1fe6e1-6fa6-4c3d-bda3-454680845f6a	NOTIFICATION_SENT	\N	{"type": "all", "count": 1}	2026-03-24 19:59:54.862091
5	be1fe6e1-6fa6-4c3d-bda3-454680845f6a	NOTIFICATION_SENT	\N	{"type": "all", "count": 1, "channel": "in_app", "emailCount": 0, "notificationCount": 1}	2026-03-24 20:06:54.834839
6	be1fe6e1-6fa6-4c3d-bda3-454680845f6a	ROLE_UPDATED	3a117c85-cdc1-4c07-8e3b-d8c2320aa32d	{"role": "participant"}	2026-03-24 20:24:04.66869
\.


--
-- Data for Name: baseline_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.baseline_metrics (id, participant_id, phone_storage_gb, laptop_storage_gb, cloud_storage_gb, mailbox_size_gb, screen_time_hours, streaming_hours, tiktok_minutes, instagram_minutes, facebook_minutes, youtube_minutes, downloads_gb_week, phone_devices, laptop_devices, tablet_devices, tablet_storage_gb, cloud_accounts, baseline_co2_kg) FROM stdin;
9	9384839c-a5f9-4e39-88ec-2d492e54eb50	100	200	400	\N	6	30	3	2	2	4	200	1	2	3	200	3	\N
10	2841e8d6-bd45-45c6-a9ec-5765e98b038f	64	128	50	\N	6	4	20	15	10	30	5	1	1	0	0	1	182.0068
11	84e531bd-b6b2-4d18-a35c-51c2e9bfc70b	64	128	50	\N	6	4	20	15	10	30	5	1	1	0	0	1	182.0068
12	fe0e063d-c28b-4d12-a0ee-e1299ccdd178	64	128	50	\N	6	4	20	15	10	30	5	1	1	0	0	1	182.0068
13	1c581add-c9d3-49c7-9a49-10b3091d8e30	64	128	50	\N	6	4	20	15	10	30	5	1	1	0	0	1	182.0068
14	27cebece-c840-4d90-b69a-fdaedb4b3a86	64	128	50	\N	6	4	20	15	10	30	5	1	1	0	0	1	182.0068
15	1ad47b80-6bf0-4132-807a-cbf91385d9b8	64	128	50	\N	6	4	20	15	10	30	5	1	1	0	0	1	182.0068
16	38578000-4a93-434f-b0a0-4795c551e8a6	64	128	50	\N	6	4	20	15	10	30	5	1	1	0	0	1	182.0068
17	23d25ae3-05a8-4552-a529-a1de485670c6	64	128	50	\N	6	4	20	15	10	30	5	1	1	0	0	1	182.0068
18	838fe60c-0c8f-48a1-8647-bae382035a97	64	128	50	\N	6	4	20	15	10	30	5	1	1	0	0	1	182.0068
19	9c8f3172-0c34-4bea-96d0-e93cde092a9f	64	128	50	\N	6	4	20	15	10	30	5	1	1	0	0	1	182.0068
20	a73e0f52-cb8c-4ae8-96ff-9cb8fa977987	64	128	50	\N	6	4	20	15	10	30	5	1	1	0	0	1	182.0068
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, sender_id, receiver_id, sender_name, message, created_at) FROM stdin;
1	9eac519e-b982-40bc-81d5-b8bd4f02f054	6d52f6af-6aed-42e0-bc54-27fc08fb7275	Chat A	Hello from e2e-chat-a-1774438007414@example.com (1774438020707)	2026-03-25 16:57:01.23064
2	df9daf9a-2f59-4bc1-86a5-b5ad2bbf2242	93fb2c36-e806-44b8-af6e-86a04654ec0d	Chat A	Hello from e2e-chat-a-1774438520719@example.com (1774438533115)	2026-03-25 17:05:33.311511
3	93fb2c36-e806-44b8-af6e-86a04654ec0d	df9daf9a-2f59-4bc1-86a5-b5ad2bbf2242	Chat B	Reply from e2e-chat-b-1774438520719@example.com (1774438536505)	2026-03-25 17:05:36.862257
4	9384839c-a5f9-4e39-88ec-2d492e54eb50	9eac519e-b982-40bc-81d5-b8bd4f02f054	Hitesh	hello	2026-03-26 15:00:02.759271
5	9384839c-a5f9-4e39-88ec-2d492e54eb50	9eac519e-b982-40bc-81d5-b8bd4f02f054	Hitesh	hi	2026-03-26 15:00:18.532163
\.


--
-- Data for Name: co2_factors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.co2_factors (key, value) FROM stdin;
streaming_per_hour	40
storage_per_gb	0.75
email_per_unit	4
text_per_unit	0.014
download_wifi_per_gb	15
download_mobile_per_gb	70
tiktok_per_min	2.63
instagram_per_min	1.5
facebook_per_min	0.79
youtube_per_min	0.46
\.


--
-- Data for Name: emission_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.emission_config (id, streaming_per_hour, tiktok_per_min, instagram_per_min, facebook_per_min, youtube_scroll_per_min, cloud_per_gb_year, email_per, text_per, download_per_gb) FROM stdin;
1	40	2.63	1.5	0.79	0.46	750	4	0.014	50
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, participant_id, title, message, is_read, created_at) FROM stdin;
1	9384839c-a5f9-4e39-88ec-2d492e54eb50	Digital Detox Update	Hello to all	f	2026-03-24 19:59:52.898828
2	9384839c-a5f9-4e39-88ec-2d492e54eb50	Digital Detox Update	hello again	f	2026-03-24 20:06:54.809102
\.


--
-- Data for Name: participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.participants (id, name, email, country, city, cohort, consent, created_at, password_hash, role, reset_token, reset_token_expiry, consent_given, consent_timestamp) FROM stdin;
be1fe6e1-6fa6-4c3d-bda3-454680845f6a	Hitesh Chopra	hitesh.chopra@insead.edu	India	Delhi	INSEAD	t	2026-03-10 19:48:01.223253	$2b$10$JQZnulV5ZYWyZxI7Wtb98O0c2kd8t1l12jXlb55NODbSwGhEtBnlG	admin	\N	\N	f	\N
9384839c-a5f9-4e39-88ec-2d492e54eb50	Hitesh	hiteshchopra1983@gmail.com	IN	Delhi		t	2026-03-15 15:27:08.650395	$2b$10$Z2PudZ9F8mtWJ.Ppio834O27ixqAbeNyMyg56cYYLCT1V97UsRO5q	participant	\N	\N	f	\N
3a117c85-cdc1-4c07-8e3b-d8c2320aa32d	Test User	test@test.com	India	Delhi	MBA	t	2026-03-10 14:32:14.177154	\N	participant	\N	\N	f	\N
833aec00-227f-4605-b6ab-cd5f59fb429a	E2E User	e2e-1774424349934@example.com	IN	\N	\N	\N	2026-03-25 13:09:10.510543	$2b$10$qzFU6z2SaZ5ckKyIDC8qruReeBbBP.ZS2s3O/3dBLQPurmex3qw5m	participant	\N	\N	t	2026-03-25 13:09:10.510543
2841e8d6-bd45-45c6-a9ec-5765e98b038f	flow1 User	flow1-1774424398218-84192@example.com	IN	\N	\N	\N	2026-03-25 13:10:02.097338	$2b$10$XT2m6y5zKiOqFij.NIxZNOrtVMl9PJ8VCS4Vh8SDwABAWv41n9qQu	participant	\N	\N	t	2026-03-25 13:10:02.097338
a9e50b73-c82d-40d8-b6f3-eabc20b87c25	flow2 User	flow2-1774424424503-66186@example.com	IN	\N	\N	\N	2026-03-25 13:10:26.716988	$2b$10$LMeBRscdzCk5.DbYuG7mu.Uf8NcAvK3osQdiJgC4BxpdLFBflgG5O	participant	\N	\N	t	2026-03-25 13:10:26.716988
84e531bd-b6b2-4d18-a35c-51c2e9bfc70b	flow3 User	flow3-1774424447604-16700@example.com	IN	\N	\N	\N	2026-03-25 13:10:49.963708	$2b$10$DH35tBpcBN4zOsKKE8r65OX59PvR0BcoZ/kDF6wQljtTbBCfjS3Hy	participant	\N	\N	t	2026-03-25 13:10:49.963708
fe0e063d-c28b-4d12-a0ee-e1299ccdd178	flow1 User	flow1-1774424690832-63195@example.com	IN	\N	\N	\N	2026-03-25 13:14:53.288211	$2b$10$oLUoCyCPNSAicDrdJGZds.DCus.Or8qNpIu/65dGwMVPrH0MOaaKC	participant	\N	\N	t	2026-03-25 13:14:53.288211
4dae8190-9775-4bda-bf05-9742839e4c29	flow2 User	flow2-1774424714946-74821@example.com	IN	\N	\N	\N	2026-03-25 13:15:17.099404	$2b$10$b6P3rdHv1HHbsGwAIpg74OJLseTV1hwMALJV91WObjgFImBXz46mi	participant	\N	\N	t	2026-03-25 13:15:17.099404
1c581add-c9d3-49c7-9a49-10b3091d8e30	flow3 User	flow3-1774424737713-88016@example.com	IN	\N	\N	\N	2026-03-25 13:15:39.822291	$2b$10$7pwckjmss4xaWU6A66nGBurtkSaATg3Ta6Esxrc3n5fv3IY4FAkQq	participant	\N	\N	t	2026-03-25 13:15:39.822291
27cebece-c840-4d90-b69a-fdaedb4b3a86	flow1 User	flow1-1774424894676-84504@example.com	IN	\N	\N	\N	2026-03-25 13:18:17.031239	$2b$10$fPWkYEyQdK/msg6G0i/sYOvER2AXr4Lrir5JrGN.tYSucgS53cFR.	participant	\N	\N	t	2026-03-25 13:18:17.031239
53a0fc1a-72f7-44bb-a94b-5c4f3c1d800e	flow2 User	flow2-1774424905992-92331@example.com	IN	\N	\N	\N	2026-03-25 13:18:28.049266	$2b$10$sxd8kmEsycGwZhb.RSw2vOZorA9UJ7R50cQXMhht5W6mGUjyP8wwO	participant	\N	\N	t	2026-03-25 13:18:28.049266
1ad47b80-6bf0-4132-807a-cbf91385d9b8	flow3 User	flow3-1774424915397-93022@example.com	IN	\N	\N	\N	2026-03-25 13:18:37.039349	$2b$10$herrrrSG/dUQ42v4LK5su.0E4Dw/NEY4MhTeXK96Ks5iyFGHwzf8m	participant	\N	\N	t	2026-03-25 13:18:37.039349
38578000-4a93-434f-b0a0-4795c551e8a6	E2E Participant	e2e-participant-1774434105015@example.com	IN	\N	\N	\N	2026-03-25 15:51:47.251164	$2b$10$dYMgi2POD.vd5SBuwgeTmuzsyQOLy3W6Ep9aun8THjLLgxBfJNb6q	participant	\N	\N	t	2026-03-25 15:51:47.251164
e4043230-034a-4289-bfa7-b008f3487565	Chat A	e2e-chat-a-1774437677815@example.com	IN	\N	\N	\N	2026-03-25 16:51:20.213985	$2b$10$0eWG0.oYzkzWAcFVp9vwleV2yQYj/3l8gyX57TuJQrKw8yMRVXX.2	participant	\N	\N	t	2026-03-25 16:51:20.213985
ba846c12-131e-4e38-be31-9d5e3b35fee2	Chat B	e2e-chat-b-1774437677815@example.com	IN	\N	\N	\N	2026-03-25 16:51:21.121838	$2b$10$eLELMH2YihRsAn.385oBcOWnmRajenEQiPLYh796G9XlcKU4ibF5u	participant	\N	\N	t	2026-03-25 16:51:21.121838
23d25ae3-05a8-4552-a529-a1de485670c6	flow1 User	flow1-1774437679027-18607@example.com	IN	\N	\N	\N	2026-03-25 16:51:31.462695	$2b$10$Vu7EFatXJqGj5adc4gT7se/GcAy/f1JTRb9ChAyuKQMqfTEvpyMA2	participant	\N	\N	t	2026-03-25 16:51:31.462695
a4e2a1f5-7f1d-46b9-ac8f-5b79fe80aa6e	flow2 User	flow2-1774437705377-92391@example.com	IN	\N	\N	\N	2026-03-25 16:51:53.288115	$2b$10$5LFvZYf7jJA95r7Oy5Xtcexm/XB913zXYgtIT0issf1hZI1AJcZH.	participant	\N	\N	t	2026-03-25 16:51:53.288115
838fe60c-0c8f-48a1-8647-bae382035a97	flow3 User	flow3-1774437724340-89679@example.com	IN	\N	\N	\N	2026-03-25 16:52:12.178844	$2b$10$BJpOM0CRYIEUNvSZauFlXOuwjd8Io2a/Apid3/yMxYNLnKl8eIv1K	participant	\N	\N	t	2026-03-25 16:52:12.178844
9eac519e-b982-40bc-81d5-b8bd4f02f054	Chat A	e2e-chat-a-1774438007414@example.com	IN	\N	\N	\N	2026-03-25 16:56:48.443479	$2b$10$vjJMdCLd8uPyr98NhgdOoeEVBhgK8MyWgMYWL7ZzHrkdNjH1kZX/i	participant	\N	\N	t	2026-03-25 16:56:48.443479
6d52f6af-6aed-42e0-bc54-27fc08fb7275	Chat B	e2e-chat-b-1774438007414@example.com	IN	\N	\N	\N	2026-03-25 16:56:49.109124	$2b$10$YMD0XJIXyhTT9b85lpLpge2FP.KPan8PO8n51XEaLiFs8W5CMSnm2	participant	\N	\N	t	2026-03-25 16:56:49.109124
df9daf9a-2f59-4bc1-86a5-b5ad2bbf2242	Chat A	e2e-chat-a-1774438520719@example.com	IN	\N	\N	\N	2026-03-25 17:05:21.906778	$2b$10$/WdmcuUNC2Ckr/JSsEmAXuGf.6mftbqSRGV1BQ.RFm77XhoS7GFzC	participant	\N	\N	t	2026-03-25 17:05:21.906778
93fb2c36-e806-44b8-af6e-86a04654ec0d	Chat B	e2e-chat-b-1774438520719@example.com	IN	\N	\N	\N	2026-03-25 17:05:22.64823	$2b$10$kgfLMTU953pSJULy9YOGHOdVXkmgZY0SLdPgnfRYB9Zy1Ok2DvJ2i	participant	\N	\N	t	2026-03-25 17:05:22.64823
9c8f3172-0c34-4bea-96d0-e93cde092a9f	flow1 User	flow1-1774438522947-56794@example.com	IN	\N	\N	\N	2026-03-25 17:05:32.65035	$2b$10$BQVs1Y8tKH3YJnASe36BAuMR5DhqTqlThETJmzqSTune/bGiT4ivO	participant	\N	\N	t	2026-03-25 17:05:32.65035
4eb75482-2708-4b48-9927-ac16fb09f3a4	flow2 User	flow2-1774438546478-57348@example.com	IN	\N	\N	\N	2026-03-25 17:05:54.052586	$2b$10$kYsQtzxcNOJGzwjcwBPV/ObSIjqU8PrecllIhrKZXiDNuuTPYr436	participant	\N	\N	t	2026-03-25 17:05:54.052586
a73e0f52-cb8c-4ae8-96ff-9cb8fa977987	flow3 User	flow3-1774438564910-4429@example.com	IN	\N	\N	\N	2026-03-25 17:06:12.538241	$2b$10$6VnhTR8LyNa0XqeMEH1ILedtG0mc8hNummZhniHFU0UbTQHGUAb0.	participant	\N	\N	t	2026-03-25 17:06:12.538241
\.


--
-- Data for Name: program_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.program_config (id, program_duration_weeks, weekly_submission_gap_days, baseline_lock, program_weeks) FROM stdin;
1	12	7	t	12
2	12	7	t	12
\.


--
-- Data for Name: weekly_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weekly_metrics (id, user_id, week_start, storage_deleted_gb, streaming_reduction_minutes, screen_time_change_minutes, downloads_avoided_gb, ritual_completed, alumni_touchpoints, tiktok_reduction_minutes, instagram_reduction_minutes, facebook_reduction_minutes, youtube_reduction_minutes) FROM stdin;
\.


--
-- Data for Name: weekly_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weekly_progress (id, participant_id, week_number, gb_deleted, streaming_reduction_minutes, screen_time_change, downloads_avoided_gb, emails_reduced, messages_reduced, ritual_completed, alumni_touchpoints, created_at, co2_saved, screen_change, streaming_reduction) FROM stdin;
1	3a117c85-cdc1-4c07-8e3b-d8c2320aa32d	1	3	0	0	0	0	0	f	0	2026-03-10 14:39:34.27011	0	0	0
3	be1fe6e1-6fa6-4c3d-bda3-454680845f6a	1	12	0	0	0	0	0	f	0	2026-03-10 21:06:24.495465	0	0	0
4	9384839c-a5f9-4e39-88ec-2d492e54eb50	1	2	4	5	3	\N	\N	t	1	2026-03-15 19:04:28.942703	0	0	0
5	9384839c-a5f9-4e39-88ec-2d492e54eb50	2	0	0	0	0	\N	\N	f	0	2026-03-15 19:30:39.387643	0	0	0
6	9384839c-a5f9-4e39-88ec-2d492e54eb50	3	2	3	3	3	\N	\N	t	3	2026-03-15 19:42:13.177074	0	0	0
7	9384839c-a5f9-4e39-88ec-2d492e54eb50	4	3	3	4	40	0	0	t	4	2026-03-23 18:19:18.933729	0.6629999999999999	4	3
8	9384839c-a5f9-4e39-88ec-2d492e54eb50	5	3	3	2	56	0	0	t	4	2026-03-24 15:51:06.560757	0.9029999999999999	2	3
9	fe0e063d-c28b-4d12-a0ee-e1299ccdd178	1	10	120	60	3	0	0	f	2	2026-03-25 13:15:00.631695	132.5	60	120
10	27cebece-c840-4d90-b69a-fdaedb4b3a86	1	10	120	60	3	0	0	f	2	2026-03-25 13:18:24.743558	132.5	60	120
11	38578000-4a93-434f-b0a0-4795c551e8a6	1	10	120	60	3	0	0	f	2	2026-03-25 16:22:10.485017	132.5	60	120
12	23d25ae3-05a8-4552-a529-a1de485670c6	1	10	120	60	3	0	0	f	2	2026-03-25 16:51:42.740355	132.5	60	120
13	9c8f3172-0c34-4bea-96d0-e93cde092a9f	1	10	120	60	3	0	0	f	2	2026-03-25 17:05:43.151731	132.5	60	120
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 6, true);


--
-- Name: baseline_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.baseline_metrics_id_seq', 20, true);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 5, true);


--
-- Name: emission_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.emission_config_id_seq', 1, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 2, true);


--
-- Name: program_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.program_config_id_seq', 2, true);


--
-- Name: weekly_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.weekly_metrics_id_seq', 1, false);


--
-- Name: weekly_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.weekly_progress_id_seq', 13, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: baseline_metrics baseline_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baseline_metrics
    ADD CONSTRAINT baseline_metrics_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: co2_factors co2_factors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.co2_factors
    ADD CONSTRAINT co2_factors_pkey PRIMARY KEY (key);


--
-- Name: emission_config emission_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emission_config
    ADD CONSTRAINT emission_config_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: participants participants_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_email_key UNIQUE (email);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: program_config program_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_config
    ADD CONSTRAINT program_config_pkey PRIMARY KEY (id);


--
-- Name: baseline_metrics unique_baseline; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baseline_metrics
    ADD CONSTRAINT unique_baseline UNIQUE (participant_id);


--
-- Name: weekly_progress unique_week; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_progress
    ADD CONSTRAINT unique_week UNIQUE (participant_id, week_number);


--
-- Name: weekly_metrics weekly_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_metrics
    ADD CONSTRAINT weekly_metrics_pkey PRIMARY KEY (id);


--
-- Name: weekly_progress weekly_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_progress
    ADD CONSTRAINT weekly_progress_pkey PRIMARY KEY (id);


--
-- Name: baseline_metrics baseline_metrics_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baseline_metrics
    ADD CONSTRAINT baseline_metrics_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.participants(id);


--
-- Name: weekly_progress weekly_progress_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_progress
    ADD CONSTRAINT weekly_progress_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.participants(id);


--
-- PostgreSQL database dump complete
--

\unrestrict N4zB77v2GO9xyVvBoZW8svZzVn9abfNfcq0Do3omdzBq0IMmqdke4iiHaeqw7mo

