const express = require("express");
const router  = express.Router();
const log     = _log.get("http:router");
const trainer = require("../actions/trees/train");

/* GET home page. */
router.get("/", async(req, res) => res.render("index"));

router.get("/compare/:allergy", async(req, res) => {

	// const alg     = req.params?.allergy;
	res.json({good: true});

	for(const alg of CONSTANT("DATASET_ALLERGY_KEYS")) {
		dsRanked(alg).then(() => {
		});
		// let collectedData = await Promise.all([ bsRanked(alg) ]);
		// collectedData     = _.flatten(collectedData);
		// const ranked      = collectedData.sort((a, b) => a.accuracy.accuracy>b.accuracy.accuracy ? -1 : 1);
		// const save        = require("../actions/save-exports");
		// for(let i = 0; i<3; i++) {
		// 	save({name: alg+"-overall-ranked-"+i, content: JSON.stringify(ranked[i], null, 2)}).then(() => {
		// 	});
		// }
	}

});

async function bsRanked(alg) {
	let tasks = [];
	for(let i = 0; i<300; i++) {
		tasks.push(new Promise((resolve, reject) => {
			let d = require("../actions/sets/bootstrap-set")(alg)
				.then(bootstrap => {
					let t = [];
					for(let j = 0; j<10; j++) {
						t.push(trainer({
										   allergyKey: alg,
										   saveData  : false,
										   trainData : {data: bootstrap.bootstrapIncluded},
										   testData  : {data: bootstrap.bootstrapExcluded}
									   }));
					}
					return Promise.all(t);
				})
				// .then(data => {
				// 	return _.flatten(data);
				// })
				.catch(e => reject(e));
			resolve(d);
		}));
	}

	let collectedData = await Promise.all(tasks);
	collectedData     = _.flatten(collectedData);
	// console.log(collectedData);

	const ranked = collectedData.sort((a, b) => a.accuracy.accuracy>b.accuracy.accuracy ? -1 : 1);

	const save = require("../actions/save-exports");
	for(let i = 0; i<3; i++) {
		save({name: alg+"-bs-ranked-"+i, content: JSON.stringify(ranked[i], null, 2)}).then(() => {
		});
	}
	return _.take(ranked, 3);
}

async function dsRanked(alg) {
	const dataset = require("../actions/sets/get-dataset");
	let t         = [];
	for(let j = 0; j<30; j++) {
		await Promise.all([ dataset({allergyKey: alg, setType: "TRAIN"}),
							dataset({allergyKey: alg, setType: "TEST"}) ]);
		t.push(trainer({
						   allergyKey: alg,
						   saveData  : false,
					   }));
	}

	let collectedData = await Promise.all(t);
	collectedData     = _.flatten(collectedData);
	const ranked      = collectedData.sort((a, b) => a.accuracy.accuracy>b.accuracy.accuracy ? -1 : 1);
	const save        = require("../actions/save-exports");
	for(let i = 0; i<5; i++) {
		save({name: alg+"-ds-ranked-"+i, content: JSON.stringify(ranked[i], null, 2)}).then(() => {
		});
	}
	return _.take(ranked, 5);
}

module.exports = router;
