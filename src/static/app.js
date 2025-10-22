document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const signupButton = signupForm.querySelector("button[type=submit]");

  // Modal elements for confirmations
  const confirmModal = document.getElementById("confirm-modal");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmOk = document.getElementById("confirm-ok");
  const confirmCancel = document.getElementById("confirm-cancel");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add participants section (pretty list with avatars)
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants-list";

        const participantsTitle = document.createElement("p");
        participantsTitle.innerHTML = "<strong>Participants:</strong>";
        participantsContainer.appendChild(participantsTitle);

        const ul = document.createElement("ul");

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            // create a simple avatar from the start of the email/name
            const initials = (p.split("@")[0] || p).replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase();
            avatar.textContent = initials || "?";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = p;

            // delete button/icon
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "participant-delete";
            deleteBtn.title = "Unregister participant";
            deleteBtn.innerHTML = "&times;"; // simple × icon

            // click handler to unregister using modal confirmation
            deleteBtn.addEventListener("click", () => {
              // show modal
              confirmMessage.textContent = `Unregister ${p} from ${name}?`;
              confirmModal.classList.remove("hidden");

              // ok handler
              const onOk = async () => {
                // close modal
                confirmModal.classList.add("hidden");
                confirmOk.removeEventListener("click", onOk);
                confirmCancel.removeEventListener("click", onCancel);

                try {
                  const resp = await fetch(
                    `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                    { method: "DELETE" }
                  );

                  const result = await resp.json();
                  if (resp.ok) {
                    // remove li from DOM
                    li.remove();
                    // refresh activities to update counts and lists
                    fetchActivities();
                  } else {
                    alert(result.detail || "Failed to unregister participant");
                  }
                } catch (err) {
                  console.error("Error unregistering:", err);
                  alert("Failed to unregister participant");
                }
              };

              const onCancel = () => {
                confirmModal.classList.add("hidden");
                confirmOk.removeEventListener("click", onOk);
                confirmCancel.removeEventListener("click", onCancel);
              };

              confirmOk.addEventListener("click", onOk);
              confirmCancel.addEventListener("click", onCancel);
            });

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        }

        participantsContainer.appendChild(ul);
        activityCard.appendChild(participantsContainer);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    // disable the signup button to prevent duplicate submissions
    if (signupButton) {
      signupButton.disabled = true;
      signupButton.setAttribute("aria-busy", "true");
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh the activities so the newly-signed-up participant appears
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

    // re-enable the signup button
    if (signupButton) {
      signupButton.disabled = false;
      signupButton.removeAttribute("aria-busy");
    }
  });

  // Initialize app
  fetchActivities();
});
