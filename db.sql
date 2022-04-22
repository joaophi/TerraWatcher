--
-- PostgreSQL database dump
--

-- Dumped from database version 14.2
-- Dumped by pg_dump version 14.2

-- Started on 2022-04-22 21:48:45 UTC

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
-- TOC entry 214 (class 1259 OID 17599)
-- Name: label; Type: TABLE; Schema: public; Owner: fcd
--

CREATE TABLE public.label (
    address character(44) NOT NULL,
    label character varying(100) NOT NULL
);


ALTER TABLE public.label OWNER TO fcd;

--
-- TOC entry 210 (class 1259 OID 16386)
-- Name: tx; Type: TABLE; Schema: public; Owner: fcd
--

CREATE TABLE public.tx (
    id bigint NOT NULL,
    hash character(64) NOT NULL,
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
    address character(44) NOT NULL,
    processed boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tx_address OWNER TO fcd;

--
-- TOC entry 213 (class 1259 OID 16413)
-- Name: tx_amount; Type: TABLE; Schema: public; Owner: fcd
--

CREATE TABLE public.tx_amount (
    tx_id bigint NOT NULL,
    address character(44) NOT NULL,
    id bigint NOT NULL,
    denom character varying(68) NOT NULL,
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
-- TOC entry 215 (class 1259 OID 17604)
-- Name: watch; Type: TABLE; Schema: public; Owner: fcd
--

CREATE TABLE public.watch (
    address character(44) NOT NULL,
    channel character(18) NOT NULL,
    amount double precision NOT NULL
);


ALTER TABLE public.watch OWNER TO fcd;

--
-- TOC entry 3194 (class 2606 OID 17603)
-- Name: label label_pkey; Type: CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.label
    ADD CONSTRAINT label_pkey PRIMARY KEY (address);


--
-- TOC entry 3196 (class 2606 OID 213904)
-- Name: watch pk_watch; Type: CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.watch
    ADD CONSTRAINT pk_watch PRIMARY KEY (address, channel);


--
-- TOC entry 3189 (class 2606 OID 17563)
-- Name: tx_address tx_address_pkey; Type: CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.tx_address
    ADD CONSTRAINT tx_address_pkey PRIMARY KEY (tx_id, address);


--
-- TOC entry 3192 (class 2606 OID 16417)
-- Name: tx_amount tx_amount_pkey; Type: CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.tx_amount
    ADD CONSTRAINT tx_amount_pkey PRIMARY KEY (id);


--
-- TOC entry 3186 (class 2606 OID 16395)
-- Name: tx tx_pkey; Type: CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.tx
    ADD CONSTRAINT tx_pkey PRIMARY KEY (id);


--
-- TOC entry 3190 (class 1259 OID 258549)
-- Name: idx_amount; Type: INDEX; Schema: public; Owner: fcd
--

CREATE INDEX idx_amount ON public.tx_amount USING btree (tx_id, address);


--
-- TOC entry 3184 (class 1259 OID 273979)
-- Name: idx_hash; Type: INDEX; Schema: public; Owner: fcd
--

CREATE UNIQUE INDEX idx_hash ON public.tx USING btree (hash);


--
-- TOC entry 3187 (class 1259 OID 169506)
-- Name: idx_processed; Type: INDEX; Schema: public; Owner: fcd
--

CREATE INDEX idx_processed ON public.tx_address USING btree (processed);


--
-- TOC entry 3198 (class 2606 OID 17585)
-- Name: tx_amount fk_amount_address; Type: FK CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.tx_amount
    ADD CONSTRAINT fk_amount_address FOREIGN KEY (tx_id, address) REFERENCES public.tx_address(tx_id, address);


--
-- TOC entry 3197 (class 2606 OID 16407)
-- Name: tx_address fk_tx_address; Type: FK CONSTRAINT; Schema: public; Owner: fcd
--

ALTER TABLE ONLY public.tx_address
    ADD CONSTRAINT fk_tx_address FOREIGN KEY (tx_id) REFERENCES public.tx(id);


-- Completed on 2022-04-22 21:48:46 UTC

--
-- PostgreSQL database dump complete
--

