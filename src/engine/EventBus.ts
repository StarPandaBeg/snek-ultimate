export class EventBus {
    private static listeners: Map<string, Function[]> = new Map();

    static on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    static off(event: string, callback: Function) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            this.listeners.set(event, eventListeners.filter(l => l !== callback));
        }
    }

    static emit(event: string, data?: any) {
        this.listeners.get(event)?.forEach(callback => callback(data));
    }
}
