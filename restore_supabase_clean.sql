--
-- ===================================================================
-- SCRIPT MAESTRO DE RESTAURACIÓN - SISTEMA IINICIA (SUPABASE)
-- Ejecutar en el SQL Editor del nuevo proyecto Supabase
-- ===================================================================
--

-- [1] EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- [2] FUNCIONES DEL ESQUEMA PUBLIC
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_updated_at() OWNER TO postgres;

--

-- Name: log_audit_action(uuid, character varying, character varying, character varying, character varying, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_audit_action(p_user_id uuid, p_user_email character varying, p_action character varying, p_entity character varying, p_entity_id character varying, p_details jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (user_id, user_email, action, entity, entity_id, details)
    VALUES (p_user_id, p_user_email, p_action, p_entity, p_entity_id, p_details)
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$;


ALTER FUNCTION public.log_audit_action(p_user_id uuid, p_user_email character varying, p_action character varying, p_entity character varying, p_entity_id character varying, p_details jsonb) OWNER TO postgres;

--

-- [3] CREACIÓN DE TABLAS (SCHEMA PUBLIC)
-- Name: admission_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admission_applications (
    id character varying(50) NOT NULL,
    user_id uuid,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    program_id character varying(100) NOT NULL,
    program_name character varying(255) NOT NULL,
    previous_school character varying(255),
    average_grade numeric(4,2) DEFAULT 0.0 NOT NULL,
    status character varying(30) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    assigned_cohort_id uuid,
    reviewed_by uuid,
    review_notes text,
    moodle_synced boolean DEFAULT false NOT NULL,
    moodle_user_id integer,
    moodle_sync_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admission_applications_status_check CHECK (((status)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'EN REVISION'::character varying, 'ADMITIDO'::character varying, 'RECHAZADO'::character varying])::text[])))
);


ALTER TABLE public.admission_applications OWNER TO postgres;

--

-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    user_email character varying(255),
    action character varying(100) NOT NULL,
    entity character varying(100) NOT NULL,
    entity_id character varying(100),
    ip_address character varying(45),
    user_agent text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--

-- Name: cms_contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cms_contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    program_interest character varying(100),
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    status character varying(30) DEFAULT 'NUEVO'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cms_contact_messages_status_check CHECK (((status)::text = ANY ((ARRAY['NUEVO'::character varying, 'EN_ATENCION'::character varying, 'RESPONDIDO'::character varying, 'ARCHIVADO'::character varying])::text[])))
);


ALTER TABLE public.cms_contact_messages OWNER TO postgres;

--

-- Name: cms_faculty; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cms_faculty (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(255) NOT NULL,
    title_prefix character varying(50),
    role_title character varying(150) NOT NULL,
    bio text NOT NULL,
    specialty_area character varying(100),
    avatar_url text,
    order_index integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cms_faculty OWNER TO postgres;

--

-- Name: cms_faqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cms_faqs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category character varying(100) NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cms_faqs OWNER TO postgres;

--

-- Name: cms_news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cms_news (
    id character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    summary text NOT NULL,
    content text NOT NULL,
    image_url text NOT NULL,
    published_date date DEFAULT CURRENT_DATE NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    author_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cms_news OWNER TO postgres;

--

-- Name: cms_pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cms_pages (
    slug character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    subtitle character varying(255),
    content_html text NOT NULL,
    meta_title character varying(255),
    meta_description text,
    is_published boolean DEFAULT true NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cms_pages OWNER TO postgres;

--

-- Name: cohorts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cohorts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    moodle_cohort_id integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cohorts OWNER TO postgres;

--

-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    program_id character varying(100),
    professor_id uuid,
    professor_name character varying(255),
    semester integer DEFAULT 1,
    credits integer DEFAULT 10,
    color_gradient character varying(100) DEFAULT 'from-blue-600 to-indigo-700'::character varying,
    moodle_course_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.courses OWNER TO postgres;

--

-- Name: device_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    fcm_token text NOT NULL,
    device_model character varying(100),
    os_version character varying(50),
    app_version character varying(50),
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.device_tokens OWNER TO postgres;

--

-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    course_id character varying(100) NOT NULL,
    cohort_id uuid,
    moodle_enrollment_id integer,
    status character varying(30) DEFAULT 'ACTIVA'::character varying NOT NULL,
    progress_percent integer DEFAULT 0 NOT NULL,
    pending_tasks integer DEFAULT 0 NOT NULL,
    next_deadline timestamp with time zone,
    grade numeric(4,2),
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    authorized_by uuid,
    CONSTRAINT enrollments_progress_percent_check CHECK (((progress_percent >= 0) AND (progress_percent <= 100))),
    CONSTRAINT enrollments_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVA'::character varying, 'SUSPENDIDA'::character varying, 'FINALIZADA'::character varying, 'BAJA'::character varying])::text[])))
);


ALTER TABLE public.enrollments OWNER TO postgres;

--

-- Name: moodle_user_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moodle_user_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    iinicia_user_id uuid NOT NULL,
    moodle_user_id integer NOT NULL,
    moodle_username character varying(100) NOT NULL,
    sync_status character varying(30) DEFAULT 'SYNCED'::character varying NOT NULL,
    last_sync_at timestamp with time zone DEFAULT now() NOT NULL,
    sync_payload jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT moodle_user_mappings_sync_status_check CHECK (((sync_status)::text = ANY ((ARRAY['SYNCED'::character varying, 'PENDING'::character varying, 'FAILED'::character varying, 'SUSPENDED'::character varying])::text[])))
);


ALTER TABLE public.moodle_user_mappings OWNER TO postgres;

--

-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) DEFAULT 'ACADEMIC_ALERT'::character varying NOT NULL,
    channel character varying(30) DEFAULT 'PUSH_ANDROID'::character varying NOT NULL,
    read boolean DEFAULT false NOT NULL,
    deep_link text,
    data_payload jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_channel_check CHECK (((channel)::text = ANY ((ARRAY['PUSH_ANDROID'::character varying, 'PORTAL_NOTIFICATION'::character varying, 'EMAIL'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--

-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    module character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--

-- Name: program_syllabus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.program_syllabus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id character varying(100) NOT NULL,
    semester_label character varying(50) NOT NULL,
    order_index integer DEFAULT 1 NOT NULL,
    course_name character varying(255) NOT NULL,
    course_description text,
    credits integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.program_syllabus OWNER TO postgres;

--

-- Name: programs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.programs (
    id character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    degree character varying(50) NOT NULL,
    area character varying(100) NOT NULL,
    duration character varying(100) NOT NULL,
    modality character varying(100) NOT NULL,
    credits integer DEFAULT 0 NOT NULL,
    rvoe character varying(100) NOT NULL,
    description text NOT NULL,
    objectives text NOT NULL,
    field_work text NOT NULL,
    image_url text NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT programs_degree_check CHECK (((degree)::text = ANY ((ARRAY['Licenciatura'::character varying, 'Ingeniería'::character varying, 'Maestría'::character varying, 'Diplomado'::character varying, 'Certificación'::character varying])::text[])))
);


ALTER TABLE public.programs OWNER TO postgres;

--

-- Name: registros; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registros (
    id bigint NOT NULL,
    nombre text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.registros OWNER TO postgres;

--

-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id character varying(50) NOT NULL,
    permission_id character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--

-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text NOT NULL,
    hierarchy_level integer DEFAULT 10 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--

-- Name: seo_redirects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seo_redirects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    old_wp_url character varying(255) NOT NULL,
    new_react_url character varying(255) NOT NULL,
    http_status integer DEFAULT 301 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.seo_redirects OWNER TO postgres;

--

-- Name: sso_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sso_tickets (
    ticket_id character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    target_system character varying(50) DEFAULT 'moodle'::character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    used_at timestamp with time zone,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sso_tickets OWNER TO postgres;

--

-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(50),
    role_id character varying(50) DEFAULT 'aspirante'::character varying NOT NULL,
    status character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    matricula character varying(50),
    avatar_url text,
    program_id character varying(100),
    program_name character varying(255),
    current_semester integer DEFAULT 1,
    mfa_enabled boolean DEFAULT false NOT NULL,
    mfa_secret text,
    privacy_consent_accepted boolean DEFAULT true NOT NULL,
    privacy_consent_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['activo'::character varying, 'suspendido'::character varying, 'pendiente'::character varying, 'baja'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--

-- [4] SECUENCIAS E IDENTIDADES
-- Name: registros_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.registros ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.registros_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--

-- [5] LLAVES PRIMARIAS Y RESTRICCIONES ÚNICAS
-- Name: admission_applications admission_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admission_applications
    ADD CONSTRAINT admission_applications_pkey PRIMARY KEY (id);


--

-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--

-- Name: cms_contact_messages cms_contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_contact_messages
    ADD CONSTRAINT cms_contact_messages_pkey PRIMARY KEY (id);


--

-- Name: cms_faculty cms_faculty_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_faculty
    ADD CONSTRAINT cms_faculty_pkey PRIMARY KEY (id);


--

-- Name: cms_faqs cms_faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_faqs
    ADD CONSTRAINT cms_faqs_pkey PRIMARY KEY (id);


--

-- Name: cms_news cms_news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_news
    ADD CONSTRAINT cms_news_pkey PRIMARY KEY (id);


--

-- Name: cms_pages cms_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_pages
    ADD CONSTRAINT cms_pages_pkey PRIMARY KEY (slug);


--

-- Name: cohorts cohorts_moodle_cohort_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_moodle_cohort_id_key UNIQUE (moodle_cohort_id);


--

-- Name: cohorts cohorts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_pkey PRIMARY KEY (id);


--

-- Name: cohorts cohorts_program_id_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_program_id_code_key UNIQUE (program_id, code);


--

-- Name: courses courses_moodle_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_moodle_course_id_key UNIQUE (moodle_course_id);


--

-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--

-- Name: device_tokens device_tokens_fcm_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_fcm_token_key UNIQUE (fcm_token);


--

-- Name: device_tokens device_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (id);


--

-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--

-- Name: enrollments enrollments_user_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_course_id_key UNIQUE (user_id, course_id);


--

-- Name: moodle_user_mappings moodle_user_mappings_iinicia_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moodle_user_mappings
    ADD CONSTRAINT moodle_user_mappings_iinicia_user_id_key UNIQUE (iinicia_user_id);


--

-- Name: moodle_user_mappings moodle_user_mappings_moodle_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moodle_user_mappings
    ADD CONSTRAINT moodle_user_mappings_moodle_user_id_key UNIQUE (moodle_user_id);


--

-- Name: moodle_user_mappings moodle_user_mappings_moodle_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moodle_user_mappings
    ADD CONSTRAINT moodle_user_mappings_moodle_username_key UNIQUE (moodle_username);


--

-- Name: moodle_user_mappings moodle_user_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moodle_user_mappings
    ADD CONSTRAINT moodle_user_mappings_pkey PRIMARY KEY (id);


--

-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--

-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--

-- Name: program_syllabus program_syllabus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_syllabus
    ADD CONSTRAINT program_syllabus_pkey PRIMARY KEY (id);


--

-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);


--

-- Name: registros registros_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registros
    ADD CONSTRAINT registros_pkey PRIMARY KEY (id);


--

-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--

-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--

-- Name: seo_redirects seo_redirects_old_wp_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seo_redirects
    ADD CONSTRAINT seo_redirects_old_wp_url_key UNIQUE (old_wp_url);


--

-- Name: seo_redirects seo_redirects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seo_redirects
    ADD CONSTRAINT seo_redirects_pkey PRIMARY KEY (id);


--

-- Name: sso_tickets sso_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sso_tickets
    ADD CONSTRAINT sso_tickets_pkey PRIMARY KEY (ticket_id);


--

-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--

-- Name: users users_matricula_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_matricula_key UNIQUE (matricula);


--

-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--

-- [6] INSERCIÓN DE DATOS INSTITUCIONALES (119 REGISTROS)
INSERT INTO public.admission_applications (id, user_id, full_name, email, phone, program_id, program_name, previous_school, average_grade, status, assigned_cohort_id, reviewed_by, review_notes, moodle_synced, moodle_user_id, moodle_sync_date, created_at, updated_at) VALUES ('SOL-2026-0891', 'a0000000-0000-0000-0000-000000000001', 'Mariana Ríos Cruz', 'mariana.rios@gmail.com', '+52 55 4892 1102', 'lic-ia-datos', 'Licenciatura en Inteligencia Artificial y Ciencia de Datos', 'Colegio de Ciencias y Humanidades Plantel Sur', '9.40', 'ADMITIDO', NULL, NULL, NULL, 't', '1042', '2026-10-15 17:30:00+00', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.admission_applications (id, user_id, full_name, email, phone, program_id, program_name, previous_school, average_grade, status, assigned_cohort_id, reviewed_by, review_notes, moodle_synced, moodle_user_id, moodle_sync_date, created_at, updated_at) VALUES ('SOL-2026-8128', NULL, 'Britny Paola Perez Nava', 'BrithNav03@gmail.com', '55 123456789', 'lic-ia-datos', 'Licenciatura en Inteligencia Artificial y Ciencia de Datos', 'cbetis 202', '9.10', 'EN REVISION', NULL, NULL, NULL, 'f', NULL, NULL, '2026-10-24 23:42:33.429965+00', '2026-10-24 23:42:33.429965+00') ON CONFLICT DO NOTHING;
INSERT INTO public.admission_applications (id, user_id, full_name, email, phone, program_id, program_name, previous_school, average_grade, status, assigned_cohort_id, reviewed_by, review_notes, moodle_synced, moodle_user_id, moodle_sync_date, created_at, updated_at) VALUES ('SOL-2026-0893', NULL, 'Valeria Guadalupe Domínguez', 'valeria.dominguez@gmail.com', '+52 81 9921 4455', 'lic-gestion-negocios', 'Licenciatura en Negocios Digitales y Transformación Organizacional', 'Instituto Tecnológico Regional', '9.10', 'ADMITIDO', NULL, NULL, NULL, 't', '3556', '2026-10-26 13:48:26.389+00', '2026-10-22 03:28:57.750076+00', '2026-10-26 13:48:26.763703+00') ON CONFLICT DO NOTHING;
INSERT INTO public.admission_applications (id, user_id, full_name, email, phone, program_id, program_name, previous_school, average_grade, status, assigned_cohort_id, reviewed_by, review_notes, moodle_synced, moodle_user_id, moodle_sync_date, created_at, updated_at) VALUES ('SOL-2026-0892', 'a0000000-0000-0000-0000-000000000002', 'Carlos Eduardo Mendoza', 'carlos.mendoza@outlook.com', '+52 33 1290 8821', 'ing-software-cloud', 'Ingeniería en Desarrollo de Software y Arquitectura Cloud', 'Preparatoria Federal Lázaro Cárdenas', '8.90', 'ADMITIDO', NULL, NULL, NULL, 't', '4060', '2026-10-26 14:24:48.546+00', '2026-10-22 03:28:57.750076+00', '2026-10-26 14:24:48.590532+00') ON CONFLICT DO NOTHING;
INSERT INTO public.admission_applications (id, user_id, full_name, email, phone, program_id, program_name, previous_school, average_grade, status, assigned_cohort_id, reviewed_by, review_notes, moodle_synced, moodle_user_id, moodle_sync_date, created_at, updated_at) VALUES ('SOL-2026-9040', NULL, 'Guerrero Calderon Adrian Alexander ', 'boladenieve83527@gmail.com', '+52 58 4815 4852', 'ing-software-cloud', 'Ingeniería en Desarrollo de Software y Arquitectura Cloud', 'CCH', '8.70', 'EN REVISION', NULL, NULL, NULL, 'f', NULL, NULL, '2026-10-26 14:30:46.246807+00', '2026-10-26 14:30:46.246807+00') ON CONFLICT DO NOTHING;
INSERT INTO public.admission_applications (id, user_id, full_name, email, phone, program_id, program_name, previous_school, average_grade, status, assigned_cohort_id, reviewed_by, review_notes, moodle_synced, moodle_user_id, moodle_sync_date, created_at, updated_at) VALUES ('SOL-2026-7465', NULL, 'Miguel Adrian Perez Alonso', 'miguelperez76565@gmail.com', '55123456789', 'dip-ciberseguridad', 'Diplomado Ejecutivo en Ciberseguridad Defensiva y DevSecOps', 'cbtis202', '8.70', 'ADMITIDO', NULL, NULL, NULL, 't', '2358', '2026-10-27 03:14:00.476+00', '2026-10-27 03:13:15.013342+00', '2026-10-27 03:15:11.952695+00') ON CONFLICT DO NOTHING;
INSERT INTO public.admission_applications (id, user_id, full_name, email, phone, program_id, program_name, previous_school, average_grade, status, assigned_cohort_id, reviewed_by, review_notes, moodle_synced, moodle_user_id, moodle_sync_date, created_at, updated_at) VALUES ('SOL-TEST-4759', NULL, 'Aspirante Prueba', 'prueba.aspirante@gmail.com', '+52 55 1234 5678', 'lic-ia-datos', 'Licenciatura en Inteligencia Artificial y Ciencia de Datos', 'Bachillerato', '9.50', 'ADMITIDO', NULL, NULL, NULL, 't', '5544', '2026-10-27 03:42:06.301+00', '2026-10-27 03:20:10.338698+00', '2026-10-27 03:43:17.767297+00') ON CONFLICT DO NOTHING;
INSERT INTO public.admission_applications (id, user_id, full_name, email, phone, program_id, program_name, previous_school, average_grade, status, assigned_cohort_id, reviewed_by, review_notes, moodle_synced, moodle_user_id, moodle_sync_date, created_at, updated_at) VALUES ('SOL-2026-5754', NULL, 'Miguel Adrian Perez Alonso', 'miguelperez76565@gmail.com', '55123456789', 'lic-ia-datos', 'Licenciatura en Inteligencia Artificial y Ciencia de Datos', 'cbtis202', '8.70', 'ADMITIDO', NULL, NULL, NULL, 't', '3760', '2026-10-27 03:42:10.593+00', '2026-10-27 03:42:24.60971+00', '2026-10-27 03:43:22.056564+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_logs (id, user_id, user_email, action, entity, entity_id, ip_address, user_agent, details, created_at) VALUES ('a5ba83f6-41bc-4b86-a29c-b6b2c6a741ba', 'a0000000-0000-0000-0000-000000000005', 'admin.sistemas@iinicia.edu.mx', 'DATABASE_INITIALIZATION', 'SYSTEM', 'SUPABASE_SETUP', '127.0.0.1', NULL, '{"status": "SUCCESS", "modules": 21, "version": "1.0.0", "moodle_rest": "CONNECTED"}', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.audit_logs (id, user_id, user_email, action, entity, entity_id, ip_address, user_agent, details, created_at) VALUES ('7db6221b-4a5a-4401-b281-e0a325ebb1e9', 'a0000000-0000-0000-0000-000000000006', 'carmen.valenzuela@iinicia.edu.mx', 'ADMISSION_APPROVED', 'ADMISSION_APPLICATION', 'SOL-2026-0891', '192.168.1.10', NULL, '{"program": "lic-ia-datos", "applicant": "Mariana Ríos Cruz", "idempotent": true, "moodle_user_id": 1042}', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_faculty (id, full_name, title_prefix, role_title, bio, specialty_area, avatar_url, order_index, is_active, created_at) VALUES ('c1150a91-bcd5-4786-a0c8-0c0c9c8fd3af', 'Dr. Alejandro Méndez Vargas', 'Dr.', 'Director del Departamento de Inteligencia Artificial', 'Doctor en Ciencias de la Computación por el Politécnico de Milán. 15 años de trayectoria en aprendizaje profundo, redes generativas y consultoría en Silicon Valley.', 'Inteligencia Artificial y Deep Learning', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', '1', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_faculty (id, full_name, title_prefix, role_title, bio, specialty_area, avatar_url, order_index, is_active, created_at) VALUES ('efebf317-55ab-4e9d-8f42-6959d8aaa98d', 'Dra. Sofía Alarcón Ruiz', 'Dra.', 'Coordinadora Académica de Ingeniería de Software', 'Investigadora y arquitecta de sistemas distribuidos tolerantes a fallos. Especialista en microservicios, Kubernetes y gobernanza de código abierto.', 'Cloud Architecture & DevOps', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80', '2', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_faculty (id, full_name, title_prefix, role_title, bio, specialty_area, avatar_url, order_index, is_active, created_at) VALUES ('5b7c3eb0-1507-42d4-ab7f-1b98aa53ef85', 'Mtra. Elena Saldaña', 'Mtra.', 'Catedrática Senior en Computación en la Nube', 'Magíster en Ciberseguridad e Infraestructuras Críticas. Ex-líder de MLOps en banca digital con certificaciones internacionales AWS y GCP.', 'MLOps & Kubernetes', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80', '3', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_faculty (id, full_name, title_prefix, role_title, bio, specialty_area, avatar_url, order_index, is_active, created_at) VALUES ('5ea0cdfd-9f66-48a2-ac48-5c836f28b683', 'Ing. Roberto Peña Guzmán', 'Ing.', 'Director de Tecnologías de la Información', 'Responsable de la infraestructura de telecomunicaciones, seguridad perimetral Zero Trust y el ecosistema híbrido Moodle-React.', 'Infraestructura & Ciberseguridad', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', '4', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_faqs (id, category, question, answer, order_index, is_active, created_at) VALUES ('e32330bb-ee00-4a8d-9d1f-7ac2be52e781', 'Admisiones', '¿Cuál es el proceso para registrarme como aspirante en IINICIA?', 'El proceso se completa en 3 pasos: 1) Selecciona el programa de tu interés en nuestro portal, 2) Llena el formulario digital de admisión y adjunta tus antecedentes académicos, 3) Nuestro comité académico revisará tu perfil en un máximo de 48 horas y generará tus credenciales universitarias automáticas.', '1', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_faqs (id, category, question, answer, order_index, is_active, created_at) VALUES ('a5888188-225d-4b29-9264-0a4c7c524965', 'Académico', '¿Todos los programas cuentan con Reconocimiento de Validez Oficial (RVOE)?', 'Sí, el 100% de nuestras licenciaturas, ingenierías y posgrados cuentan con RVOE oficial otorgado por la Secretaría de Educación Pública (SEP), lo que garantiza títulos profesionales con validez nacional e internacional.', '2', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_faqs (id, category, question, answer, order_index, is_active, created_at) VALUES ('d99de89b-3d5f-4d3a-b91d-05c1fc941374', 'Tecnología & Campus', '¿Cómo accedo al aula virtual Moodle desde el portal?', 'Gracias a nuestra arquitectura de Single Sign-On (SSO), una vez que inicias sesión en el portal web o en la app Android de IINICIA, puedes ingresar al Campus Virtual Moodle con un solo clic sin necesidad de volver a introducir usuario o contraseña.', '3', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_faqs (id, category, question, answer, order_index, is_active, created_at) VALUES ('b2c40b62-b9a9-4cc5-91d6-d84dab329760', 'Costos y Becas', '¿Existen programas de becas institucionales?', 'Sí, contamos con el programa Impulso Tech que otorga becas del 40% al 70% de descuento en colegiaturas a estudiantes con promedio sobresaliente o que provengan de sectores vulnerables.', '4', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_news (id, title, category, summary, content, image_url, published_date, is_published, author_id, created_at, updated_at) VALUES ('noticia-1', 'IINICIA inaugura su renovada infraestructura digital desacoplada con React y Moodle', 'Institucional', 'La institución retira la dependencia operativa de WordPress en favor de una arquitectura moderna, segura y con Single Sign-On unificado.', 'El Instituto Internacional de Innovación y Ciencias Aplicadas (IINICIA) ha dado a conocer su nueva plataforma tecnológica universitaria. Gracias a una arquitectura desacoplada basada en React y Next.js para la experiencia web institucional, un backend robusto en Node.js, y Moodle como motor LMS de clase mundial, los más de 12,000 estudiantes y docentes disfrutarán de una sola identidad digital y navegación fluida entre todos los servicios académicos.', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80', '2026-10-18', 't', NULL, '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_news (id, title, category, summary, content, image_url, published_date, is_published, author_id, created_at, updated_at) VALUES ('noticia-2', 'Abierta la Convocatoria de Becas de Excelencia 2026-2027', 'Admisiones', 'Se otorgarán apoyos económicos del 40% al 70% a los aspirantes con promedios superiores a 9.0 en programas tecnológicos.', 'Comprometidos con democratizar el acceso a la educación superior de vanguardia, IINICIA pone a disposición de la comunidad estudiantil su fondo de becas de impulso tecnológico. El registro se realiza íntegramente desde el nuevo portal web y la resolución se notificará en un plazo máximo de 72 horas hábiles.', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80', '2026-10-12', 't', NULL, '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_news (id, title, category, summary, content, image_url, published_date, is_published, author_id, created_at, updated_at) VALUES ('noticia-3', 'Alianza Estratégica con Centros de Investigación de Inteligencia Artificial', 'Investigación', 'Docentes y alumnos de IINICIA podrán acceder a clústeres de cómputo GPU de última generación para proyectos de tesis.', 'Con el objetivo de consolidar las prácticas de la Licenciatura en Inteligencia Artificial y Ciencia de Datos, IINICIA formalizó un acuerdo de colaboración que provee acceso a infraestructura especializada para el entrenamiento de redes neuronales y modelos fundacionales.', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80', '2026-10-05', 't', NULL, '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_pages (slug, title, subtitle, content_html, meta_title, meta_description, is_published, updated_by, updated_at) VALUES ('quienes-somos', 'Sobre IINICIA', 'Instituto Internacional de Innovación y Ciencias Aplicadas', '<h3>Nuestra Historia</h3><p>Fundado con la misión de democratizar la educación superior de tecnología punta en América Latina, IINICIA integra la investigación aplicada con las demandas más exigentes de la industria 4.0.</p>', 'Quiénes Somos | Instituto Universitario IINICIA', 'Conoce la visión, misión y cuerpo docente del Instituto Internacional de Innovación y Ciencias Aplicadas.', 't', NULL, '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_pages (slug, title, subtitle, content_html, meta_title, meta_description, is_published, updated_by, updated_at) VALUES ('mision-vision', 'Misión, Visión y Principios Rectores', 'Educación transformadora para la era digital', '<h3>Misión</h3><p>Formar líderes éticos y profesionales altamente especializados en inteligencia artificial, desarrollo de software y negocios digitales.</p><h3>Visión</h3><p>Ser la institución universitaria digital de referencia en habla hispana por su excelencia académica y tecnología educativa.</p>', 'Misión y Visión | IINICIA', 'Conoce los principios que rigen a nuestra comunidad universitaria.', 't', NULL, '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cms_pages (slug, title, subtitle, content_html, meta_title, meta_description, is_published, updated_by, updated_at) VALUES ('aviso-privacidad', 'Aviso de Privacidad Integral', 'Cumplimiento con la Ley Federal de Protección de Datos Personales', '<p>IINICIA garantiza la estricta protección y confidencialidad de los datos personales de aspirantes, alumnos y docentes recabados con fines de admisión y gestión académica.</p>', 'Aviso de Privacidad Oficial | IINICIA', 'Consulta los términos de privacidad y protección de datos del Instituto IINICIA.', 't', NULL, '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cohorts (id, program_id, code, name, start_date, end_date, moodle_cohort_id, is_active, created_at) VALUES ('c0000000-0000-0000-0000-000000000001', 'lic-ia-datos', '2026-A', 'Cohorte IA 2026-A Primavera', '2026-02-01', '2026-06-30', '501', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.cohorts (id, program_id, code, name, start_date, end_date, moodle_cohort_id, is_active, created_at) VALUES ('c0000000-0000-0000-0000-000000000002', 'ing-software-cloud', '2026-A', 'Cohorte Software Cloud 2026-A', '2026-02-01', '2026-06-30', '502', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.courses (id, code, name, program_id, professor_id, professor_name, semester, credits, color_gradient, moodle_course_id, is_active, created_at) VALUES ('c-01', 'IA-401', 'Redes Neuronales y Deep Learning con PyTorch', 'lic-ia-datos', 'a0000000-0000-0000-0000-000000000003', 'Dr. Alejandro Méndez Vargas', '4', '10', 'from-blue-600 to-indigo-700', '204', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.courses (id, code, name, program_id, professor_id, professor_name, semester, credits, color_gradient, moodle_course_id, is_active, created_at) VALUES ('c-02', 'IA-402', 'Cloud Computing & MLOps con Docker y Kubernetes', 'lic-ia-datos', 'a0000000-0000-0000-0000-000000000003', 'Mtra. Elena Saldaña', '4', '10', 'from-emerald-600 to-teal-700', '205', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.courses (id, code, name, program_id, professor_id, professor_name, semester, credits, color_gradient, moodle_course_id, is_active, created_at) VALUES ('c-03', 'IA-403', 'Machine Learning II: Algoritmos No Supervisados', 'lic-ia-datos', 'a0000000-0000-0000-0000-000000000003', 'Dr. Fernando Quiroz', '4', '10', 'from-violet-600 to-purple-800', '206', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.courses (id, code, name, program_id, professor_id, professor_name, semester, credits, color_gradient, moodle_course_id, is_active, created_at) VALUES ('c-04', 'IA-404', 'Optimización Numérica y Algoritmos Genéticos', 'lic-ia-datos', 'a0000000-0000-0000-0000-000000000003', 'Dra. Carmen Villalobos', '4', '10', 'from-amber-600 to-orange-700', '207', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.enrollments (id, user_id, course_id, cohort_id, moodle_enrollment_id, status, progress_percent, pending_tasks, next_deadline, grade, enrolled_at, authorized_by) VALUES ('96f7f99c-3852-4de1-b9d3-9c7132b4aacf', 'a0000000-0000-0000-0000-000000000001', 'c-01', 'c0000000-0000-0000-0000-000000000001', '8801', 'ACTIVA', '78', '2', '2026-10-25 05:59:00+00', '9.60', '2026-10-22 03:28:57.750076+00', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.enrollments (id, user_id, course_id, cohort_id, moodle_enrollment_id, status, progress_percent, pending_tasks, next_deadline, grade, enrolled_at, authorized_by) VALUES ('b2ee2cfa-53b4-4e93-b131-0d5e13ea31a6', 'a0000000-0000-0000-0000-000000000001', 'c-02', 'c0000000-0000-0000-0000-000000000001', '8802', 'ACTIVA', '65', '1', '2026-10-28 00:00:00+00', '9.10', '2026-10-22 03:28:57.750076+00', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.enrollments (id, user_id, course_id, cohort_id, moodle_enrollment_id, status, progress_percent, pending_tasks, next_deadline, grade, enrolled_at, authorized_by) VALUES ('836da771-6cac-4a59-a97b-6384dfbb6460', 'a0000000-0000-0000-0000-000000000001', 'c-03', 'c0000000-0000-0000-0000-000000000001', '8803', 'ACTIVA', '84', '0', '2026-11-03 02:00:00+00', '9.80', '2026-10-22 03:28:57.750076+00', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.enrollments (id, user_id, course_id, cohort_id, moodle_enrollment_id, status, progress_percent, pending_tasks, next_deadline, grade, enrolled_at, authorized_by) VALUES ('3ca39066-0575-4ca4-82e3-2d6499478586', 'a0000000-0000-0000-0000-000000000001', 'c-04', 'c0000000-0000-0000-0000-000000000001', '8804', 'ACTIVA', '52', '3', '2026-10-23 05:59:00+00', '8.70', '2026-10-22 03:28:57.750076+00', NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.moodle_user_mappings (id, iinicia_user_id, moodle_user_id, moodle_username, sync_status, last_sync_at, sync_payload, error_message, created_at) VALUES ('a840f30c-65bd-4a9f-8d11-63bf2384295e', 'a0000000-0000-0000-0000-000000000001', '1042', 'valeria.morales', 'SYNCED', '2026-10-22 03:28:57.750076+00', '{"auth": "sso_oidc", "cohort": "2026-A", "institution": "IINICIA"}', NULL, '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, channel, read, deep_link, data_payload, created_at) VALUES ('d717decd-5389-43c2-b1b3-2d75d5c3d4b2', 'a0000000-0000-0000-0000-000000000001', 'Próxima Entrega: Redes Neuronales', 'Tu laboratorio práctico de PyTorch vence el 24 de Octubre a las 23:59 hrs.', 'ACADEMIC_DEADLINE', 'PUSH_ANDROID', 'f', 'iinicia://moodle/course/204/task/401', NULL, '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.notifications (id, user_id, title, message, type, channel, read, deep_link, data_payload, created_at) VALUES ('6dad8859-213d-4b56-aa45-47b429f21bc7', 'a0000000-0000-0000-0000-000000000001', 'Bienvenido al Campus Virtual IINICIA', 'Tu cuenta institucional ha sido vinculada exitosamente con Moodle LMS.', 'MOODLE_SYNC', 'PORTAL_NOTIFICATION', 't', 'iinicia://campus', NULL, '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (id, name, module, description, created_at) VALUES ('gestionar_config_global', 'Gestionar Configuración Global', 'SISTEMA', 'Modificación de parámetros generales del portal y seguridad.', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (id, name, module, description, created_at) VALUES ('gestionar_usuarios', 'Gestionar Usuarios', 'USUARIOS', 'Creación, edición y suspensión de usuarios en el portal e identidad.', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (id, name, module, description, created_at) VALUES ('gestionar_programas_cohortes', 'Gestionar Programas y Cohortes', 'ACADEMICO', 'Administración de la oferta académica y grupos de Moodle.', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (id, name, module, description, created_at) VALUES ('crear_administrar_cursos', 'Crear y Administrar Cursos', 'ACADEMICO', 'Configuración de asignaturas y vinculación con Moodle LMS.', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (id, name, module, description, created_at) VALUES ('evaluar_estudiantes', 'Evaluar Estudiantes', 'CALIFICACIONES', 'Captura de calificaciones y retroalimentación pedagógica.', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (id, name, module, description, created_at) VALUES ('acceder_cursos_autorizados', 'Acceder a Cursos Autorizados', 'AULA_VIRTUAL', 'Ingreso por SSO al contenido del curso en Moodle.', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (id, name, module, description, created_at) VALUES ('usar_app_android', 'Usar App Móvil Android', 'MOVIL', 'Acceso móvil al dashboard, avisos push y cursos.', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (id, name, module, description, created_at) VALUES ('autorizar_admisiones', 'Autorizar Admisiones y Matrícula', 'ADMISIONES', 'Validar aspirante y crear cuenta Moodle automáticamente.', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (id, name, module, description, created_at) VALUES ('auditar_seguridad', 'Consultar Bitácora de Auditoría', 'AUDITORIA', 'Inspección de logs de seguridad y operaciones críticas.', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.permissions (id, name, module, description, created_at) VALUES ('gestionar_cms', 'Gestionar Contenidos CMS', 'CMS', 'Publicación de noticias, páginas y avisos sin tocar código.', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('a7b7cdb4-6d4b-40ba-9e96-2bedf21cb795', 'lic-ia-datos', '1er Semestre', '1', 'Fundamentos de Algoritmos y Python Científico', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('e6e85ce4-8657-4d25-abb7-512821406456', 'lic-ia-datos', '1er Semestre', '2', 'Álgebra Lineal Computacional', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('55608305-243b-4356-88bd-e836d8cbe73a', 'lic-ia-datos', '1er Semestre', '3', 'Estructuras Discretas', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('7a9dd051-bf9f-4dd8-899e-eb587e4b263c', 'lic-ia-datos', '1er Semestre', '4', 'Ética en Tecnologías Disruptivas', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('4c5461fd-935a-4e81-b2e9-50894f36632b', 'lic-ia-datos', '2do Semestre', '1', 'Cálculo Multivariable para IA', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('b4cdb9f6-d439-4441-9c48-9f6dfc3e7d0e', 'lic-ia-datos', '2do Semestre', '2', 'Bases de Datos Relacionales y NoSQL', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('d9696636-da47-4c87-8ddf-2260e32106bd', 'lic-ia-datos', '2do Semestre', '3', 'Programación Orientada a Objetos Avanzada', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('39276481-f0d0-4569-a585-5d8a27f9f9aa', 'lic-ia-datos', '2do Semestre', '4', 'Probabilidad y Estadística Aplicada', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('07397984-7722-423b-9255-94ab7b77e17a', 'lic-ia-datos', '3er Semestre', '1', 'Machine Learning I (Algoritmos Supervisados)', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('e35c529c-9e8f-4cf0-8489-b18da97dca17', 'lic-ia-datos', '3er Semestre', '2', 'Ingeniería de Características y Limpieza de Datos', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('c45a6051-bdc2-4d1e-ab95-103a89cd4de9', 'lic-ia-datos', '3er Semestre', '3', 'Estructuras de Datos y Algoritmos Complejos', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('82cf8838-754e-480c-9741-0966f458b0ed', 'lic-ia-datos', '3er Semestre', '4', 'Visualización de Datos y Storytelling', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('f05e0d6a-e891-4663-be92-42486c197213', 'lic-ia-datos', '4to Semestre', '1', 'Redes Neuronales y Deep Learning con PyTorch', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('b1026b12-c332-4155-a361-b87833747829', 'lic-ia-datos', '4to Semestre', '2', 'Cloud Computing & MLOps con Docker/K8s', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('c6cc7913-6a7b-4afb-aa64-84999cf07b5f', 'lic-ia-datos', '4to Semestre', '3', 'Machine Learning II (No Supervisado y Ensambles)', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('10e0851f-0a62-4107-8412-94f390fa777b', 'lic-ia-datos', '4to Semestre', '4', 'Optimización Numérica y Algoritmos Genéticos', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('410bc836-49c9-4a56-af62-e1b477dbb146', 'ing-software-cloud', '1er Semestre', '1', 'Fundamentos de Programación con TypeScript', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('593b7beb-9483-442c-9547-ab63ac717111', 'ing-software-cloud', '1er Semestre', '2', 'Arquitectura de Computadoras', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('c37679d9-22fa-41e2-8578-a2ff26550789', 'ing-software-cloud', '2do Semestre', '1', 'Frontend Moderno con React y Next.js', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('cd88d28b-5287-4b19-ba82-b99b650c2dab', 'ing-software-cloud', '2do Semestre', '2', 'Bases de Datos y Modelado SQL', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('b13760a1-c03c-4114-a884-65bf2e125614', 'ing-software-cloud', '3er Semestre', '1', 'Backend con Node.js & NestJS', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.program_syllabus (id, program_id, semester_label, order_index, course_name, course_description, credits, created_at) VALUES ('4eb6bc72-6e17-491e-b1f6-e67aa9902d95', 'ing-software-cloud', '3er Semestre', '2', 'Microservicios y Docker Containers', NULL, '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.programs (id, title, degree, area, duration, modality, credits, rvoe, description, objectives, field_work, image_url, featured, is_active, created_at, updated_at) VALUES ('lic-ia-datos', 'Licenciatura en Inteligencia Artificial y Ciencia de Datos', 'Licenciatura', 'Tecnología & IA', '8 Semestres (4 años)', 'Híbrida y 100% Online con Mentorías', '320', 'RVOE-SEP-2026-IA01', 'Diseñada con directores de ingeniería de Google, Microsoft y OpenAI para preparar a la nueva generación de científicos e ingenieros en machine learning, deep learning y arquitecturas de agentes autónomos.', 'Dominar la modelación matemática, visión computacional, procesamiento de lenguaje natural y el despliegue ético de modelos a gran escala en producción.', 'MLOps Engineer, Lead Data Scientist, AI Solutions Architect, Investigador en Modelos Fundacionales.', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80', 't', 't', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.programs (id, title, degree, area, duration, modality, credits, rvoe, description, objectives, field_work, image_url, featured, is_active, created_at, updated_at) VALUES ('ing-software-cloud', 'Ingeniería en Desarrollo de Software y Arquitectura Cloud', 'Ingeniería', 'Tecnología & IA', '8 Semestres (4 años)', 'En Línea Flexible', '340', 'RVOE-SEP-2026-ISC02', 'Aprende a concebir, programar y desplegar soluciones de software empresariales utilizando microservicios distribuidos, DevOps automatizado, Kubernetes y las mejores prácticas de la industria.', 'Desarrollar aplicaciones full-stack resilientes y escalables bajo arquitecturas limpias (Clean Architecture y DDD) con cobertura total de pruebas.', 'Cloud Architect, Senior Full-Stack Developer, DevOps Engineer, Site Reliability Engineer (SRE).', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80', 't', 't', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.programs (id, title, degree, area, duration, modality, credits, rvoe, description, objectives, field_work, image_url, featured, is_active, created_at, updated_at) VALUES ('lic-gestion-negocios', 'Licenciatura en Negocios Digitales y Transformación Organizacional', 'Licenciatura', 'Negocios Digitales', '7 Semestres (3.5 años)', '100% En Línea', '300', 'RVOE-SEP-2026-BND03', 'Transforma la manera en que operan las organizaciones a través de la digitalización, modelos de suscripción, fintech, marketing de rendimiento y comercio electrónico sin fronteras.', 'Idear y operar modelos de negocio digitales rentables y data-driven en mercados hipercompetitivos.', 'Chief Digital Officer, Product Manager, Growth Marketing Lead, Consultor de Negocios Digitales.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', 't', 't', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.programs (id, title, degree, area, duration, modality, credits, rvoe, description, objectives, field_work, image_url, featured, is_active, created_at, updated_at) VALUES ('dip-ciberseguridad', 'Diplomado Ejecutivo en Ciberseguridad Defensiva y DevSecOps', 'Diplomado', 'Tecnología & IA', '6 Meses (120 horas)', 'En Línea Sincrónico', '45', 'REG-DIPL-2026-SEC', 'Capacitación táctica intensiva para defender infraestructuras corporativas, orquestar auditorías de seguridad, responder ante incidentes de ransomware y blindar pipelines CI/CD.', 'Implementar controles robustos bajo el framework NIST, ISO 27001 y técnicas del MITRE ATT&CK.', 'Analista de Seguridad SOC, DevSecOps Engineer, Auditor de Vulnerabilidades.', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80', 'f', 't', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.programs (id, title, degree, area, duration, modality, credits, rvoe, description, objectives, field_work, image_url, featured, is_active, created_at, updated_at) VALUES ('cert-computacion-cuantica', 'Certificación Profesional en Cómputo en la Nube y Microservicios', 'Certificación', 'Tecnología & IA', '4 Meses (80 horas)', '100% En Línea Autogestionada', '30', 'CERT-IINICIA-CLOUD', 'Valida tus conocimientos prácticos en el diseño, despliegue y monitoreo de microservicios tolerantes a fallos con AWS, GCP y contenedores Docker.', 'Aprobar el examen de certificación con proyectos prácticos reales en la nube.', 'Cloud Associate, Ingeniero DevOps Jr.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80', 'f', 't', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('superadmin', 'gestionar_config_global', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('superadmin', 'gestionar_usuarios', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('superadmin', 'gestionar_programas_cohortes', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('superadmin', 'crear_administrar_cursos', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('superadmin', 'evaluar_estudiantes', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('superadmin', 'acceder_cursos_autorizados', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('superadmin', 'usar_app_android', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('superadmin', 'autorizar_admisiones', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('superadmin', 'auditar_seguridad', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('superadmin', 'gestionar_cms', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('admin_academico', 'gestionar_usuarios', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('admin_academico', 'gestionar_programas_cohortes', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('admin_academico', 'crear_administrar_cursos', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('admin_academico', 'autorizar_admisiones', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('admin_academico', 'acceder_cursos_autorizados', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('admin_academico', 'gestionar_cms', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('coordinador', 'gestionar_programas_cohortes', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('coordinador', 'acceder_cursos_autorizados', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('coordinador', 'gestionar_cms', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('profesor', 'crear_administrar_cursos', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('profesor', 'evaluar_estudiantes', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('profesor', 'acceder_cursos_autorizados', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('estudiante', 'acceder_cursos_autorizados', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('estudiante', 'usar_app_android', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id, created_at) VALUES ('aspirante', 'usar_app_android', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at) VALUES ('superadmin', 'Superadministrador', 'Control global de la plataforma, configuración crítica, gestión de administradores, parámetros de seguridad y auditoría.', '100', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at) VALUES ('admin_tecnico', 'Administrador Técnico', 'Infraestructura, integraciones, configuración técnica, despliegues, monitoreo, logs y soporte de segundo nivel.', '80', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at) VALUES ('admin_academico', 'Administrador Académico', 'Programas, cohortes, periodos, usuarios académicos, matrículas y estados escolares. Autoriza o suspende accesos.', '70', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at) VALUES ('coordinador', 'Coordinador de Carrera', 'Supervisión de programas, grupos, docentes, estudiantes y reportes de su ámbito asignado.', '50', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at) VALUES ('profesor', 'Profesor / Docente', 'Acceso a sus cursos Moodle, contenidos, actividades, evaluación, retroalimentación y seguimiento de estudiantes.', '30', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at) VALUES ('estudiante', 'Estudiante Regular', 'Acceso a Mi IINICIA, app Android y únicamente a los cursos, actividades y recursos autorizados en Moodle.', '10', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at) VALUES ('aspirante', 'Aspirante', 'Consulta oferta, se registra, completa datos y da seguimiento a su proceso previo a la matrícula académica.', '5', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, name, description, hierarchy_level, created_at) VALUES ('soporte', 'Soporte y Mesa de Ayuda', 'Atención de incidencias de cuenta y consulta de información mínima necesaria.', '20', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.seo_redirects (id, old_wp_url, new_react_url, http_status, is_active, created_at) VALUES ('d86a8b23-beef-49d3-ab69-a02ba6510e63', '/index.php/carreras/inteligencia-artificial/', '/oferta-academica/lic-ia-datos', '301', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.seo_redirects (id, old_wp_url, new_react_url, http_status, is_active, created_at) VALUES ('380285d4-5d79-4abb-93d0-e3d23ccbedd9', '/wp-content/uploads/plan-estudios-ia.pdf', '/oferta-academica/lic-ia-datos', '301', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.seo_redirects (id, old_wp_url, new_react_url, http_status, is_active, created_at) VALUES ('ba315b57-8131-4b35-93f4-be0b735d424f', '/index.php/software-cloud-engineering/', '/oferta-academica/ing-software-cloud', '301', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.seo_redirects (id, old_wp_url, new_react_url, http_status, is_active, created_at) VALUES ('d6bb9c6a-6c03-4bcd-9af5-ba5f6b6c5726', '/index.php/admisiones-registro/', '/admisiones', '301', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.seo_redirects (id, old_wp_url, new_react_url, http_status, is_active, created_at) VALUES ('05e9fa21-db73-4ab4-a72d-d87a502bfab5', '/index.php/noticias/inauguracion-plataforma/', '/noticias', '301', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.seo_redirects (id, old_wp_url, new_react_url, http_status, is_active, created_at) VALUES ('6f017356-6a5b-40de-949d-7ac08ffb09a5', '/index.php/contacto-campus/', '/contacto', '301', 't', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.users (id, email, full_name, phone, role_id, status, matricula, avatar_url, program_id, program_name, current_semester, mfa_enabled, mfa_secret, privacy_consent_accepted, privacy_consent_date, created_at, updated_at) VALUES ('a0000000-0000-0000-0000-000000000001', 'valeria.morales@iinicia.edu.mx', 'Valeria Morales Santillán', '+52 55 9812 3456', 'estudiante', 'activo', 'IIN-2024-8842', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 'lic-ia-datos', 'Licenciatura en Inteligencia Artificial y Ciencia de Datos', '4', 'f', NULL, 't', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.users (id, email, full_name, phone, role_id, status, matricula, avatar_url, program_id, program_name, current_semester, mfa_enabled, mfa_secret, privacy_consent_accepted, privacy_consent_date, created_at, updated_at) VALUES ('a0000000-0000-0000-0000-000000000002', 'diego.solis@gmail.com', 'Diego Armando Solís', '+52 55 4123 9988', 'aspirante', 'activo', NULL, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80', 'ing-software-cloud', 'Ingeniería en Desarrollo de Software y Arquitectura Cloud', '1', 'f', NULL, 't', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.users (id, email, full_name, phone, role_id, status, matricula, avatar_url, program_id, program_name, current_semester, mfa_enabled, mfa_secret, privacy_consent_accepted, privacy_consent_date, created_at, updated_at) VALUES ('a0000000-0000-0000-0000-000000000003', 'alejandro.mendez@iinicia.edu.mx', 'Dr. Alejandro Méndez Vargas', '+52 55 6789 0123', 'profesor', 'activo', 'DOC-2022-019', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', NULL, NULL, NULL, 't', NULL, 't', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.users (id, email, full_name, phone, role_id, status, matricula, avatar_url, program_id, program_name, current_semester, mfa_enabled, mfa_secret, privacy_consent_accepted, privacy_consent_date, created_at, updated_at) VALUES ('a0000000-0000-0000-0000-000000000004', 'sofia.alarcon@iinicia.edu.mx', 'Dra. Sofía Alarcón Ruiz', '+52 55 3344 5566', 'coordinador', 'activo', 'COORD-2021-004', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80', NULL, NULL, NULL, 't', NULL, 't', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.users (id, email, full_name, phone, role_id, status, matricula, avatar_url, program_id, program_name, current_semester, mfa_enabled, mfa_secret, privacy_consent_accepted, privacy_consent_date, created_at, updated_at) VALUES ('a0000000-0000-0000-0000-000000000005', 'admin.sistemas@iinicia.edu.mx', 'Ing. Roberto Peña Guzmán', '+52 55 1122 3344', 'superadmin', 'activo', 'ADM-2020-001', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', NULL, NULL, NULL, 't', NULL, 't', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;
INSERT INTO public.users (id, email, full_name, phone, role_id, status, matricula, avatar_url, program_id, program_name, current_semester, mfa_enabled, mfa_secret, privacy_consent_accepted, privacy_consent_date, created_at, updated_at) VALUES ('a0000000-0000-0000-0000-000000000006', 'carmen.valenzuela@iinicia.edu.mx', 'Mtra. Carmen Valenzuela', '+52 55 5566 7788', 'admin_academico', 'activo', 'ADM-ACAD-002', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80', NULL, NULL, NULL, 't', NULL, 't', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00', '2026-10-22 03:28:57.750076+00') ON CONFLICT DO NOTHING;

-- [7] LLAVES FORÁNEAS Y RELACIONES
-- Name: admission_applications admission_applications_assigned_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admission_applications
    ADD CONSTRAINT admission_applications_assigned_cohort_id_fkey FOREIGN KEY (assigned_cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL;


--

-- Name: admission_applications admission_applications_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admission_applications
    ADD CONSTRAINT admission_applications_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE RESTRICT;


--

-- Name: admission_applications admission_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admission_applications
    ADD CONSTRAINT admission_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--

-- Name: admission_applications admission_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admission_applications
    ADD CONSTRAINT admission_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--

-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--

-- Name: cms_contact_messages cms_contact_messages_program_interest_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_contact_messages
    ADD CONSTRAINT cms_contact_messages_program_interest_fkey FOREIGN KEY (program_interest) REFERENCES public.programs(id) ON DELETE SET NULL;


--

-- Name: cms_news cms_news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_news
    ADD CONSTRAINT cms_news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--

-- Name: cms_pages cms_pages_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cms_pages
    ADD CONSTRAINT cms_pages_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--

-- Name: cohorts cohorts_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE RESTRICT;


--

-- Name: courses courses_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--

-- Name: courses courses_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;


--

-- Name: device_tokens device_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: enrollments enrollments_authorized_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_authorized_by_fkey FOREIGN KEY (authorized_by) REFERENCES public.users(id);


--

-- Name: enrollments enrollments_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id) ON DELETE SET NULL;


--

-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--

-- Name: enrollments enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: moodle_user_mappings moodle_user_mappings_iinicia_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moodle_user_mappings
    ADD CONSTRAINT moodle_user_mappings_iinicia_user_id_fkey FOREIGN KEY (iinicia_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: program_syllabus program_syllabus_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_syllabus
    ADD CONSTRAINT program_syllabus_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;


--

-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--

-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--

-- Name: sso_tickets sso_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sso_tickets
    ADD CONSTRAINT sso_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--

-- [8] ÍNDICES Y TRIGGERS DE ACTUALIZACIÓN
-- Name: idx_admissions_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admissions_email ON public.admission_applications USING btree (email);


--

-- Name: idx_admissions_program; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admissions_program ON public.admission_applications USING btree (program_id);


--

-- Name: idx_admissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admissions_status ON public.admission_applications USING btree (status);


--

-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--

-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree (created_at DESC);


--

-- Name: idx_courses_moodle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_moodle_id ON public.courses USING btree (moodle_course_id);


--

-- Name: idx_courses_program_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_program_id ON public.courses USING btree (program_id);


--

-- Name: idx_enrollments_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_course ON public.enrollments USING btree (course_id);


--

-- Name: idx_enrollments_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_user ON public.enrollments USING btree (user_id);


--

-- Name: idx_moodle_mapping_moodle_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_moodle_mapping_moodle_id ON public.moodle_user_mappings USING btree (moodle_user_id);


--

-- Name: idx_moodle_mapping_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_moodle_mapping_user ON public.moodle_user_mappings USING btree (iinicia_user_id);


--

-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, read);


--

-- Name: idx_programs_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_programs_area ON public.programs USING btree (area);


--

-- Name: idx_programs_degree; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_programs_degree ON public.programs USING btree (degree);


--

-- Name: idx_programs_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_programs_featured ON public.programs USING btree (featured);


--

-- Name: idx_syllabus_program_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_syllabus_program_id ON public.program_syllabus USING btree (program_id);


--

-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--

-- Name: idx_users_matricula; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_matricula ON public.users USING btree (matricula);


--

-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--

-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--

-- Name: admission_applications trg_admissions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_admissions_updated_at BEFORE UPDATE ON public.admission_applications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--

-- Name: cms_news trg_cms_news_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_cms_news_updated_at BEFORE UPDATE ON public.cms_news FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--

-- Name: cms_pages trg_cms_pages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_cms_pages_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--

-- Name: programs trg_programs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--

-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--

-- [9] SEGURIDAD A NIVEL DE FILA (RLS) Y POLÍTICAS DE ACCESO
-- Name: admission_applications Acceso total para administradores en admisiones; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Acceso total para administradores en admisiones" ON public.admission_applications USING (true);


--

-- Name: cms_news Acceso total para administradores en cms_news; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Acceso total para administradores en cms_news" ON public.cms_news USING (true);


--

-- Name: cms_pages Acceso total para administradores en cms_pages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Acceso total para administradores en cms_pages" ON public.cms_pages USING (true);


--

-- Name: moodle_user_mappings Acceso total para administradores en mapeos moodle; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Acceso total para administradores en mapeos moodle" ON public.moodle_user_mappings USING (true);


--

-- Name: enrollments Acceso total para administradores en matriculas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Acceso total para administradores en matriculas" ON public.enrollments USING (true);


--

-- Name: programs Acceso total para administradores en programas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Acceso total para administradores en programas" ON public.programs USING (true);


--

-- Name: audit_logs Acceso total para service_role y administradores a auditoria; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Acceso total para service_role y administradores a auditoria" ON public.audit_logs USING (true);


--

-- Name: sso_tickets Acceso total para tickets SSO; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Acceso total para tickets SSO" ON public.sso_tickets USING (true);


--

-- Name: notifications Estudiantes pueden actualizar estado de sus notificaciones; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Estudiantes pueden actualizar estado de sus notificaciones" ON public.notifications FOR UPDATE USING (true);


--

-- Name: enrollments Estudiantes pueden ver sus matriculas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Estudiantes pueden ver sus matriculas" ON public.enrollments FOR SELECT USING (true);


--

-- Name: notifications Estudiantes pueden ver sus notificaciones; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Estudiantes pueden ver sus notificaciones" ON public.notifications FOR SELECT USING (true);


--

-- Name: device_tokens Gestion de tokens FCM; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Gestion de tokens FCM" ON public.device_tokens USING (true);


--

-- Name: registros Inserción de prueba; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Inserción de prueba" ON public.registros FOR INSERT TO anon WITH CHECK (true);


--

-- Name: registros Lectura de prueba; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Lectura de prueba" ON public.registros FOR SELECT TO anon USING (true);


--

-- Name: cms_contact_messages Permitir envio de mensajes de contacto; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir envio de mensajes de contacto" ON public.cms_contact_messages FOR INSERT WITH CHECK (true);


--

-- Name: admission_applications Permitir lectura de su propia solicitud de admision; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir lectura de su propia solicitud de admision" ON public.admission_applications FOR SELECT USING (true);


--

-- Name: cms_faculty Permitir lectura publica de claustro docente activo; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir lectura publica de claustro docente activo" ON public.cms_faculty FOR SELECT USING ((is_active = true));


--

-- Name: courses Permitir lectura publica de cursos activos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir lectura publica de cursos activos" ON public.courses FOR SELECT USING ((is_active = true));


--

-- Name: cms_faqs Permitir lectura publica de faqs activas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir lectura publica de faqs activas" ON public.cms_faqs FOR SELECT USING ((is_active = true));


--

-- Name: cms_news Permitir lectura publica de noticias publicadas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir lectura publica de noticias publicadas" ON public.cms_news FOR SELECT USING ((is_published = true));


--

-- Name: programs Permitir lectura publica de programas activos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir lectura publica de programas activos" ON public.programs FOR SELECT USING ((is_active = true));


--

-- Name: cms_pages Permitir lectura publica de páginas CMS publicadas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir lectura publica de páginas CMS publicadas" ON public.cms_pages FOR SELECT USING ((is_published = true));


--

-- Name: seo_redirects Permitir lectura publica de redirecciones SEO; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir lectura publica de redirecciones SEO" ON public.seo_redirects FOR SELECT USING ((is_active = true));


--

-- Name: roles Permitir lectura publica de roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir lectura publica de roles" ON public.roles FOR SELECT USING (true);


--

-- Name: program_syllabus Permitir lectura publica de syllabus; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir lectura publica de syllabus" ON public.program_syllabus FOR SELECT USING (true);


--

-- Name: admission_applications Permitir registro de solicitudes de admision; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Permitir registro de solicitudes de admision" ON public.admission_applications FOR INSERT WITH CHECK (true);


--

-- Name: users Usuarios pueden actualizar su propio perfil; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.users FOR UPDATE USING ((auth.uid() = id));


--

-- Name: users Usuarios pueden ver su propio perfil y publicos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Usuarios pueden ver su propio perfil y publicos" ON public.users FOR SELECT USING (true);


--

-- Name: admission_applications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;

--

-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--

-- Name: cms_contact_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cms_contact_messages ENABLE ROW LEVEL SECURITY;

--

-- Name: cms_faculty; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cms_faculty ENABLE ROW LEVEL SECURITY;

--

-- Name: cms_faqs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cms_faqs ENABLE ROW LEVEL SECURITY;

--

-- Name: cms_news; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cms_news ENABLE ROW LEVEL SECURITY;

--

-- Name: cms_pages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

--

-- Name: cohorts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

--

-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--

-- Name: device_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

--

-- Name: enrollments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

--

-- Name: moodle_user_mappings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.moodle_user_mappings ENABLE ROW LEVEL SECURITY;

--

-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--

-- Name: permissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

--

-- Name: program_syllabus; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.program_syllabus ENABLE ROW LEVEL SECURITY;

--

-- Name: programs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

--

-- Name: registros; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

--

-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--

-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--

-- Name: seo_redirects; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;

--

-- Name: sso_tickets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sso_tickets ENABLE ROW LEVEL SECURITY;

--

-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--

-- [10] PERMISOS Y PRIVILEGIOS EXPLÍCITOS PARA APIS Y APPS (anon, authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
