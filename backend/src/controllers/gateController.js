import GateLog from '../models/gateLogModel.js';
import Resident from '../models/residentModel.js';
import Vehicle from '../models/vehicleModel.js';
import GateActivity from '../models/gateActivityModel.js';
import mqttService from '../utils/mqttService.js';
import { getCurrentGuardObj } from './rosterController.js';

export const manualTriggerGate = async (req, res) => {
  try {
    // Only Security Guards or Admins can trigger manual gate open
    if (req.user.role !== 'guard' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Only authorized personnel can trigger manual gate override' });
    }

    const { action } = req.body;
    const gateAction = action === 'CLOSE' ? 'CLOSE' : 'OPEN';

    // 1. Send MQTT Command to ESP32 Relay
    const result = mqttService.publishGateCommand(gateAction);

    // 2. Log the activity for auditing
    const activity = await GateActivity.create({
      plate_number: 'MANUAL_OVERRIDE',
      status: 'GRANTED',
      reason: `Manual Override by ${req.user.role} (${gateAction})`,
      owner_name: 'SECURITY_DEPT',
      unit: 'GATE_01',
      is_manual_override: true,
      guard: req.user.id
    });

    // 3. Notify the Frontend via Socket
    const io = req.app.get('io');
    if (io) {
      io.emit('gate_activity', {
        plate_number: 'MANUAL_OVERRIDE',
        authorized: true,
        reason: `Manual Security Override (${gateAction})`,
        action: gateAction,
        timestamp: activity.timestamp
      });
    }

    res.status(200).json({ 
      success: true, 
      message: `Gate ${gateAction.toLowerCase()} command transmitted successfully`,
      iot_details: result 
    });
  } catch (error) {
    console.error('Manual Trigger Error:', error);
    res.status(500).json({ message: 'Failed to transmit gate command' });
  }
};

export const verifyGateAccess = async (req, res) => {
  try {
    const { plate_number } = req.body;
    if (!plate_number) return res.status(400).json({ message: 'Plate number is required' });

    const plate = String(plate_number).toUpperCase().trim();
    const cleanPlate = plate.replace(/[^A-Z0-9]/g, '');
    
    // 1. Search Vehicle Database (Residents)
    const vehicles = await Vehicle.find().populate('owner', 'full_name house_number status');
    let vehicle = vehicles.find(v => {
      const dbPlate = String(v.vehicle_number).toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (dbPlate === cleanPlate) return true;
      const dbDigits = dbPlate.replace(/[^0-9]/g, '');
      const cleanDigits = cleanPlate.replace(/[^0-9]/g, '');
      return dbDigits && cleanDigits && dbDigits === cleanDigits;
    });
    
    let authorized = false;
    let details = null;
    let reason = 'Vehicle not registered in database';
    let isVisitor = false;

    if (vehicle) {
      if (vehicle.status === 'blacklisted') {
        reason = 'VEHICLE BLACKLISTED';
      } else if (vehicle.approval_status !== 'approved') {
        reason = 'REGISTRATION PENDING APPROVAL';
      } else if (vehicle.owner && vehicle.owner.status !== 'active') {
        reason = 'RESIDENT ACCOUNT INACTIVE';
      } else {
        authorized = true;
        reason = 'AUTHORIZED RESIDENT';
        details = {
          owner: vehicle.owner?.full_name || 'Member',
          unit: vehicle.owner?.house_number || 'N/A',
          make: vehicle.make_model,
          color: vehicle.color,
          residentId: vehicle.owner?._id
        };
      }
    } else {
      // 1.1 Search Visitor Temporary Whitelist (Fast Track IoT)
      const Visitor = (await import('../models/visitorModel.js')).default;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const visitors = await Visitor.find({ 
        status: 'pending',
        expected_date: { $gte: todayStart, $lte: todayEnd }
      }).populate('resident', 'full_name status');

      const visitor = visitors.find(v => {
        const dbPlate = String(v.plate_number).toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (dbPlate === cleanPlate) return true;
        const dbDigits = dbPlate.replace(/[^0-9]/g, '');
        const cleanDigits = cleanPlate.replace(/[^0-9]/g, '');
        return dbDigits && cleanDigits && dbDigits === cleanDigits;
      });

      if (visitor) {
        if (visitor.resident && visitor.resident.status !== 'active') {
          reason = 'HOST RESIDENT ACCOUNT INACTIVE';
        } else {
          authorized = true;
          reason = `Pre-Approved Guest for House ${visitor.house_number} — Welcome!`;
          details = {
            owner: visitor.name || 'Guest',
            unit: visitor.house_number,
            make: 'Pre-Approved',
            color: 'Visitor',
            residentId: visitor.resident?._id
          };
          isVisitor = true;

          // Auto-mark as arriving to prevent reuse
          visitor.status = 'arrived';
          await visitor.save();
        }
      }
    }

    // 2. Log Activity with current guard
    const currentGuard = await getCurrentGuardObj();
    const activity = await GateActivity.create({
      plate_number: plate,
      status: authorized ? 'GRANTED' : 'DENIED',
      reason,
      owner_name: details?.owner,
      unit: details?.unit,
      vehicle_details: details ? `${details.make} (${details.color})` : undefined,
      guard: currentGuard?.staff?._id || undefined
    });

    // 3. Actuate gate, write log entry, notify resident if authorized
    if (authorized) {
      // 3.1 Send MQTT Command to ESP32 Relay
      mqttService.publishGateCommand('OPEN');

      // 3.2 Create the official GateLog entry so it shows in guard's APK feed
      await GateLog.create({
        name: details?.owner || 'Authorized Vehicle',
        vehicle_number: plate,
        type: isVisitor ? 'Visitor' : 'Resident',
        purpose: isVisitor ? 'Pre-Approved Guest' : 'Automated NPR Entry',
        unit_to_visit: details?.unit,
        gate: 'Main Gate',
        guard: currentGuard?.staff?._id || undefined,
        status: 'inside',
        entry_time: new Date(),
        plate_image: `https://placehold.co/400x150/111827/FFFFFF?text=${plate}`
      });

      // 3.3 Trigger real-time system notification to the resident
      if (details?.residentId) {
        const io = req.app.get('io');
        const { triggerSystemNotification } = await import('./notificationController.js');
        await triggerSystemNotification({
          recipient: details.residentId,
          title: isVisitor ? 'Guest Arrived' : 'Vehicle Entered',
          message: isVisitor 
            ? `Your guest ${details.owner} has arrived at the society gate.`
            : `Your vehicle ${plate} (${details.make}) has entered the society gate.`,
          category: isVisitor ? 'Visitor' : 'Vehicle',
          io
        });
      }
    }

    // 4. Emit Real-time Socket Event for Security Guard Dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('gate_activity', {
        plate_number: plate,
        authorized,
        reason,
        details,
        timestamp: activity.timestamp
      });
      console.log(`[Gate Monitor] Scanned: ${plate} | Result: ${authorized ? 'GRANTED' : 'DENIED'}`);
    }

    res.status(200).json({ authorized, reason, details });
  } catch (error) {
    console.error('Gate Verify Error:', error);
    res.status(500).json({ message: 'Internal server error during plate verification' });
  }
};

export const createEntry = async (req, res) => {
  try {
    const { name, vehicle_number, type, phone, purpose, unit_to_visit, gate } = req.body;

    const log = await GateLog.create({
      name,
      vehicle_number: vehicle_number ? String(vehicle_number).toUpperCase().trim() : undefined,
      type: type || 'Visitor',
      phone,
      purpose,
      unit_to_visit,
      gate: gate || 'Main Gate',
      guard: req.user.id,
      plate_image: vehicle_number ? `https://placehold.co/400x150/111827/FFFFFF?text=${String(vehicle_number).toUpperCase().trim()}` : undefined
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('gate_activity', {
        plate_number: log.vehicle_number || 'WALK_IN',
        authorized: true,
        reason: `${log.name} entered the society`,
        timestamp: log.entry_time
      });
    }

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Error creating entry record' });
  }
};

export const markExit = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await GateLog.findByIdAndUpdate(id, { status: 'exited', exit_time: Date.now() }, { new: true });
    if (!log) return res.status(404).json({ message: 'Record not found' });

    const io = req.app.get('io');
    if (io) {
      io.emit('gate_activity', {
        plate_number: log.vehicle_number || 'WALK_IN',
        authorized: true,
        reason: `${log.name} has exited the society`,
        timestamp: log.exit_time
      });
    }

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Error marking exit' });
  }
};

export const getGateLogs = async (req, res) => {
  try {
    const logs = await GateLog.find({})
      .populate('guard', 'full_name')
      .sort({ entry_time: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gate logs' });
  }
};

export const getMyGateLogs = async (req, res) => {
  try {
    if (req.user.role !== 'resident') {
      return res.status(403).json({ message: 'Only residents can access personal logs' });
    }

    const resident = await Resident.findById(req.user.id);
    if (!resident) return res.status(404).json({ message: 'Resident not found' });

    const logs = await GateLog.find({ unit_to_visit: resident.house_number })
      .populate('guard', 'full_name')
      .sort({ createdAt: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your gate logs' });
  }
};

export const getDailyStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await GateLog.countDocuments({ entry_time: { $gte: today } });
    const currentInside = await GateLog.countDocuments({ status: 'inside' });

    res.status(200).json({ totalToday: count, insideNow: currentInside });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};
export const deleteGateLog = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can delete logs' });
    }
    const { id } = req.params;
    const log = await GateLog.findByIdAndDelete(id);
    if (!log) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json({ message: 'Gate log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting gate log' });
  }
};

export const getRecentGateActivity = async (req, res) => {
  try {
    const activity = await GateActivity.find({}).sort({ timestamp: -1 }).limit(10);
    res.status(200).json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent activity' });
  }
};

export const notifyGateScanning = async (req, res) => {
  try {
    const { plate_number } = req.body;
    const io = req.app.get('io');
    if (io) {
      io.emit('plate_scanning', {
        plate_number: plate_number || 'UNKNOWN',
        timestamp: new Date()
      });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error emitting scanning event' });
  }
};
