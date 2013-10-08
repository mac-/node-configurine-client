var request = require('request'),
	qs = require('querystring'),
	crypto = require('crypto'),
	noop = function(){
		"use strict";
	};

module.exports = function ConfigurineClient(options) {
	"use strict";
	options = options || {};
	var configurineHost = options.host || '',
		_clientId = options.clientId || '',
		sharedKey = options.sharedKey || '',
		log = options.loggingFunction || noop,
		savedToken = '::0:',
		generateSignature = function(data, key) {
			return crypto.createHmac('sha1', key).update(data).digest('hex');
		},
		isTokenExpired = function(token) {
			return (new Date().getTime() > parseInt(token.split(':')[2], 10) - 10000);
		},
		getToken = function(clientId, sharedKey, callback) {
			if (!isTokenExpired(savedToken)) {
				log('debug', 'Token in memory is not yet expired - reusing it.');
				return callback(null, savedToken);
			}
			var timestamp = new Date().getTime(),
				signature = generateSignature(clientId + ':' + timestamp, sharedKey),
				handleGetToken = function (err, response, body) {
					if (err) {
						return callback(err);
					}
					var bodyObj;
					try {
						bodyObj = JSON.parse(body);
					}
					catch (ex) {
						log('error', 'Failed to parse reponse body.', body);
						bodyObj = null;
					}
					if (!bodyObj) {
						return callback(new Error('Unable to get an access token'));
					}
					if (bodyObj.hasOwnProperty('code') || !bodyObj.hasOwnProperty('access_token')) {
						return callback(new Error(body));
					}
					savedToken = bodyObj.access_token;
					callback(null, savedToken);
				};

			request.post({
				url: configurineHost + '/token',
				form: {
					grant_type: 'client_credentials',
					client_id: clientId,
					signature: signature,
					timestamp: timestamp
				}
			}, handleGetToken);

		},
		_this = this;

	this.getConfigByName = function(names, opts, callback) {
		if (typeof opts  === 'function') {
			callback = opts;
			opts = {};
		}
		if (!names || !callback) {
			throw new Error('Missing parameters');
		}
		var isActive = opts.isActive || true,
			associations = opts.associations || { applications: [], environments: [] },
			convertAssociations = function(associations) {
				var strAssociations = [];
				associations.applications.forEach(function(item) {
					if (item.hasOwnProperty('versions')) {
						item.versions.forEach(function(version) {
							strAssociations.push('application|' + item.name + '|' + version);
						});
					}
				});
				associations.environments.forEach(function(item) {
					strAssociations.push('environment|' + item);
				});
				return strAssociations;
			},
			handleGetConfig = function(err, response, body) {
				if (err) {
					return callback(err);
				}
				var bodyObj;
				try {
					bodyObj = JSON.parse(body);
				}
				catch (ex) {
					log('error', 'Failed to parse reponse body.', body);
					bodyObj = null;
				}
				if (!bodyObj) {
					return callback(new Error('Unable to get a config entry'));
				}
				if (bodyObj.hasOwnProperty('code')) {
					return callback(new Error(JSON.stringify(body)));
				}
				callback(null, bodyObj);
			};

		associations.applications = associations.applications || [];
		associations.environments = associations.environments || [];

		getToken(_clientId, sharedKey, function(err, accessToken) {
			if (err) {
				return callback(err);
			}
			var namesQs = (names.length > 0) ? '&' + qs.stringify({names: names}) : '';
			var associationsQs = (associations.applications.length > 0 || associations.environments.length > 0) ? '&' + qs.stringify({associations: convertAssociations(associations)}) : '';
			var url = configurineHost + '/config?isActive=' + isActive + namesQs + associationsQs;
			log('debug', 'Issuing GET request to: ' + url);
			request.get({
				url: url,
				headers: {
					'content-type': 'application/json',
					'authorization': accessToken
				}
			}, handleGetConfig);

		});

	};

	this.createConfig = function(resource, callback) {
		if (!resource || !callback) {
			throw new Error('Missing parameters');
		}
		var handlePostConfig = function(err, response, body) {
			if (err) {
				return callback(err);
			}
			if (response.statusCode !== 201) {
				return callback(new Error(JSON.stringify(body)));
			}
			var loc = response.headers.location;
			callback(null, loc.substr(loc.lastIndexOf('/')+1));
		};
		getToken(_clientId, sharedKey, function(err, accessToken) {
			if (err) {
				return callback(err);
			}
			var url = configurineHost + '/config';
			log('debug', 'Issuing POST request to: ' + url);
			request.post({
				url: url,
				json: resource,
				headers: {
					'authorization': accessToken
				}
			}, handlePostConfig);

		});
	};

	this.getConfigById = function(id, callback) {
		if (!id || !callback) {
			throw new Error('Missing parameters');
		}
		var handleGetConfig = function(err, response, body) {
			if (err) {
				return callback(err);
			}
			if (response.statusCode !== 200) {
				return callback(new Error(JSON.stringify(body)));
			}
			var bodyObj;
			try {
				bodyObj = JSON.parse(body);
			}
			catch (ex) {
				log('error', 'Failed to parse reponse body.', body);
				bodyObj = null;
			}
			if (!bodyObj) {
				return callback(new Error('Unable to get a config entry'));
			}
			callback(null, bodyObj);
		};
		getToken(_clientId, sharedKey, function(err, accessToken) {
			if (err) {
				return callback(err);
			}
			var url = configurineHost + '/config/' + id;
			log('debug', 'Issuing GET request to: ' + url);
			request.get({
				url: url,
				headers: {
					'content-type': 'application/json',
					'authorization': accessToken
				}
			}, handleGetConfig);

		});
	};

	this.updateConfigById = function(id, resource, callback) {
		if (!id || !resource || !callback) {
			throw new Error('Missing parameters');
		}
		var handlePutConfig = function(err, response, body) {
			if (err) {
				return callback(err);
			}
			if (response.statusCode !== 204) {
				return callback(new Error(JSON.stringify(body)));
			}
			callback(null, true);
		};
		getToken(_clientId, sharedKey, function(err, accessToken) {
			if (err) {
				return callback(err);
			}
			var url = configurineHost + '/config/' + id;
			log('debug', 'Issuing PUT request to: ' + url);
			request.put({
				url: url,
				json: resource,
				headers: {
					'authorization': accessToken
				}
			}, handlePutConfig);

		});
	};

	this.removeConfigById = function(id, callback) {
		if (!id || !callback) {
			throw new Error('Missing parameters');
		}
		var handleDeleteConfig = function(err, response, body) {
			if (err) {
				return callback(err);
			}
			if (response.statusCode !== 204) {
				return callback(new Error(JSON.stringify(body)));
			}
			callback(null, true);
		};
		getToken(_clientId, sharedKey, function(err, accessToken) {
			if (err) {
				return callback(err);
			}
			var url = configurineHost + '/config/' + id;
			log('debug', 'Issuing DELETE request to: ' + url);
			request.del({
				url: url,
				headers: {
					'content-type': 'application/json',
					'authorization': accessToken
				}
			}, handleDeleteConfig);

		});
	};

	//***********************admin specific calls *********************//
	this.createClient = function(clientId, email, callback) {
		if (!clientId || !email || !callback) {
			throw new Error('Missing parameters');
		}
		var postBody = {
			"clientId" : clientId,
			"email" : email
		};
		var handleAddClient = function(err, response, body) {
			if (err) {
				return callback(err);
			}
			if (response.statusCode !== 201) {
				return callback(new Error(JSON.stringify(body)));
			}
			callback(null, response.headers.location);
		};

		var url = configurineHost + '/clients';
		log('debug', 'Issuing post CLIENTS request to: ' + url);
		request.post({
			url: url,
			json: postBody,
			headers: {
				'content-type': 'application/json'
			}
		}, handleAddClient);
	};

	this.getClientById = function(clientId, callback) {
		if (!clientId || !callback) {
			throw new Error('Missing parameters');
		}
		var handleGetClient = function(err, response, body) {
			if (err) {
				return callback(err);
			}
			if (response.statusCode !== 200) {
				return callback(new Error(JSON.stringify(body)));
			}
			//dont know why but typeof here is a string....
			callback(null, JSON.parse(body));
		};
		getToken(_clientId, sharedKey, function(err, accessToken) {
			if (err) {
				return callback(err);
			}
			var url = configurineHost + '/clients/' + clientId;
			log('debug', 'Issuing get CLIENTS request to: ' + url);
			request.get({
				url: url,
				headers: {
					'content-type': 'application/json',
					'authorization' : accessToken
				}
			}, handleGetClient);
		});
	};

	this.updateClientById = function(clientId, email, isConfirmed, isAdmin, callback) {
		if (!clientId || !email ||
				typeof isAdmin !== 'boolean' || typeof isConfirmed !== 'boolean' || !callback) {
			throw new Error('Missing parameters');
		}
		var handlePutClient = function(err, response, body) {
			if (err) {
				console.log(err);
				return callback(err);
			}
			if (response.statusCode !== 204) {
				return callback(new Error(JSON.stringify(body)));
			}
			callback(null, true);
		};

		getToken(_clientId, sharedKey, function(error, accessToken) {
			if (error) {
				return callback(error);
			}

			var url = configurineHost + '/clients/' + clientId;
			log('debug', 'Issuing put CLIENT request to: ' + url);
			request.put({
				url: url,
				json : {
					clientId : clientId,
					email : email,
					isConfirmed : isConfirmed,
					isAdmin : isAdmin
				},
				headers: {
					'content-type': 'application/json',
					'authorization' : accessToken
				}
			}, handlePutClient);
		});
	};

	this.deleteClientById = function(clientId, callback) {
		if (!clientId || !callback) {
			throw new Error('Missing parameters');
		}
		//if(clientId === clientId) {
		//	throw new Error('Cannot Delete Self');
		//}
		var handleDelClient = function(err, response, body) {
			if (err) {
				console.log(err);
				return callback(err);
			}
			if (response.statusCode !== 204) {
				return callback(new Error(JSON.stringify(body)));
			}
			callback(null, true);
		};

		getToken(_clientId, sharedKey, function(error, accessToken) {
			if (error) {
				return callback(error);
			}

			var url = configurineHost + '/clients/' + clientId;
			log('debug', 'Issuing delete CLIENT request to: ' + url);
			request.del({
				url: url,
				headers: {
					'content-type': 'application/json',
					'authorization' : accessToken
				}
			}, handleDelClient);
		});
	};
};

