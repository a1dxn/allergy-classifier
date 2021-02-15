const express = require("express");
const router  = express.Router();
const log     = _log.get("http:router");

/* GET home page. */
router.get("/", async(req, res) => {
	res.render("index", sendGlobalDataToClient(
		{
			"GENERATE_PROFILE_URI" : process.env.API_LOCAL ? "/generateProfile" : "/public/generateProfile",
			"GENERATE_TREE_SVG_URI": process.env.API_LOCAL ? "/svg/generate" : "/public/svg/generate"
		})
	);
});
router.get("/index.html", (req, res) => res.redirect("/"));

function sendGlobalDataToClient(extraData) {
	let data = {
		"API_ENDPOINT"   : process.env.API_ENDPOINT,
		"APIM_PUBLIC_KEY": process.env.APIM_PUBLIC_KEY,
		"API_LOCAL"      : process.env.API_LOCAL
	};

	data = _.extend(data, extraData);

	return {a: data};
}

router.get("/james", (req, res) => res.send(`<h1>♥️</h1>`));

module.exports = router;
