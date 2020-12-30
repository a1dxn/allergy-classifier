const DecisionTree      = require("decision-tree");
const getDataset        = require("../sets/get-dataset");
const saveExports       = require("../save-exports");
const calculateAccuracy = require("./calculate-accuracy");
const log               = _log.get("train-tree");

//todo: produce jsdoc

async function trainTree(options) {
	let _timer = Date.now();
	options    = Schema.object({
								   allergyKey : Schema.get("allergyKey").required(),
								   saveOutput : Schema.boolean().optional(),
								   outputSets : Schema.boolean(),
								   trainSet   : options?._skipSetVal ? Schema.any()
																	 : Schema.object(Schema.get("dataset")),
								   testSet    : options?._skipSetVal ? Schema.any()
																	 : Schema.object(Schema.get("dataset")),
								   _skipSetVal: Schema.boolean(), //for extra speediness...Avoid using unless sets were validated prior
								   _uuid      : Schema.string().required()
													  .failover(options.allergyKey+"-"+Math.random()
																						   .toString(32)
																						   .slice(2)
																						   .toUpperCase())
							   })
					   .with("trainSet", "testSet")
					   .with("testSet", "trainSet")
					   .validate(options, {abortEarly: false});
	if(options?.error) throw options.error;
	else options = options.value;

	let flog = log.get(options._uuid.toLowerCase());
	_timer   = Date.now()-_timer;
	flog.debug("Schema validation took %dms", _timer);

	if(!(options.trainSet || options.testSet)) {
		const tasks = [
			getDataset({
						   allergyKey: options.allergyKey,
						   setType   : CONSTANT("DATASET_FILE_KEYWORD_TRAIN")
					   }),
			getDataset({
						   allergyKey: options.allergyKey,
						   setType   : CONSTANT("DATASET_FILE_KEYWORD_TEST")
					   })
		];

		_timer                      = Date.now();
		const [ trainSet, testSet ] = await Promise.all(tasks);
		_timer                      = Date.now()-_timer;
		flog.debug("Fetching datasets took %dms", _timer);
		return trainTree(_.extend(options, {trainSet, testSet, _skipSetVal: true})); //recalling but with retrieved datasets!
	}

	_timer = Date.now();
	//Build & train the decision tree!
	flog.info("Building decision tree... This may take some time!");
	const features = _.without(Object.keys(options.trainSet.data[0]), options.allergyKey);
	const tree     = new DecisionTree(options.trainSet.data, options.allergyKey, features);
	_timer         = Date.now()-_timer;
	flog.notice("Decision tree was built in %dms", _timer);

	//Lets do some predictions!
	const predictions = [], actuals = [];
	for(const row of options.testSet.data) {
		actuals.push(row[options.allergyKey]);
		predictions.push(tree.predict(row));
	}

	const output    = _.pick(options, [ "_uuid", "allergyKey" ]);
	output.accuracy = await calculateAccuracy({predictions, actuals});
	output.model    = tree.toJSON();
	if(options.outputSets) output.data = _.pick(options, [ "trainSet", "testSet" ]);

	if(options.saveOutput) {
		saveExports({
						name   : output._uuid,
						content: JSON.stringify(output)
					}).then((x) => flog.info("Model saved."));
	}

	return output;
}

module.exports = trainTree;
