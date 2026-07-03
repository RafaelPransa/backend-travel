const CashflowModel = require('../models/cashflow.model');

const getCashflowSummary = async (req, res) => {
  try {
    const { filter } = req.query; // 'weekly', 'monthly', 'yearly'
    const summary = await CashflowModel.getSummary(filter);
    const netProfit = summary.totalIncome - summary.totalExpense;

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil ringkasan kas keuangan',
      data: {
        total_income: summary.totalIncome,
        total_expense: summary.totalExpense,
        today_income: summary.todayIncome,
        last_month_income: summary.lastPeriodIncome,
        last_month_expense: summary.lastPeriodExpense,
        driver_salary: summary.driverSalary,
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

const addExpense = async (req, res) => {
  try {
    const { amount, type, detail, date, pic } = req.body;
    let proof_url = null;
    
    if (req.file) {
      proof_url = `/uploads/expenses/${req.file.filename}`;
    }

    const expenseData = {
      amount,
      type: 'expense',
      category: type,
      description: detail || '',
      pic: pic || null,
      proof_url
    };

    if (date) {
      expenseData.created_at = new Date(date).toISOString();
    }

    const newExpense = await CashflowModel.addCashflow(expenseData);

    return res.status(201).json({
      status: 'success',
      message: 'Pengeluaran operasional berhasil dicatat',
      data: newExpense
    });
  } catch (error) {
    console.error('Error addExpense:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mencatat pengeluaran operasional'
    });
  }
};

// ============================================================================
// ADMIN OPERATIONAL EXPENSES APPROVAL SYSTEM
// ============================================================================

const getDriverExpenses = async (req, res) => {
  try {
    const { status } = req.query; // 'pending', 'approved', 'rejected'
    const expenses = await CashflowModel.getExpenses(status);

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil data pengeluaran operasional supir',
      data: expenses
    });
  } catch (error) {
    console.error('Error getDriverExpenses:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data pengeluaran operasional supir'
    });
  }
};

const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' atau 'rejected'

    const updated = await CashflowModel.updateExpenseStatus(id, status);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Data pengeluaran operasional tidak ditemukan'
      });
    }

    const actionText = status === 'approved' ? 'disetujui' : 'ditolak';

    return res.status(200).json({
      status: 'success',
      message: `Pengeluaran operasional supir berhasil ${actionText}`,
      data: updated
    });
  } catch (error) {
    console.error('Error approveExpense:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status persetujuan pengeluaran operasional'
    });
  }
};

const getRecentTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await CashflowModel.getPaginatedTransactions(page, limit);

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil data transaksi cashflow',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error getRecentTransactions:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data transaksi cashflow'
    });
  }
};

module.exports = {
  getCashflowSummary,
  addExpense,
  getDriverExpenses,
  approveExpense,
  getRecentTransactions
};
