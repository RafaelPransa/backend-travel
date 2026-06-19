/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION validate_schedule_departure_day()
    RETURNS TRIGGER AS $$
    DECLARE
        v_origin VARCHAR(50);
        v_destination VARCHAR(50);
        v_dow INT;
    BEGIN
        -- 1. Dapatkan asal dan tujuan rute
        SELECT LOWER(origin), LOWER(destination) INTO v_origin, v_destination
        FROM routes
        WHERE id = NEW.route_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Rute dengan ID % tidak ditemukan', NEW.route_id;
        END IF;

        -- 2. Dapatkan indeks hari keberangkatan (1=Senin, 7=Minggu)
        v_dow := EXTRACT(ISODOW FROM NEW.departure_time);

        -- 3. Validasi rute Panawangan -> Jakarta (Senin, Rabu, Minggu)
        IF v_origin = 'panawangan' AND v_destination = 'jakarta' THEN
            IF v_dow NOT IN (1, 3, 7) THEN
                RAISE EXCEPTION 'Jadwal keberangkatan Panawangan ke Jakarta hanya diperbolehkan pada hari Senin, Rabu, dan Minggu';
            END IF;
        -- 4. Validasi rute Jakarta -> Panawangan (Selasa, Kamis, Jumat)
        ELSIF v_origin = 'jakarta' AND v_destination = 'panawangan' THEN
            IF v_dow NOT IN (2, 4, 5) THEN
                RAISE EXCEPTION 'Jadwal keberangkatan Jakarta ke Panawangan hanya diperbolehkan pada hari Selasa, Kamis, dan Jumat';
            END IF;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION validate_schedule_departure_day()
    RETURNS TRIGGER AS $$
    DECLARE
        v_origin VARCHAR(50);
        v_destination VARCHAR(50);
        v_dow INT;
    BEGIN
        SELECT LOWER(origin), LOWER(destination) INTO v_origin, v_destination
        FROM routes
        WHERE id = NEW.route_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Rute dengan ID % tidak ditemukan', NEW.route_id;
        END IF;

        v_dow := EXTRACT(ISODOW FROM NEW.departure_time);

        IF v_origin = 'jakarta' AND v_destination = 'panawangan' THEN
            IF v_dow NOT IN (1, 3, 7) THEN
                RAISE EXCEPTION 'Jadwal keberangkatan Jakarta ke Panawangan hanya diperbolehkan pada hari Senin, Rabu, dan Minggu';
            END IF;
        ELSIF v_origin = 'panawangan' AND v_destination = 'jakarta' THEN
            IF v_dow NOT IN (2, 4, 7) THEN
                RAISE EXCEPTION 'Jadwal keberangkatan Panawangan ke Jakarta hanya diperbolehkan pada hari Selasa, Kamis, dan Minggu';
            END IF;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
};
