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
    IF (( select role_id from "user" where profile_id = NEW.profile_id) = 4) THEN
        RAISE EXCEPTION 'Un juez no puede inscribirse como concursante';
    end if;
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
    FROM profile p
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
    idProfile INTEGER;
    tipo TEXT = TG_TABLE_NAME;
BEGIN
    IF (tipo = 'profile') THEN
        idProfile = OLD.id;
    END IF;
    IF (tipo = 'user') THEN
        idProfile = OLD.profile_id;
    end if;
    --si tiene imagenes cargadas debería estar anotado en un concurso, si esta anotado no necesariamente tendrá imagenes
    SELECT count(*) INTO cant
    FROM profile_contest pr
    WHERE pr.profile_id = idProfile;
    IF (cant > 0) THEN
     RAISE EXCEPTION 'No se puede eliminar este % porque tiene concursos asociados', tipo;
    END IF;
RETURN OLD;
END $$
LANGUAGE 'plpgsql';
CREATE TRIGGER tr_eliminado_user
BEFORE DELETE
ON "user"
FOR EACH ROW EXECUTE PROCEDURE fn_eliminado_profile();
CREATE TRIGGER tr_eliminado_profile
BEFORE DELETE
ON profile
FOR EACH ROW EXECUTE PROCEDURE fn_eliminado_profile();

ALTER TABLE contest
 ADD CONSTRAINT fecha
 CHECK (contest.start_date < contest.end_date );

CREATE OR REPLACE FUNCTION fn_limite_fotos_section() RETURNS Trigger AS $$
DECLARE
    cant_max INTEGER;
    cant_actual INTEGER;
    profile INTEGER;
BEGIN
        SELECT max_img_section INTO cant_max FROM contest c WHERE c.id= NEW.contest_id;
        SELECT ii.profile_id INTO profile FROM image ii JOIN contest_result r on ii.id = r.image_id WHERE NEW.image_id = ii.id;
        SELECT count(*) INTO cant_actual
        FROM contest_result cr JOIN image i on cr.image_id = i.id
        WHERE cr.contest_id = NEW.contest_id
          AND cr.section_id = NEW.section_id
          AND i.profile_id = profile;
        IF TG_OP = 'INSERT' THEN
                IF (cant_actual > cant_max) THEN
                   -- DELETE FROM contest_result WHERE contest_result.id=NEW.id;
                    --DELETE FROM metric WHERE metric.id= NEW.metric_id;
                   -- DELETE FROM image WHERE image.id= NEW.image_id;
                 RAISE EXCEPTION 'No se puede cargar mas de % imagenes por sección por perfil', cant_max;
                END IF;
        return NEW;
        end if;
       IF TG_OP = 'UPDATE' THEN
                IF (cant_actual > cant_max) THEN
                 RAISE EXCEPTION 'No se puede cargar mas de % imagenes por sección por perfil', cant_max;
                END IF;
            RETURN OLD;
        end if;


END $$
LANGUAGE 'plpgsql';

CREATE TRIGGER tr_limite_fotos_section
AFTER INSERT OR UPDATE
ON contest_result
FOR EACH ROW EXECUTE PROCEDURE fn_limite_fotos_section();

--TODO: delete interno de fn_check_fotoclub() no funciona ¿?

-- CREATE OR REPLACE FUNCTION fn_check_fotoclub() RETURNS Trigger AS $$
-- DECLARE

-- BEGIN
--     IF ( ((SELECT fotoclub_id
--     FROM profile p
--     WHERE NEW.profile_id = p.id) IS NULL) and
--      ((NEW.role_id = 2 ) or (NEW.role_id = 3)) ) THEN
--         delete from profile p2 where p2.id = NEW.profile_id;
--         RAISE EXCEPTION 'Este usuario debe pertenecer a un fotoclub/agrupación';
--     END IF;
-- RETURN NEW;
-- END $$
-- LANGUAGE 'plpgsql';

-- CREATE TRIGGER tr_check_fotoclub
-- BEFORE INSERT OR UPDATE
-- ON "user"
-- FOR EACH ROW EXECUTE PROCEDURE fn_check_fotoclub();