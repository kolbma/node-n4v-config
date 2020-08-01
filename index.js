"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
var LoggerImpl = require("bunyan");
var fs = require("fs");
var config_error_1 = require("./config_error");
var loggerlvl = ((process.env.NODE_ENV && process.env.NODE_ENV === 'test') ? 'debug' : 'info');
var log = LoggerImpl.createLogger({ name: 'config', level: loggerlvl, stream: process.stdout });
var compareObjectConfig = {
    configchecked: false,
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
     * @param cfgSubkey
     */
    Config.getInstance = function (cfgfile, cfgSubkey) {
        var configfile = Config.generateConfigFilename(cfgfile);
        return Config.getOrReadConfig(configfile, null, cfgSubkey);
    };
    /**
     * Tries to get config from cfgfile with checking properties to equal compareObject properties
     * @param compareObject
     * @param cfgfile
     * @param cfgSubkey
     */
    Config.getCheckedInstance = function (compareObject, cfgfile, cfgSubkey) {
        var configfile = Config.generateConfigFilename(cfgfile);
        return Config.getOrReadConfig(configfile, compareObject, cfgSubkey);
    };
    /**
     * Does the check to compare for existing properties
     * @param compareObject
     * @param cfg
     * @param cfgSubkey
     */
    Config.checkConfig = function (compareObject, cfg, cfgSubkey) {
        var curcfg = (cfgSubkey ? cfg[cfgSubkey] : cfg);
        if (curcfg.configchecked) {
            return cfg;
        }
        var keys = Object.keys(curcfg);
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
        curcfg.configchecked = true;
        return cfg;
    };
    /**
     * Reads config from file if not cached or file newer
     * @param filename
     * @param compareObject
     * @param cfgSubkey
     */
    Config.getOrReadConfig = function (filename, compareObject, cfgSubkey) {
        if (Config.isFileNewer(filename)) {
            if (compareObject) {
                return Config.setCache(Config.checkConfig(compareObject, Config.readConfig(filename), cfgSubkey), cfgSubkey);
            }
            else {
                return Config.setCache(Config.readConfig(filename), cfgSubkey);
            }
        }
        if (compareObject) {
            return Config.checkConfig(compareObject, Config.getCache(filename, cfgSubkey));
        }
        return Config.getCache(filename, cfgSubkey);
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
    Config.getCache = function (filename, cfgSubkey) {
        var cfg = Config.configCache[Config.configCacheFileIndex.indexOf(filename)];
        if (cfgSubkey) {
            if (cfg[cfgSubkey]) {
                cfg[cfgSubkey].lastreadAt = cfg.lastreadAt;
                cfg[cfgSubkey].configfile = cfg.configfile;
            }
            return cfg[cfgSubkey];
        }
        return cfg;
    };
    Config.setCache = function (config, cfgSubkey) {
        var index = Config.configCacheFileIndex.indexOf(config.configfile);
        if (index !== -1) {
            Config.configCache[index] = config;
        }
        else {
            Config.configCacheFileIndex[Config.configCache.push(config) - 1] = config.configfile;
        }
        return Config.getCache(config.configfile, cfgSubkey);
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
Object.defineProperty(exports, "ConfigError", { enumerable: true, get: function () { return config_error_2.ConfigError; } });
//# sourceMappingURL=index.js.map