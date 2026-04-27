import Payment from '../models/paymentModel.js';
import Resident from '../models/residentModel.js';

// @desc    Get all billing statuses (Admin only)
// @route   GET /api/payments/admin/all
export const getAdminPayments = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
    const currentYear = year || new Date().getFullYear();

    // 1. Ensure bills exist for all active residents for this month
    const residents = await Resident.find({ status: 'active' });
    const dueDate = new Date(currentYear, new Date().getMonth() + 1, 10); // 10th of next month

    for (const resi of residents) {
      const exists = await Payment.findOne({
        resident: resi._id,
        month: currentMonth,
        year: currentYear,
        type: 'Maintenance'
      });

      if (!exists) {
        await Payment.create({
          resident: resi._id,
          house_number: resi.house_number,
          title: `Maintenance - ${currentMonth}`,
          type: 'Maintenance',
          amount: 5000,
          dueDate,
          breakdown: [
            { label: 'Security & Staff', amount: 3000 },
            { label: 'Common Electricity', amount: 1500 },
            { label: 'Maintenance Fund', amount: 500 }
          ],
          status: 'due',
          month: currentMonth,
          year: currentYear
        });
      }
    }

    // Auto-update overdue status
    await Payment.updateMany(
      { status: 'due', dueDate: { $lt: new Date() } },
      { $set: { status: 'overdue' } }
    );

    const payments = await Payment.find({ month: currentMonth, year: currentYear })
      .populate('resident', 'full_name email house_number')
      .sort({ status: 1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching billing status', error: error.message });
  }
};

// @desc    Get personal billing history (Resident)
// @route   GET /api/payments/my
export const getMyPayments = async (req, res) => {
  try {
    // Auto-update overdue for THIS user before fetching
    await Payment.updateMany(
      { resident: req.user.id, status: 'due', dueDate: { $lt: new Date() } },
      { $set: { status: 'overdue' } }
    );

    const payments = await Payment.find({ resident: req.user.id })
      .sort({ year: -1, createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment history', error: error.message });
  }
};

// @desc    Update payment status (Admin)
// @route   PATCH /api/payments/:id/status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ message: 'Bill not found' });

    payment.status = status;
    if (status === 'paid') {
      payment.paidAt = Date.now();
      payment.paymentMethod = paymentMethod || payment.paymentMethod || 'Cash';
      payment.receiptId = payment.receiptId || `SS-${Date.now().toString().slice(-8)}`;
    } else {
      payment.paidAt = undefined;
      payment.paymentMethod = 'None';
      payment.receiptId = undefined;
    }

    await payment.save();
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment', error: error.message });
  }
};
// @desc    Submit payment proof (Resident)
// @route   POST /api/payments/:id/proof
export const submitPaymentProof = async (req, res) => {
  try {
    const { paymentMethod, receiptId } = req.body;
    const payment = await Payment.findOne({ _id: req.params.id, resident: req.user.id });

    if (!payment) return res.status(404).json({ message: 'Bill not found' });
    if (payment.status === 'paid') return res.status(400).json({ message: 'Bill is already paid' });

    payment.status = 'pending';
    payment.paymentMethod = paymentMethod;
    payment.receiptId = receiptId;
    payment.paidAt = Date.now();

    await payment.save();
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting proof', error: error.message });
  }
};
