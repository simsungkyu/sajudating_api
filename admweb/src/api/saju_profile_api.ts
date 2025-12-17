// API functions for saju profile operations
import { apiBase, ApiError } from '../api';

export type CreateSajuProfilePayload = {
  email: string;
  sex: 'male' | 'female';
  birthdate: string;
  image?: File | null;
};

export type CreateSajuProfileResponse = {
  uid: string;
};

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

export const createSajuProfile = async (
  payload: CreateSajuProfilePayload,
  token: string,
): Promise<CreateSajuProfileResponse> => {
  const formData = new FormData();
  formData.append('email', payload.email);
  formData.append('sex', payload.sex);
  formData.append('birthdate', payload.birthdate);
  
  if (payload.image) {
    formData.append('image', payload.image);
  }

  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${apiBase}/admin/saju_profile`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    throw new ApiError(await extractError(res), res.status);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    const data = json.data ?? json;
    // Handle both { uid: string } and { data: { uid: string } } response formats
    const uid = data.uid ?? json.uid;
    if (!uid) {
      throw new ApiError('UID가 응답에 없습니다.', res.status);
    }
    return { uid };
  }

  const text = await res.text();
  return JSON.parse(text) as CreateSajuProfileResponse;
};

export type CreateUserSajuProfilePayload = {
  sex: 'male' | 'female';
  birthdate: string;
  image?: File | null;
};

export type UserSajuProfileResponse = {
  uid: string;
  birthdate: string;
  sex: string;
  nickname?: string;
  status: string;
  saju?: {
    summary: string;
    content: string;
  };
  kwansang?: {
    summary: string;
    content: string;
  };
  partner?: {
    summary: string;
    tips: string;
  };
};

export const createUserSajuProfile = async (
  payload: CreateUserSajuProfilePayload,
): Promise<UserSajuProfileResponse> => {
  const formData = new FormData();
  formData.append('sex', payload.sex);
  formData.append('birthdate', payload.birthdate);

  if (payload.image) {
    formData.append('image', payload.image);
  }

  const res = await fetch(`${apiBase}/saju_profile`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new ApiError(await extractError(res), res.status);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    const data = json.data ?? json;
    return data as UserSajuProfileResponse;
  }

  const text = await res.text();
  return JSON.parse(text) as UserSajuProfileResponse;
};

// GET /:uid - 프로필 조회 모든 영역
export const getSajuProfile = async (uid: string): Promise<any> => {
  const res = await fetch(`${apiBase}/saju_profile/${uid}`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new ApiError(await extractError(res), res.status);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return json.data ?? json;
  }

  const text = await res.text();
  return JSON.parse(text);
};

// GET /:uid/saju - 사주 결과만 조회
export const getSajuProfileSajuResult = async (uid: string): Promise<any> => {
  const res = await fetch(`${apiBase}/saju_profile/${uid}/saju`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new ApiError(await extractError(res), res.status);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return json.data ?? json;
  }

  const text = await res.text();
  return JSON.parse(text);
};

// GET /:uid/kwansang - 관상 결과만 조회
export const getSajuProfileKwansangResult = async (uid: string): Promise<any> => {
  const res = await fetch(`${apiBase}/saju_profile/${uid}/kwansang`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new ApiError(await extractError(res), res.status);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return json.data ?? json;
  }

  const text = await res.text();
  return JSON.parse(text);
};

// GET /:uid/partner_image - 파트너 이미지 조회
export const getSajuProfilePartnerImageResult = async (uid: string): Promise<any> => {
  const res = await fetch(`${apiBase}/saju_profile/${uid}/partner_image`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new ApiError(await extractError(res), res.status);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return json.data ?? json;
  }

  const text = await res.text();
  return JSON.parse(text);
};

// PUT /:uid - 이메일 업데이트
export const updateSajuProfileEmail = async (uid: string, email: string): Promise<any> => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  const res = await fetch(`${apiBase}/saju_profile/${uid}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new ApiError(await extractError(res), res.status);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return json.data ?? json;
  }

  const text = await res.text();
  return JSON.parse(text);
};
