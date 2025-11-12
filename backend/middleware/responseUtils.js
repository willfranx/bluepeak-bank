
// Response helper for success and client/server errors

export const sendResponse = (res, status, message, data = null) => {
    res.status(status).json({
    success: status < 400,
    message,
    data,
  });
};

// Global error-handling middleware
export const globalErrorHandler = (err, req, res, next) => {
  console.error("Some Error occurred:", err.stack);

  res.status(500).json({
    success: false,
    status: 500,
    message: "Internal Server Error",
    error: err.message,
  });
};



