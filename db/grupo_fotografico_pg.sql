-- Created by Vertabelo (http://vertabelo.com)
-- Last modification date: 2021-10-23 21:35:31.883

-- tables

-- Table:info_centro
CREATE TABLE info_centro (
   title varchar(200) NULL,
    content text NULL,
    img_url varchar(45) NULL,
    id SERIAL   NOT NULL,
    CONSTRAINT info_centro_pk PRIMARY KEY (id)
);

-- Table: category
CREATE TABLE category (
    name varchar(45)  NOT NULL,
    id SERIAL   NOT NULL,
    CONSTRAINT category_pk PRIMARY KEY (id)
);

-- Table: contest
CREATE TABLE contest (
    name varchar(45)  NOT NULL,
    description text  NULL DEFAULT NULL,
    start_date date  NULL DEFAULT NULL,
    end_date date  NULL DEFAULT NULL,
    img_url varchar(45) NULL,
    rules_url varchar(45) NULL,
    id SERIAL   NOT NULL,
    CONSTRAINT contest_pk PRIMARY KEY (id)
);

-- Table: contest_category
CREATE TABLE contest_category (
    contest_id int  NOT NULL,
    category_id int  NOT NULL,
    id SERIAL   NOT NULL,
    CONSTRAINT contest_category_pk PRIMARY KEY (id)
);

CREATE INDEX fk_contest_category_id on contest_category (category_id ASC);

CREATE INDEX fk_contest_contest_id on contest_category (contest_id ASC);

-- Table: contest_result
CREATE TABLE contest_result (
    metric_id int  NOT NULL,
    image_id int  NOT NULL,
    contest_id int  NOT NULL,
    id SERIAL   NOT NULL,
    section_id int  NOT NULL,
    CONSTRAINT contest_result_pk PRIMARY KEY (id)
);

CREATE INDEX fk_contest_result_metric_id on contest_result (metric_id ASC);

CREATE INDEX fk_contest_result_contest_id on contest_result (contest_id ASC);

CREATE INDEX fk_contest_result_image_id on contest_result (image_id ASC);

-- Table: contest_section
CREATE TABLE contest_section (
    contest_id int  NOT NULL,
    section_id int  NOT NULL,
    id SERIAL   NOT NULL,
    CONSTRAINT contest_section_pk PRIMARY KEY (id)
);

CREATE INDEX fk_contest_section_id on contest_section (section_id ASC);

CREATE INDEX fk_contest_contest2_id on contest_section (contest_id ASC);

-- Table: fotoclub
CREATE TABLE fotoclub (
    name varchar(45)  NULL DEFAULT NULL,
    id SERIAL   NOT NULL,
    CONSTRAINT fotoclub_pk PRIMARY KEY (id)
);

-- Table: image
CREATE TABLE image (
    code varchar(20)  NOT NULL,
    title varchar(45)  NOT NULL,
    profile_id int  NOT NULL,
    url varchar(45) NULL,
    id SERIAL   NOT NULL,
    CONSTRAINT image_pk PRIMARY KEY (id)
);

-- Table: metric
CREATE TABLE metric (
    prize varchar(10)  NOT NULL,
    score int  NULL DEFAULT NULL,
    id SERIAL   NOT NULL,
    CONSTRAINT metric_pk PRIMARY KEY (id)
);

-- Table: profile
CREATE TABLE profile (
    name varchar(59)  NULL DEFAULT NULL,
    last_name varchar(50)  NULL DEFAULT NULL,
    fotoclub_id int  NOT NULL,
    id SERIAL   NOT NULL,
    img_url varchar(45) NULL,
    CONSTRAINT profile_pk PRIMARY KEY (id)
);

CREATE INDEX fk_profile_fotoclub_id on profile (fotoclub_id ASC);

-- Table: profile_contest
CREATE TABLE profile_contest (
    profile_id int  NOT NULL,
    contest_id int  NOT NULL,
    id SERIAL   NOT NULL,
    category_id int  NOT NULL,
    CONSTRAINT profile_enrolled UNIQUE (profile_id, contest_id) NOT DEFERRABLE  INITIALLY IMMEDIATE,
    CONSTRAINT profile_contest_pk PRIMARY KEY (id)
);

CREATE INDEX fk_profile_contest_id on profile_contest (contest_id ASC);

CREATE INDEX fk_profile_profile_id on profile_contest (profile_id ASC);

-- Table: role
CREATE TABLE role (
    type varchar(45)  NOT NULL,
    id SERIAL   NOT NULL,
    CONSTRAINT role_pk PRIMARY KEY (id)
);

-- Table: section
CREATE TABLE section (
    name varchar(45)  NOT NULL,
    id SERIAL   NOT NULL,
    parent_id int  NULL,
    CONSTRAINT section_pk PRIMARY KEY (id)
);

-- Table: user
CREATE TABLE "user" (
    username varchar(45)  NULL DEFAULT NULL,
    password_hash varchar(255)  NULL DEFAULT NULL,
    password_reset_token varchar(255)  NULL DEFAULT NULL,
    access_token varchar(128)  NULL DEFAULT NULL,
    created_at varchar(45)  NULL DEFAULT NULL,
    updated_at varchar(45)  NULL DEFAULT NULL,
    status smallint  NOT NULL,
    role_id int  NOT NULL,
    profile_id int  NOT NULL,
    id SERIAL   NOT NULL,
    CONSTRAINT fk_user_profile_id UNIQUE (profile_id) NOT DEFERRABLE  INITIALLY IMMEDIATE,
    CONSTRAINT user_pk PRIMARY KEY (id)
);

CREATE INDEX fk_user_role_id on "user" (role_id ASC);

-- foreign keys
-- Reference: contest_result_section (table: contest_result)
ALTER TABLE contest_result ADD CONSTRAINT contest_result_section
    FOREIGN KEY (section_id)
    REFERENCES section (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_contest_category_id (table: contest_category)
ALTER TABLE contest_category ADD CONSTRAINT fk_contest_category_id
    FOREIGN KEY (category_id)
    REFERENCES category (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_contest_contest2_id (table: contest_section)
ALTER TABLE contest_section ADD CONSTRAINT fk_contest_contest2_id
    FOREIGN KEY (contest_id)
    REFERENCES contest (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_contest_contest_id (table: contest_category)
ALTER TABLE contest_category ADD CONSTRAINT fk_contest_contest_id
    FOREIGN KEY (contest_id)
    REFERENCES contest (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_contest_result_contest_id (table: contest_result)
ALTER TABLE contest_result ADD CONSTRAINT fk_contest_result_contest_id
    FOREIGN KEY (contest_id)
    REFERENCES contest (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_contest_result_image_id (table: contest_result)
ALTER TABLE contest_result ADD CONSTRAINT fk_contest_result_image_id
    FOREIGN KEY (image_id)
    REFERENCES image (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_contest_result_metric_id (table: contest_result)
ALTER TABLE contest_result ADD CONSTRAINT fk_contest_result_metric_id
    FOREIGN KEY (metric_id)
    REFERENCES metric (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_contest_section_id (table: contest_section)
ALTER TABLE contest_section ADD CONSTRAINT fk_contest_section_id
    FOREIGN KEY (section_id)
    REFERENCES section (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_profile_contest_id (table: profile_contest)
ALTER TABLE profile_contest ADD CONSTRAINT fk_profile_contest_id
    FOREIGN KEY (contest_id)
    REFERENCES contest (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_profile_fotoclub_id (table: profile)
ALTER TABLE profile ADD CONSTRAINT fk_profile_fotoclub_id
    FOREIGN KEY (fotoclub_id)
    REFERENCES fotoclub (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_profile_profile_id (table: profile_contest)
ALTER TABLE profile_contest ADD CONSTRAINT fk_profile_profile_id
    FOREIGN KEY (profile_id)
    REFERENCES profile (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_user_profile_id (table: user)
ALTER TABLE "user" ADD CONSTRAINT fk_user_profile_id
    FOREIGN KEY (profile_id)
    REFERENCES profile (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: fk_user_role_id (table: user)
ALTER TABLE "user" ADD CONSTRAINT fk_user_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: profile_contest_category (table: profile_contest)
ALTER TABLE profile_contest ADD CONSTRAINT profile_contest_category
    FOREIGN KEY (category_id)
    REFERENCES category (id)
    NOT DEFERRABLE
    INITIALLY IMMEDIATE
;

-- Reference: section_section (table: section)
ALTER TABLE section ADD CONSTRAINT section_section
    FOREIGN KEY (parent_id)
    REFERENCES section (id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- End of file.

