module.exports = class APIfeatures {
  constructor(query, reqQueryObj) {
    this.query = query;
    this.reqQueryObj = reqQueryObj;
  }

  // Filtering
  filter() {
    // 1A) Filtering
    const queryObj = { ...this.reqQueryObj };
    const excludedFiels = ['page', 'sort', 'limit', 'fields'];
    excludedFiels.forEach(cur => delete queryObj[cur]);

    // 1B)Advanced Filterings
    let quaryString = JSON.stringify(queryObj);
    quaryString = quaryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      match => `$${match}`
    );
    this.query = this.query.find(JSON.parse(quaryString));
    return this;
  }

  // 2)Sorting
  sort() {
    if (this.reqQueryObj.sort) {
      const sortBy = this.reqQueryObj.sort.replaceAll(',', ' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // 3)Field Limiting
  limitFields() {
    if (this.reqQueryObj.fields) {
      const reqField = this.reqQueryObj.fields.replaceAll(',', ' ');
      this.query = this.query.select(reqField);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // 4 Pagination
  paginate() {
    const page = this.reqQueryObj.page * 1 || 1;
    const limit = this.reqQueryObj.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
};
