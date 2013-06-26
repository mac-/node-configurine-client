var request = require('request'),
	qs = require('querystring'),
	crypto = require('crypto'),
	noop = function(){};

module.exports = function ConfigurineClient(options) {

	options = options || {};
	var configurineHost = options.host || '',
		clientId = options.clientId || '',
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

		};

	this.getConfigByName = function(names, opts, callback) {
		var isActive = opts.isActive || true,
			associations = opts.associations || { applications: [], environments: [] },
			convertAssociations = function(associations) {
				var strAssociations = [];
				associations.applications.forEach(function(item) {
					strAssociations.push('application|' + item.name + '|' + item.version);
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
				callback(null, body);
			};

		associations.applications = associations.applications || [];
		associations.environments = associations.environments || [];

		getToken(clientId, sharedKey, function(err, accessToken) {
			if (err) {
				return callback(err);
			}
			var namesQs = (names.length > 0) ? '&' + qs.stringify({names: names}) : '';
			var associationsQs = (associations.applications.length > 0 || associations.environments.length > 0) ? '&' + qs.stringify({associations: convertAssociations(associations)}) : '';
			var url = configurineHost + '/config?isActive=' + isActive + namesQs + associationsQs;
			log('debug', 'Issuing request to: ' + url);
			request.get({
				url: url,
				headers: {
					'content-type': 'application/json',
					'authorization': accessToken
				}
			}, handleGetConfig);

		});

	};
};

