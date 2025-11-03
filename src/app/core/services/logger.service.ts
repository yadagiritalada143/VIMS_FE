import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

interface LoggingFunction {
  (value: any, ...rest: any[]): void;
}

export interface LoggerLevel {
  info: LoggingFunction;
  log: LoggingFunction;
  warn: LoggingFunction;
  error: LoggingFunction;
}

@Injectable({ providedIn: 'root' })

export class LoggerService implements LoggerLevel {
  info(value: any, ...rest: any[]): void {
    if (!environment.production) {
      console.info(value, rest);
    } else {
      // implement the server logger here later
    }
  }

  log(value: any, ...rest: any[]): void {
    if (!environment.production) {
      console.log(value, rest);
    } else {
      // implement the server logger here later
    }
  }

  warn(value: any, ...rest: any[]): void {
    if (!environment.production) {
      console.warn(value, rest);
    } else {
      // implement the server logger here later
    }
  }

  error(value: any, ...rest: any[]): void {
    if (!environment.production) {
      console.error(value, rest);
    } else {
     // implement the server logger here later
    }
  }
}
