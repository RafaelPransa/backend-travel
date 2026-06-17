/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION calculate_package_price()
    RETURNS TRIGGER AS $$
    DECLARE
        v_multiplier INT := 1;
        v_base_price DECIMAL(10, 2) := 250000.00; -- Default fallback
        v_calculated_price DECIMAL(10, 2);
    BEGIN
        -- Tentukan multiplier berdasarkan berat (>60kg) atau dimensi (super_besar)
        IF (NEW.weight > 60.00) OR (NEW.dimension = 'super_besar') THEN
            v_multiplier := 2;
            NEW.is_double_charge := TRUE;
        ELSE
            NEW.is_double_charge := FALSE;
        END IF;

        -- Jika route_id terisi, ambil base_price dari rute tersebut
        IF NEW.route_id IS NOT NULL THEN
            SELECT base_price INTO v_base_price FROM routes WHERE id = NEW.route_id;
            IF v_base_price IS NULL THEN
                v_base_price := 250000.00;
            END IF;
        END IF;

        -- Hitung harga dasar otomatis
        v_calculated_price := NEW.seat_qty * v_base_price * v_multiplier;

        -- Jika total_price kosong atau kurang dari v_calculated_price, gunakan v_calculated_price.
        -- Jika total_price lebih besar dari v_calculated_price, pertahankan nilainya (misal untuk tujuan yang melebihi rute).
        IF NEW.total_price IS NULL OR NEW.total_price < v_calculated_price THEN
            NEW.total_price := v_calculated_price;
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
    CREATE OR REPLACE FUNCTION calculate_package_price()
    RETURNS TRIGGER AS $$
    DECLARE
        v_multiplier INT := 1;
        v_base_price DECIMAL(10, 2) := 250000.00; -- Default fallback
    BEGIN
        -- Tentukan multiplier berdasarkan berat (>60kg) atau dimensi (super_besar)
        IF (NEW.weight > 60.00) OR (NEW.dimension = 'super_besar') THEN
            v_multiplier := 2;
            NEW.is_double_charge := TRUE;
        ELSE
            NEW.is_double_charge := FALSE;
        END IF;

        -- Jika route_id terisi, ambil base_price dari rute tersebut
        IF NEW.route_id IS NOT NULL THEN
            SELECT base_price INTO v_base_price FROM routes WHERE id = NEW.route_id;
            IF v_base_price IS NULL THEN
                v_base_price := 250000.00;
            END IF;
        END IF;

        NEW.total_price := NEW.seat_qty * v_base_price * v_multiplier;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
  `);
};
