var request = require('request'),
	qs = require('querystring'),
	crypto = require('crypto');

module.exports = function ConfigurineClient(options) {

	var configurineHost = 'http://10.252.4.158:8080',
		systemName = 'tesla',
		sharedKey = '73514',
		savedToken = ':::0:',
		generateSignature = function(data, key) {
			return crypto.createHmac('sha1', key).update(data).digest('hex');
		},
		isTokenExpired = function(token) {
			return (new Date().getTime() > parseInt(token.split(':')[3], 10) - 10000);
		},
		getToken = function(systemName, sharedKey, callback) {
			if (!isTokenExpired(savedToken)) {
				console.log(savedToken);
				return callback(null, savedToken);
			}
			var timestamp = new Date().getTime(),
				signature = generateSignature(systemName + ':' + timestamp, sharedKey),
				handleGetToken = function (err, response, body) {
					if (err) {
						return callback(err);
					}
					savedToken = JSON.parse(body).access_token;
					callback(null, savedToken);
				};

			request.post({
				url: configurineHost + '/token',
				form: {
					grant_type: 'system',
					system: systemName,
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
					strAssociations.push('environment|' + item.name);
				});
				return strAssociations;
			},
			handleGetConfig = function(err, response, body) {
				if (err) {
					return callback(err);
				}
				callback(null, body);
			};


		getToken(systemName, sharedKey, function(err, accessToken) {
			if (err) {
				return callback(err);
			}
			var namesQs = (names.length > 0) ? '&' + qs.stringify({names: names}) : '';
			var associationsQs = (associations.length > 0) ? '&' + qs.stringify({associations: convertAssociations(associations)}) : '';
			var url = configurineHost + '/config?isActive=' + isActive + namesQs + associationsQs;
			console.log(url);
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

