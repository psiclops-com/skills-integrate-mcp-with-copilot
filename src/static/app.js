document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  let allActivities = {};

  function getCategory(details) {
    // Simple category assignment based on description or name
    const name = details.name || "";
    const desc = details.description || "";
    if (/math|programming|chess|debate/i.test(name + desc)) return "Academic";
    if (/soccer|basketball|gym|sports/i.test(name + desc)) return "Sports";
    if (/art|drama/i.test(name + desc)) return "Arts";
    return "Other";
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderActivities() {
    // Get filter/sort/search values
    const searchValue = (document.getElementById("search-activities")?.value || "").toLowerCase();
    const filterCategory = document.getElementById("filter-category")?.value || "";
    const sortValue = document.getElementById("sort-activities")?.value || "name";

    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    let entries = Object.entries(allActivities).map(([name, details]) => {
      return { name, ...details, category: getCategory({ name, ...details }) };
    });

    // Filter by category
    if (filterCategory) {
      entries = entries.filter((a) => a.category === filterCategory);
    }
    // Search by name/description
    if (searchValue) {
      entries = entries.filter(
        (a) =>
          a.name.toLowerCase().includes(searchValue) ||
          a.description.toLowerCase().includes(searchValue)
      );
    }
    // Sort
    if (sortValue === "name") {
      entries.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortValue === "schedule") {
      entries.sort((a, b) => a.schedule.localeCompare(b.schedule));
    } else if (sortValue === "spots") {
      entries.sort(
        (a, b) =>
          (b.max_participants - b.participants.length) -
          (a.max_participants - a.participants.length)
      );
    }

    if (entries.length === 0) {
      activitiesList.innerHTML = "<p>No activities found.</p>";
      return;
    }

    entries.forEach((details) => {
      const name = details.name;
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <p><strong>Category:</strong> ${details.category}</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;
      activitiesList.appendChild(activityCard);

      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Toolbar event listeners
  document.getElementById("search-activities")?.addEventListener("input", renderActivities);
  document.getElementById("filter-category")?.addEventListener("change", renderActivities);
  document.getElementById("sort-activities")?.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});
