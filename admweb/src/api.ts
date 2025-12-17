const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ResponseType = 'json' | 'blob' | 'text';

interface RequestConfig {
  token?: string;
  responseType?: ResponseType;
}

async function extractError(res: Response) {
  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const body = await res.json();
      return body.error ?? body.message ?? res.statusText;
    } catch {
      // fall through
    }
  }

  try {
    const text = await res.text();
    return text || res.statusText;
  } catch {
    return res.statusText;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  config: RequestConfig = {},
) {
  const headers = new Headers(options.headers ?? {});
  const isSendingJson = options.body && !(options.body instanceof FormData);

  if (isSendingJson && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (config.token) {
    headers.set('Authorization', `Bearer ${config.token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new ApiError(await extractError(res), res.status);
  }

  if (config.responseType === 'blob') {
    return (await res.blob()) as T;
  }

  if (config.responseType === 'text') {
    return (await res.text()) as T;
  }

  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const json = await res.json();
    return (json.data ?? json) as T;
  }

  return (await res.text()) as T;
}

export type AdminLoginPayload = {
  email: string;
  password: string;
};

export type AdminLoginResponse = {
  token: string;
  admin?: string;
  expires_in?: number;
};

export type SajuProfileSummary = {
  uid: string;
  email?: string;
  sex?: string;
  birthdate?: string;
  birth_date_time?: string;
  image?: string;
  image_mime_type?: string;
  created_at?: string;
  updated_at?: string;
  has_image?: boolean;
};

export type SajuProfileDetail = SajuProfileSummary & {
  notes?: string;
};

export type SajuResultResponse = {
  result: string;
};

export type PhyPartnerSummary = {
  uid: string;
  phy_desc: string;
  sex: string;
  age?: number;
  image?: string;
  image_mime_type?: string;
  has_image?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PhyPartnerDetail = PhyPartnerSummary & {
  notes?: string;
};

export type CreatePhyPartnerPayload = {
  phy_desc: string;
  sex: 'male' | 'female';
  image?: File | null;
};

export type CreatePhyPartnerResponse = {
  uid: string;
};

export const adminApi = {
  login(payload: AdminLoginPayload) {
    return request<AdminLoginResponse>(
      '/admin/auth',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { responseType: 'json' },
    );
  },
  getProfiles(token: string) {
    return request<SajuProfileSummary[]>(
      '/admin/saju_profiles',
      { method: 'GET' },
      { token, responseType: 'json' },
    );
  },
  getProfile(uid: string, token: string) {
    return request<SajuProfileDetail>(
      `/admin/saju_profile/${uid}`,
      { method: 'GET' },
      { token, responseType: 'json' },
    );
  },
  getPhyPartners(token: string) {
    return request<PhyPartnerSummary[]>(
      '/admin/phy_partners',
      { method: 'GET' },
      { token, responseType: 'json' },
    );
  },
  getPhyPartner(uid: string, token: string) {
    return request<PhyPartnerDetail>(
      `/admin/phy_partners/${uid}`,
      { method: 'GET' },
      { token, responseType: 'json' },
    );
  },
  createPhyPartner(payload: CreatePhyPartnerPayload, token: string) {
    const formData = new FormData();
    formData.append('phy_desc', payload.phy_desc);
    formData.append('sex', payload.sex);
    if (payload.image) {
      formData.append('image', payload.image);
    }

    return request<CreatePhyPartnerResponse>(
      '/admin/phy_partners',
      { method: 'POST', body: formData },
      { token, responseType: 'json' },
    );
  },
};

export const sajuApi = {
  fetchResult(uid: string, token?: string) {
    return request<SajuResultResponse>(
      `/saju_profile/${uid}/result`,
      { method: 'GET' },
      { token, responseType: 'json' },
    );
  },
  fetchMyImage(uid: string, token?: string) {
    return request<Blob>(
      `/saju_profile/${uid}/my_image`,
      { method: 'GET' },
      { token, responseType: 'blob' },
    );
  },
  fetchPartnerImage(uid: string, token?: string) {
    return request<Blob>(
      `/saju_profile/${uid}/partner_image`,
      { method: 'GET' },
      { token, responseType: 'blob' },
    );
  },
};

export const apiBase = API_BASE;
