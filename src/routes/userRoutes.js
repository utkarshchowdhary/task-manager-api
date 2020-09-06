const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.use(authController.protect);

router.post('/logout', authController.logout);
router.post('/logoutAll', authController.logoutAll);

router
  .route('/me')
  .get(userController.getMe)
  .patch(userController.updateMe)
  .delete(userController.deleteMe);

router
  .route('/avatar')
  .get(userController.getAvatar)
  .post(
    userController.initiateUpload,
    userController.resizeAvatar,
    userController.uploadAvatar
  )
  .delete(userController.deleteAvatar);

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

router
  .route('/avatar/:id')
  .get(userController.getAvatar)
  .post(
    userController.initiateUpload,
    userController.resizeAvatar,
    userController.uploadAvatar
  )
  .delete(userController.deleteAvatar);

module.exports = router;
