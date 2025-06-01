document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    // Redirect to login if no token is found
    window.location.href = "login.html";
    return;
  }

  // Set username from localStorage if available
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      document.getElementById("username").textContent = userData.name || "User";
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }

  // Fetch user permissions from backend
  fetchUserPermissions();

  // Initialize the privacy chart
  initializeChart();

  // Add event listeners for suggestion card buttons
  setupSuggestionCards();

  // Add event listener for search functionality
  setupSearchFunctionality();

  // Add event listener for newsletter subscription
  setupNewsletterForm();
});

async function fetchUserPermissions() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:5500/api/permissions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch permissions');
    }

    const data = await response.json();
    displayPermissions(data.permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    showNotification('Error loading permissions. Please try again later.', 'error');
  }
}

function displayPermissions(permissions) {
  const appGrid = document.querySelector('.app-grid');
  
  // Clear existing app cards
  appGrid.innerHTML = '';
  
  if (!permissions || permissions.length === 0) {
    // Display message when no permissions are found
    appGrid.innerHTML = `
      <div class="no-permissions">
        <p>No app permissions found. Start by adding some apps to monitor.</p>
        <button class="btn-small">Add App</button>
      </div>
    `;
    return;
  }
  
  // Group permissions by app
  const appPermissions = {};
  
  permissions.forEach(permission => {
    if (!appPermissions[permission.app_name]) {
      appPermissions[permission.app_name] = [];
    }
    appPermissions[permission.app_name].push(permission);
  });
  
  // Create app cards for each app
  Object.keys(appPermissions).forEach(appName => {
    const appCard = document.createElement('div');
    appCard.className = 'app-card';
    
    // Determine app icon based on app name
    let iconClass = 'fa-mobile-alt';
    if (appName.toLowerCase().includes('message')) {
      iconClass = 'fa-comment';
    } else if (appName.toLowerCase().includes('camera')) {
      iconClass = 'fa-camera';
    } else if (appName.toLowerCase().includes('browser') || appName.toLowerCase().includes('safari')) {
      iconClass = 'fa-globe';
    } else if (appName.toLowerCase().includes('map')) {
      iconClass = 'fa-map-marker-alt';
    }
    
    appCard.innerHTML = `
      <div class="app-icon">
        <i class="fas ${iconClass}"></i>
      </div>
      <p>${appName}</p>
      <div class="permission-count">${appPermissions[appName].length} permissions</div>
    `;
    
    // Add click event to show permission details
    appCard.addEventListener('click', () => {
      showAppPermissionDetails(appName, appPermissions[appName]);
    });
    
    appGrid.appendChild(appCard);
  });
}

function showAppPermissionDetails(appName, permissions) {
  // Create modal for permission details
  const modal = document.createElement('div');
  modal.className = 'permission-modal';
  
  let permissionsHtml = '';
  permissions.forEach(permission => {
    const statusClass = permission.is_granted ? 'permission-granted' : 'permission-denied';
    const statusText = permission.is_granted ? 'Granted' : 'Denied';
    
    permissionsHtml += `
      <div class="permission-item">
        <div class="permission-name">${permission.permission_type}</div>
        <div class="permission-status ${statusClass}">${statusText}</div>
        <div class="permission-toggle">
          <label class="switch">
            <input type="checkbox" ${permission.is_granted ? 'checked' : ''} 
                   data-permission-id="${permission.id}">
            <span class="slider round"></span>
          </label>
        </div>
      </div>
    `;
  });
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${appName} Permissions</h2>
        <span class="close-modal">&times;</span>
      </div>
      <div class="modal-body">
        ${permissionsHtml}
      </div>
      <div class="modal-footer">
        <button class="btn-small">Save Changes</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  
  // Close modal when clicking the close button
  modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  });
  
  // Handle permission toggle changes
  modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const permissionId = e.target.dataset.permissionId;
      const isGranted = e.target.checked;
      
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5500/api/permissions/${permissionId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            is_granted: isGranted
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update permission');
        }
        
        // Update UI to reflect the change
        const statusElement = checkbox.closest('.permission-item').querySelector('.permission-status');
        statusElement.textContent = isGranted ? 'Granted' : 'Denied';
        statusElement.className = `permission-status ${isGranted ? 'permission-granted' : 'permission-denied'}`;
        
        showNotification(`Permission ${isGranted ? 'granted' : 'revoked'} successfully`, 'success');
      } catch (error) {
        console.error('Error updating permission:', error);
        // Revert checkbox state
        checkbox.checked = !isGranted;
        showNotification('Failed to update permission. Please try again.', 'error');
      }
    });
  });
  
  // Handle save changes button
  modal.querySelector('.btn-small').addEventListener('click', () => {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
    
    // Refresh permissions after changes
    fetchUserPermissions();
  });
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Show notification with animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Auto-hide notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

function initializeChart() {
  const ctx = document.getElementById("privacyChart").getContext("2d");

  // Sample data for the chart
  const data = {
    labels: ["Location", "Camera", "Microphone", "Contacts", "Storage", "Calendar"],
    datasets: [
      {
        label: "Permission Access Frequency",
        data: [65, 40, 55, 30, 45, 20],
        backgroundColor: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#8b5cf6"],
        borderColor: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#8b5cf6"],
        borderWidth: 1,
      },
    ],
  };

  // Chart configuration
  const config = {
    type: "bar",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Access Count",
          },
        },
        x: {
          title: {
            display: true,
            text: "Permission Type",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: "Permission Access Frequency",
          font: {
            size: 16,
          },
        },
      },
    },
  };

  // Create the chart
  new Chart(ctx, config);
}

function setupSuggestionCards() {
  // Get all suggestion cards
  const suggestionCards = document.querySelectorAll(".suggestion-card");

  // Add event listeners to each card's buttons
  suggestionCards.forEach((card, index) => {
    const reviewBtn = card.querySelector("button:nth-child(1)");
    const dismissBtn = card.querySelector("button:nth-child(2)");
    const snoozeBtn = card.querySelector("button:nth-child(3)");

    // Review button
    reviewBtn.addEventListener("click", () => {
      // In a real app, this would navigate to the permission review page
      showNotification(`Navigating to review page for suggestion ${index + 1}`, 'info');
    });

    // Dismiss button
    dismissBtn.addEventListener("click", () => {
      // Remove the card with a fade-out animation
      card.style.opacity = "0";
      card.style.transition = "opacity 0.3s ease";

      setTimeout(() => {
        card.style.display = "none";
      }, 300);
    });

    // Snooze button
    snoozeBtn.addEventListener("click", () => {
      // In a real app, this would hide the suggestion temporarily
      showNotification(`Suggestion ${index + 1} snoozed for 24 hours`, 'info');

      // Hide the card
      card.style.opacity = "0";
      card.style.transition = "opacity 0.3s ease";

      setTimeout(() => {
        card.style.display = "none";
      }, 300);
    });
  });
}

function setupSearchFunctionality() {
  document.querySelector(".search-bar input").addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const appCards = document.querySelectorAll(".app-card");

    appCards.forEach((card) => {
      const appName = card.querySelector("p").textContent.toLowerCase();

      if (appName.includes(searchTerm)) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  });
}

function setupNewsletterForm() {
  const newsletterForm = document.querySelector(".newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const emailInput = this.querySelector("input[type='email']");
      const email = emailInput.value.trim();

      if (email) {
        showNotification(`Thank you for subscribing with ${email}!`, 'success');
        emailInput.value = "";
      } else {
        showNotification('Please enter a valid email address.', 'error');
      }
    });
  }
}