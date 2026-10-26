/**
 * Formats Supabase and network authentication errors into friendly, actionable messages.
 */
export function formatAuthError(error) {
  if (!error) return "An unexpected error occurred. Please try again.";

  const message = error.message || (typeof error === "string" ? error : "");
  const lowerMsg = message.toLowerCase();

  // 1. Rate limiting - email rate limit
  if (lowerMsg.includes("email rate limit exceeded") || lowerMsg.includes("rate limit")) {
    return "Email rate limit exceeded. Please wait a few minutes before trying again or request your administrator to configure a custom SMTP server.";
  }

  // 2. Rate limiting - time delay / security threshold ("after XX seconds")
  if (lowerMsg.includes("for security purposes, you can only request this after") || lowerMsg.includes("security purposes")) {
    return message; // This message already contains the exact seconds to wait (e.g. "For security purposes, you can only request this after 24 seconds.")
  }

  if (lowerMsg.includes("over_email_send_rate_limit") || lowerMsg.includes("too many requests") || error.status === 429) {
    return "Too many attempts. For security purposes, please wait a moment before trying again.";
  }

  // 3. Invalid email address
  if (lowerMsg.includes("unable to validate email address") || lowerMsg.includes("invalid email")) {
    return "Please enter a valid, deliverable email address.";
  }

  // 4. User already registered
  if (lowerMsg.includes("user already registered") || lowerMsg.includes("already registered")) {
    return "An account with this email already exists. Please switch to Sign In.";
  }

  // 5. Invalid credentials
  if (lowerMsg.includes("invalid login credentials") || lowerMsg.includes("invalid credentials")) {
    return "Invalid email or password. Please verify your credentials and try again.";
  }

  // 6. Email confirmation required
  if (lowerMsg.includes("email not confirmed")) {
    return "Your email address has not been confirmed yet. Please check your inbox or ask your administrator to verify your account.";
  }

  // 7. Password constraints
  if (lowerMsg.includes("password should be at least")) {
    return "Password must be at least 6 characters long.";
  }

  // 8. Network / connectivity errors
  if (lowerMsg.includes("fetch failed") || lowerMsg.includes("failed to fetch") || lowerMsg.includes("network error")) {
    return "Unable to connect to the authentication server. Please check your internet connection.";
  }

  return message || "An unexpected error occurred. Please try again.";
}

/**
 * Validates basic email formatting.
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  // Standard RFC 5322 compliant regex simplified for web input
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
