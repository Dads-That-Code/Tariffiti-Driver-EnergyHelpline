var testThat = {

	theSpinnerHasStopped : function() {
		var spinner = page.evaluate(function() {
			var spinner = $("#loaderDiv");
			if (spinner) return !spinner.is(":visible");
			return true;
		});

		console.log(!spinner ? "spinner is spinning" : "spinner has stopped");
		return spinner;	
	}, 

	theCurrentTariffHasBeenRetrieved : function() {
		console.log("messages: " + messages);
		console.log("currentCount:" + currentCount);
		return (messages >= (currentCount + 1));
	}
};


exports.theSpinnerHasStopped = testThat.theSpinnerHasStopped;
exports.theCurrentTariffHasBeenRetrieved = testThat.theCurrentTariffHasBeenRetrieved;