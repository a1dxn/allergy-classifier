const fs     = require("fs");
const log    = _log.get("save-exports");

/**
 * @async
 * @name saveExports
 * Save some data somewhere...
 *
 * @param {Object} options
 * @param {string} name - Name of file, excluding path and filetype.
 * @param {Object|String|Buffer} content - Data to write to file.
 * @param {string} [filetype=json] - Filetype to use.
 * @param {string} [directory= <CONSTANT 'TREE_EXPORTS_FILE_PATH'>] - Directory to save in.
 *
 * @returns {Promise<void>}
 */
module.exports = async function saveExports(options) {
	options = Schema.object({
								name     : Schema.string().required().uppercase(),
								content  : Schema.any().required().disallow(null, ""),
								filetype : Schema.string().optional(), //Default json
								directory: Schema.string().optional()
							}).validate(options, {abortEarly: false});
	if(options.error) {
		log.error("Validation error on options argument. %O", options.error);
		throw options.error;
	} else options = options.value; //Values would be casted to correct data types

	let filename = (options.directory ?? CONSTANT("TREE_EXPORTS_FILE_PATH"))+options.name+(options.filetype ?? ".json");
	if(typeof options.content === 'object') options.content = JSON.stringify(options.content, null, 2);

	fs.writeFile(filename, options.content, (err) => {
		if(err) {
			log.error("Error occurred saving exports %s", filename);
			throw err;
		}
		log.info("Exports saved %s", filename);
	});

};
