const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const { getUser, getOneUser, createUser, updateUser, deleteUser} = require('../controllers/user');    


router.get('/user', getUser);
router.get('/user/:id', getOneUser);
router.post('/user', upload.array('images', 10), createUser);
router.put('/user/:id', upload.array('images', 10), updateUser)
router.delete("/user/:id", deleteUser)

module.exports = router;
