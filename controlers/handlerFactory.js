const APIfeatures = require('../utils/APIfeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = function(Model) {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(`No document found with the ID ${req.params.id}`, 404)
      );
    }
    res.status(202).json({
      status: 'deleted',
      data: null
    });
  });
};

exports.updateOne = function(Model) {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(
        new AppError(`No document found with the ID ${req.params.id}`, 404)
      );
    }
    res.status(200).json({
      status: 'updated',
      data: {
        data: doc
      }
    });
  });
};

exports.createOne = function(Model) {
  return catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc
      }
    });
  });
};

exports.getOne = function(Model, popOption) {
  return catchAsync(async (req, res, next) => {
    const { id } = req.params;
    let query = Model.findById(id);
    if (popOption) {
      query = query.populate(popOption);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError(`No document found with the ID ${id}`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
};

exports.getAll = function(Model) {
  return catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour
    //{{URL}}api/v1/tours/5c88fa8cf4afda39709c2951/reviews
    let filter = {};
    if (req.params.tourId) {
      filter = {
        tour: req.params.tourId
      };
    }
    // Execute Query
    const features = new APIfeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    // Send Responce
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
};
