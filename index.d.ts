import { IConfig } from './i_config';
/**
 * Caching JSON application configuration
 */
export declare class Config {
    /**
     * Tries to get config from cfgfile
     * @param cfgfile
     * @param cfgSubkey
     */
    static getInstance(cfgfile?: string, cfgSubkey?: string): object | never;
    /**
     * Tries to get config from cfgfile with checking properties to equal compareObject properties
     * @param compareObject
     * @param cfgfile
     * @param cfgSubkey
     */
    static getCheckedInstance<T extends IConfig>(compareObject: T, cfgfile?: string, cfgSubkey?: string): T | never;
    /**
     * Does the check to compare for existing properties
     * @param compareObject
     * @param cfg
     * @param cfgSubkey
     */
    protected static checkConfig<T extends IConfig>(compareObject: T, cfg: T, cfgSubkey?: string): T | never;
    /**
     * Reads config from file if not cached or file newer
     * @param filename
     * @param compareObject
     * @param cfgSubkey
     */
    protected static getOrReadConfig<T extends IConfig>(filename: string, compareObject?: T, cfgSubkey?: string): T | never;
    /**
     * Does the read from filename and JSON parse
     * @param filename
     */
    protected static readConfig<T extends IConfig>(filename: string): T | never;
    /**
     * Generates configfile name for NODE_ENV (.json => _NODE_ENV.json)
     * @param cfgfile
     */
    protected static generateConfigFilename(cfgfile?: string): string;
    /**
     * Checks if file is newer than cached config or doesn't exist in cache
     * @param filename
     */
    protected static isFileNewer(filename: string): boolean;
    private static configCacheFileIndex;
    private static configCache;
    private static getCache<T>(filename, cfgSubkey?);
    private static setCache<T>(config, cfgSubkey?);
    private constructor();
}
/**
 * ConfigError is used if something goes wrong with configuration
 */
export { ConfigError } from './config_error';
/**
 * Interface to extend for checking config files
 */
export { IConfig } from './i_config';
