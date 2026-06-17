/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('package_shipments', (table) => {
    table.decimal('weight', 5, 2);
    table.string('dimension', 20);
    table.boolean('is_double_charge').defaultTo(false);
  });

  await knex.raw(`
    ALTER TABLE package_shipments 
    ADD CONSTRAINT package_shipments_dimension_check 
    CHECK (dimension IN ('kecil', 'sedang', 'besar', 'super_besar'))
  `);

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
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION calculate_package_price()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.total_price := NEW.seat_qty * 250000.00;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw("ALTER TABLE package_shipments DROP CONSTRAINT IF EXISTS package_shipments_dimension_check");

  await knex.schema.alterTable('package_shipments', (table) => {
    table.dropColumn('weight');
    table.dropColumn('dimension');
    table.dropColumn('is_double_charge');
  });
};
