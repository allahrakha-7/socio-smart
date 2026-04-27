import Staff from '../models/staffModel.js';
import Complaint from '../models/complaintModel.js';
import Resident from '../models/residentModel.js';
import GateLog from '../models/gateLogModel.js';
import Alert from '../models/alertModel.js';

// @desc    Get operational summary report data
// @route   GET /api/reports/summary
// @access  Private/Admin
export const getOpsSummary = async (req, res) => {
  try {
    console.log('[REPORTS] Aggregating operational stats for:', req.user?.id);
    
    // Perform essential counts
    const [totalStaff, totalComplaints, resolvedComplaints, totalResidents, totalGateLogs, totalAlerts] = await Promise.all([
      Staff.countDocuments().catch(() => 0),
      Complaint.countDocuments().catch(() => 0),
      Complaint.countDocuments({ status: 'resolved' }).catch(() => 0),
      Resident.countDocuments().catch(() => 0),
      GateLog.countDocuments().catch(() => 0),
      Alert.countDocuments().catch(() => 0)
    ]);

    console.log(`[REPORTS] Found: ${totalStaff} Staff, ${totalResidents} Residents`);

    // Mock financial logic based on counts
    const revenueValue = totalResidents * 5000;
    const expensesValue = totalStaff * 25000;

    const data = {
      id: `REP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      title: 'Operations & Financial Summary',
      period: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
      generatedOn: new Intl.DateTimeFormat('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }).format(new Date()),
      generatedBy: 'Admin Authority',
      metrics: {
        revenue: `₨ ${revenueValue.toLocaleString()}`,
        expenses: `₨ ${expensesValue.toLocaleString()}`,
        complaints: totalComplaints,
        resolved: resolvedComplaints,
        gateLogs: totalGateLogs,
        emergencyAlerts: totalAlerts
      },
      expenseBreakdown: [
        {
          id: '1',
          category: 'Staff Salaries',
          amount: `₨ ${expensesValue.toLocaleString()}`,
          percentage: 70,
          color: '#2563EB'
        },
        {
          id: '2',
          category: 'Maintenance & Repairs',
          amount: `₨ ${(expensesValue * 0.2).toLocaleString()}`,
          percentage: 20,
          color: '#EA580C'
        },
        {
          id: '3',
          category: 'Operations',
          amount: `₨ ${(expensesValue * 0.1).toLocaleString()}`,
          percentage: 10,
          color: '#10B981'
        }
      ]
    };

    res.json(data);
  } catch (error) {
    console.error('[REPORTS ERROR]:', error);
    res.status(500).json({ message: 'Error generating ops summary', error: error.message });
  }
};
