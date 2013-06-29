# node-configurine-client

[![Build Status](https://secure.travis-ci.org/mac-/node-configurine-client.png)](http://travis-ci.org/mac-/node-configurine-client)
[![NPM version](https://badge.fury.io/js/configurine-client.png)](http://badge.fury.io/js/configurine-client)
[![Dependency Status](https://david-dm.org/mac-/node-configurine-client.png)](https://david-dm.org/mac-/node-configurine-client)

## Installation

	npm install configurine-client

## Usage

This module exposes a constructor function for creating new instances of the configuring client. The constructor takes an options object with the following properties:

* `host` - the protocol, hostname, and port of the configurine instance
* `clientId` - the client ID to authenticate with
* `sharedKey` - the client's shared key
* `loggingFunction` - (optional) a function that has the following method signature: `loggingFunction(String loglevel, String message, [Object context])`

Here's an example:

```javascript
var ConfigurineClient = require('configurine-client');
var client = new ConfigurineClient({
	host: 'http://localhost:8088',
	clientId: 'myclient',
	sharedKey: 'a1c1f962-bc57-4109-8d49-bee9f562b321'
});
```

Each client instance exposes the publc methods outlined below.


### getConfigByName

Retrieves a collection of config entries by name. This is the method signature:

```
getConfigByName(String name, [Object options], Function callback)
```

where:

* `name` - is the name to use to query configurine
* `options` - is an optional object that contains additional data to filter the query by, where the following properties are allowed:
	* `isActive` - defaults to true if not provided, and tells configurine to only query for entries that have the isActive flag set to `true`
	* `associations` - an object that contains application and/or environment associations to filter the query by
* `callback` - a method that expects to recieve an error object as the first parameter and a results object as the second that will be invoked when the response returns from configurine.

Here's an example:

```javascript
var options = {
	isActive: true,
	associations: {
		applications: [{
			name: 'myapp',
			version: '1.0.0'
		}],
		environments: ['production']
	}
};

client.getConfigByName('loglevel', options, function(err, results) {
	console.log(results); // an array of config resources
});
```

## License

The MIT License (MIT) Copyright (c) 2013 Mac Angell

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
