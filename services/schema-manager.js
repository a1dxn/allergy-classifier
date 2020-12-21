const log = _log.get("schema-manager");
const _   = require("lodash");

const Schema  = Object.create(require("joi"));
Schema["get"] = get; //adding custom method
Object.freeze(Schema);
/****/

const _SCHEMAS = {

	allergyKey      : Schema.string()
							.uppercase()
							.pattern(new RegExp(`(${CONSTANT("DATASET_ALLERGY_KEYS").join("|")})`),
									 "Allergy Key"),
	setType         : Schema.string()
							.uppercase()
							.valid(
								CONSTANT("DATASET_FILE_KEYWORD_TRAIN"),
								CONSTANT("DATASET_FILE_KEYWORD_TEST")),
	rowFeatureValue : Schema.number()
							.precision(0)
							.min(0)
							.max(1)
							.disallow(null, ""),
	datasetRowObject: {}, /*See below for loop*/

};

for(const key of CONSTANT("DATASET_ALLERGY_KEYS")) {
	_SCHEMAS.datasetRowObject[key] = get("rowFeatureValue");
}

/****/
function get(name, options) {
	try {
		if(_.has(_SCHEMAS, name)) {
			let retrieved = _.cloneDeep(_SCHEMAS[name]);

			if(options?.allKeysRequired===true) {
				Schema.assert(retrieved, Schema.object());
				for(const k in retrieved) {
					let v        = retrieved[k];
					retrieved[k] = v.required();
				}
			}
			if(options?.omitKeys) {
				log.debug("going to omit: %O", options.omitKeys);
				Schema.assert(retrieved, Schema.object());
				Schema.assert(options.omitKeys, Schema.array().items(Schema.string()));
				return _.omit(retrieved, options.omitKeys);
			}
			return retrieved;
		} else {
			log.error("Schema %s does NOT exist!", name);
			throw "Schema does not exist.";
		}
	} catch(e) {
		log.error("Error occurred. name:%s, options:%O", name, options);
		throw e;
	}

}

module.exports = Schema;
