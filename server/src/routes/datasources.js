const router = require('express').Router();
const multer = require('multer');
const dataSourceController = require('../controllers/dataSourceController');
const { authenticate, authorize } = require('../middleware/auth');
const { tenantMiddleware } = require('../middleware/tenant');

// JSON files are parsed and returned inline — never written to disk.
const jsonUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const okExt = /\.(json|geojson|ndjson)$/i.test(file.originalname);
    const okMime = ['application/json', 'text/json', 'text/plain', 'application/octet-stream'].includes(file.mimetype);
    if (okExt || okMime) cb(null, true);
    else cb(new Error(`File type "${file.mimetype}" is not a JSON file.`), false);
  },
});

router.use(authenticate, tenantMiddleware);

router.get('/', dataSourceController.list);
router.get('/:id', dataSourceController.getById);
router.post('/', authorize('board:configure'), dataSourceController.create);
router.put('/:id', authorize('board:configure'), dataSourceController.update);
router.delete('/:id', authorize('board:configure'), dataSourceController.delete);
router.post('/test', authorize('board:configure'), dataSourceController.test);
router.post('/upload-json', authorize('board:configure'), jsonUpload.single('file'), dataSourceController.uploadJson);
router.post('/:id/refresh', authorize('board:configure'), dataSourceController.refresh);

module.exports = router;
