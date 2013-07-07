var nock = require('nock'),
	_ = require('underscore'),
	assert = require('assert'),
	Client = require('../../lib/configurineClient.js'),
	clientOptions = {
		host: 'http://127.0.0.1:8080',
		clientId: 'fnord',
		sharedKey: 'a1c1f962-bc57-4109-8d49-bee9f562b321'
	},
	mockConfigObj = {
	    "id": "519bc51c9b9c05f772000001",
	    "name": "loglevel",
	    "value": "error",
	    "associations": {
	        "applications": [],
	        "environments": ["production"],
	    },
	    "isSensitive": false,
	    "isActive": true,
	    "owner": "myclient"
	},
	mockCreateConfigObj = {
	    "name": "loglevel",
	    "value": "error",
	    "associations": {
	        "applications": [],
	        "environments": ["production"],
	    },
	    "isSensitive": false,
	    "isActive": true
	},
	notFoundError = {
		code: 404,
		error: 'Not Found',
		message: 'Config entry not found'
	},
	badRequestError = {
		code: 400,
		error: 'Bad Request',
		message: 'Config entry malformed'
	},
	getMockAccessToken = function() {
		return {"access_token":"myclient:1371666627113:" + new Date().getTime() + 500000 + ":47a8cdf5560706874688726cb1b3e843783c0811"};
	};

describe('getConfigByName', function() {
	
	it('should get config by name', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).get('/config?isActive=true&names=loglevel').reply(200, [mockConfigObj]);

		client.getConfigByName('loglevel', function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isArray(result), 'should return an array as result');
			assert(_.isEqual(result[0], mockConfigObj), 'result should match expected object');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get config by name and associations', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).get('/config?isActive=true&names=loglevel&associations=application%7Cmyapp%7C1.0.0&associations=environment%7Cproduction').reply(200, [mockConfigObj]);
		var opts = {
			associations: {
				applications: [{
					name: 'myapp',
					version: '1.0.0'
				}],
				environments: ['production']
			}
		};

		client.getConfigByName('loglevel', opts, function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isArray(result), 'should return an array as result');
			assert(_.isEqual(result[0], mockConfigObj), 'result should match expected object');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get config by name and use cached token', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).get('/config?isActive=true&names=loglevel').reply(200, [mockConfigObj]);

		client.getConfigByName('loglevel', function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isArray(result), 'should return an array as result');
			assert(_.isEqual(result[0], mockConfigObj), 'result should match expected object');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');

			setTimeout(function() {
				mockConfig = nock(clientOptions.host).get('/config?isActive=true&names=loglevel').reply(200, [mockConfigObj]);

				client.getConfigByName('loglevel', function(err, result) {
					assert(!err, 'should not return an error');
					assert(_.isArray(result), 'should return an array as result');
					assert(_.isEqual(result[0], mockConfigObj), 'result should match expected object');
					assert(mockConfig.isDone(), 'should have satisfied mocked request');
					done();
				});
			}, 100);
			
		});
	});

	it('should get an error when configurine responds with a not found error', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).get('/config?isActive=true&names=loglevel').reply(404, notFoundError);

		client.getConfigByName('loglevel', function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error when configurine responds with an unexpected error', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).get('/config?isActive=true&names=loglevel').reply(500, 'Internal Sever Error');

		client.getConfigByName('loglevel', function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error the configurine responds with an error to the token call', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(404, notFoundError);

		client.getConfigByName('loglevel', function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error the configurine responds with an unexpected error to the token call', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(404, 'Internal Server Error');

		client.getConfigByName('loglevel', function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should throw an error if params are missing', function(done){

		client = new Client(clientOptions);

		assert.throws(client.getConfigByName, /Missing parameters/, 'should throw an error');
		done();
	});

});








describe('getConfigById', function() {
	
	it('should get config by id', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).get('/config/' + mockConfigObj.id).reply(200, mockConfigObj);

		client.getConfigById(mockConfigObj.id, function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isObject(result), 'should return an object as result');
			assert(_.isEqual(result, mockConfigObj), 'result should match expected object');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get config by id and use cached token', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).get('/config/' + mockConfigObj.id).reply(200, mockConfigObj);

		client.getConfigById(mockConfigObj.id, function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isObject(result), 'should return an object as result');
			assert(_.isEqual(result, mockConfigObj), 'result should match expected object');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');

			setTimeout(function() {
				mockConfig = nock(clientOptions.host).get('/config/' + mockConfigObj.id).reply(200, mockConfigObj);

				client.getConfigById(mockConfigObj.id, function(err, result) {
					assert(!err, 'should not return an error');
					assert(_.isObject(result), 'should return an object as result');
					assert(_.isEqual(result, mockConfigObj), 'result should match expected object');
					assert(mockConfig.isDone(), 'should have satisfied mocked request');
					done();
				});
			}, 100);
			
		});
	});

	it('should get an error when configurine responds with a not found error', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).get('/config/' + mockConfigObj.id).reply(404, notFoundError);

		client.getConfigById(mockConfigObj.id, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error when configurine responds with an unexpected 200', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).get('/config/' + mockConfigObj.id).reply(200, 'fnord');

		client.getConfigById(mockConfigObj.id, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error when configurine responds with an unexpected error', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).get('/config/' + mockConfigObj.id).reply(500, 'Internal Sever Error');

		client.getConfigById(mockConfigObj.id, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error the configurine responds with an error to the token call', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(404, notFoundError);

		client.getConfigById(mockConfigObj.id, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error the configurine responds with an unexpected error to the token call', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(404, 'Internal Server Error');

		client.getConfigById(mockConfigObj.id, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should throw an error if params are missing', function(done){

		client = new Client(clientOptions);

		assert.throws(client.getConfigById, /Missing parameters/, 'should throw an error');
		done();
	});

});







describe('createConfig', function() {
	
	it('should create config', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).post('/config').reply(201, '', {location: clientOptions.host + '/config/' + mockConfigObj.id});

		client.createConfig(mockCreateConfigObj, function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isString(result), 'should return a string as result');
			assert(_.isEqual(result, mockConfigObj.id), 'result should match expected string');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should create config and use cached token', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).post('/config').reply(201, '', {location: clientOptions.host + '/config/' + mockConfigObj.id});

		client.createConfig(mockCreateConfigObj, function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isString(result), 'should return a string as result');
			assert(_.isEqual(result, mockConfigObj.id), 'result should match expected string');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');

			setTimeout(function() {
				mockConfig = nock(clientOptions.host).post('/config').reply(201, '', {location: clientOptions.host + '/config/' + mockConfigObj.id});

				client.createConfig(mockCreateConfigObj, function(err, result) {
					assert(!err, 'should not return an error');
					assert(_.isString(result), 'should return a string as result');
					assert(_.isEqual(result, mockConfigObj.id), 'result should match expected string');
					assert(mockConfig.isDone(), 'should have satisfied mocked request');
					done();
				});
			}, 100);
			
		});
	});

	it('should get an error when configurine responds with a bad request error', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).post('/config').reply(400, badRequestError);

		client.createConfig(mockCreateConfigObj, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});


	it('should get an error when configurine responds with an unexpected error', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).post('/config').reply(500, 'Internal Sever Error');

		client.createConfig(mockCreateConfigObj, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error the configurine responds with an error to the token call', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(404, notFoundError);

		client.createConfig(mockCreateConfigObj, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error the configurine responds with an unexpected error to the token call', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(404, 'Internal Server Error');

		client.createConfig(mockCreateConfigObj, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should throw an error if params are missing', function(done){

		client = new Client(clientOptions);

		assert.throws(client.createConfig, /Missing parameters/, 'should throw an error');
		done();
	});

});





describe('updateConfigById', function() {
	
	it('should update config by id', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).put('/config/' + mockConfigObj.id).reply(204, '');

		client.updateConfigById(mockConfigObj.id, mockConfigObj, function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isBoolean(result), 'should return a boolean as result');
			assert(_.isEqual(result, true), 'result should match expected boolean');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should update config by id and use cached token', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).put('/config/' + mockConfigObj.id).reply(204, '');

		client.updateConfigById(mockConfigObj.id, mockConfigObj, function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isBoolean(result), 'should return a boolean as result');
			assert(_.isEqual(result, true), 'result should match expected boolean');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');

			setTimeout(function() {
				nock(clientOptions.host).put('/config/' + mockConfigObj.id).reply(204, '');

				client.updateConfigById(mockConfigObj.id, mockConfigObj, function(err, result) {
					assert(!err, 'should not return an error');
					assert(_.isBoolean(result), 'should return a boolean as result');
					assert(_.isEqual(result, true), 'result should match expected boolean');
					assert(mockConfig.isDone(), 'should have satisfied mocked request');
					done();
				});
			}, 100);
			
		});
	});

	it('should get an error when configurine responds with a bad request error', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).put('/config/' + mockConfigObj.id).reply(400, badRequestError);

		client.updateConfigById(mockConfigObj.id, mockConfigObj, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});


	it('should get an error when configurine responds with an unexpected error', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).put('/config/' + mockConfigObj.id).reply(500, 'Internal Sever Error');

		client.updateConfigById(mockConfigObj.id, mockConfigObj, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error the configurine responds with an error to the token call', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(404, notFoundError);

		client.updateConfigById(mockConfigObj.id, mockConfigObj, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error the configurine responds with an unexpected error to the token call', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(404, 'Internal Server Error');

		client.updateConfigById(mockConfigObj.id, mockConfigObj, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should throw an error if params are missing', function(done){

		client = new Client(clientOptions);

		assert.throws(client.updateConfigById, /Missing parameters/, 'should throw an error');
		done();
	});

});




describe('removeConfigById', function() {
	
	it('should remove config by id', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).delete('/config/' + mockConfigObj.id).reply(204, '');

		client.removeConfigById(mockConfigObj.id, function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isBoolean(result), 'should return a boolean as result');
			assert(_.isEqual(result, true), 'result should match expected boolean');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should remove config by id and use cached token', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).delete('/config/' + mockConfigObj.id).reply(204, '');

		client.removeConfigById(mockConfigObj.id, function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isBoolean(result), 'should return a boolean as result');
			assert(_.isEqual(result, true), 'result should match expected boolean');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');

			setTimeout(function() {
				mockConfig = nock(clientOptions.host).delete('/config/' + mockConfigObj.id).reply(204, '');

				client.removeConfigById(mockConfigObj.id, function(err, result) {
					assert(!err, 'should not return an error');
					assert(_.isBoolean(result), 'should return a boolean as result');
					assert(_.isEqual(result, true), 'result should match expected boolean');
					assert(mockConfig.isDone(), 'should have satisfied mocked request');
					done();
				});
			}, 100);
			
		});
	});

	it('should get an error when configurine responds with a not found error', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).delete('/config/' + mockConfigObj.id).reply(404, notFoundError);

		client.removeConfigById(mockConfigObj.id, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error when configurine responds with an unexpected 200', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).delete('/config/' + mockConfigObj.id).reply(200, 'fnord');

		client.removeConfigById(mockConfigObj.id, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error when configurine responds with an unexpected error', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(200, getMockAccessToken());
		var mockConfig = nock(clientOptions.host).delete('/config/' + mockConfigObj.id).reply(500, 'Internal Sever Error');

		client.removeConfigById(mockConfigObj.id, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error the configurine responds with an error to the token call', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(404, notFoundError);

		client.removeConfigById(mockConfigObj.id, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should get an error the configurine responds with an unexpected error to the token call', function(done){

		client = new Client(clientOptions);
		var mockToken = nock(clientOptions.host).post('/token').reply(404, 'Internal Server Error');

		client.removeConfigById(mockConfigObj.id, function(err, result) {
			assert(err, 'should return an error');
			assert(!result, 'should not return a result');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			done();
		});
	});

	it('should throw an error if params are missing', function(done){

		client = new Client(clientOptions);

		assert.throws(client.removeConfigById, /Missing parameters/, 'should throw an error');
		done();
	});

});



