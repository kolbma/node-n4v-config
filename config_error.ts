import { AppError } from 'n4v-app-error';

export class ConfigError extends AppError {
  name: string = 'ConfigError';
}
