const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('../controllers/handlerFactory');
const multer = require('multer'); //package for uploading
const sharp = require('sharp'); //package for resizing images
// creating a multer storage
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user -282828282-12222.extention file name
//     // we have to guarantee that we dont have same file name for an image
//     // so we do user-userid-currenttimestamp
//     const ext = file.mimetype.split('/')[1]; //file extensio console.log(req.file to see it in next middleware)
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();
// multer filter  for img file
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload only image', 400), false);
  }
};
//multer configure
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1 create error if user POSTS password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update, pls use a /updateMyPassword',
        400
      )
    );
  }
  // 2 filtered our unwanted fileld names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  // 3 update user doc
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
exports.resizeUserPhoto = catchAsync( async (req, res, next) => {
  if (!req.file) return next(); //check if file is present
  // set file name it is used in next middleware
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

 await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg').jpeg({quality : 90})
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active: false,
  });

  res.status(204).json({
    sttus: 'success',
    data: null,
  });
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined! pls use signup instead ',
  });
};

//USERS ROUTE HANDLERS
exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

//do not attempt to update password with this! cz of middleware save
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
