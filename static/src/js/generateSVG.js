const _                       = require("lodash")
	, {NEGATIVE, LEFT, RIGHT} = require("./constants")
	, {
		  PADDING_TOP,
		  PADDING_LEFT,
		  PADDING_RIGHT,
		  HEIGHT,
		  PATH_HEIGHT,
		  PATH_WIDTH,
		  LABEL_PADDING_TOP,
		  LABEL_PADDING_BOTTOM
	  }                       = require("./constants").SVG;

module.exports = function generateSVG(path) {
	const stepCount = path.length;
	const steps     = path.map((v) => parseInt(v[v.length-1]));

	const wSize  = calcWidth(steps, {
		maxLeft : 0,
		maxRight: 0,
		traverse: PATH_WIDTH || 1
	});
	const canvas = {
		width : PADDING_LEFT+Math.abs(wSize.maxLeft)+Math.abs(wSize.maxRight)+PADDING_RIGHT,
		height: (HEIGHT*stepCount),
	};

	const startingPoint = Math.abs(wSize.maxLeft);
	const initialSVG    = `<svg class="tree" width=100% height="auto" viewBox="0 0 ${canvas.width} ${canvas.height}">`;

	return traverse(startingPoint+PADDING_LEFT, PADDING_TOP, path, initialSVG);
};

function calcWidth(steps, options, base = 0) {
	let step      = steps[0];
	let leftBase  = base-options.traverse;
	let rightBase = base+options.traverse;
	if(leftBase<options.maxLeft) options.maxLeft = leftBase;
	if(rightBase>options.maxRight) options.maxRight = rightBase;
	if(steps.length>1) {
		return calcWidth(_.tail(steps), options, step===LEFT ? leftBase : rightBase);
	} else {
		return options;
	}
}

function traverse(x, y, path, result = "<svg>") {
	const pathSplit = path[0].split(":");
	const step      = parseInt(pathSplit[1]);
	const label     = path.length===1 ? (step===NEGATIVE ? "*NEGATIVE*" : "POSITIVE*") : pathSplit[0];

	y += LABEL_PADDING_TOP;
	result += `<text ${path.length===1 ? `class="result"` : ``} x="${x}" y="${y}">${label}</text>`;

	if(path.length===1) {
		return result+"</svg>";
	}

	y += LABEL_PADDING_BOTTOM;
	const leftLine  = `<path ${step===LEFT ? `class="chosen"` : ``} d="m ${x} ${y} v 10 h -${PATH_WIDTH} v 10"/>`;
	const rightLine = `<path ${step===RIGHT ? `class="chosen"` : ``} d="m ${x} ${y} v 10 h ${PATH_WIDTH} v 10"/>`;

	//The chosen route must be on top to show the shared line colour
	if(step===LEFT) result += rightLine+leftLine;
	else if(step===RIGHT) result += leftLine+rightLine;

	y += PATH_HEIGHT;
	x += step===LEFT ? -PATH_WIDTH : PATH_WIDTH; //moving left or right
	return traverse(x, y, _.tail(path), result);
}
