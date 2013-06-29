var nock = require('nock'),
	_ = require('underscore'),
	assert = require('assert'),
	Client = require('../../lib/configurineClient.js'),
	client = new Client({
		host: 'http://127.0.0.1:8080',
		clientId: 'fnord',
		sharedKey: 'a1c1f962-bc57-4109-8d49-bee9f562b321'
	}),
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
	};

describe('getConfigByName', function() {
	
	it('should get config by name', function(done){

		var mockToken = nock('http://127.0.0.1:8080').post('/token').reply(200, {"access_token":"myclient:1371666627113:1371670227113:47a8cdf5560706874688726cb1b3e843783c0811"});
		var mockConfig = nock('http://127.0.0.1:8080').get('/config?isActive=true&names=loglevel').reply(200, [mockConfigObj]);

		client.getConfigByName('loglevel', function(err, result) {
			assert(!err, 'should not return an error');
			assert(_.isArray(result), 'should return an array as result');
			assert(_.isEqual(result[0], mockConfigObj), 'result should match expected object');
			assert(mockToken.isDone(), 'should have satisfied mocked request');
			assert(mockConfig.isDone(), 'should have satisfied mocked request');
			done();
		});
	});
});