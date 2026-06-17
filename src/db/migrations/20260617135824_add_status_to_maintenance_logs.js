/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Tambah kolom status dan check constraint
  await knex.schema.alterTable('maintenance_logs', (table) => {
    table.string('status', 20).defaultTo('pending').notNullable();
    table.check("status IN ('pending', 'approved', 'rejected')", [], 'chk_maintenance_status');
  });

  // 2. Drop trigger lama dan function lama
  await knex.raw('DROP TRIGGER IF EXISTS trg_maintenance_expense ON maintenance_logs;');
  await knex.raw('DROP FUNCTION IF EXISTS log_maintenance_expense();');

  // 3. Buat function trigger baru yang memvalidasi status = approved
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_maintenance_expense()
    RETURNS TRIGGER AS $$
    DECLARE
        v_plate_number VARCHAR(15);
        v_car_type VARCHAR(50);
    BEGIN
        -- Hanya catat di cashflow jika statusnya berubah dari non-approved menjadi approved
        IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
            SELECT plate_number, car_type INTO v_plate_number, v_car_type
            FROM fleets
            WHERE id = NEW.fleet_id;

            IF NOT FOUND THEN
                v_plate_number := 'Tidak Diketahui';
                v_car_type := 'Armada';
            END IF;

            -- Memasukkan data transaksi kas keluar secara otomatis
            INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
            VALUES (
                NEW.cost,
                'expense',
                'service',
                'Biaya servis armada ' || v_car_type || ' [' || v_plate_number || ']: ' || NEW.description,
                NEW.id,
                NEW.created_at
            );
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
  `);

  // 4. Re-create trigger untuk AFTER INSERT OR UPDATE
  await knex.raw(`
    CREATE TRIGGER trg_maintenance_expense
    AFTER INSERT OR UPDATE ON maintenance_logs
    FOR EACH ROW
    EXECUTE FUNCTION log_maintenance_expense();
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // 1. Drop trigger dan function
  await knex.raw('DROP TRIGGER IF EXISTS trg_maintenance_expense ON maintenance_logs;');
  await knex.raw('DROP FUNCTION IF EXISTS log_maintenance_expense();');

  // 2. Revert function trigger ke versi lama (selalu catat saat INSERT)
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_maintenance_expense()
    RETURNS TRIGGER AS $$
    DECLARE
        v_plate_number VARCHAR(15);
        v_car_type VARCHAR(50);
    BEGIN
        SELECT plate_number, car_type INTO v_plate_number, v_car_type
        FROM fleets
        WHERE id = NEW.fleet_id;

        IF NOT FOUND THEN
            v_plate_number := 'Tidak Diketahui';
            v_car_type := 'Armada';
        END IF;

        -- Memasukkan data transaksi kas keluar secara otomatis
        INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
        VALUES (
            NEW.cost,
            'expense',
            'service',
            'Biaya servis armada ' || v_car_type || ' [' || v_plate_number || ']: ' || NEW.description,
            NEW.id,
            NEW.created_at
        );

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 3. Re-create trigger versi lama (AFTER INSERT)
  await knex.raw(`
    CREATE TRIGGER trg_maintenance_expense
    AFTER INSERT ON maintenance_logs
    FOR EACH ROW
    EXECUTE FUNCTION log_maintenance_expense();
  `);

  // 4. Drop kolom status
  await knex.schema.alterTable('maintenance_logs', (table) => {
    table.dropColumn('status');
  });
};
