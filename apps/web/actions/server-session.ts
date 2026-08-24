import 'server-only';

import { queryOptions } from '@tanstack/react-query';
import { headers } from 'next/headers';

import { tsr } from '@/lib/tsr';

const fetchServerSession = async () => {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get('cookie');

  if (!cookie) {
    return null;
  }

  const response = await tsr.auth.getSession.query({
    extraHeaders: {
      cookie,
    },
    fetchOptions: {
      cache: 'no-store',
    },
  });

  if (response.status !== 200) {
    throw new Error(response.body.message);
  }

  return response.body.body;
};

export const serverSessionQueryOptions = () =>
  queryOptions({
    queryKey: ['auth', 'session'],
    queryFn: fetchServerSession,
  });
