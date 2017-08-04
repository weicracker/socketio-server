const gulp = require("gulp");
const gulpLoadPlugins = require("gulp-load-plugins"); //自动加载插件 省去一个一个require进来
const fs = require("fs-extra");
const path = require("path");
const $ = gulpLoadPlugins();

const src = "src/";
const result = "server/";

const tsProject = $.typescript.createProject('./tsconfig.json', {
    "noImplicitAny": true,
    "noEmitOnError": false,
});

//每次执行gulp 命令时清理server文件夹
gulp.task('clean', () => {
    fs.removeSync(result);
});


//开发环境 编译tsc 文件
gulp.task("devcompileTsc", () => {
    return gulp.src([`${src}**/*.ts`])
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe(tsProject())
        .pipe($.sourcemaps.write('./',{includeContent: false, sourceRoot: path.resolve(__dirname,"src")}))//__dirname+"/maps/"
        .pipe(gulp.dest(`${result}`))
})

//生产环境 编译tsc 文件
gulp.task("productcompileTsc", () => {
    return gulp.src([`${src}**/*.ts`])
        .pipe($.plumber())
        .pipe(tsProject())
        .pipe(gulp.dest(`${result}`))
})

gulp.task("watch", () => {
    gulp.watch([`${src}**/*.ts`], ["devcompileTsc"])
})

gulp.task("default", ["watch", "clean", "devcompileTsc"]);
gulp.task("build", ["clean", "productcompileTsc"]);