const {src, dest, parallel} = require("gulp")
	, _                     = require("lodash")
	, imagemin              = require("gulp-imagemin")
	, sourcemaps            = require("gulp-sourcemaps")
	, ejs                   = require("gulp-ejs")
	, rename                = require("gulp-rename")
	, browserify            = require("browserify")
	, source                = require("vinyl-source-stream")
	, buffer                = require("vinyl-buffer")
	, jsonTransform         = require("gulp-json-transform")
	, jsum                  = require("jsum")
	, csvtojson             = require("gulp-csvtojson")
	, htmlmin               = require("gulp-htmlmin")
	, cleanCSS              = require("gulp-clean-css")
	, Path                  = require("path")
	, minify                = require("gulp-minify")
	, uglifyify             = require("uglifyify")
;

exports.staticify = parallel(
	imgOptimise
	, cssOptimise
	, ejsRender
	, jsBrowserify
	, copyWebflow
	, checksumTrees
	, jsonifySets
	, copyConfig
);

function defaultTask(cb) {
	return cb();
}

exports.default = defaultTask;

function imgOptimise() {
	return src("public/images/*")
		.pipe(imagemin())
		.pipe(dest("static/dist/images"));
}

exports.imgOptimise = imgOptimise;

function cssOptimise() {
	return src("public/css/*.css")
		.pipe(sourcemaps.init())
		.pipe(cleanCSS())
		.pipe(sourcemaps.write("."))
		.pipe(dest("static/dist/css"));
}

exports.cssOptimise = cssOptimise;

function ejsRender() {
	return src("views/*.ejs")
		.pipe(ejs({a: ""}))
		.pipe(htmlmin({
						  caseSensitive              : true,
						  collapseWhitespace         : true,
						  collapseInlineTagWhitespace: true,
						  minifyJS                   : true,
						  minifyURLs                 : true,
						  removeComments             : true,
						  useShortDoctype            : true,
					  }))
		.pipe(rename({
						 extname: ".html"
					 }))
		.pipe(dest("static/dist"));
}

exports.ejsRender = ejsRender;

function jsBrowserify() {
	return browserify("static/src/js/main.js",)
		.transform("uglifyify", {global: true})
		.bundle()
		.pipe(source("main.js"))
		.pipe(buffer())
		.pipe(dest("static/dist/js"));
}

exports.jsBrowserify = jsBrowserify;

function jsBrowserifyDebug() {
	return browserify("static/src/js/main.js", {debug: true})
		.bundle()
		.pipe(source("main.js"))
		.pipe(buffer())
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(sourcemaps.write("."))
		.pipe(dest("static/dist/js"));
}

exports.jsBrowserifyDebug = jsBrowserifyDebug;

function copyWebflow() {
	return src("public/js/webflow.js")
		.pipe(dest("static/dist/js"));
}

exports.copyWebflow = copyWebflow;

function copyConfig() {
	return src("static/src/config/*")
		.pipe(dest("static/dist"));
}

exports.copyConfig = copyConfig;

function checksumTrees() {
	return src("trees/*.json")
		.pipe(jsonTransform(function(data, file) {
			data.checksum = jsum.digest(data.model, "SHA256", "hex");
			return data;
		}))
		.pipe(dest("static/dist/trees"));
}

exports.checksumTrees = checksumTrees;

function jsonifySets() {
	return src("datasets/bootstrapped/*_TRAIN.csv")
		.pipe(rename(function(path) {
			path.basename = path.basename.replace("_TRAIN", "");
		}))
		.pipe(csvtojson({
							noheader : false,
							output   : "json",
							trim     : true,
							checkType: true,
						}))
		.pipe(jsonTransform(function(data, file) {
			return {
				allergyKey: Path.basename(file.path, Path.extname(file.relative)),
				data,
				checksum  : jsum.digest(data, "SHA256", "hex")
			};
		}))
		.pipe(dest("static/dist/sets"));
}

exports.jsonifySets = jsonifySets;
