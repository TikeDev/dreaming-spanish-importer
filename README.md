## What is this?

This is the source code for a Chrome extension (*Firefox extension to be updated soon!*) that adds a specialized button to YouTube, Spotify, Pocket Casts, Disney Plus, and Netflix for adding the video or podcast time to your Dreaming Spanish tracker.

## How do I use this?

You can download this repository and add the sourcecode to Chrome manually.


## Installation

1. Download this repository to your computer (click **'Download Zip'**) and unzip the file


<img width="450" alt="readme .zip file" src="https://github.com/user-attachments/assets/c19f64a2-9264-4a74-a5f5-93dbefed179c" />

2. Navigate to **chrome://extensions/**
3. In the top right, activate **'Developer mode'**


<img width="180" alt="developer mode enable option" src="https://github.com/user-attachments/assets/0a771f7f-f4de-4986-91fd-d642db6617b6" />

4. In the top left, click **'Load unpacked'**

<img width="250" alt="load unpacked extensions" src="https://github.com/user-attachments/assets/cc6d80cb-34ee-4563-9b13-4194ff202d37" />

5. Select the **'src-chrome'** folder in the unzipped folder that you downloaded from Step 1, and press **'Submit'**.


## How it Works
Open the video page or play a track on a supported web player and an <img width="24" alt="Ñ Dreaming Spanish add button" src="https://github.com/user-attachments/assets/4b63cd4f-3505-48f6-bae6-41062e0e77b0"/>
 button appears in the controls. When you click it, it captures the video/track info and the current timestamp and quickly opens a tab to automatically submit the info to your Dreaming Spanish "outside hours."

See **[demos](https://github.com/TikeDev/dreaming-spanish-importer/tree/main/demos)** for more screenshots!

<img width="420"  alt="Youtube Now Playing DS button" src="https://github.com/user-attachments/assets/67b49d5c-d1e4-4e18-84a2-addbac142e43" />


### Currently Supported Platforms
*"Now Playing" refers the controls of the page that shows the currently playing video or audio

| Platform Web Player  | Where the Button(s) Appears |
| ------------- | ------------- |
| Youtube  | "Now Playing", watch history page  |
| Spotify  | "Now Playing", podcast and audiobook pages  |
| Pocket Casts  | "Now Playing", listening history page  |
| Disney Plus  | "Now Playing"  |
| Netflix  | "Now Playing"  |


## Known Bugs/Issues
* Youtube - submitting from the Youtube watch history page doesn't capture the date it was watched. This is due to a limitation of the DS page not accepting automated user input on its date picker. At some point I'll switch the submit method with plain HTTP requests, which will fix this bug.
* Spotify - submitting a "Marked as Finished" (with a checkmark) track from a podcast or audiobook page does not capture the duration as it's not displayed in this case. Buttons for such tracks will appear as dimmed orange <img width="24" alt="Ñ Dreaming Spanish add button with warning" src="https://github.com/TikeDev/dreaming-spanish-importer/blob/main/src-chrome/images/dreamingplus-warn.png?raw=true"/> with a tooltip and a warning will be added to the DS entry's description for easy updating later.
* Firefox - even though there's a Firefox folder, most of the above features only apply to the Chrome version. Once I get the Chrome version to a known stable state I'll be able to create a Firefox version in no time.


## FAQ

> This is really annoying, why can't I just install it as an extension using the extension store?

Great question - I have a lot more features that I'm working on (file import, display, export etc) so I haven't submitted the extension to the store yet. Stay tuned!

> Why don't you have an **updated** Firefox version??

I'm currently building and testing this for Chrome and I want to get it to a known stable state before I create a Firefox version. Fortunately it shouldn't take too long once that happens. Again, stay tuned!

> How do I know this is safe and you aren't mining bitcoin on my computer?

Another great question! This is open source, so you can simply look at the files within this repository before you load them onto your browser. If you are not technically savvy,
I would recommend asking a friend to look at the code, or copying the code into ChatGPT and asking it if it sees anything nefarious.

> It didn't work and I'm angry!

It happens. Page layout changes in YouTube or Dreaming Spanish can cause this extension to no longer function properly. If this happens, please feel free
to open an issue on this repository and I will get to it as soon as I can.

> You should add X feature

I'd love to add more features to this. Please feel free to open an issue on this repository and I will be happy to get to it when I have the time.

Thanks to [jarmeister99](https://github.com/jarmeister99) and [MaciejWdev](https://github.com/MaciejWdev) for making their code available!
