const db = require('../config/db');

const getAllCashflows = async () => {
  return db('cashflows').orderBy('transaction_date', 'desc');
};

const getSummary = async () => {
  const incomeResult = await db('cashflows')
    .where('type', 'income')
    .sum('amount as total');
    
  const expenseResult = await db('cashflows')
    .where('type', 'expense')
    .sum('amount as total');

  const totalIncome = parseFloat(incomeResult[0].total || 0);
  const totalExpense = parseFloat(expenseResult[0].total || 0);

  return {
    totalIncome,
    totalExpense
  };
};

module.exports = {
  getAllCashflows,
  getSummary
};
