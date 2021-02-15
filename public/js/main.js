const {API_ENDPOINT, APIM_PUBLIC_KEY, GENERATE_PROFILE_URI, GENERATE_TREE_SVG_URI} = SD;
const precision                                                                    = 3;

const highlight = (text) => `<span class="highlight">${text}</span>`
	, divify    = (content, attributes) => `<div ${attributes}>${content}</div>`,
	  emoji     = (id) => ({
		  "ok"       : "✅",
		  "sos"      : "🆘",
		  "egg"      : "🥚",
		  "fish"     : "🐟",
		  "milk"     : "🥛",
		  "nuts"     : "🌰",
		  "nut"      : "🌰",
		  "peanut"   : "🥜",
		  "sesame"   : "🍚",
		  "shellfish": "🍤",
		  "soya"     : "🍲",
		  "soy"      : "🍲",
		  "wheat"    : "🍞"
	  })[id];

$.ajaxSetup({
				timeout    : 5000,
				processData: true,
				headers    : {
					"Apim-Key": APIM_PUBLIC_KEY
				}
			});

$(document).ready(() => {

	//Populate emojis on allergy form
	$("#allergy-form .toggle-label.emoji").each((i, obj) => {
		const $e = $(obj)
			, id = $e.siblings()
					 .filter(".toggle-label")
					 .text()
					 .toLowerCase();
		$e.text(emoji(id));
	});

	//Hide results template
	$("#results-block").hide();

	//'Predict' button
	$("#page-collect .button").on("click", () => {
		const input = {};
		$("#allergy-form input").each((i, obj) => {
			const $checkbox         = $(obj)
				, id                = $checkbox.closest(".list-item")
											   .find(".toggle-label:not(.emoji)")
											   .text()
											   .toLowerCase();
			input[id.toUpperCase()] = $checkbox.is(":checked") ? 1 : 0;
		});
		$.post(API_ENDPOINT+GENERATE_PROFILE_URI, input, successPrediction, "json");
	});

});

function successPrediction(response, textStatus) {
	console.log(textStatus);
	const $list     = $("#results-block ul");
	const $spinner  = $("#results-loading");
	const $template = $(".list-item.result").clone();
	$list.empty();

	response.sort((a, b) => b.prediction.prediction-a.prediction.prediction);
	for(const res of response) {
		const $item      = $template.clone()
			, isAllergic = res.prediction.prediction===1
			, allergyKey = res.allergyKey
			, id         = "res-"+allergyKey;

		$item.prop("id", id);

		(function summaryLine() {
			const summaryTrue  = `You ${highlight("may")} be allergic to ${allergyKey}...`
				, summaryFalse = `You probably ${highlight("aren't")} allergic to ${allergyKey}...`;

			$item.find(".toggle-label.emoji").text(emoji(isAllergic ? "sos" : "ok")+emoji(allergyKey.toLowerCase()));
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
				  ${(res.prediction.treeAccuracy.accuracy*100).toPrecision(precision)}% accurate with a sensitivity 
				  of ${(res.prediction.treeAccuracy.sensitivity*100).toPrecision(precision)}%.`;

			$comments.empty();
			$comments.append(divify(isAllergic ? commentsTrue : commentsFalse));
			$comments.append(divify(fyi, `class="italic"`));
		})();

		(function associationRules() {
			const $ruleList = $item.find("#associations");
			$ruleList.empty();
			for(const rule of res.patterns.allFeatures.rules) {
				const path     = rule.path.replace(",", " & ")
					, listItem = `${highlight((rule.support*100).toPrecision(precision)+"%")}
					 of people allergic to ${allergyKey} are allergic to ${highlight(path)}`;
				$ruleList.append(`<li class="rule-item">${listItem}</li>`);
			}
		})();

		// $item.show();
		$list.append($item);
		$("#results-block").show();
		$spinner.hide(500);
		$("#"+id).fadeIn(200);

		(function treeDiagram(id, res) { //tree loading is async
			const path = res.prediction.path;
			path.push("RESULT:"+res.prediction.prediction);
			$(`#${id} .result-tree`).load(API_ENDPOINT+GENERATE_TREE_SVG_URI, {path});
		})(id, res);
	}
}
