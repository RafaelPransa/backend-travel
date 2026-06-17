/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Create promotions table
  await knex.schema.createTable('promotions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('tagline', 255).notNullable();
    table.text('description');
    table.string('image_url', 500);
    table.decimal('discount_percentage', 5, 2).notNullable().defaultTo(0);
    table.string('badge_label', 50);
    table.boolean('is_active').defaultTo(true);
    table.string('promo_type', 20).defaultTo('home');
    table.timestamps(true, true);
  });

  // 2. Alter travel_bookings table (add price, eta, promo_id)
  await knex.schema.alterTable('travel_bookings', (table) => {
    table.decimal('price', 10, 2);
    table.string('eta', 50);
    table.uuid('promo_id').references('id').inTable('promotions').onDelete('SET NULL');
  });

  // Update existing travel_bookings' price to a default of 250000.00
  await knex('travel_bookings').update({ price: 250000.00 });

  // Make price not nullable after setting default values
  await knex.schema.alterTable('travel_bookings', (table) => {
    table.decimal('price', 10, 2).notNullable().alter();
  });

  // 3. Alter schedules table (add driver_2_id)
  await knex.schema.alterTable('schedules', (table) => {
    table.uuid('driver_2_id').references('id').inTable('users').onDelete('SET NULL');
  });

  // 4. Update trigger function to use NEW.price instead of r.base_price
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_travel_booking_income()
    RETURNS TRIGGER AS $$
    DECLARE
        v_origin VARCHAR(50);
        v_destination VARCHAR(50);
        v_customer_name VARCHAR(100);
    BEGIN
        IF NEW.booking_status = 'selesai' AND (OLD.booking_status IS NULL OR OLD.booking_status <> 'selesai') THEN
            -- Get route info
            SELECT r.origin, r.destination INTO v_origin, v_destination
            FROM schedules s
            JOIN routes r ON s.route_id = r.id
            WHERE s.id = NEW.schedule_id;

            -- Get customer name
            SELECT name INTO v_customer_name FROM users WHERE id = NEW.user_id;

            INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
            VALUES (
                NEW.price, -- Menggunakan harga tiket aktual dari kolom price
                'income',
                'travel_ticket',
                'Pendapatan tiket travel regular (' || v_origin || ' -> ' || v_destination || ') - Penumpang: ' || v_customer_name || ' (Kursi ' || NEW.seat_number || ')',
                NEW.id,
                NOW()
            );
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
  // 1. Revert trigger function to use r.base_price
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_travel_booking_income()
    RETURNS TRIGGER AS $$
    DECLARE
        v_price DECIMAL(10,2);
        v_origin VARCHAR(50);
        v_destination VARCHAR(50);
        v_customer_name VARCHAR(100);
    BEGIN
        IF NEW.booking_status = 'selesai' AND (OLD.booking_status IS NULL OR OLD.booking_status <> 'selesai') THEN
            -- Get route info and price
            SELECT r.base_price, r.origin, r.destination INTO v_price, v_origin, v_destination
            FROM schedules s
            JOIN routes r ON s.route_id = r.id
            WHERE s.id = NEW.schedule_id;

            -- Get customer name
            SELECT name INTO v_customer_name FROM users WHERE id = NEW.user_id;

            INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
            VALUES (
                v_price,
                'income',
                'travel_ticket',
                'Pendapatan tiket travel regular (' || v_origin || ' -> ' || v_destination || ') - Penumpang: ' || v_customer_name || ' (Kursi ' || NEW.seat_number || ')',
                NEW.id,
                NOW()
            );
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 2. Drop driver_2_id from schedules
  await knex.schema.alterTable('schedules', (table) => {
    table.dropColumn('driver_2_id');
  });

  // 3. Drop columns from travel_bookings
  await knex.schema.alterTable('travel_bookings', (table) => {
    table.dropColumn('promo_id');
    table.dropColumn('eta');
    table.dropColumn('price');
  });

  // 4. Drop promotions table
  await knex.schema.dropTableIfExists('promotions');
};
