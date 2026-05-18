import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Mark endpoint là public — JwtAuthGuard sẽ skip nếu thấy. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
