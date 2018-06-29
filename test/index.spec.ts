import * as fs from 'fs';
import 'jasmine';
import { IConfig } from '../i_config';
import { Config, ConfigError } from '../index';

interface ITestConfig extends IConfig {
  property1: string;
  property2: object;
  property3?: string;
}

describe('config', () => {
  it('reads config file', () => {
    const cfg: any = Config.getInstance('./test/test1.json');
    expect(cfg).toBeDefined();
    expect(typeof (cfg)).toEqual('object');
    expect(Object.keys(cfg).length).toBeGreaterThan(0);
    expect(cfg.property1).toEqual('test');
  });

  it('gets cached config', () => {
    const cfg: any = Config.getInstance('./test/test1.json');
    expect(cfg).toBeDefined();
    expect(typeof (cfg)).toEqual('object');
    expect(Object.keys(cfg).length).toBeGreaterThan(0);
    expect(cfg.property1).toEqual('test');
    cfg.property3 = 'success';

    const cfg2: any = Config.getInstance('./test/test1.json');
    expect(cfg2.property3).toEqual('success');
  });

  it('rereads changed config', (done) => {
    const cfg: any = Config.getInstance('./test/test2.json');
    expect(cfg).toBeDefined();
    expect(typeof (cfg)).toEqual('object');
    expect(Object.keys(cfg).length).toBeGreaterThan(0);
    expect(cfg.property1).toEqual('test');
    cfg.property3 = 'fails';

    setTimeout(() => {
      const d = new Date();
      fs.utimesSync('./test/test2.json', d, d);

      setTimeout(() => {
        const cfg2: any = Config.getInstance('./test/test2.json');
        expect(cfg2.property3).toBeUndefined();
        expect(cfg2.lastreadAt.getTime()).toBeGreaterThan(cfg.lastreadAt.getTime());
        done();
      }, 10);
    }, 10);
  });

  it('reads NODE_ENV config file', () => {
    process.env.NODE_ENV = 'test';
    const cfg: any = Config.getInstance('./test/test1.json');
    expect(cfg).toBeDefined();
    expect(typeof (cfg)).toEqual('object');
    expect(Object.keys(cfg).length).toBeGreaterThan(0);
    expect(cfg.testproperty1).toEqual('test');
    delete process.env.NODE_ENV;
  });

  it('reads checked config file', () => {
    const compareObj: ITestConfig = {
      property1: 'test',
      property2: {},
      property3: ''
    };
    try {
      const cfg = Config.getCheckedInstance<ITestConfig>(compareObj, './test/test1.json');
      expect(cfg).toBeDefined();
      expect(Object.keys(cfg).length).toBeGreaterThan(0);
      expect(cfg.property1).toEqual('test');
    } catch (err) {
      fail(err);
    }
  });

  it('gets checked cached config', () => {
    const compareObj: ITestConfig = {
      property1: 'test',
      property2: {},
      property3: ''
    };
    try {
      const cfg = Config.getCheckedInstance<ITestConfig>(compareObj, './test/test1.json');
      expect(cfg).toBeDefined();
      expect(Object.keys(cfg).length).toBeGreaterThan(0);
      expect(cfg.property1).toEqual('test');
      (cfg as any).property3 = 'success';
      const cfg2 = Config.getCheckedInstance<ITestConfig>(compareObj, './test/test1.json');
      expect((cfg2 as any).property3).toEqual('success');
    } catch (err) {
      fail(err);
    }
  });

  it('fails config check', () => {
    const compareObj: ITestConfig = {
      property1: 'test',
      property2: {},
      property3: ''
    };
    try {
      const cfg = Config.getCheckedInstance<ITestConfig>(compareObj, './test/testfail.json');
      fail('should throw error');
    } catch (err) {
      expect(err).toBeDefined();
      if (!(err instanceof ConfigError)) {
        fail('err should be ConfigError');
      }
    }
  });

  it('finds not configfile 1', () => {
    const cfg = Config.getInstance();
    expect(cfg).toBeUndefined();
  });

  it('finds not configfile 2', () => {
    const cfg = Config.getInstance('./test/notfound.json');
    expect(cfg).toBeUndefined();
  });

  it('finds not configfile NODE_ENV', () => {
    process.env.NODE_ENV = 'test';
    const cfg = Config.getInstance();
    expect(cfg).toBeUndefined();
    delete process.env.NODE_ENV;
  });

  it('can not read garbled', () => {
    try {
      const cfg = Config.getInstance('./test/garbled.json');
      fail('should throw ConfigError');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

});
