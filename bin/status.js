var chalk = require('chalk');
var util = require('util');

class Status {
  constructor(logger) {
    this.chalkError = chalk.red;
    this.chalkWarn = chalk.yellow;
    this.options = {
      verbose: false,
      quiet: false
    };
    this.log = logger;
  }

  configureOptions(options) {
    this.options.verbose = options.verbose || false;
    this.options.quiet = options.quiet || false;

    if((options.porcelain || false) === true) {
      this.options.quiet = true;
      this.options.verbose = false;
    }
  }

  /// writes banner to stdout when quiet==false
  banner(stream) {
    if(this.options.quiet !== true) {
      //inform('\nCrownPeak AccessAPI CLI\n\n');
      stream.write('CrownPeak AccessAPI CLI\n');
      stream.write('\n');
    }
  }

  /// writes informational message thats not included in logs
  /// quiet = false
  inform() {
    if(this.options.quiet !== true) {
      var argsArray = Array.prototype.slice.call(arguments);
      var str = util.format.apply(null,argsArray);
      process.stdout.write(str);
      process.stdout.write('\n');
    }
  }

  porcelain(obj) {
    if(this.options.porcelain) {
      if(typeof(obj) == 'string') {
        process.stdout.write(obj);
        process.stdout.write('\n');
      } else {
        process.stdout.write(JSON.stringify(obj,null,2));
      }
    }
  }


  //statusImpl.prototype.verbose = statusImpl.prototype.inform;
  verbose() {
    if(this.options.verbose === true) {
      this.info(arguments);
    }
  }

  /// writes info message to stdout and to logs
  info() {
    var argsArray = Array.prototype.slice.call(arguments);

    if(this.log !== undefined && this.log.isInfoEnabled !== false) {
      this.log.info.apply(this.log, argsArray);
    }

    if(this.options.quiet !== true) {
      var str = util.format.apply(null,argsArray);
      process.stdout.write(str);
      process.stdout.write('\n');
    }
  }

  /// writes warning message to stdout and to logs
  warn() {
    var argsArray = Array.prototype.slice.call(arguments);

    if(log !== undefined && log.isWarnEnabled !== false) {
      this.log.warn.apply(this.log, argsArray);
    }

    var str = util.format.apply(null,argsArray);
    process.stderr.write(chalk.yellow(str));
    process.stderr.write('\n');
  }

  /// writes error message to stderr and to logs
  error() {
    var argsArray = Array.prototype.slice.call(arguments);

    if(this.log !== undefined && this.log.isErrorEnabled !== false) {
      this.log.fatal.apply(this.log, argsArray);
    }

    var str = util.format.apply(null,argsArray);
    process.stderr.write(chalk.red(str));
    process.stderr.write('\n');
  }

  fail() {
    this.error(arguments);
  }
}

module.exports = Status;