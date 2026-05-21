const express = require('express');
const router = express.Router();
const controller = require('../controllers/memorials.controller');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.post('/', authenticate, authorize('admin', 'supervisor', 'operator'), controller.create);
router.put('/:id', authenticate, authorize('admin', 'supervisor', 'operator'), controller.update);
router.delete('/:id', authenticate, authorize('admin', 'supervisor'), controller.remove);

router.post('/upload-photo', authenticate, upload.single('photo'), controller.uploadPhoto);

module.exports = router;
