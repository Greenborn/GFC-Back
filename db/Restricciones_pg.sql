CREATE OR REPLACE FUNCTION fn_borrado_contest_category() RETURNS Trigger AS $$
DECLARE
cant INTEGER;
BEGIN
    SELECT count(*) INTO cant 
    FROM profile_contest pc
    WHERE pc.contest_id = OLD.contest_id
    AND pc.category_id = OLD.category_id;
    IF (cant > 0) THEN
     RAISE EXCEPTION 'La contest_category que quiere eliminar contiene profile_contest asociados';
    END IF;
RETURN OLD;
END $$
LANGUAGE 'plpgsql';

CREATE TRIGGER tr_borrado_contest_category
BEFORE DELETE
ON contest_category
FOR EACH ROW EXECUTE PROCEDURE fn_borrado_contest_category();

CREATE OR REPLACE FUNCTION fn_borrado_contest_section() RETURNS Trigger AS $$
DECLARE
cant INTEGER;
BEGIN
    SELECT count(*) INTO cant
    FROM contest_result cr
    WHERE cr.contest_id = OLD.contest_id
    AND cr.section_id = OLD.section_id;
    IF (cant > 0) THEN
     RAISE EXCEPTION 'La contest_section que quiere eliminar contiene contest_result asociados';
    END IF;
RETURN OLD;
END $$
LANGUAGE 'plpgsql';

CREATE TRIGGER tr_borrado_contest_section
BEFORE DELETE
ON contest_section
FOR EACH ROW EXECUTE PROCEDURE fn_borrado_contest_section();

CREATE OR REPLACE FUNCTION fn_ingreso_profile_contest() RETURNS Trigger AS $$
DECLARE
fecha DATE;
BEGIN
    SELECT c.end_date INTO fecha
    FROM contest c
    WHERE c.id = NEW.contest_id;
    IF (fecha < date(now())) THEN
     RAISE EXCEPTION 'No se puede ingresar un nuevo profile_contest pasado el tiempo límite del concurso';
    END IF;
RETURN NEW;
END $$
LANGUAGE 'plpgsql';

CREATE TRIGGER tr_ingreso_profile_contest
BEFORE INSERT
ON profile_contest
FOR EACH ROW EXECUTE PROCEDURE fn_ingreso_profile_contest();

CREATE OR REPLACE FUNCTION fn_eliminado_profile_contest() RETURNS Trigger AS $$
DECLARE
    cant INTEGER;
BEGIN
    SELECT count(*) INTO cant
    FROM image i join contest_result cr on i.id = cr.image_id
    WHERE i.profile_id = OLD.profile_id
    AND cr.contest_id = OLD.contest_id;
    IF (cant > 0) THEN
     RAISE EXCEPTION 'No se puede eliminar este concursante porque tiene obras asociadas en este concurso';
    END IF;
RETURN OLD;
END $$
LANGUAGE 'plpgsql';

CREATE TRIGGER tr_eliminado_profile_contest
BEFORE DELETE
ON profile_contest
FOR EACH ROW EXECUTE PROCEDURE fn_eliminado_profile_contest();

CREATE OR REPLACE FUNCTION fn_eliminado_fotoclub() RETURNS Trigger AS $$
DECLARE
    cant INTEGER;
BEGIN
    SELECT count(*) INTO cant
    FROM profile p JOIN profile_contest pc ON (p.id = pc.profile_id)
    WHERE p.fotoclub_id = OLD.id;
    IF (cant > 0) THEN
     RAISE EXCEPTION 'No se puede eliminar este fotoclub porque tiene perfiles con concursos asociados';
    END IF;
RETURN OLD;
END $$
LANGUAGE 'plpgsql';

CREATE TRIGGER tr_eliminado_fotoclub
BEFORE DELETE
ON fotoclub
FOR EACH ROW EXECUTE PROCEDURE fn_eliminado_fotoclub();

CREATE OR REPLACE FUNCTION fn_eliminado_profile() RETURNS Trigger AS $$
DECLARE
    cant INTEGER;
BEGIN
    --si tiene imagenes cargadas debería estar anotado en un concurso, si esta anotado no necesariamente tendrá imagenes
    SELECT count(*) INTO cant
    FROM profile_contest pr
    WHERE pr.profile_id = OLD.id;
    IF (cant > 0) THEN
     RAISE EXCEPTION 'No se puede eliminar este perfil porque tiene concursos asociados';
    END IF;
RETURN OLD;
END $$
LANGUAGE 'plpgsql';

CREATE TRIGGER tr_eliminado_profile
BEFORE DELETE
ON profile
FOR EACH ROW EXECUTE PROCEDURE fn_eliminado_profile();

ALTER TABLE contest
 ADD CONSTRAINT fecha
 CHECK (contest.start_date < contest.end_date );
 