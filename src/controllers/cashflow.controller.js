const CashflowModel = require('../models/cashflow.model');

const getCashflowSummary = async (req, res) => {
  try {
    const summary = await CashflowModel.getSummary();
    const netProfit = summary.totalIncome - summary.totalExpense;

    return res.status(200).json({
      status: 'success',
      data: {
        total_income: summary.totalIncome,
        total_expense: summary.totalExpense,
        net_profit: netProfit
      }
    });
  } catch (error) {
    console.error('Error getCashflowSummary:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil ringkasan kas keuangan'
    });
  }
};

module.exports = {
  getCashflowSummary
};
