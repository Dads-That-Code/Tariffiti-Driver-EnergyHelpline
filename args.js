var args = require('system').args;

function get(s) {
	var re = new RegExp('^' + s + '=\\\"?(.*?)\\\"?$', 'i');

	for (var i = 0; i < args.length; i++) {
		if (re.test(args[i])) return re.exec(args[i])[1];
	}

	return null;
}

exports.get = get