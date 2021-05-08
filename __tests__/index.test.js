import axios from 'axios';
import fs from 'fs/promises';
import nock from 'nock';
import os from 'os';
import path from 'path';

import getName from '../src/getName';
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

  beforeAll(() => nock.disableNetConnect());
  beforeEach(async () => {
    const dirPath = path.join(os.tmpdir(), 'page-loader-');

    tempDir = await fs.mkdtemp(dirPath);
  });
  afterEach(() => nock.cleanAll());
  afterAll(() => nock.enableNetConnect());

  it('should return files', async () => {
    const htmlFile = await fs.readFile(getFixture('index.html'), 'utf-8');

    const getFile = async (name) => {
      const result = await fs.readFile(getFixture(name), 'utf-8');

      return result;
    };

    const files = {
      html: ['/courses', await htmlFile],
      css: ['/assets/application.css', await getFile('assets/application.css')],
      img: ['/assets/professions/nodejs.png', await getFile('assets/professions/nodejs.png')],
      js: ['/packs/js/runtime.js', await getFile('packs/js/runtime.js')],
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

    await loader(url, tempDir);

    const htmlPath = path.join(tempDir, getName(url));
    const htmlResult = await fs.readFile(htmlPath, 'utf-8');
    const htmlExpected = await fs.readFile(getFixture('result.html'), 'utf-8');

    expect(htmlResult).toBe(htmlExpected);

    const filePaths = [
      '/assets/application.css',
      '/assets/professions/nodejs.png',
      '/packs/js/runtime.js',
    ];

    const test = async (file) => {
      const fileName = getName(`${origin}${file}`);
      const filePath = path.join(tempDir, 'ru-hexlet-io-courses_files', fileName);
      const result = await fs.readFile(filePath, 'utf-8');
      const expected = await fs.readFile(getFixture(file), 'utf-8');

      expect(result).toBe(expected);
    };

    const promises = filePaths.map(test);
    await Promise.all(promises);
  });

  it('should reject with 404', async () => {
    const scope = nock(origin).get('/notFound').reply(responseStatuses.notFound);

    const result = () => loader(`${origin}/notFound`, tempDir);

    await expect(result).rejects.toThrow(Error);
    scope.done();
  });

  it('should return error for wrong folder', async () => {
    const scope = nock(origin).get(pathname).reply(responseStatuses.ok, '');

    await expect(loader(url, `${tempDir}/folder`)).rejects.toThrow();
    scope.done();
  });
});
