const log          = _log.get("generate-profile");
const predictTree  = require("../actions/trees/predict");
const findPatterns = require("../actions/patterns/find");

/**
 *
 * @param {Object} data - dataset row containing existing allergy key data
 * @returns {Promise<[{allergyKey, data, prediction, patterns}]>}
 */
module.exports = async function generateProfile(data) {
	data = Schema.object(Schema.get("datasetRowObject")).validate(data, {abortEarly: false});
	if(data?.error) {
		log.error("Validation error on options argument. %O", data.error);
		throw data.error;
	} else data = data?.value; //Values would be casted to correct data types

	log.info('data: %O', data);


	const existingKeys = _.keys(data);
	const missingKeys  = CONSTANT("DATASET_ALLERGY_KEYS");
	for(const k of existingKeys) _.pull(missingKeys, k);
	if(missingKeys.length===0) {
		//They have everything so theres no point evaluating against our models...
		//todo: Perhaps it may be worth using this for testing the accuracy?
	}
	log.info('existingKeys: %O', existingKeys);
	log.info('missingKeys: %O', missingKeys);

	let todo = [];
	for(const k of missingKeys) {
		const p = Promise.all([
								  predictTree({allergyKey: k, data}),
								  findPatterns({allergyKey: k, features: existingKeys})
							  ])
						 .then(res => {
						 	res[1].rules = _.take(res[1].rules, CONSTANT("PATTERNS_RULE_LIMIT"));
							 return {
								 allergyKey: k,
								 data,
								 prediction: res[0],
								 patterns  : res[1]
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
