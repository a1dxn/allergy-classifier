const {EMOJI, POSITIVE, NEGATIVE, NUMBER_PRECISION}           = require("./constants")
	, {PATTERNS_COMPOUND_RULE_SEPARATOR, PATTERNS_RULE_LIMIT} = require("./constants").PATTERNS
	, generateProfile                                         = require("./generateProfile")
	, {prefetch}                                              = require("./fetchData")
	, _                                                       = require("lodash");

const highlight  = (text) => `<span class="highlight">${text}</span>`
	, divify     = (content, attributes) => `<div ${attributes}>${content}</div>`
	, percentify = (number) => (number*100).toPrecision(NUMBER_PRECISION)+"%";

$(document).ready(() => {
	prefetch();

	//Populate emojis on allergy form
	$("#allergy-form .toggle-label.emoji").each((i, obj) => {
		const $e = $(obj)
			, id = $e.siblings()
					 .filter(".toggle-label")
					 .text()
					 .toLowerCase();
		$e.text(EMOJI(id));
	});

	//Hide results template
	$("#results-block").hide();

	//'Predict' button
	$("#page-collect .button").on("click", () => {
		collectInput()
			.then(r => generateProfile(r))
			.then(r => buildResults(r))
			.catch(e => {
				try {
					$("#results-loading").html(EMOJI("ohdear")).prop("style", "font-size:10vh");
				} catch(e) {}
				console.error(e);
				alert("Uh oh... Something bad happened! Try refreshing the page.");
			});
	});
});

async function collectInput() {
	const input = {};
	$("#allergy-form input").each((i, obj) => {
		const $checkbox         = $(obj)
			, id                = $checkbox.closest(".list-item")
										   .find(".toggle-label:not(.emoji)")
										   .text()
										   .toLowerCase();
		input[id.toUpperCase()] = $checkbox.is(":checked") ? POSITIVE : NEGATIVE;
	});
	return input;
}

function buildResults(results) {
	console.log("Building results...");
	const $list     = $("#results-block ul")
		, $spinner  = $("#results-loading")
		, $template = $(".list-item.result").clone();
	$list.empty();

	results.sort((a, b) => b.prediction.prediction-a.prediction.prediction);
	for(const res of results) {
		const $item      = $template.clone()
			, isAllergic = res.prediction.prediction===POSITIVE
			, allergyKey = res.allergyKey
			, id         = "res-"+allergyKey;

		$item.prop("id", id);

		(function summaryLine() {
			const summaryTrue  = `You ${highlight("may")} be allergic to ${allergyKey}...`
				, summaryFalse = `You probably ${highlight("aren't")} allergic to ${allergyKey}...`;

			// let emojiAllergy = EMOJI("fish"), emojiStatus = EMOJI("ok");

			$item.find(".toggle-label.emoji").text(EMOJI(isAllergic)+EMOJI(allergyKey));
			$item.find(".toggle-label.result").html(isAllergic ? summaryTrue : summaryFalse);
		})();

		(function comments() {
			const $comments     = $item.find(".comments.tree")
				, commentsTrue  = `Based on our decision tree modelling using your existing allergies, 
								${highlight("you may be allergic to "+allergyKey)}
								 - you should consult further with a doctor.`
				, commentsFalse = `Based on our decision tree modelling using your existing allergies, 
								${highlight("you probably aren't allergic to "+allergyKey)}.`
				,
				  fyi           = `FYI, our '${allergyKey}' decision tree is 
				  ${percentify(res.prediction.treeAccuracy.accuracy)} accurate with a sensitivity 
				  of ${percentify(res.prediction.treeAccuracy.sensitivity)}.`;

			$comments.empty();
			$comments.append(divify(isAllergic ? commentsTrue : commentsFalse));
			$comments.append(divify(fyi, `class="italic"`));
		})();

		(function treeDiagram() {
			$item.find(".result-tree").html(res.prediction.svg);
		})();

		(function associationRules() {
			const $ruleList = $item.find("#associations");
			$ruleList.empty();
			for(const rule of _.take(res.patterns.allFeatures.rules, PATTERNS_RULE_LIMIT)) {
				const path     = rule.path.replace(",", ` ${PATTERNS_COMPOUND_RULE_SEPARATOR} `)
					, listItem = `${highlight(percentify(rule.support))}
					 of people allergic to ${allergyKey} are allergic to ${highlight(path)}`;
				$ruleList.append(`<li class="rule-item">${listItem}</li>`); //todo maybe extract?
			}
		})();

		$list.append($item);
	}
	console.log("Results built.");
	$("#results-block").fadeIn(200);
	$spinner.hide(200);
}
