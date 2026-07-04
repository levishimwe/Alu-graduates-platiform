exports.formatResponse = (success, message, data = {}) => ({
  success,
  message,
  data,
});

exports.handleError = (res, error, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error",
  });
};

exports.paginate = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  return {
    skip: (pageNum - 1) * limitNum,
    limit: limitNum,
    page: pageNum,
  };
};