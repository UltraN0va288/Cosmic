let inFrame;

try {
  inFrame = window !== top;
} catch (e) {
  inFrame = true;
}

if (!inFrame && !navigator.userAgent.includes("Firefox")) {
  const popup = open("about:blank", "_blank");
  if (popup && !popup.closed) {
    const doc = popup.document;
    const iframe = doc.createElement("iframe");
    const style = iframe.style;
    const link = doc.createElement("link");

    const name = localStorage.getItem("name") || "Courses";
    const icon =
      localStorage.getItem("icon") ||
      "https://raw.githubusercontent.com/UltraN0va288/Cosmic/main/static/assets/media/favicon/schoology.png";

    doc.title = name;
    link.rel = "icon";
    link.href = icon;

    iframe.src = location.href;
    style.position = "fixed";
    style.top = style.bottom = style.left = style.right = 0;
    style.border = style.outline = "none";
    style.width = style.height = "100%";

    doc.head.appendChild(link);
    doc.body.appendChild(iframe);

    const pLink =
      localStorage.getItem(encodeURI("pLink")) || "https://www.nasa.gov/";
    location.replace(pLink);

    const script = doc.createElement("script");
    script.textContent = `
      window.onbeforeunload = function (event) {
        const confirmationMessage = 'Leave Site?';
        (event || window.event).returnValue = confirmationMessage;
        return confirmationMessage;
      };
    `;
    doc.head.appendChild(script);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  if (window.localStorage.getItem("v4Particles") === "true") {
    const particlesConfig = {
      particles: {
        number: { value: 130, density: { enable: true, value_area: 700 } },
        color: { value: ["#8b5cf6", "#06b6d4", "#14b8a6"] },
        shape: { type: "circle" },
        opacity: { value: 0.8, random: true },
        size: { value: 3, random: true },
        line_linked: { enable: false },
        move: {
          enable: true,
          speed: 2,
          random: true,
          straight: false,
          out_mode: "out",
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: { onhover: { enable: true, mode: "repulse" }, resize: true },
        modes: { repulse: { distance: 60, duration: 0.4 } },
      },
      retina_detect: true,
    };

    if (typeof particlesJS === "function") {
      particlesJS("particles-js", particlesConfig);
    }
  }

  if (window.AccessControl) {
    try {
      await window.AccessControl.registerDevice();
    } catch (error) {
      console.warn("Device registration failed:", error);
    }
  }

  const welcomeName = localStorage.getItem("deviceUsername");
  if (!welcomeName) {
    const createdName = prompt(
      "Set a quick username for this device (for admin tracking):",
    );
    if (createdName && createdName.trim()) {
      localStorage.setItem("deviceUsername", createdName.trim().slice(0, 40));
      if (window.AccessControl) {
        try {
          await window.AccessControl.registerDevice();
        } catch {
          // ignore
        }
      }
    }
  }
});

const splashtext = [
  "Thanks for using the site",
  "Check out the settings page",
  "Make sure to star the Github Repo!",
];
const splashNode = document.getElementById("splash");
if (splashNode) {
  splashNode.innerHTML =
    splashtext[Math.floor(Math.random() * splashtext.length)];
}

window.addEventListener("load", () => {
  navigator.serviceWorker.register("../sw.js?v=4", {
    scope: "/a/",
  });
});
