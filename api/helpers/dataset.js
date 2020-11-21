const csv = require('csvtojson');

let self = {

	friendlyName: 'Dataset Handler',

	description: 'Handles the parsing and formatting of dataset files',

	inputs: {

		allergyKey: {
			friendlyName: 'Allergy Keyword',
			type        : 'string',
			required    : true,
		},

		setType: {
			friendlyName: 'Dataset Type',
			description : 'Accepts either TRAIN or TEST',
			type        : 'string',
			defaultsTo  : 'TRAIN',
		},

	},

	exits: {

		success: {
			description: 'All done.',
		},

		invalidAllergyKey: {
			description: 'Allergy key not recognised from list of constants.',
		},

		invalidSetType: {
			description: 'Dataset Type not recognised. Accepts only TRAIN or TEST.',
		},

		datasetNotFound: {
			description: 'Dataset was not found with given allergy key and set type.',
		},

	},

	fn: async function(inputs, exits) {
		const _start     = Date.now();
		const allergyKey = inputs.allergyKey.toUpperCase();
		if(!sails.config.CONSTANTS.DATASET_ALLERGY_KEYWORDS.includes(allergyKey)) {
			return exits.invalidAllergyKey({inputs});
		}

		const setKeyword = sails.config.CONSTANTS['DATASET_FILE_KEYWORD_'+inputs.setType.toUpperCase()];
		if(_.isEmpty(setKeyword)) {
			return exits.invalidSetType({inputs});
		}

		const datasetName = inputs.allergyKey.toUpperCase()+'_'+setKeyword;

		const cache = sails.hooks.cache.store('datasets');
		let dataset = cache.get(datasetName);
		if(_.isEmpty(dataset)) {
			const fullFilePath = sails.config.CONSTANTS.DATASET_FILE_PATH+datasetName
			                     +sails.config.CONSTANTS.DATASET_FILE_EXTENSION;

			const stats = {
				positiveCases           : 0,
				positiveIntersectionWith: {},
				confidences             : {
					precedence: [],
				},
				negativeCases           : 0,
				totalCases              : 0,
			}
			for(let alg of sails.config.CONSTANTS.DATASET_ALLERGY_KEYWORDS) stats.positiveIntersectionWith[alg] = 0;

			const parsedData = await csv({
				                             noheader : false,
				                             output   : 'json',
				                             trim     : true,
				                             checkType: true,
			                             }).fromFile(fullFilePath)
			                               .subscribe((jsonObject, i) => {
				                               stats.totalCases++;
				                               if(jsonObject[allergyKey]===1) {
					                               stats.positiveCases++;
					                               for(let alg in jsonObject) {
						                               stats.positiveIntersectionWith[alg] += jsonObject[alg];
					                               }
				                               } else {
					                               stats.negativeCases++;
				                               }
			                               });

			//Delete the intersection of allergyKey-U-allergyKey as it would be confusing! (just use positiveCases)
			delete stats.positiveIntersectionWith[allergyKey];
			//Calculate confidences for all intersections
			for(let alg in stats.positiveIntersectionWith) {
				stats.confidences[alg] = stats.positiveIntersectionWith[alg]/stats.positiveCases;
				stats.confidences[alg] = Math.round((stats.confidences[alg]+Number.EPSILON)*100)/100;
				stats.confidences.precedence.push(alg);
			}
			stats.confidences.precedence.sort((a, b) => stats.confidences[b]>stats.confidences[a] ? 1 : -1);

			dataset = new DataSet(allergyKey, inputs.setType, parsedData, stats);
			cache.set(datasetName, dataset);
			sails.log.debug(`Fetched new DataSet object for '${datasetName}' in ${Date.now()-_start}ms`);
		} else {
			sails.log.debug(`Fetched cached DataSet object for '${datasetName}' in ${Date.now()-_start}ms`);
		}

		// console.log(dataset);
		return exits.success(dataset);

	},

};

module.exports = self;

class DataSet {

	constructor(key, type, data, stats) {
		this.allergyKey = key.toUpperCase();
		this.type       = type.toUpperCase();
		this.data       = data;
		this.stats      = stats;
	}

}
