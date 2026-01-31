import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.chatur.chess',
    appName: 'Chatur Chess',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
