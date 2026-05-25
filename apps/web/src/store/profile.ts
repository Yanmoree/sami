import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DefaultAddress {
  fullName: string;
  phone: string;
  city: string;
  street: string;
  building: string;
  apartment: string;
  postalCode: string;
  country: string;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: DefaultAddress;
}

interface ProfileState {
  profile: ProfileData;
  setProfile: (p: Partial<ProfileData>) => void;
  setAddress: (a: Partial<DefaultAddress>) => void;
  clear: () => void;
}

const empty: ProfileData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: {
    fullName: '',
    phone: '',
    city: '',
    street: '',
    building: '',
    apartment: '',
    postalCode: '',
    country: 'RU',
  },
};

/**
 * Профиль пользователя. В демо — единственный источник правды (localStorage).
 * В проде сюда подтягиваем данные из /auth/me и PATCH'им через /auth/profile.
 * Auto-подставляется в CheckoutPage как defaultValues формы.
 */
export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: empty,
      setProfile: (p) =>
        set((state) => ({ profile: { ...state.profile, ...p } })),
      setAddress: (a) =>
        set((state) => ({
          profile: { ...state.profile, address: { ...state.profile.address, ...a } },
        })),
      clear: () => set({ profile: empty }),
    }),
    { name: 'sami_profile' },
  ),
);
