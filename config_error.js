"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var n4v_app_error_1 = require("n4v-app-error");
var ConfigError = /** @class */ (function (_super) {
    __extends(ConfigError, _super);
    function ConfigError() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'ConfigError';
        return _this;
    }
    return ConfigError;
}(n4v_app_error_1.AppError));
exports.ConfigError = ConfigError;
//# sourceMappingURL=config_error.js.map