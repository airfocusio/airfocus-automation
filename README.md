# airfocus-automation

Kickstart your own [airfocus](http://airfocus.com/) automation handler with ease!

## Getting started

- Log into your airfocus account and create an API key in your account settings (API keys are only available in higher tier plans).
- Clone this repository.
- Run the following preparational steps:
  ```bash
  npm ci
  npm run init -- --name my-airfocus-automation
  cp .env.example .env
  # add correct values to .env file
  ```
- Implement your custom automation logic. You can find some examples [here](src/examples/).
- Test locally by running (using [ngrok](https://ngrok.com/) to make your local instance available from the public internet):
  ```bash
  npm start
  ```
- Publish as container image by running:
  ```bash
  npm run build-docker
  ```
- Deploy and run on your server. Make sure that you make it reachable via HTTPS with a valid certificate, for example by using a reverse proxy and Let's encrypt.
