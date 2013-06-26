module.exports = {
	reporter: function reporter(results) {
		process.stdout.write('\x1B[1mRunning jshint...\x1B[22m');
		var len = results.length,
			str = '',
			file, error;

		results.forEach(function (result) {
			file = result.file;
			error = result.error;
			str += file + ': line ' + error.line + ', col ' +
				error.character + ', ' + error.reason + '\n';
		});

		if (str) {
			process.stdout.write(' \x1B[31mfailed!\x1B[39m\n');
			process.stdout.write(str + '\n' + len + ' error' + ((len === 1) ? '' : 's') + '\n');
		}
		else {
			process.stdout.write(' \x1B[32mpassed!\x1B[39m\n');
		}
	}
};