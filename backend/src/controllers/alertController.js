import Alert from '../models/alertModel.js';
import Resident from '../models/residentModel.js';
import mqttService from '../utils/mqttService.js';
import { getCurrentGuardObj } from './rosterController.js';

export const triggerSOS = async (req, res) => {
  try {
    const resident = await Resident.findById(req.user.id);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    const alert = await Alert.create({
      type: 'SOS',
      sender: req.user.id,
      senderModel: 'Resident',
      title: 'EMERGENCY SOS',
      description: `Panic alarm triggered by ${resident.full_name}. Please respond immediately.`,
      location: resident.house_number || 'Unknown Unit',
      status: 'active'
    });

    // 0. Find current guard on duty
    const currentGuard = await getCurrentGuardObj();
    const guardId = currentGuard?.staff?._id;

    // 1. Notify Guard and Admin Dashboards via Socket (Zero Latency)
    const io = req.app.get('io');
    if (io) {
      const payload = {
        id: alert._id,
        sender: resident.full_name,
        location: alert.location,
        time: alert.createdAt,
        routedTo: guardId
      };
      
      // Emit to a specific guard room if they joined one, or globally with routedTo flag
      if (guardId) {
        io.to(`guard_${guardId}`).emit('emergency_alert', payload);
      }
      
      // Admin dashboard listens globally
      io.emit('emergency_alert', payload);
      
      console.log(`[Emergency Hub] SOS Routed to Guard ${guardId || 'ALL'}: ${resident.full_name} @ ${alert.location}`);
    }

    // 2. Trigger Physical IoT Siren/Buzzer via MQTT
    mqttService.publishSirenCommand('ON');

    res.status(201).json(alert);
  } catch (error) {
    console.error('SOS Trigger Error:', error);
    res.status(500).json({ message: 'Error triggering SOS alert' });
  }
};

export const getActiveAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ status: 'active' })
      .populate('sender', 'full_name phone house_number')
      .sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active alerts' });
  }
};

export const resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findByIdAndUpdate(
      id,
      { 
        status: 'resolved',
        resolvedBy: req.user.id,
        resolvedAt: new Date()
      },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.status(200).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error resolving alert' });
  }
};
