var then = {

	countAvailableTariffs: function() {

		return page.evaluate(function() {
			return $("div.compare-table-item div.toggle-button a span").length;
		});
	},

	getAvailableTariffs: function() {

		page.evaluate(function() {
			$("div.compare-table-item div.toggle-button a span").click();
		});
	},

	getNextAvailableTariff: function() {
		page.evaluate(function() {
			$("div.compare-table-item div.toggle-button a span:not(.hide-link)")[0].click();
		});
	}, 

	getRemainingAvailableTariffs: function() {
		return page.evaluate(function() {
			return $("div.compare-table-item div.toggle-button a span:not(.hide-link)").length;
		}); 
	},

	enterUsage: function() {

		page.evaluate(function(p) {

			if (/gas/i.test(p.fuelMix)) {
				angular.element("#gasKWhUsage").click(); 
				angular.element("#gasKWhUsage").triggerHandler('click')

				angular.element("#gasKWhUsage").scope().resource.dataTemplate('gasKWhUsage')('usageAsKWh').data = 12500;
				angular.element("#gasKWhUsage").scope().$apply();
			}

			if (/elec/i.test(p.fuelMix)) {
				angular.element("#elecKWhUsage").click(); 
				angular.element("#elecKWhUsage").triggerHandler('click')

				if (p.isE7) {
					angular.element("#elecKWhUsage").scope().viewModel.economy7.dayUsage = 5436;
					angular.element("#elecKWhUsage").scope().viewModel.economy7.nightUsage = 3436;
				}
				else {
					angular.element("#elecKWhUsage").scope().viewModel.economy7.dayUsage = 7436;
				}

				angular.element("#elecKWhUsage").scope().$apply();
			}

		}, 
		params);

	}, 

	resultsFromAllSuppliers: function() {

		page.evaluate(function(p) {
			angular.element("#switch-today-no").click(); 
			angular.element("#switch-today-no").triggerHandler('click')
		}, 
		params);
	},

	getQuote: function() {
		page.evaluate(function() {
			$("#show-results").click();;
		})
	},

	selectFuelMix: function() {
		page.evaluate(function(p) {
			$("input[value='" + p.fuelMix + "']").trigger("click");
		}, 
		params);
	},

	selectE7: function() {

		page.evaluate(function(p) {
			if (/elec/i.test(p.fuelMix)) {
				if (p.isE7) {
					angular.element("#elec-economy-meter-yes").click(); 
					angular.element("#elec-economy-meter-yes").triggerHandler("click")
				}
				else {
					angular.element("#elec-economy-meter-no").click(); 
					angular.element("#elec-economy-meter-no").triggerHandler("click")
				}
			}
		}, 
		params);
	},

	selectSameSupplier: function() {
		page.evaluate(function(p) {
			angular.element($("#comparison-type-same-supplier")).scope().$parent.$parent.viewModel.sameSupplier = p.sameSupplier;
			angular.element($("#comparison-type-same-supplier")).scope().$parent.$parent.$apply();
		}, 
		params);
	},

	selectFirstSupplierAndTariff: function() {
		page.evaluate(function(p) {
			var selected = $("#elecSupplier option:selected").val();
			
			console.log("A selected: " + selected);
			console.log("$('#elecSupplier option').first().val(): " + $("#elecSupplier option").first().val());
			
			if (!selected || (selected != $("#elecSupplier option").first().val())) {
				$("#elecSupplierTariff").empty();
				$("#elecSupplier").val($("#elecSupplier option").first().val());
				$("#elecSupplier").trigger("change");

				while ($("#elecSupplierTariff option").length == 0) 
				{
					var start = new Date().getTime();
					for (var i = 0; i < 1e7; i++) {
						if ((new Date().getTime() - start) > 1000) {
							break;
						}
					}

					console.log("Found " + $("#elecSupplierTariff option").length + " tariffs");
				}

				$("#elecSupplierTariff").val($("#elecSupplierTariff option").first().val());
				$("#elecSupplierTariff").trigger("change");
			}
			return false;
		}, 
		params);
	},

	selectEachSupplierTariff: function() {
		
		// Determine if there is a new tariff to select
		var tariff = page.evaluate(function(p) {
			var newVal = $('#elecSupplierTariff option:selected').next();
			if (!newVal) newVal = $('#elecSupplierTariff option').first();

			return newVal.val();
		}, 
		params)

		if (tariff) {

			// Initialise the message counter
			if (messages == null) messages = 0;
			currentCount = messages;

			tariff = page.evaluate(function(p, t) {
				$('#elecSupplierTariff').val(t);
				$('#elecSupplierTariff').trigger('change');	

				return $('#elecSupplierTariff option:selected').next().val();
			}, 
			params, 
			tariff);
		}
		else {
			var newSupplier = page.evaluate(function(p) {
				var nextSupplier = $("#elecSupplier option:selected").next().val();
				if (nextSupplier) {
					$("#elecSupplierTariff").empty();
					$("#elecSupplier").val(nextSupplier);
					$("#elecSupplier").trigger("change");

					while ($("#elecSupplierTariff option").length == 0) 
					{
						var start = new Date().getTime();
						for (var i = 0; i < 1e7; i++) {
							if ((new Date().getTime() - start) > 1000) {
								break;
							}
						}

						console.log("Found " + $("#elecSupplierTariff option").length + " tariffs");
					}

					$("#elecSupplierTariff").val($("#elecSupplierTariff option").first().val());
		 			$("#elecSupplierTariff").trigger("change");

					return true;
				}
				return false;
			}, 
			params);

			// Get all future tariffs
			if (!newSupplier) {

				// When we have exhausted all suppliers then proceed to retrieve all of the 
				// available tariffs from the quote results screen
				wait.until(
					testThat.theCurrentTariffHasBeenRetrieved, 
					then.enterUsage, 
					function() {

						wait.until(
							testThat.theSpinnerHasStopped, 
							then.resultsFromAllSuppliers, 
							function() {

								then.getQuote();

								wait.until(
									testThat.theSpinnerHasStopped, 
									then.getEachFutureSupplier
								)
							}
						)
					}
				);
			}
		}

		if (params.futureOnly) {

			// If we are only retrieving future tariffs then proceed directly to optaining a quote, and 
			// expanding each of the tariff info sections on the available tariffs to trigger the retrieval
			// of the tarrif information via the url that is enqueued with the tariffiti service
			wait.until(
				testThat.theCurrentTariffHasBeenRetrieved, 
				then.enterUsage, 
				function() {

					wait.until(
						testThat.theSpinnerHasStopped, 
						then.resultsFromAllSuppliers, 
						function() {

							then.getQuote();

							wait.until(
								testThat.theSpinnerHasStopped, 
								then.getEachFutureSupplier
							)
						}
					)
				}
			);
		}
		else {
			// Iterate through each of the supplier and tariff combinations on the refine quote screen first
			// before proceeding to get a quote and all future tariffs called at line 197 above
			wait.until(
				testThat.theCurrentTariffHasBeenRetrieved, 
				then.selectEachSupplierTariff
			);
		}
	}, 

	getEachFutureSupplier: function() {

		if (then.getRemainingAvailableTariffs() > 0) {

			then.getNextAvailableTariff();
			
			wait.until(
				testThat.theCurrentTariffHasBeenRetrieved, 
				then.getEachFutureSupplier
			);
		}
		else {
			phantom.exit()
		}
	}
}

exports.selectFuelMix = then.selectFuelMix;
exports.selectSameSupplier = then.selectSameSupplier;
exports.selectFirstSupplierAndTariff = then.selectFirstSupplierAndTariff;
exports.selectEachSupplierTariff = then.selectEachSupplierTariff;
exports.selectE7 = then.selectE7;
exports.currentTariffCount = then.currentTariffCount;
exports.enterUsage = then.enterUsage;
exports.resultsFromAllSuppliers = then.resultsFromAllSuppliers;
exports.getQuote = then.getQuote;
exports.getAvailableTariffs = then.getAvailableTariffs;
exports.getNextAvailableTariff = then.getNextAvailableTariff;
exports.getRemainingAvailableTariffs = then.getRemainingAvailableTariffs;
exports.getEachFutureSupplier = then.getEachFutureSupplier;
	