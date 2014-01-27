FoxyDB [![Build Status](https://travis-ci.org/shiftplanning/foxydb.png?branch=master)](https://travis-ci.org/shiftplanning/foxydb)
======

FoxyDB is a browser based graphical database driven reporting tool

Dependencies
------------
- node.js

Installation
------------
- Run `npm install` to install all node.js dependencies

Configuration
-------------
- Edit `config.js` file 

```javascript
exports.frontConfig = {
    allowRegister: true, //Allow users to register, not suitable for public installs, but good for intranets
	baseURL: 'http://www.foxydb.com/' //Return to homepage link
}

exports.application = {
	port: 8000, //Port on which the application will be served
	sessionSecret: 'foxy', //Session cookie secret
	packaged: true //Serve packaged production files, setto false for development and debug
}
```

Running
------------
- Run `node server.js` 
