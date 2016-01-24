const gulp = require("gulp");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const merge = require("merge2");
const mocha = require("gulp-mocha");
const rimraf = require("rimraf");
const mkdirp = require("mkdirp");
const fs = require("fs");

var mainTsOptions = {
    target: "es5",
    noImplicitAny: true,
    module: "commonjs",
    declaration: true,
    sourceMap: true,
    suppressImplicitAnyIndexErrors: true
};
var testTsOptions = {
    target: "es5",
    noImplicitAny: true,
    module: "commonjs",
    sourceMap: true,
    suppressImplicitAnyIndexErrors: true
};
var tsTypingsFile = "./typings/tsd.d.ts";

gulp.task("clean", (done) => {
    rimraf("./out", (err) => {
        if (err) return done(err);
        
        mkdirp("./out", done);
    });
});

gulp.task("tsc", (done) => {
    return compileTypeScript(mainTsOptions, [
        tsTypingsFile,
        "./*.ts"
    ], null);
});

gulp.task("tsc-test", ["tsc"], (done) => {
    return compileTypeScript(testTsOptions, [
        tsTypingsFile,
        "./test/*.ts"
    ], "test");
});

gulp.task("build", ["tsc", "tsc-test"]);

gulp.task("test", ["build"], () => {
    return gulp
        .src("./out/test/*.js", { read: false })
        .pipe(mocha({ reporter: "spec" }));
});

function compileTypeScript(options, fileGlobs, outDir, done) {
    var pipeline = gulp
        .src(fileGlobs)
        .pipe(sourcemaps.init())
        .pipe(ts(options));

    outDir = (outDir || "");
    
    return merge([
        pipeline.js.pipe(gulp.dest("./out/" + outDir)),
        pipeline.dts.pipe(gulp.dest("./out/" + outDir)),
        pipeline.pipe(sourcemaps.write({
            includeContent: false,
            sourceRoot: "../"
        }))
    ]);
}