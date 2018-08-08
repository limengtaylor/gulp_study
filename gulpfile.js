var gulp = require('gulp')
var sass = require('gulp-sass')
var minify = require('gulp-minify-css')
var uglify = require('gulp-uglify')
var jshint = require('gulp-jshint')
var spritesmith = require('gulp.spritesmith')
var postcss = require('gulp-postcss')
var pxtoviewport = require('postcss-px-to-viewport')
var autoprefixer = require('gulp-autoprefixer')
/* var cssnext = require('cssnext')
var precss = require('precss') */
var concat = require('gulp-concat')
var rename = require('gulp-rename')
var imagemin = require('gulp-imagemin')
//var htmlmin = require('gulp-htmlmin')  //压缩html文件
/* var connect = require('gulp-connect')
var webserver = require('gulp-webserver')
var gulpopen = require('gulp-open') */
//var fileinclude = require('gulp-file-include')  //html代码复用
var browserSync = require('browser-sync').create()
var reload = browserSync.reload
/* var replacesrc = require('gulp-replace-src')
var fs = require('fs') */
var inject = require('gulp-inject')
var rev = require('gulp-rev')
var revcollector = require('gulp-rev-collector')
var runsequence = require('run-sequence')
var cache = require('gulp-cache')
var livereload = require('gulp-livereload')

gulp.task('scss',['sprite'],function(){
    var processors = [
      pxtoviewport({
        viewportWidth: 375,
        viewportHeight: 1334,
        unitPrecision: 5,
        viewportUnit: 'vw',
        selectorBlankList:['.ignore','.hairlines','font-size'],
        minPixelValue: 1,
        mediaQuery: false
      })
    ]
    return gulp
      .src('src/sass/index.scss')
      .pipe(sass.sync().on('error',sass.logError))
      .pipe(postcss(processors)) 
      .pipe(autoprefixer())  //自动添加浏览器前缀
      .pipe(minify())  //CSS压缩
      .pipe(rev())  //文件名加MD5后缀
      .pipe(gulp.dest('dist/css'))
      .pipe(rev.manifest())
      .pipe(gulp.dest('dist/rev/css'))
})
//js压缩、合并、重命名
gulp.task('js',function(){
    return gulp
      .src('src/js/**/*.js')
      .pipe(concat('index.js'))  
/*       .pipe(gulp.dest('build/js'))  
      .pipe(rename({suffix:'.min'})) */
      .pipe(uglify())  
      .pipe(rev())  //文件名加MD5后缀
      .pipe(gulp.dest('dist/js'))
      .pipe(rev.manifest())
      .pipe(gulp.dest('dist/rev/js'))   
})
//处理图标生成雪碧图和scss
gulp.task('sprite',function(){
  return gulp
    .src('src/icons/*.png')
    .pipe(spritesmith({
      imgName: 'src/images/sprite.png',  //生成的雪碧图的路径
      cssName: 'src/sass/icons.scss',  //图标生成scss
      imgPath: '../images/sprite.png',  //指定路径，直接出现在background属性值中
      padding: 5,  //图标间间距，防止重叠
      cssFormat: 'css',  //scss文件内容以css格式输出
      //cssOpts用来重新命名生成的类名，默认添加icon-前缀
/*       cssOpts: {
        cssSelector: function(sprite){
          return '.iyouxin-'+sprite.name
        }
      } */
      cssTemplate: function(data){  //data为对象，保存合成前小图和大图的信息，包括小图在大图之中的信息
        let arr = []
        let width = data.spritesheet.px.width
        let height = data.spritesheet.px.height
        let url = data.spritesheet.image

        arr.push(`
        .icon{
          display: inline-block;
          vertical-align: middle;
          background: url("${url}") no-repeat;
        }
        `)

        data.sprites.forEach(function(sprite){
          arr.push(`
          .icon-${sprite.name}{
            width:${sprite.px.width};
            height:${sprite.px.height};
            background-position:${sprite.px.offset_x} ${sprite.px.offset_y};
            background-size:${sprite.px.width} ${sprite.px.height};
          }
          `)
        })
        return arr.join('');
      }
    })
  )
    .pipe(gulp.dest(''))
})
//压缩图片
gulp.task('imagemin',function(){
  return gulp
    .src('src/images/*.*')
    .pipe(cache(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({plugins: [{removeViewBox: true}]})
    ])))
    .pipe(rev())  //文件名加MD5后缀
    .pipe(gulp.dest('dist/images'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('dist/rev/images'))
})

gulp.task('watch',function(){
  //监控sass下的文件，如果有修改，则执行sprite任务和scss任务
  gulp.watch('src/sass/*',['sprite','scss'])
  //监控images下的文件，如果有修改，则执行imagemin任务
  gulp.watch('src/images/*',['imagemin'])
  //监控js下的文件，如果有修改，则执行js任务
  gulp.watch('src/js/**/*.js',['js'])
  
  livereload.listen()

  gulp.watch(['dist/**']).on('change',livereload.reload)
  
})

//资源注入，将指定css和js以标签形式插入html指定标志位
//tips:lm将插件中gulp-inject/src/transform/index.js中transform.html.css作了一定修改，否则插入的css路径为/build而不是../build，会导致css在html中无效
gulp.task('inject',['scss'],function(){
  var source = gulp.src(['dist/css/*.css','sist/js/*.min.js'],{read: false})
  return gulp
    .src('src/index.html')
    .pipe(inject(source))
    .pipe(gulp.dest('src'))
})

gulp.task('build:inject',['build:scss'],function(){
    var source = gulp.src(['dist/css/*.css','dist/js/*.js'],{read: false})
    return gulp
      .src('src/index.html')
      .pipe(inject(source))
      .pipe(gulp.dest('src'))
  })

gulp.task('build:scss',['sprite'],function(){
    return gulp
      .src('src/sass/index.scss')
      .pipe(sass({
          outputStyle: 'compressed'  // 此配置使文件编译并输出压缩过的文件
       }))
  .pipe(gulp.dest('dist/css'))
})

gulp.task('build:js', function () {
    return gulp
      .src('src/js/*.js')
      .pipe(concat('index.js'))  
      .pipe(gulp.dest('dist/js'))
})
gulp.task('build:image',['sprite'],function(){
  return gulp
    .src('src/images/*.*')
    .pipe(gulp.dest('dist/images'))
})

gulp.task('dev', function (done) {
  condition = false;
  runsequence(
    ['imagemin'],
    ['scss'],
    ['js'],
    ['rev'],
    ['watch'],
    done
  )
})

gulp.task('rev',function(){
  return gulp
    .src(['dist/rev/**/*.json','src/index.html'])
    .pipe(revcollector({
      replaceReved: true
    }))
    .pipe(gulp.dest('src'))
    gulp.src('dist/rev/**/*.json','')
})

gulp.task('build', ['build:scss','build:image', 'build:js','build:inject'])
gulp.task('default',['sprite','imagemin','scss','js','inject','watch'])