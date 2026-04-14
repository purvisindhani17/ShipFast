const express = require('express');
const router = express.Router();
const { getCourierList } = require('../controllers/rateEngine');

router.get('/', (req, res) => {
  res.json({ success: true, data: getCourierList() });
});

module.exports = router;
