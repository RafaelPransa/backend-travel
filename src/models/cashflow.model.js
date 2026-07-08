const db = require('../config/db');

const getAllCashflows = async (filter) => {
  let query = db('cashflows').orderBy('created_at', 'desc');

  if (filter === 'today') {
    query = query.whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE");
  } else if (filter === 'weekly') {
    query = query.where('created_at', '>=', db.raw("NOW() - INTERVAL '7 days'"));
  } else if (filter === 'monthly') {
    query = query.where('created_at', '>=', db.raw("NOW() - INTERVAL '30 days'"));
  } else if (filter === 'yearly') {
    query = query.where('created_at', '>=', db.raw("NOW() - INTERVAL '1 year'"));
  }

  return query;
};

const getSummary = async (filter, startDate, endDate) => {
  let queryIncome = db('cashflows').where('type', 'income');
  let queryExpense = db('cashflows').where('type', 'expense');
  let todayIncomeQuery = db('cashflows').where('type', 'income').whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE");
  let lastPeriodIncomeQuery = db('cashflows').where('type', 'income');
  let lastPeriodExpenseQuery = db('cashflows').where('type', 'expense');

  if (startDate && endDate) {
    const startDateStr = `${startDate} 00:00:00 +07:00`;
    const endDateStr = `${endDate} 23:59:59 +07:00`;
    queryIncome = queryIncome.whereBetween('created_at', [startDateStr, endDateStr]);
    queryExpense = queryExpense.whereBetween('created_at', [startDateStr, endDateStr]);

    // Calculate last period of same duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - diffDays);
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStartDateStr = `${prevStart.getFullYear()}-${String(prevStart.getMonth() + 1).padStart(2, '0')}-${String(prevStart.getDate()).padStart(2, '0')} 00:00:00 +07:00`;
    const prevEndDateStr = `${prevEnd.getFullYear()}-${String(prevEnd.getMonth() + 1).padStart(2, '0')}-${String(prevEnd.getDate()).padStart(2, '0')} 23:59:59 +07:00`;

    lastPeriodIncomeQuery = lastPeriodIncomeQuery.whereBetween('created_at', [prevStartDateStr, prevEndDateStr]);
    lastPeriodExpenseQuery = lastPeriodExpenseQuery.whereBetween('created_at', [prevStartDateStr, prevEndDateStr]);
  } else {
    if (filter === 'today') {
      queryIncome = queryIncome.whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE");
      queryExpense = queryExpense.whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE");
      lastPeriodIncomeQuery = lastPeriodIncomeQuery.whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE - INTERVAL '1 day'");
      lastPeriodExpenseQuery = lastPeriodExpenseQuery.whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE - INTERVAL '1 day'");
    } else if (filter === 'weekly') {
      queryIncome = queryIncome.whereRaw("DATE_TRUNC('week', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('week', CURRENT_DATE)");
      queryExpense = queryExpense.whereRaw("DATE_TRUNC('week', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('week', CURRENT_DATE)");
      lastPeriodIncomeQuery = lastPeriodIncomeQuery.whereRaw("DATE_TRUNC('week', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')");
      lastPeriodExpenseQuery = lastPeriodExpenseQuery.whereRaw("DATE_TRUNC('week', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')");
    } else if (filter === 'monthly') {
      queryIncome = queryIncome.whereRaw("DATE_TRUNC('month', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('month', CURRENT_DATE)");
      queryExpense = queryExpense.whereRaw("DATE_TRUNC('month', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('month', CURRENT_DATE)");
      lastPeriodIncomeQuery = lastPeriodIncomeQuery.whereRaw("DATE_TRUNC('month', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')");
      lastPeriodExpenseQuery = lastPeriodExpenseQuery.whereRaw("DATE_TRUNC('month', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')");
    } else if (filter === 'yearly') {
      queryIncome = queryIncome.whereRaw("DATE_TRUNC('year', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('year', CURRENT_DATE)");
      queryExpense = queryExpense.whereRaw("DATE_TRUNC('year', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('year', CURRENT_DATE)");
      lastPeriodIncomeQuery = lastPeriodIncomeQuery.whereRaw("DATE_TRUNC('year', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')");
      lastPeriodExpenseQuery = lastPeriodExpenseQuery.whereRaw("DATE_TRUNC('year', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')");
    }
  }

  const incomeResult = await queryIncome.sum('amount as total');
  const expenseResult = await queryExpense.sum('amount as total');
  const todayResult = await todayIncomeQuery.sum('amount as total');
  const lastPeriodResult = await lastPeriodIncomeQuery.sum('amount as total');
  const lastPeriodExpenseResult = await lastPeriodExpenseQuery.sum('amount as total');

  const totalIncome = parseFloat(incomeResult[0].total || 0);
  const totalExpense = parseFloat(expenseResult[0].total || 0);
  const todayIncome = parseFloat(todayResult[0].total || 0);
  const lastPeriodIncome = parseFloat(lastPeriodResult[0].total || 0);
  const lastPeriodExpense = parseFloat(lastPeriodExpenseResult[0].total || 0);
  const driverSalary = totalIncome * 0.4;

  return {
    totalIncome,
    totalExpense,
    todayIncome,
    lastPeriodIncome,
    lastPeriodExpense,
    driverSalary
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
    .leftJoin('routes', 'schedules.route_id', 'routes.id')
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
  return db.transaction(async (trx) => {
    const [updated] = await trx('operational_expenses')
      .where({ id })
      .update({ status })
      .returning('*');

    if (updated && status === 'approved') {
      const driver = await trx('users').where({ id: updated.driver_id }).first();
      const driverName = driver ? driver.name : 'Supir';

      await trx('cashflows').insert({
        amount: updated.amount,
        type: 'expense',
        category: updated.category,
        description: `Pengeluaran biaya ${updated.category} oleh ${driverName}: ${updated.description || '-'}`,
        reference_id: updated.id,
        created_at: updated.created_at
      });
    }

    return updated;
  });
};

const getPaginatedTransactions = async (page = 1, limit = 10, startDate, endDate) => {
  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 10;
  const offset = (parsedPage - 1) * parsedLimit;

  // Hitung total data
  let totalQuery = db('cashflows');
  let recordsQuery = db('cashflows');

  if (startDate && endDate) {
    const startDateStr = `${startDate} 00:00:00 +07:00`;
    const endDateStr = `${endDate} 23:59:59 +07:00`;
    totalQuery = totalQuery.whereBetween('created_at', [startDateStr, endDateStr]);
    recordsQuery = recordsQuery.whereBetween('created_at', [startDateStr, endDateStr]);
  }

  const totalResult = await totalQuery.count('id as total').first();
  const total = parseInt(totalResult.total || 0, 10);

  // Ambil data dengan limit dan offset
  const records = await recordsQuery
    .select(
      'cashflows.*',
      db.raw(`
        COALESCE(
          (SELECT payment_method::text FROM travel_bookings WHERE id = cashflows.reference_id AND cashflows.category = 'travel_ticket'),
          (SELECT payment_method::text FROM charter_bookings WHERE id = cashflows.reference_id AND cashflows.category = 'charter_booking'),
          (SELECT payment_method::text FROM package_shipments WHERE id = cashflows.reference_id AND cashflows.category = 'package_shipment'),
          '-'
        ) as payment_method
      `)
    )
    .orderBy('created_at', 'desc')
    .limit(parsedLimit)
    .offset(offset);

  const totalPages = Math.ceil(total / parsedLimit);

  return {
    data: records,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages
    }
  };
};

module.exports = {
  getAllCashflows,
  getSummary,
  addCashflow,
  getExpenses,
  updateExpenseStatus,
  getPaginatedTransactions
};
