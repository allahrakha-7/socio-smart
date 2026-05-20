import Vehicle from '../models/vehicleModel.js';
import Resident from '../models/residentModel.js';
import GateLog from '../models/gateLogModel.js';
import Guard from '../models/guardModel.js';
import axios from 'axios';

const syncVehiclesToFirebase = async () => {
  try {
    const approvedVehicles = await Vehicle.find({ approval_status: 'approved' });
    const payload = {};
    approvedVehicles.forEach((v) => {
      const cleanPlate = String(v.vehicle_number).toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanPlate) {
        payload[`car_${v._id}`] = cleanPlate;
      }
    });
    await axios.put('https://car-scaning-default-rtdb.firebaseio.com/cars.json', payload);
    console.log('[Firebase Sync] Approved vehicles successfully synced to Firebase RTDB');
  } catch (error) {
    console.log('[Firebase Sync] Sync warning:', error.message);
  }
};

export const verifyVehicleAccess = async (req, res) => {
  try {
    const { plate_number } = req.body;
    if (!plate_number) {
      return res.status(400).json({ message: 'Plate number is required' });
    }

    const cleanPlate = plate_number.toUpperCase().trim();

    // 1. Search for an approved vehicle in the database
    const vehicle = await Vehicle.findOne({ 
      vehicle_number: cleanPlate,
      approval_status: 'approved'
    }).populate('owner', 'full_name house_number phone');

    if (vehicle) {
      // 2. Create a GateLog entry for the authorized access
      await GateLog.create({
        type: 'Resident',
        name: vehicle.owner.full_name,
        vehicle_number: cleanPlate,
        phone: vehicle.owner.phone,
        unit_to_visit: vehicle.owner.house_number,
        purpose: 'NPR Authorization',
        gate: 'Main Gate',
        guard: req.user.id,
        status: 'inside'
      });

      return res.status(200).json({
        authorized: true,
        message: 'Access Granted',
        details: {
          owner: vehicle.owner.full_name,
          unit: vehicle.owner.house_number,
          make: vehicle.make_model,
          color: vehicle.color
        }
      });
    }

    // 3. Not found or not approved
    return res.status(200).json({
      authorized: false,
      message: 'Access Denied',
      reason: 'Vehicle not registered or pending approval'
    });

  } catch (error) {
    console.error('NPR Verification Error:', error);
    res.status(500).json({ message: 'Error during vehicle verification' });
  }
};

export const listVehicles = async (req, res) => {
  try {
    const filter = (req.user.role === 'admin' || req.user.role === 'guard') ? {} : { owner: req.user.id };
    const vehicles = await Vehicle.find(filter)
      .populate('owner', 'full_name email house_number profile_image')
      .sort({ createdAt: -1 });
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicles' });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const { ownerId, ownerModel, vehicle_number, vehicle_type, make_model, color, rfid_tag, parking_slot, vehicle_image } = req.body;

    // Use req.user.id if the requester is a resident to prevent spoofing
    const finalOwnerId = req.user.role === 'admin' ? ownerId : req.user.id;
    const finalOwnerModel = req.user.role === 'admin' ? (ownerModel || 'Resident') : 'Resident';

    if (!finalOwnerId || !vehicle_number || !vehicle_type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const vehicle = await Vehicle.create({
      owner: finalOwnerId,
      ownerModel: finalOwnerModel,
      vehicle_number: String(vehicle_number).toUpperCase().trim(),
      vehicle_type,
      make_model,
      color,
      rfid_tag,
      parking_slot,
      vehicle_image,
      approval_status: req.user.role === 'admin' ? 'approved' : 'pending',
    });

    res.status(201).json(vehicle);
    if (vehicle.approval_status === 'approved') {
      syncVehiclesToFirebase();
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Vehicle number or RFID tag already exists' });
    }
    res.status(500).json({ message: 'Error creating vehicle' });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Authorization check
    if (req.user.role !== 'admin') {
      const existing = await Vehicle.findById(id);
      if (!existing || String(existing.owner) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to update this vehicle' });
      }
    }

    const vehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.status(200).json(vehicle);
    syncVehiclesToFirebase();
  } catch (error) {
    res.status(500).json({ message: 'Error updating vehicle' });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Authorization check
    if (req.user.role !== 'admin') {
      const existing = await Vehicle.findById(id);
      if (!existing || String(existing.owner) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to delete this vehicle' });
      }
    }

    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.status(200).json({ message: 'Vehicle deleted successfully' });
    syncVehiclesToFirebase();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vehicle' });
  }
};

export const approveVehicle = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can approve vehicles' });
    }

    const { id } = req.params;
    const { action } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { approval_status: action },
      { new: true }
    );

    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.status(200).json(vehicle);
    syncVehiclesToFirebase();
  } catch (error) {
    res.status(500).json({ message: 'Error approving vehicle' });
  }
};
