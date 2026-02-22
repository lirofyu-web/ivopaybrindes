type Listener<T> = (data: T) => void;

class EventEmitter<Events extends Record<string, any>> {
    private listeners: { [K in keyof Events]?: Listener<Events[K]>[] } = {};

    on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }

    emit<K extends keyof Events>(event: K, data: Events[K]): void {
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            eventListeners.forEach(listener => listener(data));
        }
    }
}


type ErrorEvents = {
  'permission-error': Error;
};

export const errorEmitter = new EventEmitter<ErrorEvents>();
