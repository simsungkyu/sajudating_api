// API functions for phy partner operations
import { apiBase, ApiError } from '../api';
import type { CreatePhyPartnerResponse } from '../api';

export type CreatePhyPartnerWithImagePayload = {
  phy_desc: string;
  sex: 'male' | 'female';
  age: number;
  image?: File | null;
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

export const createPhyPartner = async (
  payload: CreatePhyPartnerWithImagePayload,
  token: string,
): Promise<CreatePhyPartnerResponse> => {
  const formData = new FormData();
  formData.append('phy_desc', payload.phy_desc);
  formData.append('sex', payload.sex);
  formData.append('age', payload.age.toString());
  
  if (payload.image) {
    formData.append('image', payload.image);
  }

  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${apiBase}/admin/phy_partner`, {
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
    return (json.data ?? json) as CreatePhyPartnerResponse;
  }

  const text = await res.text();
  return JSON.parse(text) as CreatePhyPartnerResponse;
};

