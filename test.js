var page = require('webpage').create();
var system = require('system');

page.onResourceRequested = function (request) {
  system.stderr.writeLine('= onResourceRequested()');
  system.stderr.writeLine('  request: ' + JSON.stringify(request, undefined, 4));
};

page.onResourceReceived = function(response) {
  system.stderr.writeLine('= onResourceReceived()' );
  system.stderr.writeLine('  id: ' + response.id + ', stage: "' + response.stage + '", response: ' + JSON.stringify(response));
};

page.onLoadStarted = function() {
  system.stderr.writeLine('= onLoadStarted()');
  var currentUrl = page.evaluate(function() {
    return window.location.href;
  });
  system.stderr.writeLine('  leaving url: ' + currentUrl);
};

page.onLoadFinished = function(status) {
  system.stderr.writeLine('= onLoadFinished()');
  system.stderr.writeLine('  status: ' + status);
};

page.onNavigationRequested = function(url, type, willNavigate, main) {
  system.stderr.writeLine('= onNavigationRequested');
  system.stderr.writeLine('  destination_url: ' + url);
  system.stderr.writeLine('  type (cause): ' + type);
  system.stderr.writeLine('  will navigate: ' + willNavigate);
  system.stderr.writeLine('  from page\'s main frame: ' + main);
};

page.onResourceError = function(resourceError) {
  system.stderr.writeLine('= onResourceError()');
  system.stderr.writeLine('  - unable to load url: "' + resourceError.url + '"');
  system.stderr.writeLine('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
};

page.onError = function(msg, trace) {
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

page.onNavigationRequested = function(url, type, willNavigate, main) {
  console.log('Trying to navigate to: ' + url);
  console.log('Caused by: ' + type);
  console.log('Will actually navigate: ' + willNavigate);
  console.log('Sent from the page\'s main frame: ' + main);
}

var webPage = require('webpage');
var page = webPage.create();
var settings = {
  operation: "POST",
  encoding: "utf8",
  headers: {
    "Content-Type": "application/json"
  },
  data: JSON.stringify({
    url : "http://rest.energyhelpline.com/domestic/energy/supplies/tariffSelectionG3165201_E3165145.json?t=q6Zp-P_RWjeVw8iknEmOyg7RYxY3W1ZiVHnhMJKGyOyipcpPuORYFg&format=json"
  })
};

page.open('http://localhost:8090/api/externals/energyhelpline/tariff', settings, function(status) {
  console.log('Status: ' + status);
});