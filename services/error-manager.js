/**
 * @name FormatError
 * Format an error into a presentable object for sending back to requests.
 *
 * @param {Error|string|object} _err - Error to format.
 * @param {ServerResponse} [responseFunction] - 'res' from the Express Router to make things simpler.
 * @returns {{name : string, message : string, status : number}}
 */
function FormatError(_err, responseFunction) {
	let e = {
		status : 500,
		name   : "ServerError",
		message: "An unknown server error has occurred.",
	};

	if(_err?.isJoi) {
		e.status  = 422;
		e.details = _err?.details;
	}

	if(_err instanceof Error) {
		if(!_.isEmpty(_err?.name)) e.name = _err.name.toString();
		if(!_.isEmpty(_err?.message)) e.message = _err.message.toString();
	} else if(typeof _err==="string") {
		if(!_.isEmpty(_err)) e.message = _err.toString();
	} else if(typeof _err==="object") {
		if(!_.isEmpty(_err?.error)) e = FormatError(_err.error);
		if(!_.isEmpty(_err?.name)) e.name = _err.name.toString();
		if(!_.isEmpty(_err?.message)) e.message = _err.message.toString();
		if(!_.isEmpty(_err?.statusCode)) e.status = parseInt(_err.statusCode);
		if(!_.isEmpty(_err?.input)) e.input = _err.input;
		if(!_.isEmpty(_err?.details)) e.details = _err.details;

	}

	if(responseFunction) {
		try {
			responseFunction.status(e.status).json({error: e});
		} catch(e) {
		}
	}

	return e;
}

module.exports = FormatError;
