export class ApiResponse {
  static success(res, statusCode, data, message = 'Success') {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res, statusCode, message = 'Error', errors = []) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}
