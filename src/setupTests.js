// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "regenerator-runtime/runtime";

import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'stream/web';

Object.assign(global, { TextDecoder, TextEncoder, ReadableStream });

// Mock window.location for Firebase initialization
delete window.location;
window.location = { hostname: 'test.example.com' };
