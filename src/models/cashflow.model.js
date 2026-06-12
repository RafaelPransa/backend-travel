const db = require('../config/db');

const getAllCashflows = async (filter) => {
  let query = db('cashflows').orderBy('created_at', 'desc');
  
  if (filter === 'weekly') {
    query = query.where('created_at', '>=', db.raw("NOW() - INTERVAL '7 days'"));
  } else if (filter === 'monthly') {
    query = query.where('created_at', '>=', db.raw("NOW() - INTERVAL '30 days'"));
  } else if (filter === 'yearly') {
    query = query.where('created_at', '>=', db.raw("NOW() - INTERVAL '1 year'"));
  }
  
  return query;
};

const getSummary = async (filter) => {
  let queryIncome = db('cashflows').where('type', 'income');
  let queryExpense = db('cashflows').where('type', 'expense');

  if (filter === 'weekly') {
    queryIncome = queryIncome.where('created_at', '>=', db.raw("NOW() - INTERVAL '7 days'"));
    queryExpense = queryExpense.where('created_at', '>=', db.raw("NOW() - INTERVAL '7 days'"));
  } else if (filter === 'monthly') {
    queryIncome = queryIncome.where('created_at', '>=', db.raw("NOW() - INTERVAL '30 days'"));
    queryExpense = queryExpense.where('created_at', '>=', db.raw("NOW() - INTERVAL '30 days'"));
  } else if (filter === 'yearly') {
    queryIncome = queryIncome.where('created_at', '>=', db.raw("NOW() - INTERVAL '1 year'"));
    queryExpense = queryExpense.where('created_at', '>=', db.raw("NOW() - INTERVAL '1 year'"));
  }

  const incomeResult = await queryIncome.sum('amount as total');
  const expenseResult = await queryExpense.sum('amount as total');

  const totalIncome = parseFloat(incomeResult[0].total || 0);
  const totalExpense = parseFloat(expenseResult[0].total || 0);

  return {
    totalIncome,
    totalExpense
  };
};

const addCashflow = async (data) => {
  const [record] = await db('cashflows').insert(data).returning('*');
  return record;
};

// operational expenses methods
const getExpenses = async (status) => {
  let query = db('operational_expenses')
    .join('users', 'operational_expenses.driver_id', 'users.id')
    .join('schedules', 'operational_expenses.schedule_id', 'schedules.id')
    .join('routes', 'schedules.route_id', 'routes.id')
    .select(
      'operational_expenses.*',
      'users.name as driver_name',
      'schedules.departure_time',
      'routes.origin',
      'routes.destination'
    )
    .orderBy('operational_expenses.created_at', 'desc');

  if (status) {
    query = query.where('operational_expenses.status', status);
  }

  return query;
};

const updateExpenseStatus = async (id, status) => {
  const [updated] = await db('operational_expenses')
    .where({ id })
    .update({ status })
    .returning('*');
  return updated;
};

module.exports = {
  getAllCashflows,
  getSummary,
  addCashflow,
  getExpenses,
  updateExpenseStatus
};
