const JobOpenings = require('../models/jobopennings.modal');

// Get all sales
const getAllSales = async (req, res) => {
  try {
    const salesData = await JobOpenings.find()
      .populate('assignedHR', 'firstName lastName') // yeh User model se data uthayega
      .sort({ date: -1 });

    const formattedSales = salesData.map((sale) => {
      const saleObj = sale.toObject();
      if (saleObj.assignedHR) {
        saleObj.hrName = `${saleObj.assignedHR.firstName} ${saleObj.assignedHR.lastName}`;
      } else {
        saleObj.hrName = null;
      }
      return saleObj;
    });

    res.status(200).json(formattedSales);
  } catch (error) {
    console.error('Error fetching sales data:', error.message);
    res.status(500).json({ message: 'Server Error while fetching sales data' });
  }
};





// Create a new sale
const createSale = async (req, res) => {
  const sale = new JobOpenings(req.body);
  try {
    const newSale = await sale.save();
    res.status(201).json(newSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a sale
const updateSale = async (req, res) => {
  try {
    const updatedSale = await JobOpenings.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a sale
const deleteSale = async (req, res) => {
  try {
    await JobOpenings.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSales,
  createSale,
  updateSale,
  deleteSale,
};
