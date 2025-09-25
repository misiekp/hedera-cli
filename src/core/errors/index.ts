export class DomainError extends Error {
  public code: number;

  constructor(message: string, code = 1) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export const errors = {
  DomainError,
};

export type Errors = typeof errors;
