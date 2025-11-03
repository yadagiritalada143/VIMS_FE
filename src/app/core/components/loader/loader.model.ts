export class Loader {

    id?: string;
    image?: string;
    show?: boolean;
    timer?: number;
    message?: string;

    constructor(init?: Partial<Loader>) {
        Object.assign(this, init);
    }
}