import * as _ from 'lodash';

class DataParser {

    constructor() { }

    // Removes empty objects/fields according to conditions
    deepOmitFields(data: any, validator: Function = this.fallbackValidator, emptyObjectAllowed: boolean = true) {
        if (_.isObject(data) && !Array.isArray(data)) {

            let result: any = {};
            let keys: any = [...Object.keys(data)];

            for (let key of keys) {
                if (_.isObject(data[key])) {

                    let output: any = this.deepOmitFields(data[key], validator, emptyObjectAllowed);
                    if(emptyObjectAllowed || (!emptyObjectAllowed && (JSON.stringify(output) !== '{}'))) {
                        if(validator(output)) {
                            result[key] = output;
                        }
                    }
                } else if (validator(data[key])) {
                    result[key] = data[key];
                }
            }

            return result;
        }

        return data;
    }


    private fallbackValidator: Function = (data: any): boolean => !!data; 
};

export default DataParser;