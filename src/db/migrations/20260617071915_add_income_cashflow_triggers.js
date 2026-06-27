/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Travel Bookings Income Trigger
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

  await knex.raw(`
    CREATE TRIGGER trg_travel_booking_income
    AFTER UPDATE ON travel_bookings
    FOR EACH ROW
    EXECUTE FUNCTION log_travel_booking_income();
  `);

  // 2. Charter Bookings Income Trigger
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_charter_booking_income()
    RETURNS TRIGGER AS $$
    DECLARE
        v_customer_name VARCHAR(100);
    BEGIN
        IF NEW.status = 'selesai' AND (OLD.status IS NULL OR OLD.status <> 'selesai') THEN
            SELECT name INTO v_customer_name FROM users WHERE id = NEW.user_id;

            INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
            VALUES (
                NEW.offered_price,
                'income',
                'charter_ticket',
                'Pendapatan sewa charter pariwisata (' || NEW.car_type || ') ke ' || NEW.destination || ' - Penyewa: ' || v_customer_name,
                NEW.id,
                NOW()
            );
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_charter_booking_income
    AFTER UPDATE ON charter_bookings
    FOR EACH ROW
    EXECUTE FUNCTION log_charter_booking_income();
  `);

  // 3. Package Shipments Income Trigger
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_package_shipment_income()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.transaction_status = 'selesai' AND (OLD.transaction_status IS NULL OR OLD.transaction_status <> 'selesai') THEN
            INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
            VALUES (
                NEW.original_price,
                'income',
                'package_shipment',
                'Pendapatan pengiriman paket (Resi: ' || NEW.waybill_number || ') - Pengirim: ' || NEW.sender_name || ', Penerima: ' || NEW.receiver_name,
                NEW.id,
                NOW()
            );
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_package_shipment_income
    AFTER UPDATE ON package_shipments
    FOR EACH ROW
    EXECUTE FUNCTION log_package_shipment_income();
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(`DROP TRIGGER IF EXISTS trg_travel_booking_income ON travel_bookings;`);
  await knex.raw(`DROP FUNCTION IF EXISTS log_travel_booking_income();`);

  await knex.raw(`DROP TRIGGER IF EXISTS trg_charter_booking_income ON charter_bookings;`);
  await knex.raw(`DROP FUNCTION IF EXISTS log_charter_booking_income();`);

  await knex.raw(`DROP TRIGGER IF EXISTS trg_package_shipment_income ON package_shipments;`);
  await knex.raw(`DROP FUNCTION IF EXISTS log_package_shipment_income();`);
};
