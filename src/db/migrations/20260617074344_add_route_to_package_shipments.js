/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Add route_id column to package_shipments referencing routes
  await knex.schema.alterTable('package_shipments', (table) => {
    table.uuid('route_id').references('id').inTable('routes').onDelete('SET NULL');
  });

  // 2. Update trigger function to dynamically calculate price based on routes.base_price
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

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // 1. Revert trigger function to original static Rp250.000 calculation
  await knex.raw(`
    CREATE OR REPLACE FUNCTION calculate_package_price()
    RETURNS TRIGGER AS $$
    DECLARE
        v_multiplier INT := 1;
    BEGIN
        IF (NEW.weight > 60.00) OR (NEW.dimension = 'super_besar') THEN
            v_multiplier := 2;
            NEW.is_double_charge := TRUE;
        ELSE
            NEW.is_double_charge := FALSE;
        END IF;
        NEW.total_price := NEW.seat_qty * 250000.00 * v_multiplier;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 2. Drop route_id column from package_shipments
  await knex.schema.alterTable('package_shipments', (table) => {
    table.dropColumn('route_id');
  });
};
