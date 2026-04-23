const express = require("express");
const companyController = require("../controllers/companyController");

const router = express.Router();

// Публичный список компаний (нужен при регистрации).
router.get("/", companyController.getPublicList);

module.exports = router;
