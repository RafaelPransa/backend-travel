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
        -- [TAMBAHAN] Hapus record cashflow jika dibatalkan/ditolak
        IF NEW.booking_status IN ('dibatalkan', 'ditolak') AND (OLD.booking_status IS NULL OR OLD.booking_status NOT IN ('dibatalkan', 'ditolak')) THEN
            DELETE FROM cashflows WHERE reference_id = NEW.id AND category = 'travel_ticket';
        END IF;

        IF (NEW.payment_method = 'cashless' AND NEW.booking_status = 'dibayar' AND (OLD.booking_status IS NULL OR OLD.booking_status <> 'dibayar'))
           OR (NEW.payment_method = 'cash' AND NEW.booking_status = 'selesai' AND (OLD.booking_status IS NULL OR OLD.booking_status <> 'selesai')) THEN
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

  // 2. Charter Bookings Income Trigger
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_charter_booking_income()
    RETURNS TRIGGER AS $$
    DECLARE
        v_customer_name VARCHAR(100);
    BEGIN
        -- [TAMBAHAN] Hapus record cashflow jika dibatalkan/ditolak
        IF NEW.status IN ('dibatalkan', 'ditolak') AND (OLD.status IS NULL OR OLD.status NOT IN ('dibatalkan', 'ditolak')) THEN
            DELETE FROM cashflows WHERE reference_id = NEW.id AND category = 'charter_ticket';
        END IF;

        IF (NEW.payment_method = 'cashless' AND NEW.status = 'dibayar' AND (OLD.status IS NULL OR OLD.status <> 'dibayar'))
           OR (NEW.payment_method = 'cash' AND NEW.status = 'selesai' AND (OLD.status IS NULL OR OLD.status <> 'selesai')) THEN
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

  // 3. Package Shipments Income Trigger
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_package_shipment_income()
    RETURNS TRIGGER AS $$
    BEGIN
        -- [TAMBAHAN] Hapus record cashflow jika dibatalkan/ditolak
        IF NEW.status IN ('dibatalkan', 'ditolak', 'REJECTED') AND (OLD.status IS NULL OR OLD.status NOT IN ('dibatalkan', 'ditolak', 'REJECTED')) THEN
            DELETE FROM cashflows WHERE reference_id = NEW.id AND category = 'package_shipment';
        END IF;

        -- Perubahan: untuk cash, kita menggunakan NEW.status = 'delivered', untuk cashless NEW.transaction_status = 'dibayar'
        IF (NEW.payment_method = 'cashless' AND NEW.transaction_status = 'dibayar' AND (OLD.transaction_status IS NULL OR OLD.transaction_status <> 'dibayar'))
           OR (NEW.payment_method = 'cash' AND NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered')) THEN
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
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Revert back to previous triggers without cancellation logic and package 'delivered' logic
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_travel_booking_income()
    RETURNS TRIGGER AS $$
    DECLARE
        v_price DECIMAL(10,2);
        v_origin VARCHAR(50);
        v_destination VARCHAR(50);
        v_customer_name VARCHAR(100);
    BEGIN
        IF (NEW.payment_method = 'cashless' AND NEW.booking_status = 'dibayar' AND (OLD.booking_status IS NULL OR OLD.booking_status <> 'dibayar'))
           OR (NEW.payment_method = 'cash' AND NEW.booking_status = 'selesai' AND (OLD.booking_status IS NULL OR OLD.booking_status <> 'selesai')) THEN
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
    CREATE OR REPLACE FUNCTION log_charter_booking_income()
    RETURNS TRIGGER AS $$
    DECLARE
        v_customer_name VARCHAR(100);
    BEGIN
        IF (NEW.payment_method = 'cashless' AND NEW.status = 'dibayar' AND (OLD.status IS NULL OR OLD.status <> 'dibayar'))
           OR (NEW.payment_method = 'cash' AND NEW.status = 'selesai' AND (OLD.status IS NULL OR OLD.status <> 'selesai')) THEN
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
    CREATE OR REPLACE FUNCTION log_package_shipment_income()
    RETURNS TRIGGER AS $$
    BEGIN
        IF (NEW.payment_method = 'cashless' AND NEW.transaction_status = 'dibayar' AND (OLD.transaction_status IS NULL OR OLD.transaction_status <> 'dibayar'))
           OR (NEW.payment_method = 'cash' AND NEW.transaction_status = 'selesai' AND (OLD.transaction_status IS NULL OR OLD.transaction_status <> 'selesai')) THEN
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
};
