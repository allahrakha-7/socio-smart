import Amenity from '../models/amenityModel.js';
import AmenityBooking from '../models/amenityBookingModel.js';

// @desc    Get all amenities (Simplified for frontend metadata-mapping)
// @route   GET /api/amenities
export const getAmenities = async (req, res) => {
  try {
    const basicList = [
      { 
        name: 'Community Hall', description: 'A spacious venue for parties, workshops, and community gatherings.', 
        icon: 'Users', thumbnail: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80',
        status: 'available', location: 'Block A, Ground Floor', price: 'Rs. 5000.00', timings: { open: '09:00 AM', close: '11:00 PM' }
      },
      { 
        name: 'Tennis Court', description: 'Professional-grade clay courts for tennis enthusiasts.', 
        icon: 'Trophy', thumbnail: 'https://images.unsplash.com/photo-1595435066311-6411d94dae35?auto=format&fit=crop&w=400&q=80',
        status: 'available', location: 'East Wing Sports Complex', price: 'Free', timings: { open: '06:00 AM', close: '08:00 PM' } 
      },
      { 
        name: 'Swimming Pool', description: 'Temperature-controlled swimming pool with dedicated kids area.', 
        icon: 'Waves', thumbnail: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=400&q=80',
        status: 'available', location: 'Main Pavilion, Level 2', price: 'Free', timings: { open: '06:00 AM', close: '09:00 PM' } 
      },
      { 
        name: 'Club House (Gym)', description: 'State-of-the-art fitness center with premium equipment.', 
        icon: 'Dumbbell', thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
        status: 'available', location: 'Main Pavilion, Level 1', price: 'Free', timings: { open: '05:00 AM', close: '10:00 PM' } 
      },
      { 
        name: 'Guest Room', description: 'Comfortable ensuite rooms for society guests.', 
        icon: 'Bed', thumbnail: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80',
        status: 'available', location: 'Block B, Level 1', price: 'Rs. 2500.00 / Night', timings: { open: 'Check-in: 12 PM', close: 'Check-out: 10 AM' } 
      },
      { 
        name: 'Prayer Hall', description: 'A serene and quiet space for meditation and prayers.', 
        icon: 'Heart', thumbnail: 'https://images.unsplash.com/photo-1544124499-58cb797bc59d?auto=format&fit=crop&w=400&q=80',
        status: 'available', location: 'Block C, Ground Floor', price: 'Free', timings: { open: '05:00 AM', close: '10:00 PM' } 
      }
    ];

    // Ensure core facilities exist robustly via bulkWrite upsert to bypass earlier state issues
    const bulkOps = basicList.map(amenity => ({
      updateOne: {
        filter: { name: amenity.name },
        update: { $set: amenity },
        upsert: true
      }
    }));
    await Amenity.bulkWrite(bulkOps);

    const amenities = await Amenity.find({}).select('name status location price').sort({ name: 1 });
    res.json(amenities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching facilities', error: error.message });
  }
};

// @desc    Create a new amenity (Admin)
export const createAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.create(req.body);
    res.status(201).json(amenity);
  } catch (error) {
    res.status(500).json({ message: 'Error creating facility', error: error.message });
  }
};

// @desc    Request a booking
export const bookAmenity = async (req, res) => {
  try {
    const { amenityId, bookingDate, slot, purpose } = req.body;
    const amenity = await Amenity.findById(amenityId);
    if (!amenity) return res.status(404).json({ message: 'Facility not found' });

    const existing = await AmenityBooking.findOne({
      amenity: amenityId,
      bookingDate: new Date(new Date(bookingDate).setHours(0,0,0,0)),
      slot,
      status: 'approved'
    });

    if (existing) return res.status(400).json({ message: 'This slot is already booked' });

    const booking = await AmenityBooking.create({
      resident: req.user.id,
      amenity: amenityId,
      bookingDate: new Date(new Date(bookingDate).setHours(0,0,0,0)),
      slot,
      purpose,
      status: 'pending'
    });

    res.status(201).json({ success: true, message: 'Request submitted', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
};

// @desc    Get booked slots
export const getBookedSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(new Date(date).setHours(0, 0, 0, 0));
    const end = new Date(new Date(date).setHours(23, 59, 59, 999));
    const bookings = await AmenityBooking.find({
      amenity: req.params.id,
      bookingDate: { $gte: start, $lte: end },
      status: { $in: ['pending', 'approved'] }
    }).select('slot');
    res.json(bookings.map(b => b.slot));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching slots' });
  }
};

// @desc    Admin: Get all bookings
export const getAdminBookings = async (req, res) => {
  try {
    const bookings = await AmenityBooking.find({})
      .populate('resident', 'full_name house_number')
      .populate('amenity', 'name location')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data' });
  }
};

// @desc    Admin: Update status
export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await AmenityBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
};
// @desc    Admin: Update facility operational status
export const updateAmenityStatus = async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(amenity);
  } catch (error) {
    res.status(500).json({ message: 'Status update failed' });
  }
};
