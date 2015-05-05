/** -------------------------------------------------------- consts
*/
const SASS_SRC = "./src/sass/";
const CSS_BUILD = "./build/css/";
const CSS_DEPLOY = "./deploy/css/";

const JS_SRC = "./src/js/";
const JS_BUILD = "./build/js/";
const JS_DEPLOY = "./deploy/js/"

const IMG_SRC = "./src/img/";
const IMG_BUILD = "./build/img/";
const IMG_DEPLOY = "./deploy/img/";

const FONT_SRC = "./src/img/";
const FONT_BUILD = "./build/img/";
const FONT_DEPLOY = "./deploy/img/";

const DIST = "./deploy/dist/"; // file for distribution

// const JS_LIB = "src/js/vendor/"; 
// const EXTERNAL_LIBS = {
//     rainbow: JS_LIB + "rainbow-custom.min.js"
// };

/** -------------------------------------------------------- requires
*/
var gulp = require("gulp"),
    browserSync = require("browser-sync").create(),
    reload = browserSync.reload,
    browserify = require("browserify"),
    source = require("vinyl-source-stream"),
    sass = require("gulp-sass"),
    concat = require("gulp-concat"),
    changed = require("gulp-changed"),
    minifyCSS = require("gulp-minify-css"),
    zip = require("gulp-zip"),
    rename = require("gulp-rename"),
    imagemin = require("gulp-imagemin"),
    uglify = require("gulp-uglify"),
    jshint = require("gulp-jshint");

// -------------------------------------------------------- tasks

/** ----------------------------- 
    styles
    compile into css, put it in build, concat, add main file, minify, put in deploy
**/
gulp.task("styles", function(){
    return gulp.src(['node_modules/normalize.css/normalize.css', SASS_SRC+"*.scss"])
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(gulp.dest(CSS_BUILD))
        .pipe(concat("main.css"))
        .pipe(gulp.dest(CSS_BUILD))
        .pipe(reload({ stream: true }))
        .pipe(minifyCSS())
        .pipe(rename({ extname: ".min.css"}))
        .pipe(gulp.dest(CSS_DEPLOY));
});

/** ----------------------------- 
    lint
**/
gulp.task("lint", function(){
    return gulp.src(JS_SRC+"*.js")
        .pipe(jshint())
        .pipe(jshint.reporter("default"));
});

/** ----------------------------- 
    scripts
    concat all scripts, put in build, minify, put in deploy
**/
gulp.task("scripts", function(){
    // var catScripts = []; 
    // for (var ex in EXTERNAL_LIBS) {
    //     catScripts.push(EXTERNAL_LIBS[ex]);
    // }
    // catScripts.push(JS_SRC+"*.js");

    return gulp.src(JS_SRC + "base.js")
        .pipe(concat("main.js"))
        .pipe(gulp.dest(JS_BUILD))
        .pipe(uglify({ preserveComments: "some"}))
        .pipe(gulp.dest(JS_DEPLOY));
});

/** ----------------------------- 
    browserify
    bundle js dependencies based on base.js
**/
gulp.task("browserify", function(){
    return browserify(JS_SRC + "base.js")
        .bundle()
        .pipe(source("base.js"))
        .pipe(gulp.dest(JS_BUILD))
});

// -------------------------------------------------------- serve 

/** ----------------------------- 
    script-watch
    make sure scripts task is complete before reloading browser
**/
gulp.task("script-watch", ["scripts"], reload);

/** ----------------------------- 
    serve
    use browsersync to create static server for build
**/
gulp.task("serve", ["styles"], function(){
    browserSync.init({
        server: "./build"
    });

    gulp.watch(SASS_SRC + "*.scss", ["styles"]);
    gulp.watch(JS_SRC + "*.js", ["lint", "script-watch"]);
    gulp.watch("build/*.html").on("change", reload);
});


// -------------------------------------------------------- deploy 

/** ----------------------------- 
    copy styles for distribution
**/
gulp.task("publish-styles", function(){
    return gulp.src(CSS_BUILD+"carrotcell.css")
        .pipe(changed(DIST))
        .pipe(gulp.dest(DIST));
})

/** ----------------------------- 
    image processing
**/
gulp.task("images", function(){
    return gulp.src(IMG_SRC+"**")
        .pipe(imagemin())
        .pipe(gulp.dest(IMG_BUILD));
});

/** ----------------------------- 
    dist-scripts
**/
gulp.task("publish-scripts", function(){
    return gulp.src(JS_SRC+"jCarrotCell.js")
        .pipe(changed(DIST))
        .pipe(gulp.dest(DIST))
        .pipe(uglify({ preserveComments: "some"}))
        .pipe(rename({ extname: ".min.js"}))
        .pipe(gulp.dest(DIST));
})

/** ----------------------------- 
    deploy 
    move readable files into DIST and zip it up
**/
gulp.task("deploy", ["images", "publish-scripts", "publish-styles"], function(){
    return gulp.src([DIST+"*", "!"+DIST+"*.zip"])
        .pipe(zip("jcarrotcell.zip"))
        .pipe(gulp.dest(DIST));
})

// -------------------------------------------------------- default 
/** ----------------------------- 
    default gulp 
    start serving up this thing
**/
gulp.task("default", ["serve"]);

