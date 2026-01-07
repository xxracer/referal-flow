
import { EventEmitter } from 'events';

// This is a global event emitter to decouple error handling from data fetching logic.
export const errorEmitter = new EventEmitter();
