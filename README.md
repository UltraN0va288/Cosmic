<div align="center">
    <h1>Cosmic</h1>
    <p>Cosmic is a web proxy with a Clean and Sleek UI and easy to use menus.</p>
    <h2>Credit to InterstellarNetworks for the base and inspiration</h2>
</div>

> [!IMPORTANT]
> If you fork this project, consider giving it a star in the original repository!

## Features

<div align="center">

| Wide Collection of Games |  Tab Cloaking   | Wide collection of Apps |
| :----------------------: | :-------------: | :---------------------: |
|   About:Blank Cloaking   |   Fast Speeds   |   Built in Tab system   |
|         Clean UI         | Inspect Element |     Now.gg support      |
|   Password Protection    |     Themes      |   GeForce NOW support   |

</div>

## Deployment

> [!IMPORTANT]
> You **cannot** deploy to static web hosts, including Netlify, Cloudflare Pages, and GitHub Pages.

### Server Deployment

You must run these commands on your server:  
`git clone https://github.com/UltraN0va288/Cosmic`  
`cd Cosmic`  
`npm install`  
`npm start`

#### What happened to Replit Deployment?

As of January 1st, 2024, Replit is [no longer free](https://blog.replit.com/hosting-changes). Try GitHub Codespaces instead.

### GitHub Codespaces

1. Create a GitHub account if you haven't already.
2. Click "Code" (green button) and then "Create Codespace on main."
3. In the terminal at the bottom, paste `pnpm i && pnpm start`.
4. Respond to the application popup by clicking "Make public."
   > [!IMPORTANT]
   > Make sure you actually click the "Make public." button, or the proxy won't function properly.
5. Access the deployed website from the ports tab.
6. For subsequent uses in the same codespace, just run `pnpm start`

### Solution for if there is no popup.

1. Run `pnpm i`, and before `pnpm start`, prepend `PORT=8080`, replacing 8080 with another port. For example, `PORT=6969 pnpm start`.
2. If this does not work then you can prepend `$env:PORT=8080;`, replacing 8080 with another port. For example, `$env:PORT=6969; pnpm start`
3. Go to the ports tab, Click Forward A Port, And type the port number.
4. Right-click Visibility and set Port Visibility to Public.

## Report Issues

If you encounter problems, open an issue on GitHub, and we'll address it promptly.
