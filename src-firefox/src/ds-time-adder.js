// handshake w background.js to make sure script is ready before doing anything
browser.runtime.sendMessage({ action: "dsScriptReady" });
let modalHandled = false;

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
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autofillForm") {
    const duration = request.videoDuration;
    const tabUrl = request.tabUrl;
    const title = request.title;
    const author = request.author !== undefined ? request.author : "Unknown Author";
    const extraData = (request.extraData || "");

    // Create a MutationObserver to watch for the "Add hours outside the platform" button
    const buttonObserver = new MutationObserver((mutations, buttonObserverInstance) => {
      console.log(
        "Dreaming Spanish Helper: Checking for 'Add hours outside the platform' button..."
      );

      const addHoursButton = [...document.querySelectorAll("button")].find(
        (btn) =>
          btn.textContent.trim().includes("Add time outside the platform")
      );

      if (addHoursButton) {
        // Stop observing once the button is found
        buttonObserverInstance.disconnect();

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
            if (modal && !modalHandled) {
              // know when to disconnect observer
              modalHandled = true;
              modalObserverInstance.disconnect();
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
                let message = `${title} || ${author} \n${tabUrl}`;
                if (extraData){
                  message = extraData + message;
                }
                simulateUserInput(descriptionInput, message);
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
        // auto-disconnect if no modal after 5 seconds
        setTimeout(() => modalObserver.disconnect(), 5000);
      }
    });

    // Start observing the DOM for the "Add hours outside the platform" button
    buttonObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    // auto-disconnect if no add hour button after 5 seconds
    setTimeout(() => buttonObserver.disconnect(), 5000);
  }
});


// CUSTOM PLAYBACK RATE SLIDER ///////////////////
window.onload = function () {
  function addPlackbackRateSlider() {
    const playbackMenu = document.querySelector(".shaka-playback-rates");

    const wrapper = document.createElement("div");
    wrapper.id = "playback-rate-slider-wrapper";
    //wrapper.style.display = "flex";
    //wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.padding = "8px 12px";
    wrapper.style.borderBottom = "1px solid rgba(255, 255, 255, 0.2)";
    wrapper.style.cursor = "pointer";
    wrapper.style.transition = "background-color";
    wrapper.style.fontSize = "12px";

    // slider label
    const label = document.createElement("span");
    label.textContent = "Custom speed:";
    label.style.color = "#EEEEEE";
    label.style.marginTop = "6px";
    label.style.marginBottom = "6px";
    label.style.marginLeft = "0px";
    label.style.fontSize = "12px";
    label.style.textAlign = "center";
    label.style.display = "flex";
    label.style.justifySelf = "center";

    // playback rate slider
    const slider = document.createElement("input");
    slider.id = "playback-rate-slider";
    slider.type = "range";
    slider.min = "0.25";
    slider.max = "2.5";
    slider.step = "0.05";
    slider.value = "1";
    slider.style.width = "80%";
    slider.style.height = "6px";
    slider.style.cursor = "pointer";
    slider.style.accentColor = "#EEEEEE";
    slider.style.margin = "10px auto";
   // slider.style.marginBottom = "6px";
    slider.style.display = "flex";
    slider.style.justifySelf = "center";

    // playback rate display
    const rateDisplay = document.createElement("span");
    rateDisplay.textContent = "1.00x";
    rateDisplay.style.color = "#EEEEEE";
    rateDisplay.style.fontSize = "12px";
    rateDisplay.style.marginTop = "6px";
    rateDisplay.style.marginLeft = "unset";
    rateDisplay.style.textAlign = "center";
    rateDisplay.style.display = "flex";
    rateDisplay.style.justifySelf = "center";

    // hide automatic checkmark
    const styleSheet = document.styleSheets[0]; 
    styleSheet.insertRule("#playback-rate-slider-wrapper i.material-icons-round.shaka-chosen-item { display: none !important }", 0);

    // store custom slider value 
    let customRate = parseFloat(slider.value);

    // video
    const video = document.querySelector(".shaka-video");
    addHoverEffect();

    function addHoverEffect(){
      // hover effect
      wrapper.addEventListener("mouseenter", () => {
        wrapper.style.backgroundColor = "hsla(0, 0%, 100%, 0.1)";
      });
      wrapper.addEventListener("mouseleave", () => {
        wrapper.style.backgroundColor = "";
      });
    }

    function applyCustomRate(rate) {
      video.playbackRate = rate;
      rateDisplay.textContent = Number.isInteger(rate) ? `${rate.toFixed(0)}x` : `${rate.toFixed(2)}x`;
    }

    // update rate while sliding
    slider.addEventListener("input", (e) => {
      e.stopPropagation();
      customRate = parseFloat(e.target.value);
      applyCustomRate(customRate);
    });

    // switch to custom rate upon clicking area
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.target === slider) return;
      applyCustomRate(customRate);
    });

    // update custom rate to default (1.0) upon double clicking
    slider.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      applyCustomRate(1);
      slider.value = 1;
    });

    // add slider elements to existing playback rate menu
    wrapper.appendChild(label);
    wrapper.appendChild(slider);
    wrapper.appendChild(rateDisplay);
    let firstChild = playbackMenu.firstChild;
    firstChild.style.paddingTop = "10px";

    // insert slider
    playbackMenu.insertBefore(wrapper, firstChild.nextSibling);
  }

  const targetNode = document.body;
  const config = {
    childList: true, // observe additions and removals of child nodes
    subtree: true    // observe changes in  entire subtree of the targetNode
  };
  let debounceTimeout;

  // wait until mutations die down to insert slider
  const callback = (mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {
        let playbackMenu = document.querySelector(".shaka-playback-rates");
        if (
          playbackMenu &&
          !document.getElementById("playback-rate-slider-wrapper") &&
          location.pathname.startsWith("/watch")
        ) {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            addPlackbackRateSlider();
          }, 500); 
        }
      }
    }
  };

  // start observing DOM for mutations
  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);   
}