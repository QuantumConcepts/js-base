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
    rimraf("./dist", (err) => {
        if (err) return done(err);
        
        mkdirp("./dist", done);
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
        .src("./dist/test/*.js", { read: false })
        .pipe(mocha({ reporter: "spec" }));
});

function compileTypeScript(options, fileGlobs, outDir, done) {
    var pipeline = gulp
        .src(fileGlobs)
        .pipe(sourcemaps.init())
        .pipe(ts(options));

    outDir = (outDir || "");
    
    return merge([
        pipeline.js.pipe(gulp.dest("./dist/" + outDir)),
        pipeline.dts.pipe(gulp.dest("./dist/" + outDir)),
        pipeline.pipe(sourcemaps.write({
            includeContent: false,
            sourceRoot: "../"
        }))
    ]);
}