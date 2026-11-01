import { loginFlow } from '@/lib/auth/login';
import { handle } from '@/lib/http';
export const POST = (req: Request) => handle(() => loginFlow(req, 'staff'));
