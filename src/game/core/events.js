export class CombatEventBus {
    constructor() {
        this.listeners = [];
        this.log = [];
    }
    on(listener) {
        this.listeners.push(listener);
    }
    off(listener) {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }
    emit(event) {
        this.log.push(event);
        for (const listener of this.listeners) {
            listener(event);
        }
    }
    getLog() {
        return this.log;
    }
    clear() {
        this.listeners = [];
        this.log = [];
    }
}
