import * as log4js from 'log4js';

const FUNC = 'funcName';
const CLSS = 'className';

type Tokens ={
	[key: string]: (logEvent: log4js.LoggingEvent) => any,
} 

export default class LoggerFactory {
	constructor(level: string)
	constructor(config: log4js.Configuration)

	constructor(levelOrConfig: string | log4js.Configuration) {
		if (typeof levelOrConfig === 'string') {
			this.defaults(levelOrConfig);
		} else {
			this.configure(levelOrConfig);
		}
	}

	// See getLogger below
	public getLogger<T extends Object>(
		category: string,
		classInstance: T,
		method?: string,
	): log4js.Logger;

	// See getLogger below
	public getLogger<T extends Function>(
		category: string,
		func: T,
		method?: string,
	): log4js.Logger;


	/**
	 * @param {string} category Log4js category (see log4js documentation)
	 * @param {Object | Function} A class instance or function reference
	 * @param {string | undefined} Method name for the class or module where
	 * a function sits. 
	 */
	public getLogger<T extends Object>(
		category: string,
		classOrFunc: T,
		method: string,
	): log4js.Logger {
		if (classOrFunc instanceof Function) {
			return this.getLoggerFunc(category, classOrFunc);
		}
		return this.getLoggerClass(category, classOrFunc, method);
	}

	public static getDefaultLayout(
		pattern?: string,
		call = true,
		tokens?: Tokens,
	): log4js.Layout {
		return {
			type: 'pattern',
			pattern: LoggerFactory.getDefaultPattern()
				+ `${call ? '%x{call}' : ''}`
				+ `${pattern !== undefined ? ` ${pattern}` : ''}: %m %n`,
			tokens: {
				call: (event: log4js.LoggingEvent) => {
					const { className, funcName } = event.context;
					if (className && funcName) {
						return ` [${className}.${funcName}()]`;
					}
					if (className) {
						return ` [${className}]`;
					}
					if (funcName) {
						return ` [${funcName}()]`;
					}
					return '';
				},
				...(tokens || {}),
			},
		}
	}

	public static getDefaultPattern(): string {
		return `[%d] [%p] [%c]`;
	}

	public static getDefaults(level: string): log4js.Configuration {
		return {
			appenders: {
				out: {
					type: 'stdout',
					layout: LoggerFactory.getDefaultLayout(),
				},
			},
			categories: {
				default: {
					appenders: ['out'],
					level,
				},
			}
		}
	}

	private getLoggerFunc<T extends Function>(
		category: string,
		func: T,
	): log4js.Logger {
		const logger = log4js.getLogger(category);
		const funcName = func.name;

		logger.addContext(FUNC, funcName);

		return logger;
	}

	private getLoggerClass<T extends Object>(
		category: string,
		classInstance: T,
		method?: string,
	): log4js.Logger {
		const logger = log4js.getLogger(category);
		const className = classInstance.constructor.name;

		logger.addContext(CLSS, className);
		if (method) {
			logger.addContext(FUNC, method);
		}

		return logger;
	}

	private defaults(level: string): void {
		log4js.configure(LoggerFactory.getDefaults(level));
	}

	private configure(config: log4js.Configuration): void {
		log4js.configure(config);
	}
}
