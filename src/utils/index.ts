import * as jwt from 'jsonwebtoken';

export function getExpireTime(token) {
	const decodedToken = jwt.decode(token);
	if (!decodedToken) return null;

	const expireTime = decodedToken?.exp;

	// False is expired
	return new Date().getTime() < expireTime * 1000;
}
