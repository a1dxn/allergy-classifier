const log = _log.get('constant-manager');
const CONSTANTS = Object.freeze({
								  DATASET_FILE_PATH         : process.cwd()+'/datasets/bootstrapped/',
								  DATASET_FILE_EXTENSION    : '.csv',
								  DATASET_FILE_KEYWORD_TRAIN: 'TRAIN',
								  DATASET_FILE_KEYWORD_TEST : 'TEST',
								  DATASET_ALLERGY_KEYS  : Object.freeze([
																				'EGG',
																				'FISH',
																				'MILK',
																				'NUTS',
																				'PEANUT',
																				'SESAME',
																				'SHELLFISH',
																				'SOYA',
																				'WHEAT',
																			]),
	TREE_EXPORTS_FILE_PATH: process.cwd()+'/tree-exports/',
	TREE_FILE_PATH: process.cwd()+'/trees/',
	TREE_FILE_EXTENSION: '.json'
							  });

module.exports = function(name) {
	if(_.has(CONSTANTS, name)) return CONSTANTS[name];
	else {
		log.error('Constant %s does NOT exist!', name);
		throw 'Constant does not exist.';
	}
};
