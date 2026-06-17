/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Create institutional_expenses table
  await knex.schema.createTable('institutional_expenses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('expense_type', 50).notNullable(); // 'nib' or 'pajak_kendaraan'
    table.uuid('fleet_id').references('id').inTable('fleets').onDelete('SET NULL');
    table.decimal('amount', 10, 2).notNullable();
    table.date('payment_date').notNullable();
    table.date('next_payment_date');
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.check(`expense_type IN ('nib', 'pajak_kendaraan')`, [], 'chk_institutional_expense_type');
    table.check('amount >= 0', [], 'chk_institutional_expense_amount');
  });

  // 2. Trigger for automatically calculating next_payment_date
  await knex.raw(`
    CREATE OR REPLACE FUNCTION calculate_institutional_next_payment_date()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.expense_type = 'nib' THEN
            NEW.next_payment_date := NEW.payment_date + INTERVAL '5 years';
        ELSIF NEW.expense_type = 'pajak_kendaraan' THEN
            NEW.next_payment_date := NEW.payment_date + INTERVAL '1 year';
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_calculate_next_payment_date
    BEFORE INSERT OR UPDATE ON institutional_expenses
    FOR EACH ROW
    EXECUTE FUNCTION calculate_institutional_next_payment_date();
  `);

  // 3. Trigger for automatically logging institutional expenses to cashflows
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_institutional_expense_cashflow()
    RETURNS TRIGGER AS $$
    DECLARE
        v_desc TEXT;
        v_plate VARCHAR(15);
    BEGIN
        IF TG_OP = 'INSERT' THEN
            IF NEW.expense_type = 'nib' THEN
                v_desc := 'Pengeluaran Instansi (NIB) - ' || COALESCE(NEW.description, '');
            ELSIF NEW.expense_type = 'pajak_kendaraan' THEN
                IF NEW.fleet_id IS NOT NULL THEN
                    SELECT plate_number INTO v_plate FROM fleets WHERE id = NEW.fleet_id;
                END IF;
                IF v_plate IS NOT NULL THEN
                    v_desc := 'Pengeluaran Pajak Kendaraan (' || v_plate || ') - ' || COALESCE(NEW.description, '');
                ELSE
                    v_desc := 'Pengeluaran Pajak Kendaraan - ' || COALESCE(NEW.description, '');
                END IF;
            ELSE
                v_desc := 'Pengeluaran Instansi - ' || COALESCE(NEW.description, '');
            END IF;

            INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
            VALUES (
                NEW.amount,
                'expense',
                'institutional_expense',
                v_desc,
                NEW.id,
                NEW.created_at
            );
            RETURN NEW;

        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.expense_type = 'nib' THEN
                v_desc := 'Pengeluaran Instansi (NIB) - ' || COALESCE(NEW.description, '');
            ELSIF NEW.expense_type = 'pajak_kendaraan' THEN
                IF NEW.fleet_id IS NOT NULL THEN
                    SELECT plate_number INTO v_plate FROM fleets WHERE id = NEW.fleet_id;
                END IF;
                IF v_plate IS NOT NULL THEN
                    v_desc := 'Pengeluaran Pajak Kendaraan (' || v_plate || ') - ' || COALESCE(NEW.description, '');
                ELSE
                    v_desc := 'Pengeluaran Pajak Kendaraan - ' || COALESCE(NEW.description, '');
                END IF;
            ELSE
                v_desc := 'Pengeluaran Instansi - ' || COALESCE(NEW.description, '');
            END IF;

            UPDATE cashflows
            SET amount = NEW.amount,
                description = v_desc,
                created_at = NEW.created_at
            WHERE reference_id = NEW.id AND type = 'expense' AND category = 'institutional_expense';
            RETURN NEW;

        ELSIF TG_OP = 'DELETE' THEN
            DELETE FROM cashflows
            WHERE reference_id = OLD.id AND type = 'expense' AND category = 'institutional_expense';
            RETURN OLD;
        END IF;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_log_institutional_expense_cashflow
    AFTER INSERT OR UPDATE OR DELETE ON institutional_expenses
    FOR EACH ROW
    EXECUTE FUNCTION log_institutional_expense_cashflow();
  `);

  // 4. Trigger for automatically calculating and logging driver salary (40%) when schedule is completed
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_driver_salary_expense()
    RETURNS TRIGGER AS $$
    DECLARE
        v_total_revenue DECIMAL(10, 2) := 0;
        v_driver_name_1 VARCHAR(100);
        v_driver_name_2 VARCHAR(100);
    BEGIN
        IF TG_OP = 'UPDATE' THEN
            IF NEW.status = 'completed' THEN
                -- Clean up existing entries first to avoid duplicates/re-runs
                DELETE FROM cashflows WHERE reference_id = NEW.id AND category = 'driver_salary';

                -- Calculate total revenue from travel_bookings
                SELECT COALESCE(SUM(price), 0) INTO v_total_revenue
                FROM travel_bookings
                WHERE schedule_id = NEW.id AND booking_status = 'selesai';

                IF v_total_revenue > 0 THEN
                    -- Check if both drivers are assigned
                    IF NEW.driver_id IS NOT NULL AND NEW.driver_2_id IS NOT NULL THEN
                        -- Split equally (20% each)
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
                        -- Single driver gets 40%
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
                        -- Single driver 2 gets 40%
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
                -- If status changed back from completed, remove the salaries
                DELETE FROM cashflows WHERE reference_id = NEW.id AND category = 'driver_salary';
            END IF;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            -- Delete salaries when schedule is deleted
            DELETE FROM cashflows WHERE reference_id = OLD.id AND category = 'driver_salary';
            RETURN OLD;
        END IF;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_log_driver_salary_expense
    AFTER UPDATE OR DELETE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION log_driver_salary_expense();
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop schedules trigger & function
  await knex.raw(`DROP TRIGGER IF EXISTS trg_log_driver_salary_expense ON schedules;`);
  await knex.raw(`DROP FUNCTION IF EXISTS log_driver_salary_expense();`);

  // Drop institutional_expenses triggers & functions
  await knex.raw(`DROP TRIGGER IF EXISTS trg_log_institutional_expense_cashflow ON institutional_expenses;`);
  await knex.raw(`DROP FUNCTION IF EXISTS log_institutional_expense_cashflow();`);

  await knex.raw(`DROP TRIGGER IF EXISTS trg_calculate_next_payment_date ON institutional_expenses;`);
  await knex.raw(`DROP FUNCTION IF EXISTS calculate_institutional_next_payment_date();`);

  // Drop institutional_expenses table
  await knex.schema.dropTableIfExists('institutional_expenses');
};
