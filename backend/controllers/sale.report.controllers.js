const Sale = require('../models/Sale');

// Get all sales
const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new sale
const createSale = async (req, res) => {
  try {
    const { assignedHR, ...restData } = req.body;

    const saleData = {
      ...restData,
      assignedHR,
      startDate: assignedHR ? new Date() : null, // Assign current date if HR is set
    };

    const newSale = new Sale(saleData);
    await newSale.save();
    res.status(201).json(newSale);
  } catch (error) {
    res.status(500).json({ message: "Error creating sale", error });
  }
};


// Update a sale
const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedHR, ...restData } = req.body;

    const updatedData = {
      ...restData,
      assignedHR,
      startDate: assignedHR ? new Date() : null, // Update startDate if HR is reassigned
    };

    const updatedSale = await Sale.findByIdAndUpdate(id, updatedData, { new: true });
    res.status(200).json(updatedSale);
  } catch (error) {
    res.status(500).json({ message: "Error updating sale", error });
  }
};

// Delete a sale
const deleteSale = async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id);
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
