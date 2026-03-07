CREATE TABLE public.transaction_type (
	id serial4 NOT NULL,
	"name" varchar NOT NULL,
	CONSTRAINT transaction_type_pk PRIMARY KEY (id)
);

CREATE TABLE public."user" (
	user_id bigserial NOT NULL,
	email varchar NOT NULL,
	"password" varchar NOT NULL,
	username varchar NOT NULL,
	"name" varchar NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT user_pk PRIMARY KEY (user_id),
	CONSTRAINT user_unique UNIQUE (email)
);

CREATE TABLE public.transaction_category (
	category_id int8 DEFAULT nextval('transaction_categories_category_id_seq'::regclass) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	user_id int4 NOT NULL,
	"name" varchar NOT NULL,
	color varchar NOT NULL,
	CONSTRAINT transaction_categories_pk PRIMARY KEY (category_id),
	CONSTRAINT transaction_categories_user_fk FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public."transaction" (
	transaction_id bigserial NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	user_id int4 NOT NULL,
	category_id int4 NULL,
	type_id int4 NOT NULL,
	amount float4 NOT NULL,
	description varchar NOT NULL,
	transaction_datetime timestamptz NULL,
	CONSTRAINT transactions_pk PRIMARY KEY (transaction_id),
	CONSTRAINT transaction_transaction_category_fk FOREIGN KEY (category_id) REFERENCES public.transaction_category(category_id) ON DELETE SET NULL ON UPDATE CASCADE,
	CONSTRAINT transaction_transaction_type_fk FOREIGN KEY (type_id) REFERENCES public.transaction_type(id) ON DELETE RESTRICT ON UPDATE CASCADE,
	CONSTRAINT transaction_user_fk FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);