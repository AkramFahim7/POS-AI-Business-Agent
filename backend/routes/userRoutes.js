const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(adminOnly);

router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

router.patch('/:id/status', updateUserStatus);

module.exports = router;
