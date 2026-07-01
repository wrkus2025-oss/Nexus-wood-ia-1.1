export type JwtUser = {
  userId: string;
  email: string;
  role: string;
  workspaceId?: string | null;
};
