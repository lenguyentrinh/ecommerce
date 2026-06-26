import { api } from "./api";
import type { MeResponse } from "./authAPI";

// Profile update — `email` is immutable and never sent.
interface ProfilePayload {
  userName?: string;
  phoneNumber?: string;
}

interface Address {
  id: number;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

type AddressPayload = Omit<Address, "id" | "isDefault"> & { isDefault?: boolean };

interface ActionResponse {
  message: string;
}

// PATCH /users/profile → sanitized user { id, userName, email, phoneNumber, role }
// (returned raw, mirroring /auth/me).
const updateProfileAPI = async (data: ProfilePayload) => {
  const res = await api.patch("/users/profile", data);
  return res.data as MeResponse;
};

// GET /users/addresses → { data: Address[] } (never a raw top-level array).
const getAddressesAPI = async () => {
  const res = await api.get("/users/addresses");
  return res.data.data as Address[];
};

// POST /users/addresses → the created Address.
const createAddressAPI = async (data: AddressPayload) => {
  const res = await api.post("/users/addresses", data);
  return res.data as Address;
};

// PATCH /users/addresses/:id → the updated Address.
const editAddressAPI = async (id: number, data: AddressPayload) => {
  const res = await api.patch("/users/addresses/" + id, data);
  return res.data as Address;
};

// PATCH /users/addresses/:id/default → the full list with the new default set.
const setDefaultAddressAPI = async (id: number) => {
  const res = await api.patch("/users/addresses/" + id + "/default");
  return res.data.data as Address[];
};

// DELETE /users/addresses/:id → { message }.
const deleteAddressAPI = async (id: number) => {
  const res = await api.delete("/users/addresses/" + id);
  return res.data as ActionResponse;
};

export {
  updateProfileAPI,
  getAddressesAPI,
  createAddressAPI,
  editAddressAPI,
  setDefaultAddressAPI,
  deleteAddressAPI,
};
export type { ProfilePayload, Address, AddressPayload };
