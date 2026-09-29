/**
 * Standard API response helper
 */
export const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res, message = 'An error occurred', statusCode = 500, errorDetails = null) => {
  const response = {
    success: false,
    message
  };

  if (process.env.NODE_ENV !== 'production' && errorDetails) {
    response.debug = errorDetails;
  }

  return res.status(statusCode).json(response);
};
