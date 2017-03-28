//"c:\Program Files (x86)\phantomjs-2.1.1-windows\bin\phantomjs.exe" --local-to-remote-url-access=yes  --web-security=false --ignore-ssl-errors=true app.js --ssl-protocol=any  postcode="B79 9HL" fuelMix="gasAndElec"  sameSupplier="true"

"use strict";

var args 	 = require('./args'),
    page 	 = require('webpage').create(), 
    wait 	 = require('./wait'), 
	then	 = require('./then.js'), 
	testThat = require('./testthat.js'), 
	fs 		 = require('fs'), 
	service  = require('webpage').create();

var params = {
	postcode 	 : args.get("postcode"), 
	fuelMix 	 : args.get("fuelmix"),
	sameSupplier : args.get("sameSupplier") == "true", 
	outputPath   : args.get("outputPath")
};
 
console.log("postcode: " + params.postcode);
console.log("fuelMix: " + params.fuelMix);
console.log("sameSupplier: " + params.sameSupplier);

var currentCount = null;
var messages = null;

page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.onResourceRequested = function(requestData, networkRequest) {
	if (messages != null) {
		var match = requestData.url.match(/tariffSelection/g);
		if (match != null) {

			var tariffAndSupplier = page.evaluate(function(p) {
				return { 
					supplier: $('#elecSupplier option:selected').text(), 
					tariff	: $('#elecSupplierTariff option:selected').text()
				};
			}, 
			params);

			if (tariffAndSupplier.supplier && tariffAndSupplier.tariff) {

				var settings = {
					operation: "POST",
					encoding: "utf8",
					headers: {
						"Content-Type": "application/json"
					},
					data: JSON.stringify({
						supplier: tariffAndSupplier.supplier, 
						tariff: tariffAndSupplier.tariff, 
						url : requestData.url
					})
				};

				service.open('http://localhost:8090/api/externals/energyhelpline/tariff', settings, function(s) {
					if (s !== 'success') {
						console.log("Error submitting " + tariffAndSupplier.tariff + " from " + tariffAndSupplier.supplier);
					}
				});
			}
			
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
							)
						}
					)
				}
		    );
		}
	}
	else {
		phantom.exit(1);
	}
};

console.log("hello there")
page.open("https://energyhelpline.com/fri/");