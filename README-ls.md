# Lightstreams Wallet

Setup 
```
$ nvm use 10.16.3 
$ npm i
```

Run
```
$ ETH_MAINNET_RPC_ENDPOINT="https://mainnet.infura.io/v3/7958e7becf04414a80bee7e801ba73be" INFURA_PROJECT_ID="7958e7becf04414a80bee7e801ba73be" METAMASK_DEBUG="true" gulp dev
```

METAMASK_DEBUG - This sends error messages to sentry.io. The HTTP address the error events are sent to is hard coded in app/scripts/lib/setupRaven.js

## Add Custom Build to Chrome

* Open `Settings` > `Extensions`.
* Check "Developer mode".
* Alternatively, use the URL `chrome://extensions/` in your address bar
* At the top, click `Load Unpacked Extension`.
* Navigate to your `metamask-plugin/dist/chrome` folder.
* Click `Select`.

You now have the plugin, and can click 'inspect views: background plugin' to view its dev console.