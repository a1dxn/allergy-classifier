const log     = _log.get("tree-predict");
const getTree = require("./get");

/**
 * @async
 * @name predictTree
 * Given some data, predict allergy classification. 0 or 1.
 *
 * @param {Object} options
 * @param {string} options.allergyKey - Allergy to predict. See constants for allowed set.
 * @param {Object} options.data - Data containing all allergy keys excluding options.allergyKey.
 * @returns {Promise<number>} 0 or 1
 */
module.exports = async function predictTree(options) {
	options = Schema.object({
								allergyKey: Schema.string().required().uppercase()
												  .pattern(
													  new RegExp(`(${CONSTANT("DATASET_ALLERGY_KEYS").join("|")})`),
													  "Allergy Key"),
								data      : Schema.object().required(),
							})
					.validate(options, {abortEarly: false});
	if(options.error) {
		log.error("Validation error on options argument. %O", options.error);
		throw options.error;
	} else options = options.value; //Values would be casted to correct data types

	const tree = getTree(options.allergyKey);

	let prediction = null;
	try {
		let root = tree.model;
		while(root.type !== 'result') {
			let childNode = _.find(root.vals, (node) => node.name === options.data[root.name]);
			if(childNode) root = childNode.child;
			else root = root.vals[0].child;
		}
		prediction = root.val;
	} catch(e) {
		log.error('Unable to traverse tree! Error: %O', e);
		throw e;
	}
	log.info('Predicting: %O', options.data);
	log.info('The results are in...%s:%s!', options.allergyKey, prediction===0 ? 'FALSE' : 'TRUE');
	return prediction;

};
