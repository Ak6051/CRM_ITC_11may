const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/gcsMulter');
const auth = require('../middleware/authMiddleware');
const {
  getAllCompanies, getCompany, createCompany, updateCompany, deleteCompany,
  addBranch, updateBranch, deleteBranch, bulkImportCompanies,
} = require('../controllers/company.controller');

const companyUpload = upload.fields([
  { name: 'gstUpload',            maxCount: 1 },
  { name: 'agreementUpload',      maxCount: 1 },
  { name: 'otherDocumentUpload',  maxCount: 1 },
  { name: 'tokenUpload',          maxCount: 1 },
]);

// Company CRUD
router.get('/',       auth, getAllCompanies);
router.get('/:id',    auth, getCompany);
router.post('/',      auth, companyUpload, createCompany);
router.put('/:id',    auth, companyUpload, updateCompany);
router.delete('/:id', auth, deleteCompany);
router.post('/bulk-import', auth, bulkImportCompanies);

// Branch CRUD (nested under company)
router.post('/:id/branches',                  auth, companyUpload, addBranch);
router.put('/:id/branches/:branchId',         auth, companyUpload, updateBranch);
router.delete('/:id/branches/:branchId',      auth, deleteBranch);

module.exports = router;
