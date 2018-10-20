import createClient from 'webdav';
import webdavFileManager from 'services/webdavFileManager.js';

jest.mock('webdav');

describe('webdavClient', () => {
	it('can do a thing', () => {
		createClient();
	});
});