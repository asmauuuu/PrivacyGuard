document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm")

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Get form values
    const fullName = document.getElementById("fullName").value.trim()
    const email = document.getElementById("signupEmail").value.trim()
    const signup_pwd = document.getElementById("signupPassword").value.trim()
    const confirm_pwd = document.getElementById("confirmPassword").value.trim()

    // Simple validation
    let isValid = true

    // Reset previous error messages
    clearErrors()

    // Validate full name
    if (fullName === "") {
      showError("fullName", "Full name is required")
      isValid = false
    }

    // Validate email
    if (email === "") {
      showError("signupEmail", "Email is required")
      isValid = false
    } else if (!isValidEmail(email)) {
      showError("signupEmail", "Please enter a valid email address")
      isValid = false
    }

    // Validate password
    if (signup_pwd === "") {
      showError("signupPassword", "Password is required")
      isValid = false
    } else if (signup_pwd.length < 8) {
      showError("signupPassword", "Password must be at least 8 characters long")
      isValid = false
    }

    // Validate confirm password
    if (confirm_pwd === "") {
      showError("confirmPassword", "Please confirm your password")
      isValid = false
    } else if (signup_pwd !== confirm_pwd) {
      showError("confirmPassword", "Passwords do not match")
      isValid = false
    }

    // If form is valid, proceed with signup
    if (isValid) {
      try {
        // const response = await fetch("http://localhost:5500/api/auth/register", {
        const response = await fetch("http://127.0.0.1:5000/sign-up", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          
          body: JSON.stringify({
            full_name: fullName,
            signup_email: email,
            signup_pwd: signup_pwd,
            confirm_pwd: confirm_pwd,
          }),
        })

        const data = await response.json();

        console.log(data);

        if (response.ok) {
          // Create success message
          const successMessage = document.createElement("div")
          successMessage.className = "success-message"
          successMessage.textContent = "Account created successfully! Redirecting to login.."

          // Insert success message at the top of the form
          signupForm.insertBefore(successMessage, signupForm.firstChild)

          // Redirect to verification page
          setTimeout(() => {
              window.location.href = "login"
          }, 2000)
        } else {
          showError("signupEmail", data.error || "Registration failed. Please try again.")
        }
      } catch (error) {
        console.error("Error:", error)
        showError("signupEmail", "An error occurred. Please try again later.")
      }
    }
  })

  // Function to validate email format
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Function to show error message
  function showError(inputId, message) {
    const input = document.getElementById(inputId)
    input.classList.add("error")

    // Create error message element
    const errorDiv = document.createElement("div")
    errorDiv.className = "error-message"
    errorDiv.textContent = message

    // Insert error message after the input
    input.parentNode.insertBefore(errorDiv, input.nextSibling)
  }

  // Function to clear all error messages
  function clearErrors() {
    // Remove error class from inputs
    const inputs = document.querySelectorAll(".error")
    inputs.forEach((input) => input.classList.remove("error"))

    // Remove error messages
    const errorMessages = document.querySelectorAll(".error-message")
    errorMessages.forEach((message) => message.remove())

    // Remove success message if exists
    const successMessage = document.querySelector(".success-message")
    if (successMessage) {
      successMessage.remove()
    }
  }
})
