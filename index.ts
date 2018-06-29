import * as LoggerImpl from 'bunyan';
import * as fs from 'fs';
import { ConfigError } from './config_error';
import { IConfig } from './i_config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const loggerlvl: LogLevel = ((process.env.NODE_ENV && process.env.NODE_ENV === 'test') ? 'debug' : 'info');
const log = LoggerImpl.createLogger({ name: 'config', level: loggerlvl, stream: process.stdout });

const compareObjectConfig: IConfig = {
  configchecked: false,
  configfile: '',
  lastreadAt: new Date()
};

/**
 * Caching JSON application configuration
 */
export class Config {
  /**
   * Tries to get config from cfgfile
   * @param cfgfile
   * @param cfgSubkey
   */
  static getInstance(cfgfile?: string, cfgSubkey?: string): object | never {
    const configfile = Config.generateConfigFilename(cfgfile);
    return Config.getOrReadConfig<any>(configfile, null, cfgSubkey);
  }

  /**
   * Tries to get config from cfgfile with checking properties to equal compareObject properties
   * @param compareObject
   * @param cfgfile
   * @param cfgSubkey
   */
  static getCheckedInstance<T extends IConfig>(compareObject: T, cfgfile?: string, cfgSubkey?: string): T | never {
    const configfile = Config.generateConfigFilename(cfgfile);
    return Config.getOrReadConfig<T>(configfile, compareObject, cfgSubkey);
  }

  /**
   * Does the check to compare for existing properties
   * @param compareObject
   * @param cfg
   * @param cfgSubkey
   */
  protected static checkConfig<T extends IConfig>(compareObject: T, cfg: T, cfgSubkey?: string): T | never {
    const curcfg: IConfig = (cfgSubkey ? cfg[cfgSubkey] : cfg);
    if (curcfg.configchecked) {
      return cfg;
    }
    const keys = Object.keys(curcfg);
    const compKeys = Object.keys(compareObject).concat(Object.keys(compareObjectConfig));
    let failedKey: string;
    if (!keys.every((key) => {
      if (!compKeys.includes(key)) {
        failedKey = key;
        return false;
      }
      return true;
    })) {
      throw new ConfigError('Configuration file check failed for \'%s\'', failedKey);
    }
    curcfg.configchecked = true;
    return cfg;
  }

  /**
   * Reads config from file if not cached or file newer
   * @param filename
   * @param compareObject
   * @param cfgSubkey
   */
  protected static getOrReadConfig<T extends IConfig>(filename: string, compareObject?: T, cfgSubkey?: string): T | never {
    if (Config.isFileNewer(filename)) {
      if (compareObject) {
        return Config.setCache<T>(Config.checkConfig(compareObject, Config.readConfig<T>(filename), cfgSubkey), cfgSubkey);
      } else {
        return Config.setCache<T>(Config.readConfig<T>(filename), cfgSubkey);
      }
    }
    if (compareObject) {
      return Config.checkConfig(compareObject, Config.getCache<T>(filename, cfgSubkey));
    }
    return Config.getCache<T>(filename, cfgSubkey);
  }

  /**
   * Does the read from filename and JSON parse
   * @param filename
   */
  protected static readConfig<T extends IConfig>(filename: string): T | never {
    let config: T;
    try {
      log.debug('Reading config file ' + filename);
      config = JSON.parse(fs.readFileSync(filename, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') {
        const msg = 'Not found config file ' + filename;
        log.info(msg);
        throw new ConfigError(err, msg);
      }
    }
    if (!config) {
      const msg = 'Not parseable config file ' + filename;
      log.info(msg);
      throw new ConfigError(msg);
    }
    config.lastreadAt = new Date();
    config.configfile = filename;
    return config;
  }

  /**
   * Generates configfile name for NODE_ENV (.json => _NODE_ENV.json)
   * @param cfgfile
   */
  protected static generateConfigFilename(cfgfile?: string): string {
    let configfile = cfgfile || 'app.json';
    try {
      if (process.env.NODE_ENV) {
        const envcfgfile = (cfgfile && cfgfile.replace('.json', '_' + process.env.NODE_ENV + '.json'));
        const envconfig = envcfgfile || 'app_' + process.env.NODE_ENV + '.json';
        log.debug('Trying to find config file ' + envconfig);
        if (fs.statSync(envconfig).isFile()) {
          configfile = envconfig;
        }
      }
    } catch (err) {
      if (err.code && err.code === 'ENOENT') {
        log.debug(err, 'Not found config file');
      } else {
        log.error(err);
      }
    }
    return configfile;
  }

  /**
   * Checks if file is newer than cached config or doesn't exist in cache
   * @param filename
   */
  protected static isFileNewer(filename: string): boolean {
    let filemtime: number;
    try {
      filemtime = fs.statSync(filename).mtime.getTime();
    } catch (err) {
      log.warn(err);
      return false;
    }
    const cfg = Config.getCache<IConfig>(filename);
    if (!cfg) {
      log.debug('Config not cached');
      return true;
    }
    return filemtime > cfg.lastreadAt.getTime();
  }

  private static configCacheFileIndex: string[] = [];
  private static configCache: IConfig[] = [];

  private static getCache<T extends IConfig>(filename: string, cfgSubkey?: string): T | undefined {
    const cfg = Config.configCache[Config.configCacheFileIndex.indexOf(filename)];
    if (cfgSubkey) {
      if (cfg[cfgSubkey]) {
        cfg[cfgSubkey].lastreadAt = cfg.lastreadAt;
        cfg[cfgSubkey].configfile = cfg.configfile;
      }
      return cfg[cfgSubkey] as T;
    }
    return cfg as T;
  }

  private static setCache<T extends IConfig>(config: T, cfgSubkey?: string): T {
    const index = Config.configCacheFileIndex.indexOf(config.configfile);
    if (index !== -1) {
      Config.configCache[index] = config;
    } else {
      Config.configCacheFileIndex[Config.configCache.push(config) - 1] = config.configfile;
    }
    return Config.getCache(config.configfile, cfgSubkey);
  }

  private constructor() { }
}

/**
 * ConfigError is used if something goes wrong with configuration
 */
export { ConfigError } from './config_error';

/**
 * Interface to extend for checking config files
 */
export { IConfig } from './i_config';
