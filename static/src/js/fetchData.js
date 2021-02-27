const {ALLERGY_KEYS, DATA_ENDPOINT} = require("./constants")
	, _                             = require("lodash")
	, jsum                          = require("jsum");

const _data                     = {};
_data[DATA_ENDPOINT("DATASET")] = {};
_data[DATA_ENDPOINT("TREE")]    = {};
let fulfilled                   = false;

const prefetch = () => {
	for(let a of ALLERGY_KEYS) {
		_data[DATA_ENDPOINT("TREE")][a]    = $.getJSON(`${DATA_ENDPOINT("TREE")}/${a}.json`);
		_data[DATA_ENDPOINT("DATASET")][a] = $.getJSON(`${DATA_ENDPOINT("DATASET")}/${a}.json`);
	}
	fulfilled = true;
};

const getData = async(type, name) => {
	type = DATA_ENDPOINT(type);
	if(_.isEmpty(type)) throw "data endpoint type not recognised.";
	if(!_.has(_data[type], name)) throw "data name not recognised.";
	if(!fulfilled) prefetch();
	return Promise.resolve(_data[type][name])
				  .then(d => {
					  if(_.has(d, "checksum")) {
						  let a = d.checksum;
						  let b = jsum.digest(d.model || d.data, "SHA256", "hex");
						  if(a===b) return d;
					  }
					  throw `Failed to verify integrity of ${type}:${name} data.`;
				  });
};

module.exports = {
	prefetch,
	getData
};
