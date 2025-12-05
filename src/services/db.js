import { Capacitor } from '@capacitor/core';
import * as WebStorage from './storage/WebStorage';
import * as NativeStorage from './storage/NativeStorage';

const isNative = Capacitor.isNativePlatform();

export const db = isNative ? NativeStorage : WebStorage;

// Helper to init
export const initStorage = async () => {
    if (isNative) {
        await NativeStorage.initDB();
    } else {
        await WebStorage.initDB();
    }
};
