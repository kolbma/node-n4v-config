import * as LoggerImpl from 'bunyan';
import * as fs from 'fs';
import { ConfigError } from './config_error';
import { IConfig } from './i_config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const loggerlvl: LogLevel = ((process.env.NODE_ENV && process.env.NODE_ENV === 'test') ? 'debug' : 'info');
const log = LoggerImpl.createLogger({ name: 'config', level: loggerlvl, stream: process.stdout });

const compareObjectConfig: IConfig = {
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
   */
  static getInstance(cfgfile?: string): object | never {
    const configfile = Config.generateConfigFilename(cfgfile);
    return Config.getOrReadConfig<any>(configfile);
  }

  /**
   * Tries to get config from cfgfile with checking properties to equal compareObject properties
   * @param compareObject
   * @param cfgfile
   */
  static getCheckedInstance<T extends IConfig>(compareObject: T, cfgfile?: string): T | never {
    const configfile = Config.generateConfigFilename(cfgfile);
    return Config.getOrReadConfig<T>(configfile, compareObject);
  }

  /**
   * Does the check to compare for existing properties
   * @param compareObject
   * @param cfg
   */
  protected static checkConfig<T extends IConfig>(compareObject: T, cfg: T): T | never {
    const keys = Object.keys(cfg);
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
    return cfg;
  }

  /**
   * Reads config from file if not cached or file newer
   * @param filename
   * @param compareObject
   */
  protected static getOrReadConfig<T extends IConfig>(filename: string, compareObject?: T): T | never {
    if (Config.isFileNewer(filename)) {
      if (compareObject) {
        return Config.setCache<T>(Config.checkConfig(compareObject, Config.readConfig<T>(filename)));
      } else {
        return Config.setCache<T>(Config.readConfig<T>(filename));
      }
    }
    return Config.getCache(filename);
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

  private static getCache<T extends IConfig>(filename: string): T | undefined {
    return Config.configCache[Config.configCacheFileIndex.indexOf(filename)] as T;
  }

  private static setCache<T extends IConfig>(config: T): T {
    const index = Config.configCacheFileIndex.indexOf(config.configfile);
    if (index !== -1) {
      Config.configCache[index] = config;
    } else {
      Config.configCacheFileIndex[Config.configCache.push(config) - 1] = config.configfile;
    }
    return config;
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
