/* eslint-disable arrow-body-style */
import gulp from 'gulp';
import babel from 'gulp-babel';
import sequence from 'run-sequence';
import del from 'del';

gulp.task('default', ['build']);

gulp.task('clean', () => del(['lib']));

gulp.task('build', (done) => {
    sequence(['clean'], ['build:lib'], done)
});

gulp.task('build:lib', () => {
    return gulp.src(['src/**/*.js'])
        .pipe(babel())
        .pipe(gulp.dest('lib'));
});
