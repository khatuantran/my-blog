import { describe, expect, it, beforeEach } from 'vitest';
import { useState } from 'react';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadZone, type UploadEntry } from '@/components/shared/UploadZone';
import { TestProviders } from '../../_helpers/test-providers';
import { mswServer } from '../../_helpers/msw-server';

const API_URL = 'http://localhost:3001';
const CLOUD = 'test-cloud';

beforeEach(() => {
  mswServer.use(
    http.post(`${API_URL}/files/sign`, () =>
      HttpResponse.json({
        data: {
          signature: 'sig',
          timestamp: 1715952000,
          apiKey: 'key',
          cloudName: CLOUD,
          folder: 'myblog/posts',
          resourceType: 'image',
          publicId: null,
        },
      }),
    ),
    http.post(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, () =>
      HttpResponse.json({
        public_id: 'myblog/posts/abc',
        secure_url: 'https://res.cloudinary.com/test/abc.jpg',
        width: 800,
        height: 600,
        bytes: 12345,
        original_filename: 'abc',
      }),
    ),
    http.post(`https://api.cloudinary.com/v1_1/${CLOUD}/raw/upload`, () =>
      HttpResponse.json({
        public_id: 'myblog/raw/doc',
        secure_url: 'https://res.cloudinary.com/test/doc.pdf',
        bytes: 2048,
        original_filename: 'doc',
      }),
    ),
  );
});

function Wrapper(props: {
  variant: 'image' | 'file';
  maxCount?: number;
  initial?: UploadEntry[];
  hint?: string;
  maxSizeMB?: number;
}) {
  const [value, setValue] = useState<UploadEntry[]>(props.initial ?? []);
  return (
    <UploadZone
      resourceType={props.variant === 'image' ? 'image' : 'raw'}
      accept={props.variant === 'image' ? 'image/*' : '.pdf'}
      maxCount={props.maxCount ?? 10}
      variant={props.variant}
      value={value}
      onChange={setValue}
      hint={props.hint}
      maxSizeMB={props.maxSizeMB}
    />
  );
}

describe('UploadZone', () => {
  it('renders drop zone với slots remaining', () => {
    render(
      <TestProviders>
        <Wrapper variant="image" maxCount={5} />
      </TestProviders>,
    );
    expect(screen.getByText(/5 slots left/)).toBeInTheDocument();
  });

  it('select image file → sign + Cloudinary upload + thumbnail render', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <Wrapper variant="image" />
      </TestProviders>,
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await user.upload(input, file);

    await waitFor(() => {
      const imgs = document.querySelectorAll('img');
      expect(imgs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('full state khi maxCount reached', () => {
    const initial: UploadEntry[] = [
      { id: '1', url: 'u1', publicId: 'p1', size: 1, name: 'a', type: 'image/jpeg' },
      { id: '2', url: 'u2', publicId: 'p2', size: 1, name: 'b', type: 'image/jpeg' },
    ];
    render(
      <TestProviders>
        <Wrapper variant="image" maxCount={2} initial={initial} />
      </TestProviders>,
    );
    expect(screen.getByText(/max reached \(2\/2\)/)).toBeInTheDocument();
  });

  it('click × remove existing asset', async () => {
    const user = userEvent.setup();
    const initial: UploadEntry[] = [
      { id: '1', url: 'https://cdn/1.jpg', publicId: 'p1', size: 1, name: 'a', type: 'image/jpeg' },
    ];
    render(
      <TestProviders>
        <Wrapper variant="image" initial={initial} />
      </TestProviders>,
    );
    await user.click(screen.getByRole('button', { name: /remove image/i }));
    await waitFor(() => {
      expect(document.querySelector('img')).toBeNull();
    });
  });

  // T-363 new prop coverage
  it('T-363: renders custom hint when provided (overrides default slot-count text)', () => {
    render(
      <TestProviders>
        <Wrapper variant="image" hint="❯ paste your screenshot here" />
      </TestProviders>,
    );
    expect(screen.getByText('❯ paste your screenshot here')).toBeInTheDocument();
    expect(screen.queryByText(/slots left/)).not.toBeInTheDocument();
  });

  it('T-363: accept prop wires to underlying input attribute', () => {
    render(
      <TestProviders>
        <Wrapper variant="file" />
      </TestProviders>,
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe('.pdf');
  });

  it('T-363: maxSizeMB rejects oversized file (onChange not called for >limit)', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <Wrapper variant="file" maxSizeMB={0.001} />
      </TestProviders>,
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // 2KB file vs 0.001MB (~1KB) limit → filtered out before Cloudinary upload.
    const oversized = new File([new Uint8Array(2048)], 'big.pdf', { type: 'application/pdf' });
    await user.upload(input, oversized);
    // Wait a tick — no upload should fire, no asset list rendered.
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByText('big.pdf')).not.toBeInTheDocument();
  });

  it('file variant renders FileItem rows', () => {
    const initial: UploadEntry[] = [
      {
        id: '1',
        url: 'https://cdn/x.pdf',
        publicId: 'p1',
        size: 1024,
        name: 'doc.pdf',
        type: 'PDF',
      },
    ];
    render(
      <TestProviders>
        <Wrapper variant="file" initial={initial} />
      </TestProviders>,
    );
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });
});
