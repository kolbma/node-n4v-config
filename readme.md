# net4VISIONS Config class

Provides handling of JSON application configuration with caching and reread of changed files.

## Installation

`npm i n4v-config`

## Features

- Default config file is "app.json"
- Tries to use a file "app_<NODE_ENV>.json" if NODE_ENV is set, falls back to default app.json
- If specified a custom config file, like myconfig.json, it tries "myconfig_<NODE_ENV>.json"
- Checks for valid properties with the help of a compare object with dummy values. Throws a ConfigError.
- There is also Config.getInstance() without checking.
- Caches the config and rereads file only if file modification time is newer.

## Usage

### TypeScript

``` TypeScript
import { Config, ConfigError, IConfig } from 'n4v-config';

interface IMyConfig extends IConfig {
  myProperty: string;
}

const compareObj: MyConfig = {
  myProperty: ''
};

const cfg = Config.getCheckedInstance<IMyConfig>(compareObj, './myconfig.json');

console.log('myProperty: %s', cfg.myProperty);

```

### JavaScript

``` JavaScript
const config = require('n4v-config');
const Config = config.Config;
const ConfigError = config.ConfigError;

const compareObj = {
  myProperty: ''
};

const cfg = Config.getCheckedInstance(compareObj, './myconfig.json');

console.log('myProperty: %s', cfg.myProperty);

```
