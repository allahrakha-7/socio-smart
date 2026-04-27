// Catches requests to URLs that don't exist (e.g., /api/wrong-url)
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler: Ensures your React Native app ALWAYS gets JSON back
export const errorHandler = (err, req, res, next) => {
  // If the status is 200 but an error fired, force it to 500 Server Error
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Mongoose specific "Bad Object ID" errors cleanly
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message = 'Resource not found. Invalid ID format.';
    statusCode = 404;
  }

  res.status(statusCode).json({
    message,
    // Only show the detailed stack trace if you are in development mode
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
