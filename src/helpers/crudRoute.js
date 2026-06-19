const { validate } = require('../middlewares/validation.middleware');
const masterController = require('../controllers/masterData.controller');

/**
 * Helper untuk registrasi rute CRUD master data secara generik.
 * Digunakan oleh masterData.routes.js dan cms.routes.js.
 * 
 * @param {object} router - Express Router instance
 * @param {string} path - Path endpoint (e.g. '/fleets')
 * @param {string} table - Nama tabel database
 * @param {object|null} schema - Zod schema validasi (opsional)
 */
const crudRoute = (router, path, table, schema) => {
  router.get(path, masterController.getRecords(table));
  if (schema) {
    router.post(path, validate(schema), masterController.createRecord(table));
    router.put(`${path}/:id`, validate(schema), masterController.updateRecord(table));
  } else {
    router.post(path, masterController.createRecord(table));
    router.put(`${path}/:id`, masterController.updateRecord(table));
  }
  router.delete(`${path}/:id`, masterController.deleteRecord(table));
};

module.exports = crudRoute;
