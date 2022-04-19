--
-- PostgreSQL database dump
--

-- Dumped from database version 14.2
-- Dumped by pg_dump version 14.2

-- Started on 2022-04-18 18:13:29 UTC

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
-- TOC entry 210 (class 1259 OID 16386)
-- Name: tx; Type: TABLE; Schema: public; Owner: fcd
--

CREATE TABLE public.tx (
    id bigint NOT NULL,
    hash character(32) NOT NULL,
    "timestamp" timestamp(0) without time zone NOT NULL,
    json json NOT NULL
);


ALTER TABLE public.tx OWNER TO fcd;

--
-- TOC entry 211 (class 1259 OID 16402)
-- Name: tx_address; Type: TABLE; Schema: public; Owner: fcd
--

CREATE TABLE public.tx_address (
    tx_id bigint NOT NULL,
    address character varying(40) NOT NULL
);


ALTER TABLE public.tx_address OWNER TO fcd;

--
-- TOC entry 213 (class 1259 OID 16413)
-- Name: tx_amount; Type: TABLE; Schema: public; Owner: fcd
--

CREATE TABLE public.tx_amount (
    tx_id bigint NOT NULL,
    address character varying(40) NOT NULL,
    id bigint NOT NULL,
    denom character varying(40) NOT NULL,
    amount double precision NOT NULL,
    usd double precision NOT NULL,
    in_out character(1) NOT NULL
);


ALTER TABLE public.tx_amount OWNER TO fcd;

--
-- TOC entry 212 (class 1259 OID 16412)
-- Name: tx_amount_id_seq; Type: SEQUENCE; Schema: public; Owner: fcd
--

ALTER TABLE public.tx_amount ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tx_amount_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 209 (class 1259 OID 16385)
-- Name: tx_id_seq; Type: SEQUENCE; Schema: public; Owner: fcd
--

ALTER TABLE public.tx ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tx_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 3323 (class 0 OID 16386)
-- Dependencies: 210
-- Data for Name: tx; Type: TABLE DATA; Schema: public; Owner: fcd
--

COPY public.tx (id, hash, "timestamp", json) FROM stdin;
\.


--
-- TOC entry 3324 (class 0 OID 16402)
-- Dependencies: 211
-- Data for Name: tx_address; Type: TABLE DATA; Schema: public; Owner: fcd
--

COPY public.tx_address (tx_id, address) FROM stdin;
\.


--
-- TOC entry 3326 (class 0 OID 16413)
-- Dependencies: 213
-- Data for Name: tx_amount; Type: TABLE DATA; Schema: public; Owner: fcd
--

COPY public.tx_amount (tx_id, address, id, denom, amount, usd, in_out) FROM stdin;
\.


--
-- TOC entry 3332 (class 0 OID 0)
-- Dependencies: 212
-- Name: tx_amount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fcd
--

SELECT pg_catalog.setval('public.tx_amount_id_seq', 1, false);


--
-- TOC entry 3333 (class 0 OID 0)
-- Dependencies: 209
-- Name: tx_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fcd
--

SELECT pg_catalog.setval('public.tx_id_seq', 1, false);


--
-- TOC entry 3178 (class 2606 OID 16424)
-- Name: tx_address tx_address_pkey; Type: CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.tx_address
    ADD CONSTRAINT tx_address_pkey PRIMARY KEY (tx_id, address);


--
-- TOC entry 3180 (class 2606 OID 16417)
-- Name: tx_amount tx_amount_pkey; Type: CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.tx_amount
    ADD CONSTRAINT tx_amount_pkey PRIMARY KEY (id);


--
-- TOC entry 3176 (class 2606 OID 16395)
-- Name: tx tx_pkey; Type: CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.tx
    ADD CONSTRAINT tx_pkey PRIMARY KEY (id);


--
-- TOC entry 3182 (class 2606 OID 16425)
-- Name: tx_amount fk_amount_address; Type: FK CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.tx_amount
    ADD CONSTRAINT fk_amount_address FOREIGN KEY (tx_id, address) REFERENCES public.tx_address(tx_id, address);


--
-- TOC entry 3181 (class 2606 OID 16407)
-- Name: tx_address fk_tx_address; Type: FK CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.tx_address
    ADD CONSTRAINT fk_tx_address FOREIGN KEY (tx_id) REFERENCES public.tx(id);


-- Completed on 2022-04-18 18:13:29 UTC

--
-- PostgreSQL database dump complete
--

