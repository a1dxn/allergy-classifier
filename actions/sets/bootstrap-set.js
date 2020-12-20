const log        = _log.get("bootstrap-set");
const getDataset = require("./get-dataset");
const Schema     = require("joi");
const _          = require("lodash");

/**
 * @async
 * @name generateBootstrapSet
 * Generate a bootstrap set from existing (combined) datasets.
 *
 * @param {string} allergyKey - Allergy set to get. See constants for allowed set.
 * @returns {Promise<{bootstrapIncluded : [], bootstrapExcluded : []}>}
 */
module.exports = async function generateBootstrapSet(allergyKey) {
	allergyKey = Schema.string().required().uppercase()
					   .pattern(
						   new RegExp(`(${CONSTANT("DATASET_ALLERGY_KEYS").join("|")})`),
						   "Allergy Key")
					   .validate(allergyKey, {abortEarly: false});
	if(allergyKey.error) {
		log.error("Validation error on options argument. %O", allergyKey.error);
		throw allergyKey.error;
	} else allergyKey = allergyKey.value; //Values would be casted to correct data types

	let originalDataset     = await getDataset({allergyKey});
	originalDataset = originalDataset.data;
	const originalDatasetSize = originalDataset.length;

	let includedIndex = [];
	let bootstrapIncluded = [];
	let excludedIndex = [];
	let bootstrapExcluded = [];

	for(let i = 0; i<originalDatasetSize; i++) {
		const randomIndex = getRandomInt(originalDatasetSize);
		includedIndex.push(randomIndex);
		const d = originalDataset[randomIndex];
		bootstrapIncluded.push(d);
	}

	for(let i = 0; i<originalDatasetSize; i++) {
		if(includedIndex.includes(i)) continue;
		const d = originalDataset[i];
		excludedIndex.push(i);
		bootstrapExcluded.push(d);
	}

	log.info("Length of original:%d, included:%d, excluded:%d, inc&exc:%d",
			 originalDatasetSize, bootstrapIncluded.length, bootstrapExcluded.length,
			 (bootstrapIncluded.length+bootstrapExcluded.length));

	let intersection = _.intersection(includedIndex, excludedIndex);
	if(intersection > 0) {
		log.error('INTERSECTION OF INC AND EXC: %O', intersection);
		throw 'Intersection of included and excluded indexes... somethings happened!';
	}


	return {bootstrapIncluded, bootstrapExcluded};
};

function getRandomInt(max) {
	return Math.floor(Math.random()*Math.floor(max));
}
