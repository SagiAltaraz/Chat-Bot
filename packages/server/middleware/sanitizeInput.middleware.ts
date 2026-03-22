import { sanitizeDeep } from '../utils/sanitizer.util';

export const sanitizeInput = (req: any, _res: any, next: any) => {
   req.body && (req.body = sanitizeDeep(req.body));

   if (req.query) Object.assign(req.query, sanitizeDeep(req.query));
   if (req.params) Object.assign(req.params, sanitizeDeep(req.params));

   next();
};
