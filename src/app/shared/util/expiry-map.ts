export class ExpiryMap <K, V> extends Map<any, any> {

    private timeout: number;
    private expiryMap: Map <any, number> = new Map <any, number>();

    constructor(timeout: number = 60000, args?: any) {
        super(...(args ?? []));
        this.timeout = timeout;
    }

    set(key: any, value: any): this {
        this.expiryMap.set(key, Date.now());
        super.set(key, value);
        return this;
    }

    get(key: any): any {

        if (this.expiryMap.has(key)) {
            const now: number = Date.now();
            let value: number = this.expiryMap.get(key);
            if (now - value > this.timeout) {
                super.delete(key);
            } else {
                this.expiryMap.set(key, Date.now());
            }
        }

        return super.get(key);
    }
}
