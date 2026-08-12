export type Registration = {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  photo: string;
  createdAt: string;
};

export type RegistrationInput = Omit<Registration, "id" | "createdAt">;
