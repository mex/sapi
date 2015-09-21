# sapi
Proxy for APIs to minimize downtime (sapi stands for "Stable API")

## Install
For local usage: `npm install`

For global usage: `npm install -g .`

_Note: You might want to check out [this article](https://github.com/sindresorhus/guides/blob/master/npm-global-without-sudo.md) to avoid `sudo`'ing global modules._

## Usage
If you just installed it locally, use `npm start` (optionally with an environment as first parameter).

If you installed it globally, there are several commands available.

 - `start`: Starts the proxy as detached
 - `stop`: Stops the proxy
 - `restart`: Run `stop` then `start`
 - `monitor`: Streams the log file to the console
 - `help`: Shows info on the above commands

The proxy will be hosted at `http://localhost:8008`.
