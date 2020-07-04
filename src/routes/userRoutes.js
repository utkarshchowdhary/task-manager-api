const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const app = require('../app');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.use(authController.protect);

router.post('/logout', authController.logout);
router.post('/logoutAll', authController.logoutAll);

router
  .route('/me')
  .get(userController.getMe)
  .patch(
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.UpdateMe
  )
  .delete(userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
