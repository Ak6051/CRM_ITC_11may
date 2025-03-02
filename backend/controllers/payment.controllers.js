

exports.updatePaymentStatus = async (req, res) => {
    const { saleId } = req.params;
    const { paymentStatus } = req.body;
    
    try {
      const sale = await Sale.findByIdAndUpdate(
        saleId,
        { paymentStatus },
        { new: true }
      );
      if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }
      res.status(200).json({ success: true, data: sale });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error updating payment status', error });
    }
  };
  