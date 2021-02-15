const calcWidth = require("./calculate-width");
const log       = _log.get("svg-generate");

const NODE_LABEL_PADDING_TOP    = 10
	, NODE_LABEL_PADDING_BOTTOM = 10
	, NODE_PATH_HEIGHT          = 20
	, NODE_PATH_WIDTH           = 50
	, NODE_HEIGHT               = 40
	, PADDING_LEFT              = 10
	, PADDING_RIGHT             = 10
	, PADDING_TOP               = 10
;

module.exports = async function(path) {
	const _start = Date.now(); //debug: time tracking
	Schema.assert(path, Schema.array().label("Path").min(2));
	Schema.assert(_.initial(path), Schema.array()
										 .label("Path")
										 .required()
										 .items(Schema.string()
													  .label("Path step")
													  .required()
													  .uppercase()
													  .pattern(
														  new RegExp(`(${CONSTANT("DATASET_ALLERGY_KEYS").join("|")}):[01]`),
														  "expected step")));
	Schema.assert(_.last(path), Schema.string()
									  .label("final path step")
									  .required()
									  .uppercase()
									  .pattern(
										  new RegExp(`RESULT:[01]`),
										  "expected result step"));

	const pathStringRepresentation = path.join("->");
	log.debug("Generating SVG for path: %s", pathStringRepresentation);

	const stepCount = path.length;
	const steps     = path.map((v) => parseInt(v[v.length-1]));

	const wSize  = await calcWidth(steps, NODE_PATH_WIDTH);
	const canvas = {
		width : PADDING_LEFT+Math.abs(wSize?.maxLeft)+Math.abs(wSize?.maxRight)+PADDING_RIGHT,
		height: (NODE_HEIGHT*stepCount),
	};

	const startingPoint = Math.abs(wSize?.maxLeft);
	const initialSVG    = `<svg class="tree" width=100% height="auto" viewBox="0 0 ${canvas.width} ${canvas.height}">`;

	return traverse(startingPoint+PADDING_LEFT, PADDING_TOP, path, initialSVG).then((result) => {
		log.info("SVG generated in %dms for path:%s.", Date.now()-_start, pathStringRepresentation);
		return result;
	});
};

async function traverse(x, y, path, returnVal) {
	const pathSplit = path[0].split(":");
	const step      = parseInt(pathSplit[1]); //0 for L, 1 for R traversal
	let label       = _.capitalize(pathSplit[0]);
	if(path.length===1) { //this must be the final result step then!
		label = step===0 ? "*NEGATIVE*" : "*POSITIVE*";
	}

	y += NODE_LABEL_PADDING_TOP; //add top text buffer
	returnVal += `<text ${path.length===1 ? `class="result"` : ``} x="${x}" y="${y}">${label}</text>`;

	if(path.length===1) { //If final step, stop here to avoid adding extra lines...
		return returnVal+"</svg>";
	}

	y += NODE_LABEL_PADDING_BOTTOM; //add text to line padding
	const leftLine  = `<path ${step===0 ? `class="chosen"` : ``} d="m ${x} ${y} v 10 h -${NODE_PATH_WIDTH} v 10"/>`;
	const rightLine = `<path ${step===1 ? `class="chosen"` : ``} d="m ${x} ${y} v 10 h ${NODE_PATH_WIDTH} v 10"/>`;

	//Choosing which order to print in...the chosen path should go last (to appear on top!)
	if(step===0) returnVal += rightLine+leftLine;
	else returnVal += leftLine+rightLine;

	y += NODE_PATH_HEIGHT;
	x += step===0 ? -NODE_PATH_WIDTH : NODE_PATH_WIDTH; //Moving left or right x pixels for next round
	return traverse(x, y, _.tail(path), returnVal);
}
