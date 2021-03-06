const fs         = require("fs");
const log        = _log.get("get-tree");
const deepFreeze = require("deep-freeze");
const forest     = require("../../services/cache-manager").store("forest", 0 /*permanent*/);

/**
 * @async
 * @name getTree
 * Get a specific allergy tree model
 * @param {string} allergyKey - Allergy to predict. See constants for allowed set.
 * @returns {Promise<{allergyKey: string, uuid: string, accuracy: Object, model: Object}>} See /trees/ for example!
 */
module.exports = async function getTree(allergyKey) {
	allergyKey = Schema.get("allergyKey").required().validate(allergyKey, {abortEarly: false});
	if(allergyKey?.error) {
		log.error("Validation error on options argument. %O", allergyKey.error);
		throw allergyKey.error;
	} else allergyKey = allergyKey?.value; //Values would be casted to correct data types

	if(forest.has(allergyKey)) return forest.get(allergyKey);

	const filepath = CONSTANT("TREE_FILE_PATH")+allergyKey+CONSTANT("TREE_FILE_EXTENSION");
	let json;
	try {
		let raw = fs.readFileSync(filepath);
		log.debug("file %s fetched", filepath);
		// noinspection JSCheckFunctionSignatures
		json = JSON.parse(raw);
		log.debug("file parsed to json");
		deepFreeze(json);
	} catch(e) {
		log.error("Unable to parse tree %s", allergyKey);
		throw e;
	}

	forest.set(allergyKey, json);
	return json;
};
