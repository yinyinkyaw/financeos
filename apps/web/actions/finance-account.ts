import 'server-only';

import { queryOptions } from '@tanstack/react-query';
import { headers } from 'next/headers';

import { tsr } from '@/lib/tsr';

const fetchFinanceAccount = async () => {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get('cookie');

  const response = await tsr.financeAccounts.list.query({
    extraHeaders: cookie ? { cookie } : {},
    fetchOptions: {
      cache: 'no-store',
    },
  });

  if (response.status !== 200) {
    throw new Error(response.body.message);
  }

  return response.body.body;
};

export const financeAccountQueryOptions = () =>
  queryOptions({ queryKey: ['finance-account'], queryFn: fetchFinanceAccount });
