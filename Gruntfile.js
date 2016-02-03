'use strict';

// GRUNT configuration:
//  - Lint, compile, bundle, and optimize
var db_options = require('./db.json');

module.exports = function(grunt){
	grunt.initConfig({
		clean	: {
			build	: 'build'
		},

		jshint	: {
		    client: {
		        src: ['src/js/**/*.js'],
		        options: {
		          jshintrc: 'public/.jshintrc'
		        }
		    },
		    build: {
		        src: ['Gruntfile.js'],
		        options: {
		        	jshintrc: '.jshintrc'
		        }
		    }
		},

		less	: {
			debug	: {
				files	: {
					'build/css/styles.css'	: 'src/css/**/*.less'
				}
			},
			release	: {
				options	: {
					yuicompress: true
				},
				files	: {
					'build/css/styles.css'		: 'src/css/**/*.less'
				}
			}
		},

		jade	: {
			debug	: {
				options	: {
					pretty	: true,
					data	: {
						debug	: true
					}
				},
				files: {
					//'build/views/home.html': 'src/views/home.jade'
				}
			},
			release	: {
				options	: {
					data	: {
						debug	: false
					}
				},
				files	: {
					//'build/views/home.html': 'src/views/home.jade'
				}
			}
		},

		copy	: {
			debug	: {
				expand	: true,
				cwd		: 'src/js',
				src		: '**/*.js',
				dest	: 'build/js/'
			}
		},

		concat	: {
			release	: {
				files	: {
					'build/js/app.js': 'src/js/**/*.js'
				}
			}
		},

		uglify	: {
			release	: {
				files	: {
					'build/js/app.min.js': 'build/js/app.js'
				}
			}
		},
		
	    watch: {
	      // lint js files when they change, and then copy them over to build directory
	      js: {
	        files: ['src/js/**/*.js'],
	        tasks: ['jshint:client', 'copy:js_debug']
	      },

	      // run the less:debug task if a less file changes
	      less: {
	        files: ['src/css/**/*.less'],
	        tasks: ['less:debug']
	      },

	      // run the jade:debug task if a jade file changes
	      jade: {
	        files: ['src/views/**/*.jade'],
	        tasks: ['jade:debug']
	      },

	      // run the whole build again if the process changes
	      rebuild: {
	        files: ['Gruntfile.js'],
	        tasks: ['jshint:build', 'build:debug']
	      }
	    },

	    db_create	: { options: db_options },
	    db_upgrade	: { options: db_options },
	    db_rollback	: { options: db_options },
	    db_seed		: { options: db_options },
	    
	    incbuild	: {
	    	options	: {
		    	file	: '.build'
		    }
	    },
	    
	    incversion	: {
	    	options	: {
	    		file	: '.version',
	    		inc		: 'sub'			// {major}.{minor}.{sub}
	    	}
	    }

	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-jade');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.loadTasks('./db-tasks');
	
	
	// versioning tasks
	grunt.registerTask('timestamp', 'Creates a file with a timestamp in it', function () {
		var options = this.options({
			file: '.timestamp'
		});
		var stamp = +new Date(); // cast date into a unix timestamp
		var contents = stamp.toString();

		grunt.file.write(options.file, contents);
	});
	
	grunt.registerTask('incbuild', 'Increments build number', function () {
		var options = this.options({
			file: '.build'
		});
		var buildNo = (grunt.file.isFile(options.file) ? grunt.file.read(options.file) : '0');
		if (buildNo === '') {
			buildNo = 1;
		} else {
			buildNo = parseInt(buildNo) + 1;
		}
		grunt.file.write(options.file, buildNo);
	});
	
	grunt.registerTask('incversion', 'Increments build number', function () {
		var options = this.options({
			file: '.version'
		});
		var versionNo	= (grunt.file.isFile(options.file)	? grunt.file.read(options.file)	: '0.0.0');
		var buildNo		= (grunt.file.isFile('.build')		? grunt.file.read('.build')		: '1' );
		var timeStamp	= (grunt.file.isFile('.timestamp')	? grunt.file.read('.timestamp')	: (+new Date()) );
		if (versionNo === '') {
			versionNo = '0.0.1';
		} else {
			var ver = String(versionNo).split('.', 3);
			if (typeof ver[0] == 'undefined') { ver[0] = 0; }
			if (typeof ver[1] == 'undefined') { ver[1] = 0; }
			if (typeof ver[2] == 'undefined') { ver[2] = 0; }
			switch (options.inc) {
				case 'mayor'	: ver[0] = parseInt(ver[0]) + 1; break;
				case 'minor'	: ver[1] = parseInt(ver[1]) + 1; break;
				case 'sub'		: ver[2] = parseInt(ver[2]) + 1; break;
			}
			versionNo = ver[0] + '.' + ver[1] + '.' + ver[2];
		}
		
		grunt.file.write(options.file, versionNo);
		grunt.file.write('.release', versionNo + '-' + buildNo +  '-' + timeStamp );
	});
	
	
	// build tasks
	grunt.registerTask('build:debug', 'Lint and compile', [
		'clean', 'jshint', 'less:debug', 'jade:debug', 'copy:debug', 'timestamp'
	]);

	grunt.registerTask('build:stage', 'Lint, compile and bundle', [
		'clean', 'jshint', 'less:release', 'jade:release', 'concat:release', 'incbuild', 'incversion'
	]);

	grunt.registerTask('build:release', 'Lint, compile, bundle, and optimize', [
		'clean', 'jshint', 'less:release', 'jade:release', 'concat:release', 'uglify:release', 'timestamp', 'incbuild', 'incversion'
	]);
	
	
	// database tasks
	grunt.registerTask('db:setup', 'Create, update, and seed a new database', [
	    'db_create', 'db_upgrade', 'db_seed'
	]);
      	
	grunt.registerTask('db:update', 'update existing database', [
	    'db_upgrade'
	]);
	                                                                   	                                                                   	
	grunt.registerTask('db:rollback', 'Rollback last database updates', [
	    'db_rollback'
	]);
	                     
	// activate watching files
  	grunt.registerTask('dev', ['build:debug', 'watch']);                                              	                                                                   	
};