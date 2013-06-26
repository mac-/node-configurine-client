clean:
	npm cache clean && rm -rf node_modules/* coverage lib-test

install:
	make clean && npm install
	 
test:
	./node_modules/.bin/jshint lib/* --config test/jshint/config.json --reporter test/jshint/reporter.js
	@NODE_ENV=test ./node_modules/.bin/mocha --recursive --reporter spec --timeout 3000 test/unit

test-cov:
	@NODE_ENV=test ./node_modules/.bin/mocha --require blanket --recursive --timeout 3000 -R travis-cov test/unit

test-cov-json:
	@NODE_ENV=test ./node_modules/.bin/mocha --require blanket --recursive --timeout 3000 -R json-cov test/unit > test/coverage.json

test-cov-html:
	@NODE_ENV=test ./node_modules/.bin/mocha --require blanket --recursive --timeout 3000 -R html-cov test/unit > test/coverage.html
	xdg-open "file://${CURDIR}/test/coverage.html" &

.PHONY: test test-cov test-cov-json test-cov-html