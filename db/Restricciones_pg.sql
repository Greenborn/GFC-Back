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
RETURN NEW;
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
RETURN NEW;
END $$
LANGUAGE 'plpgsql';

CREATE TRIGGER tr_borrado_contest_section
BEFORE DELETE
ON contest_section
FOR EACH ROW EXECUTE PROCEDURE fn_borrado_contest_section();