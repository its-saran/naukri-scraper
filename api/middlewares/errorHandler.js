import utils from '../utils/helper.js';

const errorHandler = (req, res) => {
    const err = utils.createError({status: 404})
    res.status(err.error.status).json(err);
};
  
export default errorHandler;


// import utils from '../utils/helper.js';

// const errorHandler = (err, req, res) => {
//   const error = utils.createError({ status: err.statusCode || 500 });
//   res.status(error.error.status).json(error);
// };

// export default errorHandler;`