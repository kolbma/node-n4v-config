import 'jasmine';
import { IConfig } from '../i_config';
import { Config, ConfigError } from '../index';

interface ITestConfig extends IConfig {
  property1: string;
  property2: object;
}

describe('config-subkey', () => {
  it('reads checked config file subkey', () => {
    const compareObj: ITestConfig = {
      property1: 'test',
      property2: {}
    };
    try {
      const cfg = Config.getCheckedInstance<ITestConfig>(compareObj, './test/test3.json', 'subkey');
      expect(cfg).toBeDefined();
      expect(Object.keys(cfg).length).toBeGreaterThan(0);
      expect(cfg.property1).toEqual('test');
    } catch (err) {
      fail(err);
    }
  });

  it('gets checked cached config subkey', () => {
    const compareObj: ITestConfig = {
      property1: 'test',
      property2: {}
    };
    try {
      const cfg = Config.getCheckedInstance<ITestConfig>(compareObj, './test/test3.json', 'subkey');
      expect(cfg).toBeDefined();
      expect(Object.keys(cfg).length).toBeGreaterThan(0);
      expect(cfg.property1).toEqual('test');
      (cfg as any).property3 = 'success';
      expect(cfg.configchecked).toBeTruthy();
      const cfg2 = Config.getCheckedInstance<ITestConfig>(compareObj, './test/test3.json', 'subkey');
      expect((cfg2 as any).property3).toEqual('success');
    } catch (err) {
      fail(err);
    }
  });

  it('fails config check without subkey', () => {
    const compareObj: ITestConfig = {
      property1: 'test',
      property2: {}
    };
    try {
      const cfg = Config.getCheckedInstance<ITestConfig>(compareObj, './test/test3.json');
      fail('should throw error');
    } catch (err) {
      expect(err).toBeDefined();
      if (!(err instanceof ConfigError)) {
        fail('err should be ConfigError');
      }
    }
  });

});
