const validate = (schema) => (req, res, next) => {
  try {
    // Validate req.body. For multipart/form-data, numbers might be strings,
    // so Zod schemas should ideally handle coercion (e.g., z.coerce.number())
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error.name === "ZodError" || error.errors) {
      // Return a clean error structure
      const errArray = error.errors || error.issues;
      const formattedErrors = errArray.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({ message: "خطأ في البيانات المدخلة", errors: formattedErrors });
    }
    console.error("Validation Error:", error);
    return res.status(400).json({ message: "خطأ في التحقق من البيانات" });
  }
};

module.exports = validate;
