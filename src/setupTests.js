// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "regenerator-runtime/runtime";
import 'whatwg-fetch'; 

import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'stream/web'; 
import { Blob, File } from 'buffer';
import DOMException from 'domexception';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.Blob = Blob;
global.File = File;
global.MessagePort = class MessagePort {};
global.DOMException = DOMException;

// Global Mock for Firebase to prevent ReadableStream errors in component tests
jest.mock("firebase/functions", () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(() => jest.fn()),
}));

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  child: jest.fn(),
  remove: jest.fn(),
}));

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
}));

jest.mock("./firebase", () => ({}));
jest.mock("./auth", () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));
