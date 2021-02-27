const _        = require("lodash");
module.exports = {

	ALLERGY_KEYS: [
		"EGG",
		"FISH",
		"MILK",
		"NUTS",
		"PEANUT",
		"SESAME",
		"SHELLFISH",
		"SOYA",
		"WHEAT"
	],

	EMOJI: (id) => ({
		"false"    : "✅",
		"true"     : "🆘",
		"egg"      : "🥚",
		"fish"     : "🐟",
		"milk"     : "🥛",
		"nuts"     : "🌰",
		"nut"      : "🌰",
		"peanut"   : "🥜",
		"sesame"   : "🍚",
		"shellfish": "🍤",
		"soya"     : "🍲",
		"soy"      : "🍲",
		"wheat"    : "🍞",
		"ohdear"   : "🤒"
	})[_.lowerCase(id)],

	/* Data endpoints */
	DATA_ENDPOINT   : (type) => ({
		"DATASET": "sets",
		"TREE"   : "trees",
	})[type.toUpperCase()],
	POSITIVE        : 1,
	NEGATIVE        : 0,
	LEFT            : 0,
	RIGHT           : 1,
	NUMBER_PRECISION: 3,

	/* Patterns */
	PATTERNS: {
		PATTERNS_RULE_LIMIT             : 3,
		PATTERNS_RULE_MIN_SUPPORT       : 0.15,
		PATTERNS_COMPOUND_RULE_SEPARATOR: "&",
	},

	/* SVG */
	SVG: {
		LABEL_PADDING_TOP   : 10,
		LABEL_PADDING_BOTTOM: 10,
		PATH_HEIGHT         : 20,
		PATH_WIDTH          : 50,
		HEIGHT              : 40,
		PADDING_LEFT        : 10,
		PADDING_RIGHT       : 10,
		PADDING_TOP         : 10,
	}

};
