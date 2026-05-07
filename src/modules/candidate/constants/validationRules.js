export const validationRules = {
  firstName: {
    required: true,
    message: "First name is required",
  },
  email: {
    required: true,
    pattern: /\S+@\S+\.\S+/,
    message: "Invalid email format",
  },
};