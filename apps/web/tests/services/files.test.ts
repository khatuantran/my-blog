import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../_helpers/msw-server';
import { uploadAsset, type SignedUploadParams } from '@/services/api/files';

const API_URL = 'http://localhost:3001';

function file(name = 'pic.png', type = 'image/png'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe('uploadAsset (ADR-010 provider-aware)', () => {
  it('provider=local → POST multipart lên BE /files/upload, unwrap {data}', async () => {
    let receivedPath = '';
    mswServer.use(
      http.post(`${API_URL}/files/upload`, ({ request }) => {
        // KHÔNG parse request.formData() ở đây — undici/jsdom trong vitest không đọc được
        // multipart boundary (env limit). Field handling đã cover ở BE local-storage.spec.
        receivedPath = new URL(request.url).pathname;
        return HttpResponse.json({
          data: {
            url: 'http://localhost:3001/uploads/myblog/posts/1-x.png',
            publicId: 'myblog/posts/1-x.png',
            size: 3,
            name: 'pic.png',
            type: 'image/png',
          },
        });
      }),
    );
    const signed: SignedUploadParams = {
      provider: 'local',
      signature: '',
      timestamp: 0,
      apiKey: '',
      cloudName: '',
      folder: 'myblog/posts',
      resourceType: 'image',
      publicId: null,
      uploadUrl: '/files/upload',
    };
    const asset = await uploadAsset(file(), signed);
    expect(receivedPath).toBe('/files/upload');
    expect(asset.url).toBe('http://localhost:3001/uploads/myblog/posts/1-x.png');
    expect(asset.publicId).toBe('myblog/posts/1-x.png');
  });

  it('provider=cloudinary → POST thẳng Cloudinary, map secure_url/public_id', async () => {
    mswServer.use(
      http.post('https://api.cloudinary.com/v1_1/:cloud/:rt/upload', () =>
        HttpResponse.json({
          public_id: 'myblog/posts/abc',
          secure_url: 'https://res.cloudinary.com/x/abc.png',
          width: 800,
          height: 600,
          bytes: 1234,
          format: 'png',
          original_filename: 'pic',
        }),
      ),
    );
    const signed: SignedUploadParams = {
      provider: 'cloudinary',
      signature: 'sig',
      timestamp: 123,
      apiKey: 'key',
      cloudName: 'mycloud',
      folder: 'myblog/posts',
      resourceType: 'image',
      publicId: null,
    };
    const asset = await uploadAsset(file(), signed);
    expect(asset.url).toBe('https://res.cloudinary.com/x/abc.png');
    expect(asset.publicId).toBe('myblog/posts/abc');
    expect(asset.width).toBe(800);
    expect(asset.size).toBe(1234);
  });
});
