document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Get form values
    const email = document.getElementById("email").value.trim()
    const password = document.getElementById("password").value.trim()

    // Simple validation
    let isValid = true

    // Reset previous error messages
    clearErrors()

    // Validate email/username
    if (email === "") {
      showError("email", "Username or email is required")
      isValid = false
    }

    // Validate password
    if (password === "") {
      showError("password", "Password is required")
      isValid = false
    }

    // If form is valid, proceed with login
    if (isValid) {
      try {
        // const response = await fetch("http://localhost:5500/api/auth/login", {
        const response = await fetch("http://127.0.0.1:5000/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        })

        const user_json = await fetch("http://127.0.0.1:5000/static/users.json", {
          method: "GET",
        })

        const data = await response.json()

        console.log(data);

        const user_json_data = await user_json.json()

        const userEmailIsValid = user_json_data.some(user => user.email.includes(data[0].email));
        const userPwdIsValid = user_json_data.some(user => user.password.includes(data[1].password));

        const message = document.createElement("div");

        if (response.ok) {
          // Create success message

          // Insert success message at the top of the form
          loginForm.insertBefore(message, loginForm.firstChild)

          // Store token in localStorage
          localStorage.setItem("token", data.token)
          localStorage.setItem("user_id", data.user_id)
          localStorage.setItem("name", data.name)

          // Redirect to dashboard page
          setTimeout(() => {
            if (userEmailIsValid && userPwdIsValid) {
              message.className = "success-message";
              message.textContent = "Login successful! Redirecting...";
              window.location.href = "dashboard"
            } else {
              message.className = "error-message-container";
              message.textContent = "Invalid Credentials";
            }
          }, 2000)
        } else {
          // Check if email verification is needed
          // if (data.needs_verification) {
          //   alert("Please verify your email before logging in.")
          //   window.location.href = `verify-email.html?email=${encodeURIComponent(data.email)}`
          // } else {
          //   showError("password", data.error || "Login failed. Please check your credentials.")
          // }
        }
      } catch (error) {
        console.error("Error:", error)
        showError("password", "An error occurred. Please try again later.")
      }
    }
  })

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
