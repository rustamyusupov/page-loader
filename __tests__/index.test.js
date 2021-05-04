import fs from 'fs';
import os from 'os';
import path from 'path';

import loader from '../src/index';

const url = 'http://rustamyusupov.github.io/nerds';

describe('index loader', () => {
  let tempDir = '';

  beforeEach(async () => {
    const dirPath = path.join(os.tmpdir(), 'page-loader-');

    tempDir = await fs.promises.mkdtemp(dirPath);
  });

  it('should return filename', async () => {
    const result = await loader(url, tempDir);
    const expected = path.join(tempDir, 'rustamyusupov-github-io-nerds.htmla'); // ?

    expect(result).toBe(expected);
  });

  it('should return file is exists', async () => {
    const response = await loader(url, tempDir);
    const result = fs.existsSync(response);

    expect(result).toBeTruthy();
  });

  it('should return error', async () => {
    const result = await loader('', '');

    expect(result).toBe('');
  });
});
