'use strict';

var gulp = require('gulp');
var del = require('del');
var newer = require('gulp-newer');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var rename = require('gulp-rename');

var imagemin = require('gulp-imagemin');
var svgmin = require('gulp-svgmin');
var svgstore = require('gulp-svgstore');

var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var objectFit = require('postcss-object-fit-images');
var minify = require('gulp-csso');

var posthtml = require('gulp-posthtml');
var include = require('posthtml-include');

var server = require('browser-sync').create();

gulp.task('clean', function() {
  return del('build');
});

gulp.task('copy', function() {
  return gulp.src([
      'src/fonts/**/*.{woff,woff2}',
      'src/img/*.webp'
    ], {
      base: 'src'
    })
    .pipe(gulp.dest('build'));
});

gulp.task('images', function () {
  return gulp.src([
      'src/img/**/*.{png,jpg,svg}',
      '!src/img/sprite/*.svg'
    ])
    .pipe(newer('build/img'))
    .pipe(imagemin([
      imagemin.optipng({
        optimizationLevel: 3
      }),
      imagemin.jpegtran({
        progressive: true
      }),
      imagemin.svgo({
        plugins: [{
          removeViewBox: false
        }]
      })
    ]))
    .pipe(gulp.dest('build/img'));
});

gulp.task('sprite', function() {
  return gulp.src('src/img/sprite/*.svg')
    .pipe(svgmin({
      plugins: [{
        removeViewBox: false
      }]
    }))
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/img'));
});

gulp.task('style', function () {
  return gulp.src('src/sass/style.scss')
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded'
    }))
    .pipe(postcss([
      autoprefixer(),
      objectFit()
    ]))
    .pipe(gulp.dest('build/css'))
    .pipe(minify())
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream());
});

gulp.task('scripts-libs', function () {
  return gulp.src('src/js/libs/*.js')
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('build/js'));
});

gulp.task('scripts-modules', function () {
  return gulp.src('src/js/modules/*.js')
    .pipe(concat('main.js'))
    .pipe(gulp.dest('build/js'));
});

gulp.task('scripts', gulp.series(
  'scripts-libs',
  'scripts-modules'
));

gulp.task('html', function () {
  return gulp.src('src/*.html')
    .pipe(plumber())
    .pipe(posthtml([
      include()
    ]))
    .pipe(gulp.dest('build'));
});

gulp.task('refresh', function (done) {
  server.reload();
  done();
});

gulp.task('build', gulp.series(
  'clean',
  'copy',
  'images',
  'sprite',
  'style',
  'scripts',
  'html'
));

gulp.task('serve', function () {
  server.init({
    server: 'build/',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch('src/img/**/*', gulp.series('images', 'refresh'));
  gulp.watch('src/img/sprite/*.svg', gulp.series('sprite', 'refresh'));
  gulp.watch('src/sass/**/*.scss', gulp.series('style'));
  gulp.watch('src/js/**/*.js', gulp.series('scripts', 'refresh'));
  gulp.watch('src/**/*.html', gulp.series('html', 'refresh'));
});

gulp.task('start', gulp.series('build', 'serve'));
