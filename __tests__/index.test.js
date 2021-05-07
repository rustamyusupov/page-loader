import axios from 'axios';
import fs from 'fs';
import nock from 'nock';
import os from 'os';
import path from 'path';

import { getFileName } from '../src/utils';
import loader from '../src/index';

axios.defaults.adapter = require('axios/lib/adapters/http');

const origin = 'https://ru.hexlet.io';
const pathname = '/courses';
const url = `${origin}${pathname}`;
const responseStatuses = {
  ok: 200,
  notFound: 404,
  serverError: 500,
};

const getFixture = (fileName) => path.join(__dirname, '../__fixtures__', fileName);

describe('index loader', () => {
  let tempDir = '';

  beforeAll(() => {
    const dirPath = path.join(os.tmpdir(), 'page-loader-');

    nock.disableNetConnect();
    tempDir = fs.mkdtempSync(dirPath);
  });
  afterAll(() => {
    nock.enableNetConnect();
    nock.cleanAll();
  });

  it('should return filename', async () => {
    nock(origin).get(pathname).reply(responseStatuses.ok, 'ru-hexlet-io-courses.html');

    const result = await loader(url, tempDir);
    const expected = path.join(tempDir, 'ru-hexlet-io-courses.html');

    expect(result).toBe(expected);
  });

  it('should return files', async () => {
    const htmlFile = fs.readFileSync(getFixture('index.html'), 'utf-8');
    const getFile = (name) => fs.readFileSync(getFixture(name), 'utf-8');
    const files = {
      html: ['/courses', htmlFile],
      css: ['/assets/application.css', getFile('assets/application.css')],
      img: ['/assets/professions/nodejs.png', getFile('assets/professions/nodejs.png')],
      js: ['/packs/js/runtime.js', getFile('packs/js/runtime.js')],
    };

    nock(origin)
      .get(pathname)
      .reply(responseStatuses.ok, htmlFile)
      .get(files.html[0])
      .reply(responseStatuses.ok, htmlFile)
      .get(files.css[0])
      .reply(responseStatuses.ok, files.css[1])
      .get(files.img[0])
      .reply(responseStatuses.ok, files.img[1])
      .get(files.js[0])
      .reply(responseStatuses.ok, files.js[1]);

    // TODO: how to do this?
    // .get(/(js|css|img)\/.*/)
    // .reply((uri) => [responseStatuses.ok, fs.readFileSync(getFixture(uri), 'utf-8')]);

    await loader(url, tempDir);

    const htmlPath = path.join(tempDir, getFileName(url));
    const htmlResult = await fs.promises.readFile(htmlPath, 'utf-8');
    const htmlExpected = await fs.promises.readFile(getFixture('result.html'), 'utf-8');

    expect(htmlResult).toBe(htmlExpected);

    const filePaths = [
      '/assets/application.css',
      '/assets/professions/nodejs.png',
      '/packs/js/runtime.js',
    ];

    filePaths.forEach((file) => {
      const fileName = getFileName(`${origin}${file}`);
      const filePath = path.join(tempDir, 'ru-hexlet-io-courses_files', fileName);
      const result = fs.readFileSync(filePath, 'utf-8');
      const expected = fs.readFileSync(getFixture(file), 'utf-8');

      expect(result).toBe(expected);
    });
  });

  it('should reject with 404', async () => {
    nock(origin).get('/notFound').reply(responseStatuses.notFound);

    const result = () => loader(`${origin}/notFound`, tempDir);

    await expect(result).rejects.toThrow(Error);
  });

  it('should return error for wrong folder', async () => {
    nock(origin).get(pathname).reply(responseStatuses.ok);

    const result = loader(url, `${tempDir}\\wrongFolder`);

    await expect(result).rejects.toThrow();
  });
});
