"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LoggerImpl = require("bunyan");
var fs = require("fs");
var config_error_1 = require("./config_error");
var loggerlvl = ((process.env.NODE_ENV && process.env.NODE_ENV === 'test') ? 'debug' : 'info');
var log = LoggerImpl.createLogger({ name: 'config', level: loggerlvl, stream: process.stdout });
var compareObjectConfig = {
    configfile: '',
    lastreadAt: new Date()
};
/**
 * Caching JSON application configuration
 */
var Config = /** @class */ (function () {
    function Config() {
    }
    /**
     * Tries to get config from cfgfile
     * @param cfgfile
     */
    Config.getInstance = function (cfgfile) {
        var configfile = Config.generateConfigFilename(cfgfile);
        return Config.getOrReadConfig(configfile);
    };
    /**
     * Tries to get config from cfgfile with checking properties to equal compareObject properties
     * @param compareObject
     * @param cfgfile
     */
    Config.getCheckedInstance = function (compareObject, cfgfile) {
        var configfile = Config.generateConfigFilename(cfgfile);
        return Config.getOrReadConfig(configfile, compareObject);
    };
    /**
     * Does the check to compare for existing properties
     * @param compareObject
     * @param cfg
     */
    Config.checkConfig = function (compareObject, cfg) {
        var keys = Object.keys(cfg);
        var compKeys = Object.keys(compareObject).concat(Object.keys(compareObjectConfig));
        var failedKey;
        if (!keys.every(function (key) {
            if (!compKeys.includes(key)) {
                failedKey = key;
                return false;
            }
            return true;
        })) {
            throw new config_error_1.ConfigError('Configuration file check failed for \'%s\'', failedKey);
        }
        return cfg;
    };
    /**
     * Reads config from file if not cached or file newer
     * @param filename
     * @param compareObject
     */
    Config.getOrReadConfig = function (filename, compareObject) {
        if (Config.isFileNewer(filename)) {
            if (compareObject) {
                return Config.setCache(Config.checkConfig(compareObject, Config.readConfig(filename)));
            }
            else {
                return Config.setCache(Config.readConfig(filename));
            }
        }
        return Config.getCache(filename);
    };
    /**
     * Does the read from filename and JSON parse
     * @param filename
     */
    Config.readConfig = function (filename) {
        var config;
        try {
            log.debug('Reading config file ' + filename);
            config = JSON.parse(fs.readFileSync(filename, 'utf8'));
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                var msg = 'Not found config file ' + filename;
                log.info(msg);
                throw new config_error_1.ConfigError(err, msg);
            }
        }
        if (!config) {
            var msg = 'Not parseable config file ' + filename;
            log.info(msg);
            throw new config_error_1.ConfigError(msg);
        }
        config.lastreadAt = new Date();
        config.configfile = filename;
        return config;
    };
    /**
     * Generates configfile name for NODE_ENV (.json => _NODE_ENV.json)
     * @param cfgfile
     */
    Config.generateConfigFilename = function (cfgfile) {
        var configfile = cfgfile || 'app.json';
        try {
            if (process.env.NODE_ENV) {
                var envcfgfile = (cfgfile && cfgfile.replace('.json', '_' + process.env.NODE_ENV + '.json'));
                var envconfig = envcfgfile || 'app_' + process.env.NODE_ENV + '.json';
                log.debug('Trying to find config file ' + envconfig);
                if (fs.statSync(envconfig).isFile()) {
                    configfile = envconfig;
                }
            }
        }
        catch (err) {
            if (err.code && err.code === 'ENOENT') {
                log.debug(err, 'Not found config file');
            }
            else {
                log.error(err);
            }
        }
        return configfile;
    };
    /**
     * Checks if file is newer than cached config or doesn't exist in cache
     * @param filename
     */
    Config.isFileNewer = function (filename) {
        var filemtime;
        try {
            filemtime = fs.statSync(filename).mtime.getTime();
        }
        catch (err) {
            log.warn(err);
            return false;
        }
        var cfg = Config.getCache(filename);
        if (!cfg) {
            log.debug('Config not cached');
            return true;
        }
        return filemtime > cfg.lastreadAt.getTime();
    };
    Config.getCache = function (filename) {
        return Config.configCache[Config.configCacheFileIndex.indexOf(filename)];
    };
    Config.setCache = function (config) {
        var index = Config.configCacheFileIndex.indexOf(config.configfile);
        if (index !== -1) {
            Config.configCache[index] = config;
        }
        else {
            Config.configCacheFileIndex[Config.configCache.push(config) - 1] = config.configfile;
        }
        return config;
    };
    Config.configCacheFileIndex = [];
    Config.configCache = [];
    return Config;
}());
exports.Config = Config;
/**
 * ConfigError is used if something goes wrong with configuration
 */
var config_error_2 = require("./config_error");
exports.ConfigError = config_error_2.ConfigError;
//# sourceMappingURL=index.js.map