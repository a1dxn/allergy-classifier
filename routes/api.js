express      = require("express");
const router = express.Router();
const Err    = require("../services/error-manager");
const log    = _log.get("http:router");

/*** --base-- ***/
router.get("/", async(req, res) => {
	return res.json(["Hello!"]);
});

/*** --Generate Profile-- (internet-facing) ***/
router.post("/generateProfile", async(req, res) => {
	const generateProfile = require("../actions/generate-profile");

	let input = req.body;
	generateProfile(input)
		.then(predictions => {
			log.debug("Profile prediction generated...");
			return res.json(predictions);
		})
		.catch(error => {
			log.debug("Error occurred on /api/generateProfile.");
			return Err({error, input}, res);
		});
});

/*** --SVG-- ***/
/**generate (internet-facing)**/
router.post("/svg/generate", async(req, res) => {
	const generateSVG = require("../actions/svg/generate");

	let input = req.body;
	if(input["path[]"]) input = input["path[]"];
	else if(input["path"]) input = input["path"];

	generateSVG(input)
		.then(svg => {
			log.debug("SVG generated successfully.");
			res.status(201).send(svg);
		})
		.catch(error => {
			log.debug("Error occurred on /api/svg/generate");
			return Err({error, input}, res);
		});
});

/*** --Trees-- ***/
/**predict**/
router.post("/tree/predict", async(req, res) => {
	const predictTree = require("../actions/trees/predict");

	let input = req.body;
	if(req.is("application/x-www-form-urlencoded") || _.isEmpty(input)) {
		if(_.isEmpty(input)) input = req.query;
		input = {
			allergyKey: input?.allergyKey,
			data      : _.omit(input, "allergyKey")
		};
	}

	predictTree(input)
		.then(predictions => {
			log.debug("Tree prediction generated...");
			return res.json(predictions);
		})
		.catch(error => {
			log.debug("Error occurred on /api/tree/predict");
			return Err({error, input}, res);
		});
});

/**get**/
router.get("/tree/get/:id", async(req, res) => {
	const getTree = require("../actions/trees/get");

	let input = req.params.id;
	getTree(input)
		.then(response => {
			log.debug("Fetched tree...");
			return res.json(response);
		})
		.catch(error => {
			log.debug("Error occurred on /api/tree/get");
			return Err({error, input}, res);
		});
});

/**calculate-accuracy**/
router.post("/tree/calculateAccuracy", async(req, res) => {
	const calculateAccuracy = require("../actions/trees/calculate-accuracy");

	let input = req.body;
	calculateAccuracy(input)
		.then(result => {
			log.debug("Calculated accuracy...");
			return res.json(result);
		})
		.catch(error => {
			log.debug("Error occurred on /api/trees/calculateAccuracy");
			return Err({error, input}, res);
		});
});

/**train**/
router.post("/tree/train", async(req, res) => {
	const trainTree = require("../actions/trees/train");

	let input = req.body;
	trainTree(input)
		.then(result => {
			log.debug("Tree generated...");
			return res.json(result);
		})
		.catch(error => {
			log.debug("Error occurred on /api/trees/train");
			return Err({error, input}, res);
		});
});

/*** --Patterns-- ***/
/**find**/
router.post("/patterns/find", async(req, res) => {
	const findPatterns = require("../actions/patterns/find");

	let input = req.body;
	findPatterns(input)
		.then(result => {
			log.debug("Patterns found for %s.", result?.allergyKey);
			return res.json(result);
		})
		.catch(error => {
			log.debug("Error occurred on /api/patterns/find");
			return Err({error, input}, res);
		});

});

/*** --Sets-- ***/
/**get**/
router.post("/sets/get", async(req, res) => {
	const getDataset = require("../actions/sets/get-dataset");

	let input = req.body;
	getDataset(input)
		.then(result => {
			log.debug("Dataset %s (%s) fetched...", result?.allergyKey, result?.setType);
			return res.json(result);
		})
		.catch(error => {
			log.debug("Error occurred on /api/sets/get");
			return Err({error, input}, res);
		});
});

//todo: sets/combine-sets - waiting to reformat existing actions first!
//todo: sets/bootstrap-set - waiting to reformat existing actions first!

module.exports = router;
