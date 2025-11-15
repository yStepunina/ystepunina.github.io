 1
  2
  3
  4
  5
  6
  7
  8
  9
 10
 11
 12
 13
 14
 15
 16
 17
 18
 19
 20
 21
 22
 23
 24
 25
 26
 27
 28
 29
 30
 31
 32
 33
 34
 35
 36
 37
 38
 39
 40
 41
 42
 43
 44
 45
 46
 47
 48
 49
 50
 51
 52
 53
 54
 55
 56
 57
 58
 59
 60
 61
 62
 63
 64
 65
 66
 67
 68
 69
 70
 71
 72
 73
 74
 75
 76
 77
 78
 79
 80
 81
 82
 83
 84
 85
 86
 87
 88
 89
 90
 91
 92
 93
 94
 95
 96
 97
 98
 99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
189
190
191
192
193
194
195
196
197
198
199
200
 	
import gulp from "gulp";
import { deleteSync } from "del";

import include from "gulp-file-include";
import formatHtml from "gulp-format-html";

import less from "gulp-less";
import plumber from "gulp-plumber";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import sortMediaQueries from "postcss-sort-media-queries";
import minify from "gulp-csso";
import rename from "gulp-rename";

import terser from "gulp-terser";

import imagemin from "gulp-imagemin";
import imagemin_gifsicle from "imagemin-gifsicle";
import imagemin_mozjpeg from "imagemin-mozjpeg";
import imagemin_optipng from "imagemin-optipng";

import svgmin from "gulp-svgmin";
import svgstore from "gulp-svgstore";

import server from "browser-sync";

const resources = {
  html: "src/html/**/*.html",
  jsDev: "src/scripts/dev/**/*.js",
  jsVendor: "src/scripts/vendor/**/*.js",
  images: "src/assets/images/**/*.{png,jpg,jpeg,webp,gif,svg}",
  less: "src/styles/**/*.less",
  svgSprite: "src/assets/svg-sprite/*.svg",
  static: [
    "src/assets/favicons/**/*.*",
    "src/assets/fonts/**/*.{woff,woff2}",
    "src/assets/icons/**/*.*",
    // "src/assets/video/**/*.{mp4,webm}",
    // "src/assets/audio/**/*.{mp3,ogg,wav,aac}",
    // "src/json/**/*.json",
    // "src/php/**/*.php"
  ],
};

// Gulp Tasks:

function clean(done) {
  deleteSync(["dist"]);
  done();
}

function includeHtml() {
  return gulp
    .src("src/html/*.html")
    .pipe(plumber())
    .pipe(
      include({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(formatHtml())
    .pipe(gulp.dest("dist"));
}

function style() {
  return gulp
    .src("src/styles/styles.less")
    .pipe(plumber())
    .pipe(less())
    .pipe(
      postcss([
        autoprefixer({ overrideBrowserslist: ["last 4 version"] }),
        sortMediaQueries({
          sort: "desktop-first",
        }),
      ])
    )
    .pipe(gulp.dest("dist/styles"))
    .pipe(minify())
    .pipe(rename("styles.min.css"))
    .pipe(gulp.dest("dist/styles"));
}

function js() {
  return gulp
    .src("src/scripts/dev/*.js")
    .pipe(plumber())
    .pipe(
      include({
        prefix: "//@@",
        basepath: "@file",
      })
    )
    .pipe(gulp.dest("dist/scripts"))
    .pipe(terser())
    .pipe(
      rename(function (path) {
        path.basename += ".min";
      })
    )
    .pipe(gulp.dest("dist/scripts"));
}

function jsCopy() {
  return gulp
    .src(resources.jsVendor)
    .pipe(plumber())
    .pipe(gulp.dest("dist/scripts"));
}

function copy() {
  return gulp
    .src(resources.static, {
      base: "src",
      encoding: false,
    })
    .pipe(gulp.dest("dist/"));
}

function images() {
  return gulp
    .src(resources.images, { encoding: false })
    .pipe(
      imagemin([
        imagemin_gifsicle({ interlaced: true }),
        imagemin_mozjpeg({ quality: 100, progressive: true }),
        imagemin_optipng({ optimizationLevel: 3 }),
      ])
    )
    .pipe(gulp.dest("dist/assets/images"));
}

function svgSprite() {
  return gulp
    .src(resources.svgSprite)
    .pipe(
      svgmin({
        js2svg: {
          pretty: true,
        },
      })
    )
    .pipe(
      svgstore({
        inlineSvg: true,
      })
    )
    .pipe(rename("symbols.svg"))
    .pipe(gulp.dest("dist/assets/icons"));
}

const build = gulp.series(
  clean,
  copy,
  includeHtml,
  style,
  js,
  jsCopy,
  images,
  svgSprite
);

function reloadServer(done) {
  server.reload();
  done();
}

function serve() {
  server.init({
    server: "dist",
  });
  gulp.watch(resources.html, gulp.series(includeHtml, reloadServer));
  gulp.watch(resources.less, gulp.series(style, reloadServer));
  gulp.watch(resources.jsDev, gulp.series(js, reloadServer));
  gulp.watch(resources.jsVendor, gulp.series(jsCopy, reloadServer));
  gulp.watch(resources.static, { delay: 500 }, gulp.series(copy, reloadServer));
  gulp.watch(
    resources.images,
    { delay: 500 },
    gulp.series(images, reloadServer)
  );
  gulp.watch(resources.svgSprite, gulp.series(svgSprite, reloadServer));
}

const start = gulp.series(build, serve);

export {
  clean,
  copy,
  includeHtml,
  style,
  js,
  jsCopy,
  images,
  svgSprite,
  build,
  serve,
  start,
};
