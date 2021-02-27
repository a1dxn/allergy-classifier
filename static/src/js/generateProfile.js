const {POSITIVE}                  = require("./constants")
	, {PATTERNS_RULE_MIN_SUPPORT} = require("./constants").PATTERNS
	, {getData}                   = require("./fetchData")
	, generateSVG                 = require("./generateSVG")
	, _                           = require("lodash");

module.exports = async function generateProfile(data) {
	console.log("Generating predictions and rules...");
	const keys    = _.keys(data);
	const posKeys = keys.filter(v => data[v]===1);
	const negKeys = keys.filter(v => data[v]===0);
	const todo    = [];
	for(const k of negKeys) {
		let actions = [
			getData("tree", k).then(tree => predict(k, _.omit(data, k), tree)),
			getData("dataset", k).then(dataset => findPatterns(k, _.without(keys, k), dataset)),
			getData("dataset", k).then(dataset => findPatterns(k, _.without(posKeys, k), dataset))
		];
		todo.push(Promise.all(actions)
						 .then(res => ({
							 allergyKey: k,
							 data,
							 prediction: res[0],
							 patterns  : {
								 allFeatures   : res[1],
								 chosenFeatures: res[2]
							 }
						 })));
	}
	return Promise.all(todo);
};

async function predict(key, data, tree) {
	let path       = [];
	let prediction = null;
	try {
		let root = tree.model;
		while(root.type!=="result") {
			path.push(root.name+":"+data[root.name]);
			let childNode = _.find(root.vals, (node) => node.name===data[root.name]);
			if(childNode) root = childNode.child;
			else root = root.vals[0].child;
		}
		prediction = root.val;
	} catch(e) {
		console.error("Unable to traverse tree!");
		console.error(e);
		throw "Unable to traverse tree";
	}
	if(!_.isNumber(prediction)) throw "Unable to predict";

	return {
		allergyKey  : key,
		data,
		prediction,
		path,
		svg         : generateSVG(_.concat(path, "RESULT:"+prediction)),
		treeAccuracy: tree.accuracy
	};
}

async function findPatterns(key, features, dataset) {
	let rules = traverse(_.concat(key, features), dataset.data);
	return {
		allergyKey: key,
		features  : features,
		size      : rules[0].size,
		rules     : _.tail(rules).sort((a, b) => a.support>b.support ? -1 : 1)
	};

	function traverse(ft, cases, totalCases = -1, results = [], path) {
		const me = _.head(ft);
		ft       = _.tail(ft);
		cases    = cases.filter((row) => row[me]===POSITIVE); //positive cases wanted!
		if(totalCases=== -1) totalCases = cases.length;
		else path = (path ? path+"," : "")+me;
		const support = cases.length/totalCases;
		if(support<PATTERNS_RULE_MIN_SUPPORT) return results;
		results.push({
						 path: path || "root",
						 size: cases.length,
						 support,
					 });
		while(ft.length>0) {
			traverse(ft, cases, totalCases, results, path);
			ft = _.tail(ft);
		}
		return results;
	}
}
