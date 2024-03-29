//"c:\Program Files (x86)\phantomjs-2.1.1-windows\bin\phantomjs.exe" --local-to-remote-url-access=yes  --web-security=false --ignore-ssl-errors=true app.js --ssl-protocol=any  postcode="B79 9HL" fuelMix="gasAndElec" sameSupplier="true" isE7="true" paymentMethod="MDD" tariffService="http://localhost:8090/api/enqueue/energyhelpline/tariff" futureOnly="true"

"use strict";

var args 	 	= require('./args'),
    page 	 	= require('webpage').create(), 
    wait 	 	= require('./wait'), 
	then	 	= require('./then.js'), 
	testThat 	= require('./testthat.js'), 
	fs 		 	= require('fs'), 
	service  	= require('webpage').create(),
	system 		= require('system'), 
	debug		= require('./debugger.js');

var params = {
	postcode 	 	: args.get("postcode"), 
	fuelMix 	 	: args.get("fuelmix"),
	sameSupplier 	: args.get("sameSupplier") == "true",
	isE7		 	: args.get("isE7") == "true", 
	paymentMethod	: args.get("paymentMethod"), 
	tariffService   : args.get("tariffService"), 
	futureOnly		: args.get("futureOnly") == "true"
};
 
console.log("postcode: " + params.postcode);
console.log("fuelMix: " + params.fuelMix);
console.log("sameSupplier: " + params.sameSupplier);
console.log("isE7: " + params.isE7);
console.log("paymentMethod: " + params.paymentMethod);
console.log("tariffService: " + params.tariffService);
console.log("futureOnly: " + params.futureOnly)

var currentCount = null;
var messages = null;

// Emit verbose debug information about the service page
debug.emit(service);

page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.onResourceRequested = function(requestData, networkRequest) {
	if (messages != null) {
		var match = requestData.url.match(/tariffSelection/g);
		if (match != null) {

			console.log("Requesting resource: " + requestData.url);

			var settings = {
				operation: "POST",
				encoding: "utf8",
				headers: {
					"Content-Type": "application/json"
				},
				data: JSON.stringify({
					url 	: requestData.url, 
					seenOn 	: new Date()
				})
			};

			console.log(settings);

			service.open(params.tariffService, settings, function(s) {
				if (s !== 'success') {
					console.log("Unable to submit to " + params.tariffService + " please check that the service is running");
				}
			});

			messages ++;
		}
	}
};

page.onResourceReceived = function(response) {
	if (messages != null && /rest\.energyhelpline.*?\/switches\//i.test(response.url) && response.status == 409) {
		var tariffAndSupplier = page.evaluate(function(p) {
			return { 
				supplier: $('#elecSupplier option:selected').text(), 
				tariff	: $('#elecSupplierTariff option:selected').text()
			};
		}, 
		params);

		console.log("ERROR retrieving tariff data for supplier " + tariffAndSupplier.supplier + " and tariff " + tariffAndSupplier.tariff);
		messages ++;
	}
};

page.onLoadFinished = function(status) {

console.log("loading")
	if (status === "success") {

		var pageUrl = page.evaluate(function() { return window.location.href; });
		
		if (/\/fri\/$/.test(pageUrl)) {

	        page.evaluate(function(p) {

	        	$("#PostCode").val(p.postcode);
	        	$("div.section--hero__startquote button.btn-primary").click();
				
	        }, 
	        params);

		}
		else if (/\/domestic\/switch/.test(pageUrl)) {

			wait.until(
				// First select the fuel mix and wait for the spinner to stop
				testThat.theSpinnerHasStopped, 
				then.selectFuelMix, 
				function() {

					wait.until(
						// select E7 where appropriate
						testThat.theSpinnerHasStopped, 
						then.selectE7, 
						function() {

							// Select whether the the energy is received from the same supplier
							wait.until(
								testThat.theSpinnerHasStopped, 
								then.selectSameSupplier, 
								function () {

									// Select the first supplier and tariff
									wait.until(
										testThat.theSpinnerHasStopped, 
										then.selectFirstSupplierAndTariff, 
										function() {

											// Next enter the consumption. Again wait for the spinner to stop
											wait.until(
												testThat.theSpinnerHasStopped,  
												then.selectEachSupplierTariff
											);
											
										}
									);
								}
							);
						}
					);
				}
		    );
		}
	}
	else {
		phantom.exit(1);
	}
};

page.open("https://energyhelpline.com/fri/");