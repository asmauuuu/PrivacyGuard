document.addEventListener("DOMContentLoaded", () => {
  const verificationForm = document.getElementById("verificationForm")
  const resendCodeBtn = document.getElementById("resendCode")
  const countdownElement = document.getElementById("countdown")
  const timerElement = document.getElementById("timer")
  const codeInputs = document.querySelectorAll(".verification-code input")

  // Get email from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const email = urlParams.get("email")

  if (!email) {
    alert("Email parameter is missing. Please go back to the login page.")
    window.location.href = "login.html"
  }

  // Auto-focus and navigate between code inputs
  codeInputs.forEach((input, index) => {
    // Auto-focus first input
    if (index === 0) {
      input.focus()
    }

    input.addEventListener("keyup", (e) => {
      if (e.key >= 0 && e.key <= 9) {
        // Move to next input
        if (index < codeInputs.length - 1) {
          codeInputs[index + 1].focus()
        }
      } else if (e.key === "Backspace") {
        // Move to previous input
        if (index > 0) {
          codeInputs[index - 1].focus()
        }
      }
    })

    // Handle paste event
    input.addEventListener("paste", (e) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData("text")
      if (/^\d+$/.test(pastedData) && pastedData.length <= codeInputs.length) {
        for (let i = 0; i < pastedData.length; i++) {
          if (index + i < codeInputs.length) {
            codeInputs[index + i].value = pastedData[i]
          }
        }
        // Focus on the next empty input or the last one
        const nextIndex = Math.min(index + pastedData.length, codeInputs.length - 1)
        codeInputs[nextIndex].focus()
      }
    })
  })

  // Handle form submission
  verificationForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Collect verification code
    let verificationCode = ""
    codeInputs.forEach((input) => {
      verificationCode += input.value
    })

    if (verificationCode.length !== 6) {
      alert("Please enter all 6 digits of the verification code.")
      return
    }

    try {
      const response = await fetch("http://localhost:5500/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Email verified successfully! You can now log in.")
        window.location.href = "login.html"
      } else {
        alert(data.error || "Verification failed. Please try again.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred. Please try again later.")
    }
  })

  // Handle resend code
  let cooldown = false
  let secondsLeft = 30

  resendCodeBtn.addEventListener("click", async (e) => {
    e.preventDefault()

    if (cooldown) {
      return
    }

    try {
      const response = await fetch("http://localhost:5500/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("A new verification code has been sent to your email.")

        // Start cooldown
        cooldown = true
        countdownElement.style.display = "block"
        secondsLeft = 30
        timerElement.textContent = secondsLeft

        const countdownInterval = setInterval(() => {
          secondsLeft--
          timerElement.textContent = secondsLeft

          if (secondsLeft <= 0) {
            clearInterval(countdownInterval)
            cooldown = false
            countdownElement.style.display = "none"
          }
        }, 1000)
      } else {
        alert(data.error || "Failed to resend verification code. Please try again.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred. Please try again later.")
    }
  })
})
