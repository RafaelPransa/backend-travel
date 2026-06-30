/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Alter Table Columns to increase precision from (10,2) to (15,2)
  await knex.raw(`ALTER TABLE routes ALTER COLUMN base_price TYPE DECIMAL(15,2);`);
  await knex.raw(`ALTER TABLE travel_bookings ALTER COLUMN price TYPE DECIMAL(15,2);`);
  await knex.raw(`ALTER TABLE travel_bookings ALTER COLUMN original_price TYPE DECIMAL(15,2);`);
  await knex.raw(`ALTER TABLE travel_bookings ALTER COLUMN discount_amount TYPE DECIMAL(15,2);`);
  await knex.raw(`ALTER TABLE charter_bookings ALTER COLUMN offered_price TYPE DECIMAL(15,2);`);
  await knex.raw(`ALTER TABLE charter_bookings ALTER COLUMN original_price TYPE DECIMAL(15,2);`);
  await knex.raw(`ALTER TABLE charter_bookings ALTER COLUMN discount_amount TYPE DECIMAL(15,2);`);
  await knex.raw(`ALTER TABLE package_shipments ALTER COLUMN original_price TYPE DECIMAL(15,2);`);
  await knex.raw(`ALTER TABLE package_shipments ALTER COLUMN discount_amount TYPE DECIMAL(15,2);`);
  await knex.raw(`ALTER TABLE cashflows ALTER COLUMN amount TYPE DECIMAL(15,2);`);
  
  // check if operational_expenses exists
  const hasOpExp = await knex.schema.hasTable('operational_expenses');
  if (hasOpExp) {
    await knex.raw(`ALTER TABLE operational_expenses ALTER COLUMN amount TYPE DECIMAL(15,2);`);
  }

  // 2. Update Triggers to use DECIMAL(15,2)
  // Travel Booking Income
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_travel_booking_income()
    RETURNS TRIGGER AS $$
    DECLARE
        v_price DECIMAL(15,2);
        v_origin VARCHAR(50);
        v_destination VARCHAR(50);
        v_customer_name VARCHAR(100);
    BEGIN
        IF NEW.booking_status IN ('dibatalkan', 'ditolak') AND (OLD.booking_status IS NULL OR OLD.booking_status NOT IN ('dibatalkan', 'ditolak')) THEN
            DELETE FROM cashflows WHERE reference_id = NEW.id AND category = 'travel_ticket';
        END IF;

        IF (NEW.payment_method = 'cashless' AND NEW.booking_status = 'dibayar' AND (OLD.booking_status IS NULL OR OLD.booking_status <> 'dibayar'))
           OR (NEW.payment_method = 'cash' AND NEW.booking_status = 'selesai' AND (OLD.booking_status IS NULL OR OLD.booking_status <> 'selesai')) THEN
            SELECT r.base_price, r.origin, r.destination INTO v_price, v_origin, v_destination
            FROM schedules s
            JOIN routes r ON s.route_id = r.id
            WHERE s.id = NEW.schedule_id;

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

  // Driver Salary Expense
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_driver_salary_expense()
    RETURNS TRIGGER AS $$
    DECLARE
        v_total_revenue DECIMAL(15, 2) := 0;
        v_driver_name_1 VARCHAR(100);
        v_driver_name_2 VARCHAR(100);
    BEGIN
        IF TG_OP = 'UPDATE' THEN
            IF NEW.status = 'completed' THEN
                DELETE FROM cashflows WHERE reference_id = NEW.id AND category = 'driver_salary';

                SELECT COALESCE(SUM(price), 0) INTO v_total_revenue
                FROM travel_bookings
                WHERE schedule_id = NEW.id AND booking_status = 'selesai';

                IF v_total_revenue > 0 THEN
                    IF NEW.driver_id IS NOT NULL AND NEW.driver_2_id IS NOT NULL THEN
                        SELECT name INTO v_driver_name_1 FROM users WHERE id = NEW.driver_id;
                        SELECT name INTO v_driver_name_2 FROM users WHERE id = NEW.driver_2_id;

                        INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
                        VALUES (
                            v_total_revenue * 0.20,
                            'expense',
                            'driver_salary',
                            'Gaji supir utama (' || COALESCE(v_driver_name_1, 'Supir Utama') || ') untuk jadwal travel ' || NEW.id,
                            NEW.id,
                            NOW()
                        );

                        INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
                        VALUES (
                            v_total_revenue * 0.20,
                            'expense',
                            'driver_salary',
                            'Gaji supir cadangan (' || COALESCE(v_driver_name_2, 'Supir Cadangan') || ') untuk jadwal travel ' || NEW.id,
                            NEW.id,
                            NOW()
                        );
                    ELSIF NEW.driver_id IS NOT NULL THEN
                        SELECT name INTO v_driver_name_1 FROM users WHERE id = NEW.driver_id;

                        INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
                        VALUES (
                            v_total_revenue * 0.40,
                            'expense',
                            'driver_salary',
                            'Gaji supir (' || COALESCE(v_driver_name_1, 'Supir') || ') untuk jadwal travel ' || NEW.id,
                            NEW.id,
                            NOW()
                        );
                    ELSIF NEW.driver_2_id IS NOT NULL THEN
                        SELECT name INTO v_driver_name_2 FROM users WHERE id = NEW.driver_2_id;

                        INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
                        VALUES (
                            v_total_revenue * 0.40,
                            'expense',
                            'driver_salary',
                            'Gaji supir (' || COALESCE(v_driver_name_2, 'Supir') || ') untuk jadwal travel ' || NEW.id,
                            NEW.id,
                            NOW()
                        );
                    END IF;
                END IF;
            ELSIF OLD.status = 'completed' AND NEW.status <> 'completed' THEN
                DELETE FROM cashflows WHERE reference_id = NEW.id AND category = 'driver_salary';
            END IF;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            DELETE FROM cashflows WHERE reference_id = OLD.id AND category = 'driver_salary';
            RETURN OLD;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Institutional Expense
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_institutional_expense()
    RETURNS TRIGGER AS $$
    DECLARE
        v_total_revenue DECIMAL(15, 2) := 0;
    BEGIN
        IF TG_OP = 'UPDATE' THEN
            IF NEW.status = 'completed' THEN
                DELETE FROM cashflows WHERE reference_id = NEW.id AND category = 'institutional_fee';

                SELECT COALESCE(SUM(price), 0) INTO v_total_revenue
                FROM travel_bookings
                WHERE schedule_id = NEW.id AND booking_status = 'selesai';

                IF v_total_revenue > 0 THEN
                    INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
                    VALUES (
                        v_total_revenue * 0.15,
                        'expense',
                        'institutional_fee',
                        'Potongan instansi (15%) dari jadwal travel ' || NEW.id,
                        NEW.id,
                        NOW()
                    );
                END IF;
            ELSIF OLD.status = 'completed' AND NEW.status <> 'completed' THEN
                DELETE FROM cashflows WHERE reference_id = NEW.id AND category = 'institutional_fee';
            END IF;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            DELETE FROM cashflows WHERE reference_id = OLD.id AND category = 'institutional_fee';
            RETURN OLD;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Not rolling back to 10,2 to avoid silent truncation data loss
};
