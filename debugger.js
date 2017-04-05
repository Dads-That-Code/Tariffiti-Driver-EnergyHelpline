function debug(service) {
    
    service.onResourceError = function(resourceError) {
        console.error(resourceError.url + ': ' + resourceError.errorString);
    };

    service.onResourceRequested = function (request) {
        system.stderr.writeLine('= onResourceRequested()');
        system.stderr.writeLine('  request: ' + JSON.stringify(request, undefined, 4));
    };

    service.onResourceReceived = function(response) {
        system.stderr.writeLine('= onResourceReceived()' );
        system.stderr.writeLine('  id: ' + response.id + ', stage: "' + response.stage + '", response: ' + JSON.stringify(response));
    };

    service.onLoadStarted = function() {
        system.stderr.writeLine('= onLoadStarted()');
        var currentUrl = page.evaluate(function() {
            return window.location.href;
        });
        system.stderr.writeLine('  leaving url: ' + currentUrl);
    };

    service.onLoadFinished = function(status) {
        system.stderr.writeLine('= onLoadFinished()');
        system.stderr.writeLine('  status: ' + status);
    };

    service.onNavigationRequested = function(url, type, willNavigate, main) {
        system.stderr.writeLine('= onNavigationRequested');
        system.stderr.writeLine('  destination_url: ' + url);
        system.stderr.writeLine('  type (cause): ' + type);
        system.stderr.writeLine('  will navigate: ' + willNavigate);
        system.stderr.writeLine('  from page\'s main frame: ' + main);
    };

    service.onResourceError = function(resourceError) {
        system.stderr.writeLine('= onResourceError()');
        system.stderr.writeLine('  - unable to load url: "' + resourceError.url + '"');
        system.stderr.writeLine('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
    };

    service.onError = function(msg, trace) {
        system.stderr.writeLine('= onError()');
        var msgStack = ['  ERROR: ' + msg];
        if (trace) {
            msgStack.push('  TRACE:');
            trace.forEach(function(t) {
                msgStack.push('    -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
            });
        }
        system.stderr.writeLine(msgStack.join('\n'));
    };
}

exports.emit = debug;