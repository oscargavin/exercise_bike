export const validatePassword = (password) => {
  const requirements = {
    minLength: 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*]/.test(password),
  };

  const errors = [];

  if (password.length < requirements.minLength) {
    errors.push(
      `Password must be at least ${requirements.minLength} characters long`
    );
  }
  if (!requirements.hasUpperCase) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!requirements.hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!requirements.hasNumbers) {
    errors.push("Password must contain at least one number");
  }
  if (!requirements.hasSpecialChar) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
