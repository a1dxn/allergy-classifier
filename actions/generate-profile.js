const log          = _log.get("generate-profile");
const predictTree  = require("../actions/trees/predict");
const findPatterns = require("../actions/patterns/find");
const getTree      = require("../actions/trees/get");

/**
 *
 * @param {Object} data - dataset row containing existing allergy key data
 * @returns {Promise<[{allergyKey, data, prediction, patterns}]>}
 */
module.exports = async function generateProfile(data) {
	data = Schema.object(Schema.get("datasetRowObject", {allKeysRequired: true})).validate(data, {abortEarly: false});
	if(data?.error) {
		log.error("Validation error on options argument. %O", data.error);
		throw data.error;
	} else data = data?.value; //Values would be casted to correct data types

	log.info("data: %O", data);

	const keys         = _.keys(data);
	const positiveKeys = keys.filter(v => data[v]===1);
	const negativeKeys = keys.filter(v => data[v]===0);

	log.debug("positiveKeys: %O", positiveKeys);
	log.debug("negativeKeys: %O", negativeKeys);

	let todo = [];
	for(const k of negativeKeys) {
		const p = Promise.all([
								  /*0 DT prediction*/predictTree({allergyKey: k, data: _.omit(data, k)}),
								  /*1 Top patterns*/findPatterns({allergyKey: k, features: _.without(keys, k)}),
								  /*2 PositiveKey patterns*/findPatterns({allergyKey: k, features: _.without(positiveKeys, k)}),
								  /*3 DT Tree Accuracy*/getTree(k)
							  ])
						 .then(res => {
							 res[1].rules            = _.take(res[1].rules, CONSTANT("PATTERNS_RULE_LIMIT"));
							 res[3].rules            = _.take(res[3].rules, CONSTANT("PATTERNS_RULE_LIMIT"));
							 let prediction          = res[0];
							 prediction.treeAccuracy = res[3].accuracy;

							 return {
								 allergyKey: k,
								 data,
								 prediction,
								 patterns  : {
									 chosenFeatures: res[2],
									 allFeatures   : res[1]
								 }
							 };
						 })
						 .catch(e => {
							 log.error("Error occurred evaluating allergy %s. data:%O, error:%O", k, data, k);
							 throw e;
						 });
		todo.push(p);
	}

	return Promise.all(todo);

};
