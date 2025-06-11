// Function to simulate user input more thoroughly
function simulateUserInput(element, value) {
  element.focus();

  // Set the value
  element.value = value;

  // Dispatch input event
  const inputEvent = new Event("input", { bubbles: true });
  element.dispatchEvent(inputEvent);

  // Dispatch change event
  const changeEvent = new Event("change", { bubbles: true });
  element.dispatchEvent(changeEvent);

  // Optionally, dispatch a blur event to simulate leaving the input field
  const blurEvent = new Event("blur", { bubbles: true });
  element.dispatchEvent(blurEvent);
}

// Listen for messages from the background or other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autofillForm") {
    const duration = request.videoDuration;
    const tabUrl = request.tabUrl;
    const title = request.title;
    const author = request.author !== undefined ? request.author : "Unknown Author";

    // Create a MutationObserver to watch for the "Add hours outside the platform" button
    const observer = new MutationObserver((mutations, observerInstance) => {
      console.log(
        "Dreaming Spanish Helper: Checking for 'Add hours outside the platform' button..."
      );

      const addHoursButton = [...document.querySelectorAll("button")].find(
        (btn) =>
          btn.textContent.trim().includes("Add time outside the platform")
      );

      if (addHoursButton) {
        // Stop observing once the button is found
        observerInstance.disconnect();

        // Simulate a click on the "Add hours outside the platform" button
        addHoursButton.click();
        console.log(
          "Dreaming Spanish Helper: Clicked 'Add time outside the platform' button."
        );

        // Now observe the DOM for the modal to appear
        const modalObserver = new MutationObserver(
          (mutations, modalObserverInstance) => {
            console.log("Dreaming Spanish Helper: Checking for modal...");

            // Adjust the selector based on the actual modal structure
            const modal = document.querySelector(".modal"); // Replace with the actual modal selector if different
            if (modal) {
              console.log("Dreaming Spanish Helper: Modal found!");

              // Stop observing once the modal is found
              modalObserverInstance.disconnect();

              // Input the video duration into the 'timeMinutes' field
              const timeMinutesInput = modal.querySelector('input[name="timeMinutes"]');
              
              if (timeMinutesInput) {
                simulateUserInput(timeMinutesInput, duration);
              } else {
                console.error(
                  "Dreaming Spanish Helper: 'timeMinutes' input field not found."
                );
                return; // Exit if the input field isn't found
              }

              const descriptionInput = modal.querySelector('textarea[name="description"]');
              
              if (descriptionInput) {
                // Title first to make it show in preview table
                simulateUserInput(descriptionInput, `${title} || ${author} \n${tabUrl}`);
              } else {
                console.error("Dreaming Spanish Helper: 'description' input field not found.");
                return; // Exit if the input field isn't found
              }

              // Find and click the 'save' button
              const saveButton = [...modal.querySelectorAll("button")].find(
                (btn) => btn.textContent.trim().toLowerCase() === "save"
              );

              if (saveButton) {
                saveButton.click();
              } else {
                console.error("Dreaming Spanish Helper: 'save' button not found.");
              }
              window.close();
            }
          }
        );

        // Start observing the DOM for the modal to appear
        modalObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
    });

    // Start observing the DOM for the "Add hours outside the platform" button
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
});
