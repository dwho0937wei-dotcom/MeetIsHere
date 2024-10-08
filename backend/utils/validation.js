// backend/utils/validation.js
const { validationResult } = require('express-validator');
const { check, oneOf } = require('express-validator');

// middleware for formatting errors from express-validator middleware
// (to customize, see express-validator's documentation)
const handleValidationErrors = (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) { 
    const errors = {};
    validationErrors
      .array()
      .forEach(error => {
        // console.log(error);
        if (error.path) {
            errors[error.path] = error.msg;
        }
        else if (error.nestedErrors) {
            // console.log(error.nestedErrors[0][0]);
            errors[error.nestedErrors[0][0].path] = error.msg;
        }
      });
    
    const err = Error("Bad Request");
    err.errors = errors;
    err.status = 400;
    err.title = "Bad Request";
    delete err.stack;
    // next(err);
    return res.status(err.status).json({
        message: err.message,
        errors,
    })
  }
  next();
};

// Validate User
const validateLogin = [
  oneOf([
      check("credential").isEmail(),
      check("credential").isLength({ min: 4 })
  ], { message: "Credential must either be an email or a username with at least 4 characters" }),
  check('password')
      .exists({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('Password is required and needs to be at least 6 characters'),
  handleValidationErrors
];

const validateSignUp = [
  check('email')
      .exists({ checkFalsy: true })
      .isEmail()
      .withMessage('The provided email is invalid'),
  check('username')
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage('Username must be required'),
  check('firstName')
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage('First name must be required'),
  check('lastName')
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage('Last name must be required'),
  handleValidationErrors
];

// Validate Group
const validateGroup = [
    // check('name')
    //     .exists({ checkFalsy: true })
    //     .isLength({ max: 60 })
    //     .withMessage('Name must be 60 characters or less'),
    check('name')
        .exists({ checkFalsy: true })
        .withMessage('Name is required'),
    // check('about')
    //     .exists({ checkFalsy: true })
    //     .isLength({ min: 50 })
    //     .withMessage('About must be 50 characters or more'),
    check('about')
        .exists({ checkFalsy: true })
        .isLength({ min: 30 })
        .withMessage('Description must be at least 30 characters long'),
    // check('type')
    //     .exists({ checkFalsy: true })
    //     .isIn(['Online', 'In person'])
    //     .withMessage("Type must be 'Online' or 'In person'"),
    check('type')
        .exists({ checkFalsy: true })
        .isIn(['Online', 'In person'])
        .withMessage("Group Type is required"),
    // check('private')
    //     .exists({ checkNull: true })
    //     .isBoolean()
    //     .withMessage('Private must be a boolean'),
    check('private')
        .exists({ checkNull: true })
        .isBoolean()
        .withMessage('Visibility Type is required'),
    check('city')
        .exists({ checkFalsy: true })
        .notEmpty()
        .withMessage('City is required'),
    check('state')
        .exists({ checkFalsy: true })
        .notEmpty()
        .withMessage('State is required'),
  handleValidationErrors
];

// Validate Venue
const validateVenue = [
  check('address')
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage('Street address is required'),
  check('city')
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage('City is required'),
  check('state')
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage('State is required'),
  check('lat')
      .exists({ checkFalsy: true })
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be within -90 and 90'),
  check('lng')
      .exists({ checkFalsy: true })
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be within -180 and 180'),
  handleValidationErrors
];

// Validate Event
const today = new Date().toISOString();
const validateEvent = [
    // check('name')
    //     .exists({ checkFalsy: true })
    //     .isLength({ min: 5 })
    //     .withMessage('Name must be at least 5 characters'),
    check('name')
        .exists({ checkFalsy: true })
        .withMessage('Name is required'),
    // check('type')
    //     .exists({ checkFalsy: true })
    //     .isIn(['Online', 'In person'])
    //     .withMessage("Type must be Online or In person"),
    check('type')
        .exists({ checkFalsy: true })
        .isIn(['Online', 'In person'])
        .withMessage("Event Type is required"),
    // check('capacity')
    //     .exists({ checkFalsy: true })
    //     .isInt()
    //     .withMessage('Capacity must be an integer'),
    // check('price')
    //     .exists({ checkFalsy: true }).withMessage("Price is invalid")
    //     .isFloat({ min: 0 }).withMessage("Price is invalid")
    //     .custom(price => {
    //         const places = price.toString().split('.');
    //         if (places.length > 1 && places[1].length > 2) {
    //             throw new Error("Price is invalid");
    //         }
    //         return true;
    //     })
    //     .withMessage("Price is invalid"),
    check('price')
        .exists({ checkFalsy: true }).withMessage("Price is required")
        .isFloat({ min: 0 }).withMessage("Price is required")
        .custom(price => {
            const places = price.toString().split('.');
            if (places.length > 1 && places[1].length > 2) {
                throw new Error("Price is required");
            }
            return true;
        })
        .withMessage("Price is required"),
    // check('description')
    //     .exists({ checkFalsy: true })
    //     .notEmpty()
    //     .withMessage('Description is required'),
    check('description')
        .exists({ checkFalsy: true })
        .isLength({ min: 30 })
        .withMessage('Description needs 30 or more characters'),
    // check('startDate')
    //     .exists({ checkFalsy: true })
    //     .isAfter(today)
    //     .withMessage('Start date must be in the future'),
    check('startDate')
        .exists({ checkFalsy: true })
        .withMessage('Event start is required'),
    // check('endDate')
    //     .exists({ checkFalsy: true })
    //     .custom((endDate, { req }) => {
    //         const startDate = req.body.startDate;
    //         if (endDate <= startDate) {
    //             throw new Error();
    //         }
    //         return true;
    //     })
    //     .withMessage('End date is less than start date'),
    check('endDate')
        .exists({ checkFalsy: true })
        .withMessage('Event end is required'),
    handleValidationErrors
];

// Validate Attendance
const validateAttendance = [
    check('status')
        .exists({ checkFalsy: true })
        .not().isIn(['pending'])
        .withMessage('Cannot change an attendance status to pending'),
    handleValidationErrors
];

const validateEventQuery = [
    oneOf([
        check("page").optional().isEmpty(),
        check("page").isInt({ min: 1 })
    ], { message: "Page must be greater than or equal to 1" }),

    oneOf([
        check("size").optional().isEmpty(),
        check("size").isInt({ min: 1 })
    ], { message: "Size must be greater than or equal to 1" }),

    oneOf([
        check("name").optional().isEmpty(),
        check("name").notEmpty()
    ], { message: "Name must be a string" }),

    oneOf([
        check("type").optional().isEmpty(),
        check("type").isString()
        .custom(type => {
            const expectedInputs = ["online", "in person"];
            return expectedInputs.includes(type.toLowerCase());
        })
    ], { message: "Type must be 'Online' or 'In Person'" }),
    oneOf([
        check("startDate").optional().isEmpty(),
        check("startDate").custom(startDate => new Date(startDate).toString() !== "Invalid Date")
    ], { message: "Start date must be a valid datetime" }),
    
    handleValidationErrors
];

module.exports = {
  validateLogin,
  validateSignUp,
  validateGroup,
  validateVenue,
  validateEvent,
  validateAttendance,
  validateEventQuery
};