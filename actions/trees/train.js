const DecisionTree = require("decision-tree");
const getDataset   = require("../sets/get-dataset");
const saveExports  = require("../save-exports");
const calculateAccuracy = require('./calculate-accuracy');

//todo: produce jsdoc

module.exports = async function(options) {
	options = Schema.object({
								allergyKey: Schema.string().required().uppercase()
												  .pattern(
													  new RegExp(`(${CONSTANT("DATASET_ALLERGY_KEYS").join("|")})`),
													  "Allergy Key"),
								saveData  : Schema.boolean().optional(),
								trainData : Schema.any(),
								testData  : Schema.any()
							})
					.with("trainData", "testData")
					.with("trainData", "testData")
					.validate(options, {abortEarly: false});
	if(options.error) {
		_log.get('train-tree').error("Validation error on options argument. %O", options.error);
		throw options.error;
	} else options = options.value; //Values would be casted to correct data types

	const uuid = options.allergyKey+"-"+Math.random().toString(32).slice(2).toUpperCase();
	const log  = _log.get("train-tree:"+uuid.toLowerCase());

	log.debug("Getting datasets...");

	let tasks = [];
	if(options.trainData) {
		tasks.push(options.trainData);
		tasks.push(options.testData);
	} else {
		tasks.push(getDataset(
			{
				allergyKey: options.allergyKey,
				setType   : CONSTANT("DATASET_FILE_KEYWORD_TRAIN")
			}));
		tasks.push(getDataset({
								  allergyKey: options.allergyKey,
								  setType   : CONSTANT("DATASET_FILE_KEYWORD_TEST")
							  }));
	}
	return Promise.all(tasks)
				  .then(async(datasets) => {
					  log.debug("Datasets obtained.");
					  let _timer   = Date.now();
					  let features = Object.keys(datasets[0].data[0]).filter(v => v!==options.allergyKey);
					  log.debug("Features: %O", features);

					  log.notice("Building decision tree... This may take some time!");
					  let tree = new DecisionTree(datasets[0].data, options.allergyKey, features);

					  _timer = Date.now()-_timer;
					  log.notice("Decision tree was built in %d seconds", _timer/1000);

					  //Lets do some predictions!
					  let predictions = [], actuals = [];
					  for(const d of datasets[1].data) {
					  	actuals.push(d[options.allergyKey]);
					  	predictions.push(tree.predict(d));
					  }

					  let accuracy = await calculateAccuracy({predictions, actuals});

					  let output = {
						  allergyKey: options.allergyKey,
						  uuid,
						  type: (options.testData ? 'bs' : 'ds'),
						  accuracy,
						  model     : tree.toJSON()
					  };
					  if(options.trainData) {
					  	output.data = {
					  		train: options.trainData,
							test: options.testData,
						}
					  }
					  log.info("Accuracy: %O", output.accuracy);
					  log.debug("Model outputted");

					  if(options?.saveData ?? true) {
						  return saveExports({
												 name   : output.uuid,
												 content: JSON.stringify(output, null, 2)
											 })
							  .then(() => {
								  return output;
							  });
					  } else return output;
				  });
};
