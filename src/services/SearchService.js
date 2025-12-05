import { Capacitor } from '@capacitor/core';
import { SearchService as WebSearch } from './search/WebSearch';
import { NativeSearch } from './search/NativeSearch';

const isNative = Capacitor.isNativePlatform();

export const SearchService = isNative ? NativeSearch : WebSearch;
