/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_package_shipment_income()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.transaction_status = 'selesai' AND (OLD.transaction_status IS NULL OR OLD.transaction_status <> 'selesai') THEN
            INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
            VALUES (
                COALESCE(NEW.original_price, 0),
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
  await knex.raw(`
    CREATE OR REPLACE FUNCTION log_package_shipment_income()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.transaction_status = 'selesai' AND (OLD.transaction_status IS NULL OR OLD.transaction_status <> 'selesai') THEN
            INSERT INTO cashflows (amount, type, category, description, reference_id, created_at)
            VALUES (
                COALESCE(NEW.total_price, NEW.original_price, 0),
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
