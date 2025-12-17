import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type AuthState = {
  token: string;
  adminId?: string;
  expiresAt?: number;
};

export const authAtom = atomWithStorage<AuthState | null>('admweb-auth', null);

export const isAuthedAtom = atom((get) => Boolean(get(authAtom)?.token));

export const logoutAtom = atom(null, (_get, set) => {
  set(authAtom, null);
});
