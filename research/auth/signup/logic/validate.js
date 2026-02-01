// js/signup/logic/validate.js
import { uiRefs } from "../core/state.js";
import { clearAllErrors, setError, setMessage } from "../ui/messages.js";
import { readFormIntoState } from "../data/formState.js";

export function validateStep(stepId) {
  clearAllErrors();
  setMessage("");

  readFormIntoState();

  const d = uiRefs.state.data;
  const role = uiRefs.state.role;

  const required = (name, value, message = "This field is required.") => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      setError(name, message);
      return false;
    }
    return true;
  };

  if (stepId === "role") {
    return required("role", role, "Please select a role.");
  }

  if (stepId === "account") {
    let ok = true;
    ok = required("email", d.email, "Enter a valid email.") && ok;
    ok = required("password", d.password, "Password is required.") && ok;

    if (d.password && d.password.length < 8) {
      setError("password", "Must be at least 8 characters.");
      ok = false;
    }

    ok = required("confirmPassword", d.confirmPassword, "Please confirm password.") && ok;

    if (d.password && d.confirmPassword && d.password !== d.confirmPassword) {
      setError("confirmPassword", "Passwords do not match.");
      ok = false;
    }
    return ok;
  }

  if (stepId === "profile") {
    let ok = true;
    ok = required("fullName", d.fullName) && ok;
    ok = required("phone", d.phone) && ok;
    return ok;
  }

  if (role === "provider" && stepId === "providerProfessional") {
    let ok = true;
    ok = required("category", d.category, "Please choose a category.") && ok;
    ok = required("experienceYears", d.experienceYears, "Enter years of experience.") && ok;
    ok = required("bio", d.bio, "Please write a short bio.") && ok;
    return ok;
  }

  if (role === "provider" && stepId === "providerRequirements") {
    let ok = true;
    ok = required("govId", d.govId, "Government ID is required.") && ok;
    return ok;
  }

  if (role === "provider" && stepId === "providerAvailability") {
    let ok = true;

    if (!d.days || d.days.length === 0) {
      setMessage("Please select at least one available day.", "warn");
      ok = false;
    }

    ok = required("timeFrom", d.timeFrom, "Select start time.") && ok;
    ok = required("timeTo", d.timeTo, "Select end time.") && ok;

    if (d.timeFrom && d.timeTo && d.timeFrom >= d.timeTo) {
      setMessage("End time must be later than start time.", "warn");
      ok = false;
    }

    return ok;
  }

  if (role === "provider" && stepId === "providerReview") {
    if (!d.providerConfirm) {
      setError("providerConfirm", "Please confirm before submitting.");
      return false;
    }
    return true;
  }

  return true;
}
