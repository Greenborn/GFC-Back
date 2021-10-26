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