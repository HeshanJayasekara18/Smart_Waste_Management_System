//  Centralized Error Handling (avoids code duplication)
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  const status = err.statusCode || (err.message?.includes('overlap') ? 409 : 400);
  const payload = {
    error: err.message || 'Internal Server Error',
  };

  if (err.errorCode) {
    payload.errorCode = err.errorCode;
  }

  if (err.context) {
    payload.context = err.context;
  }

  res.status(status).json(payload);
};

export default errorHandler;

