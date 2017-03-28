var then = {

	selectFuelMix: function() {
		page.evaluate(function(p) {
			$("input[value='" + p.fuelMix + "']").trigger("click");
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

			if (!newSupplier) phantom.exit();
		}

		wait.until(
			testThat.theCurrentTariffHasBeenRetrieved, 
			then.selectEachSupplierTariff
		);
	}, 
}

exports.selectFuelMix = then.selectFuelMix;
exports.selectSameSupplier = then.selectSameSupplier;
exports.selectFirstSupplierAndTariff = then.selectFirstSupplierAndTariff;
exports.selectEachSupplierTariff = then.selectEachSupplierTariff;